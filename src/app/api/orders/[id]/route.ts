import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notifyOrderStatusChange } from "@/lib/whatsapp";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
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
    });

    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    // Role check: customer can only view own order unless admin/cashier
    if (session && session.role === "CUSTOMER" && order.userId && order.userId !== session.id) {
      return NextResponse.json({ error: "Akses tidak diizinkan" }, { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Fetch single order error:", error);
    return NextResponse.json({ error: "Gagal mengambil data pesanan" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, paymentStatus, notes } = body;

    const currentOrder = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
    });

    if (!currentOrder) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    // If customer, can only CANCEL if order is still PENDING
    if (session.role === "CUSTOMER") {
      if (currentOrder.userId !== session.id) {
        return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
      }
      if (status !== "CANCELLED") {
        return NextResponse.json({ error: "Pelanggan hanya dapat membatalkan pesanan" }, { status: 403 });
      }
      if (currentOrder.status !== "PENDING") {
        return NextResponse.json(
          { error: "Pesanan yang sudah diproses atau selesai tidak dapat dibatalkan" },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};

    if (status) {
      const allowedStatuses = ["PENDING", "PROCESSING", "READY", "COMPLETED", "CANCELLED"];
      if (!allowedStatuses.includes(status)) {
        return NextResponse.json({ error: "Status pesanan tidak valid" }, { status: 400 });
      }
      updateData.status = status;

      // Auto-mark payment as PAID if completing or if specified
      if (status === "COMPLETED" && currentOrder.paymentStatus === "PENDING") {
        updateData.paymentStatus = "PAID";
      }
    }

    if (paymentStatus) {
      const allowedPayment = ["PENDING", "PAID", "CANCELLED"];
      if (!allowedPayment.includes(paymentStatus)) {
        return NextResponse.json({ error: "Status pembayaran tidak valid" }, { status: 400 });
      }
      updateData.paymentStatus = paymentStatus;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const updated = await prisma.order.update({
      where: { id: currentOrder.id },
      data: updateData,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Send WhatsApp notification if status changed
    if (status && status !== currentOrder.status) {
      try {
        await notifyOrderStatusChange(updated, status, currentOrder.status);
      } catch (waErr) {
        console.error("WhatsApp status change notification error:", waErr);
      }
    }

    return NextResponse.json({
      order: updated,
      message: `Status pesanan berhasil diubah menjadi ${updated.status}`,
    });
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json({ error: "Gagal memperbarui pesanan" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak (Hanya Admin)" }, { status: 403 });
    }

    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
    });

    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    // Delete order items first, then the order
    await prisma.$transaction([
      prisma.orderItem.deleteMany({ where: { orderId: order.id } }),
      prisma.order.delete({ where: { id: order.id } }),
    ]);

    return NextResponse.json({
      message: `Pesanan ${order.orderNumber} berhasil dihapus`,
    });
  } catch (error) {
    console.error("Delete order error:", error);
    return NextResponse.json({ error: "Gagal menghapus pesanan" }, { status: 500 });
  }
}
