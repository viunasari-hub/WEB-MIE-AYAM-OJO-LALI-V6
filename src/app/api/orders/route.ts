import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";
import { notifyNewOrder } from "@/lib/whatsapp";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = Number(searchParams.get("limit")) || 50;

    const where: Record<string, unknown> = {};

    // Customer can only view their own orders unless Admin/Cashier
    if (session) {
      if (session.role === "CUSTOMER") {
        where.userId = session.id;
      }
    } else {
      // Unauthenticated user shouldn't list arbitrary orders
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Fetch orders error:", error);
    return NextResponse.json({ error: "Gagal memuat pesanan" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const body = await req.json();
    const {
      customerName,
      customerPhone,
      items,
      paymentMethod = "CASH",
      notes,
    } = body;

    if (!customerName || !customerName.trim()) {
      return NextResponse.json({ error: "Nama pelanggan wajib diisi" }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Keranjang belanja kosong" }, { status: 400 });
    }

    // Verify products from DB and calculate actual total
    const productIds = items.map((i: { productId: string }) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    let calculatedTotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const p = productMap.get(item.productId);
      if (!p) {
        return NextResponse.json(
          { error: `Produk dengan ID ${item.productId} tidak ditemukan` },
          { status: 400 }
        );
      }
      if (!p.available) {
        return NextResponse.json(
          { error: `Produk "${p.name}" saat ini sedang tidak tersedia` },
          { status: 400 }
        );
      }
      const qty = Math.max(1, Number(item.quantity) || 1);
      const subtotal = p.price * qty;
      calculatedTotal += subtotal;

      validatedItems.push({
        productId: p.id,
        quantity: qty,
        price: p.price,
        subtotal,
      });
    }

    const orderNumber = generateOrderNumber();

    // Create order with orderItems in transaction
    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        userId: session?.id || null,
        customerName: customerName.trim(),
        customerPhone: customerPhone ? customerPhone.trim() : null,
        total: calculatedTotal,
        status: "PENDING",
        paymentMethod: paymentMethod.toUpperCase(),
        paymentStatus: "PENDING",
        notes: notes ? notes.trim() : null,
        items: {
          create: validatedItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Trigger WhatsApp notification asynchronously (won't fail checkout if WA fails)
    try {
      await notifyNewOrder(newOrder);
    } catch (waErr) {
      console.error("WhatsApp new order notification error:", waErr);
    }

    return NextResponse.json(
      {
        order: newOrder,
        message: "Pesanan berhasil dibuat!",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json({ error: "Gagal membuat pesanan" }, { status: 500 });
  }
}
