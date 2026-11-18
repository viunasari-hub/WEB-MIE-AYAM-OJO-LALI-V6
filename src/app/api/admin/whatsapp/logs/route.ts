import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak (Hanya Admin)" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const search = searchParams.get("search") || "";
    const limit = Math.min(100, Number(searchParams.get("limit")) || 50);

    const where: Record<string, unknown> = {};

    if (orderId) {
      where.orderId = orderId;
    }

    if (search.trim()) {
      where.OR = [
        { recipientPhone: { contains: search.trim() } },
        { type: { contains: search.trim() } },
        { message: { contains: search.trim() } },
        { order: { orderNumber: { contains: search.trim() } } },
      ];
    }

    const logs = await prisma.notificationLog.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const formatted = logs.map((log) => ({
      id: log.id,
      orderId: log.order?.orderNumber || (log.orderId ? `ID:${log.orderId.slice(-6)}` : "-"),
      rawOrderId: log.orderId,
      recipientPhone: log.recipientPhone,
      recipientType: log.recipientType,
      type: log.type,
      message: log.message,
      status: log.status,
      errorMessage: log.errorMessage,
      createdAt: log.createdAt,
    }));

    return NextResponse.json({ logs: formatted });
  } catch (error) {
    console.error("Fetch notification logs error:", error);
    return NextResponse.json({ error: "Gagal memuat log notifikasi" }, { status: 500 });
  }
}
