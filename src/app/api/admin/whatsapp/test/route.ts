import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendWhatsAppMessage, getWhatsAppConfig, formatPhoneWhatsApp } from "@/lib/whatsapp";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak (Hanya Admin)" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const config = await getWhatsAppConfig();

    const targetPhone = formatPhoneWhatsApp(body.targetPhone || config.adminNumber);

    if (!targetPhone) {
      return NextResponse.json(
        { error: "Nomor WhatsApp tujuan belum ditentukan atau tidak valid" },
        { status: 400 }
      );
    }

    const now = new Intl.DateTimeFormat("id-ID", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date());

    const testMessage = `🧪 TES NOTIFIKASI WHATSAPP - OJOLALI

Halo Admin! Ini adalah pesan uji coba sistem notifikasi WhatsApp Mie Ayam & Bakso Ojolali.

Waktu Kirim: ${now}
Mode: ${config.mode.toUpperCase()}
Status Sistem: AKTIF & SIAP DIGUNAKAN

Jika Anda menerima pesan ini, konfigurasi WhatsApp Anda telah berjalan dengan sukses! 👍`;

    const result = await sendWhatsAppMessage({
      to: targetPhone,
      message: testMessage,
      recipientType: "ADMIN",
      type: "Tes Notifikasi",
    });

    return NextResponse.json({
      success: result.success,
      status: result.status,
      mode: result.mode,
      message: result.message,
      error: result.error,
      recipientPhone: result.recipientPhone,
    });
  } catch (error) {
    console.error("Test WhatsApp send error:", error);
    return NextResponse.json({ error: "Gagal mengirim pesan uji coba" }, { status: 500 });
  }
}
