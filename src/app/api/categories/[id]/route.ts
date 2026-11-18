import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";

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
    const { name } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nama kategori wajib diisi" }, { status: 400 });
    }

    const trimmedName = name.trim();
    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: trimmedName,
        slug: slugify(trimmedName),
      },
    });

    return NextResponse.json({ category: updated, message: "Kategori berhasil diperbarui" });
  } catch (error) {
    console.error("Update category error:", error);
    return NextResponse.json({ error: "Gagal memperbarui kategori" }, { status: 500 });
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

    // Check if category has products
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return NextResponse.json(
        { error: `Kategori tidak dapat dihapus karena masih memiliki ${productCount} produk.` },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Kategori berhasil dihapus" });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json({ error: "Gagal menghapus kategori" }, { status: 500 });
  }
}
