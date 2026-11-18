import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const availableOnly = searchParams.get("available") === "true";

    const where: Record<string, unknown> = {};

    if (category && category !== "all") {
      where.OR = [
        { categoryId: category },
        { category: { slug: category } },
      ];
    }

    if (search) {
      where.name = { contains: search };
    }

    if (availableOnly) {
      where.available = true;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Fetch products error:", error);
    return NextResponse.json({ error: "Gagal mengambil data produk" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak (Hanya Admin)" }, { status: 403 });
    }

    const body = await req.json();
    const { name, categoryId, price, description, image, available } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nama produk wajib diisi" }, { status: 400 });
    }
    if (!categoryId) {
      return NextResponse.json({ error: "Kategori produk wajib dipilih" }, { status: 400 });
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return NextResponse.json({ error: "Harga harus berupa angka positif" }, { status: 400 });
    }

    const defaultImage =
      image && image.trim()
        ? image.trim()
        : "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80";

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        categoryId,
        price: numPrice,
        description: description ? description.trim() : null,
        image: defaultImage,
        available: available !== undefined ? Boolean(available) : true,
      },
      include: { category: true },
    });

    return NextResponse.json({ product, message: "Produk berhasil ditambahkan" }, { status: 201 });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json({ error: "Gagal menambahkan produk" }, { status: 500 });
  }
}
