import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findUserByIdentifier, getPhoneVariants } from "@/lib/phone";
import { signToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return NextResponse.json(
        { error: "Nomor handphone dan kode verifikasi wajib diisi" },
        { status: 400 }
      );
    }

    const trimmedCode = code.toString().trim();
    const variants = getPhoneVariants(phone);

    // Look for active OTP
    const activeOtp = await prisma.otpCode.findFirst({
      where: {
        phone: { in: variants },
        code: trimmedCode,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!activeOtp) {
      return NextResponse.json(
        { error: "Kode verifikasi salah atau sudah kedaluwarsa. Silakan minta kode baru." },
        { status: 400 }
      );
    }

    // Delete used OTP
    await prisma.otpCode.deleteMany({
      where: {
        phone: { in: variants },
      },
    });

    // Find the associated user
    const user = await findUserByIdentifier(phone);
    if (!user) {
      return NextResponse.json(
        { error: "Akun pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    const sessionPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as "ADMIN" | "CASHIER" | "CUSTOMER",
      phone: user.phone,
    };

    const token = await signToken(sessionPayload);

    let redirectUrl = "/customer";
    if (user.role === "ADMIN") redirectUrl = "/admin";
    else if (user.role === "CASHIER") redirectUrl = "/cashier";

    const response = NextResponse.json({
      message: "Login berhasil",
      user: sessionPayload,
      redirectUrl,
    });

    // Set secure HTTP-only cookie
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
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server saat memverifikasi kode OTP" },
      { status: 500 }
    );
  }
}
