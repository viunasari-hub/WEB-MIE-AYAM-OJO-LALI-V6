import { NextResponse } from "next/server";
import { comparePassword, signToken, COOKIE_NAME } from "@/lib/auth";
import { findUserByIdentifier } from "@/lib/phone";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const identifier = (body.phone || body.identifier || body.email || "").trim();
    const password = body.password;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Nomor handphone dan kata sandi wajib diisi" },
        { status: 400 }
      );
    }

    const user = await findUserByIdentifier(identifier);

    if (!user) {
      return NextResponse.json(
        { error: "Nomor handphone tidak terdaftar. Silakan periksa kembali atau daftar akun baru." },
        { status: 401 }
      );
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Kata sandi tidak sesuai. Silakan coba lagi." },
        { status: 401 }
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
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server saat login" },
      { status: 500 }
    );
  }
}
