import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, COOKIE_NAME } from "@/lib/auth";
import { getPhoneVariants, cleanPhoneDigits } from "@/lib/phone";

export async function POST(req: Request) {
  try {
    const { name, phone, password, email } = await req.json();

    if (!name || !phone || !password) {
      return NextResponse.json(
        { error: "Nama lengkap, nomor handphone, dan kata sandi wajib diisi" },
        { status: 400 }
      );
    }

    const trimmedPhone = phone.trim();
    const digits = cleanPhoneDigits(trimmedPhone);

    if (digits.length < 8) {
      return NextResponse.json(
        { error: "Nomor handphone tidak valid (minimal 8 digit)" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Kata sandi minimal 6 karakter" },
        { status: 400 }
      );
    }

    // Check if phone number is already registered
    const variants = getPhoneVariants(trimmedPhone);
    const existingPhone = await prisma.user.findFirst({
      where: { phone: { in: variants } },
    });

    if (existingPhone) {
      return NextResponse.json(
        { error: "Nomor Handphone / WhatsApp sudah terdaftar. Silakan langsung login." },
        { status: 400 }
      );
    }

    // Determine email (custom or auto-generated for Prisma unique constraint)
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
      const existingEmail = await prisma.user.findUnique({
        where: { email: finalEmail },
      });
      if (existingEmail) {
        return NextResponse.json(
          { error: "Alamat email sudah terdaftar. Silakan gunakan email lain." },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        phone: trimmedPhone,
        email: finalEmail,
        password: hashedPassword,
        role: "CUSTOMER",
      },
    });

    const sessionPayload = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role as "ADMIN" | "CASHIER" | "CUSTOMER",
      phone: newUser.phone,
    };

    const token = await signToken(sessionPayload);

    const response = NextResponse.json({
      message: "Registrasi berhasil",
      user: sessionPayload,
      redirectUrl: "/customer",
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses registrasi" },
      { status: 500 }
    );
  }
}
