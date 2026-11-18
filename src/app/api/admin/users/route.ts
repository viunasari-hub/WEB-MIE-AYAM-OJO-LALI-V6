import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak (Hanya Admin)" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role"); // "CASHIER" or "CUSTOMER"

    const where: Record<string, unknown> = {};
    if (role) {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
        orders: {
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = users.map((u) => {
      const totalSpent = u.orders
        .filter((o) => o.status === "COMPLETED")
        .reduce((sum, o) => sum + o.total, 0);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone,
        createdAt: u.createdAt,
        totalOrders: u.orders.length,
        totalSpent,
      };
    });

    return NextResponse.json({ users: formatted });
  } catch (error) {
    console.error("Fetch admin users error:", error);
    return NextResponse.json({ error: "Gagal memuat pengguna" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak (Hanya Admin)" }, { status: 403 });
    }

    const { name, phone, password, email, role = "CASHIER" } = await req.json();

    if (!name || !phone || !password) {
      return NextResponse.json({ error: "Nama, nomor handphone, dan kata sandi wajib diisi" }, { status: 400 });
    }

    const { getPhoneVariants, cleanPhoneDigits } = await import("@/lib/phone");
    const digits = cleanPhoneDigits(phone);
    if (digits.length < 8) {
      return NextResponse.json({ error: "Nomor handphone tidak valid (minimal 8 digit)" }, { status: 400 });
    }

    const variants = getPhoneVariants(phone);
    const existingPhone = await prisma.user.findFirst({
      where: { phone: { in: variants } },
    });
    if (existingPhone) {
      return NextResponse.json({ error: "Nomor handphone sudah digunakan oleh akun lain" }, { status: 400 });
    }

    let finalEmail = (email || "").toLowerCase().trim();
    if (!finalEmail) {
      finalEmail = `${digits}@ojolali.local`;
      const existingEmail = await prisma.user.findUnique({
        where: { email: finalEmail },
      });
      if (existingEmail) {
        finalEmail = `${digits}-${Date.now().toString().slice(-4)}@ojolali.local`;
      }
    } else {
      const existing = await prisma.user.findUnique({
        where: { email: finalEmail },
      });
      if (existing) {
        return NextResponse.json({ error: "Alamat email sudah terdaftar" }, { status: 400 });
      }
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        email: finalEmail,
        password: hashedPassword,
        role: role as "ADMIN" | "CASHIER" | "CUSTOMER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { user: newUser, message: `Akun ${newUser.role} berhasil dibuat` },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json({ error: "Gagal membuat pengguna" }, { status: 500 });
  }
}
