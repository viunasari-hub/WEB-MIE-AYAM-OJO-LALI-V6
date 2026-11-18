import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { resendOrderWhatsApp } from "@/lib/whatsapp";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const target = body.target === "ADMIN" ? "ADMIN" : "CUSTOMER";

    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    // Role check: customer can only resend to themselves
    if (session.role === "CUSTOMER") {
      if (order.userId && order.userId !== session.id) {
        return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
      }
    }

    const result = await resendOrderWhatsApp(order, target);

    return NextResponse.json({
      success: result.success,
      status: result.status,
      message: result.message,
      error: result.error,
      recipientPhone: result.recipientPhone,
      mode: result.mode,
    });
  } catch (error) {
    console.error("Manual WhatsApp send error:", error);
    return NextResponse.json({ error: "Gagal memproses pengiriman WhatsApp" }, { status: 500 });
  }
}
