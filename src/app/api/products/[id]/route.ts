import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Fetch product by id error:", error);
    return NextResponse.json({ error: "Gagal memuat produk" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak (Hanya Admin)" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, categoryId, price, description, image, available } = body;

    const dataToUpdate: Record<string, unknown> = {};

    if (name !== undefined) {
      if (!name.trim()) return NextResponse.json({ error: "Nama produk tidak boleh kosong" }, { status: 400 });
      dataToUpdate.name = name.trim();
    }

    if (categoryId !== undefined) {
      dataToUpdate.categoryId = categoryId;
    }

    if (price !== undefined) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice <= 0) {
        return NextResponse.json({ error: "Harga harus angka positif" }, { status: 400 });
      }
      dataToUpdate.price = numPrice;
    }

    if (description !== undefined) {
      dataToUpdate.description = description ? description.trim() : null;
    }

    if (image !== undefined) {
      dataToUpdate.image = image ? image.trim() : null;
    }

    if (available !== undefined) {
      dataToUpdate.available = Boolean(available);
    }

    const updated = await prisma.product.update({
      where: { id },
      data: dataToUpdate,
      include: { category: true },
    });

    return NextResponse.json({ product: updated, message: "Produk berhasil diperbarui" });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json({ error: "Gagal memperbarui produk" }, { status: 500 });
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

    // Check if product is in order items
    const orderItemsCount = await prisma.orderItem.count({
      where: { productId: id },
    });

    if (orderItemsCount > 0) {
      // If referenced in orders, we deactivate it instead of breaking relational integrity
      await prisma.product.update({
        where: { id },
        data: { available: false },
      });
      return NextResponse.json({
        message: "Produk telah dinonaktifkan karena sudah memiliki riwayat pesanan.",
      });
    }

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ message: "Produk berhasil dihapus" });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json({ error: "Gagal menghapus produk" }, { status: 500 });
  }
}
