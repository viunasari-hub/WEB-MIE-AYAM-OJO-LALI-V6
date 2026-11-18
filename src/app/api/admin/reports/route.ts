import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "CASHIER")) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "week"; // today, week, month, custom
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const now = new Date();
    let startDate = new Date();
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    if (period === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "week") {
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "month") {
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "custom" && startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      startDate.setHours(0, 0, 0, 0);
      const customEnd = new Date(endDateParam);
      customEnd.setHours(23, 59, 59, 999);
      endDate.setTime(customEnd.getTime());
    } else {
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    }

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const completedOrders = orders.filter((o) => o.status === "COMPLETED");
    const totalOmzet = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const totalTransaksi = orders.length;
    const completedCount = completedOrders.length;
    const rataRataTransaksi = completedCount > 0 ? Math.round(totalOmzet / completedCount) : 0;

    // Aggregate Top Products
    const productStatsMap = new Map<string, { id: string; name: string; quantity: number; revenue: number }>();

    for (const order of completedOrders) {
      for (const item of order.items) {
        const prod = item.product;
        const current = productStatsMap.get(prod.id) || {
          id: prod.id,
          name: prod.name,
          quantity: 0,
          revenue: 0,
        };
        current.quantity += item.quantity;
        current.revenue += item.subtotal;
        productStatsMap.set(prod.id, current);
      }
    }

    const topProducts = Array.from(productStatsMap.values()).sort((a, b) => b.quantity - a.quantity);

    // Group sales by day for chart
    const dailyMap = new Map<string, { date: string; label: string; omzet: number; orders: number }>();

    // Initialize days
    const cur = new Date(startDate);
    while (cur <= endDate) {
      const dateKey = cur.toISOString().split("T")[0];
      const label = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(cur);
      dailyMap.set(dateKey, { date: dateKey, label, omzet: 0, orders: 0 });
      cur.setDate(cur.getDate() + 1);
    }

    for (const order of orders) {
      const dateKey = order.createdAt.toISOString().split("T")[0];
      if (dailyMap.has(dateKey)) {
        const entry = dailyMap.get(dateKey)!;
        entry.orders += 1;
        if (order.status === "COMPLETED") {
          entry.omzet += order.total;
        }
      }
    }

    const chartData = Array.from(dailyMap.values());

    return NextResponse.json({
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalOmzet,
      totalTransaksi,
      completedCount,
      rataRataTransaksi,
      topProducts,
      chartData,
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        total: o.total,
        status: o.status,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt,
        itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
      })),
    });
  } catch (error) {
    console.error("Reports API error:", error);
    return NextResponse.json({ error: "Gagal memproses laporan penjualan" }, { status: 500 });
  }
}
