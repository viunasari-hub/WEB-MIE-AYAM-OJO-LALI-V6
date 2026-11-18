import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Fetch categories error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data kategori" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak (Hanya Admin)" }, { status: 403 });
    }

    const { name } = await req.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nama kategori wajib diisi" }, { status: 400 });
    }

    const trimmedName = name.trim();
    const baseSlug = slugify(trimmedName);

    const existing = await prisma.category.findFirst({
      where: {
        OR: [{ name: trimmedName }, { slug: baseSlug }],
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Kategori dengan nama serupa sudah ada" }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name: trimmedName,
        slug: baseSlug,
      },
    });

    return NextResponse.json({ category, message: "Kategori berhasil ditambahkan" }, { status: 201 });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json({ error: "Gagal menambahkan kategori" }, { status: 500 });
  }
}
