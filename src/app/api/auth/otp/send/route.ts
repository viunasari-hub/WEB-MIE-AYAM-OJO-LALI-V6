import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findUserByIdentifier, getPhoneVariants, cleanPhoneDigits } from "@/lib/phone";
import { sendWhatsAppMessage, getWhatsAppConfig } from "@/lib/whatsapp";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    const cleanDigits = cleanPhoneDigits(phone);

    if (!cleanDigits || cleanDigits.length < 8) {
      return NextResponse.json(
        { error: "Masukkan nomor WhatsApp yang valid (minimal 8-15 digit)" },
        { status: 400 }
      );
    }

    const user = await findUserByIdentifier(phone);
    if (!user) {
      return NextResponse.json(
        {
          error:
            "Nomor WhatsApp belum terdaftar di akun manapun. Silakan daftar akun baru terlebih dahulu.",
        },
        { status: 404 }
      );
    }

    // Generate 6 digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 menit

    const targetPhone = user.phone || phone;
    const variants = getPhoneVariants(targetPhone);

    // Invalidate old OTPs for this phone
    await prisma.otpCode.deleteMany({
      where: {
        phone: { in: variants },
      },
    });

    // Save new OTP
    await prisma.otpCode.create({
      data: {
        phone: targetPhone,
        code,
        expiresAt,
      },
    });

    // Send WhatsApp notification
    const message = `🔐 *KODE VERIFIKASI LOGIN - BASO & MIE AYAM OJOLALI*

Halo kak *${user.name}*,
Kode verifikasi (OTP) untuk masuk ke akun Anda adalah:

*${code}*

Kode ini berlaku selama 5 menit. Jangan berikan kode ini kepada siapapun demi keamanan akun Anda.`;

    const config = await getWhatsAppConfig();
    await sendWhatsAppMessage({
      to: targetPhone,
      message,
      recipientType: user.role === "ADMIN" ? "ADMIN" : "CUSTOMER",
      type: "Kode OTP Login",
    });

    return NextResponse.json({
      success: true,
      message:
        config.mode === "mock"
          ? `[SIMULASI MOCK] Kode OTP berhasil dikirim ke WhatsApp: ${code}`
          : "Kode verifikasi telah dikirim ke WhatsApp Anda.",
      mode: config.mode,
      mockCode: config.mode === "mock" ? code : undefined,
      phone: targetPhone,
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return NextResponse.json(
      { error: "Gagal mengirimkan kode verifikasi OTP. Silakan periksa kembali server WhatsApp." },
      { status: 500 }
    );
  }
}
