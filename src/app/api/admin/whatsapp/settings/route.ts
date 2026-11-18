import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getWhatsAppConfig, saveWhatsAppConfig, formatPhoneWhatsApp } from "@/lib/whatsapp";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak (Hanya Admin)" }, { status: 403 });
    }

    const config = await getWhatsAppConfig();

    return NextResponse.json({
      settings: {
        mode: config.mode,
        apiUrl: config.apiUrl,
        adminNumber: config.adminNumber,
        enabled: config.enabled,
        hasToken: Boolean(config.apiToken && config.apiToken.length > 0),
        // Mask token for frontend security (Requirement #8: Jangan pernah menampilkan API token pada frontend)
        maskedToken: config.apiToken
          ? `${config.apiToken.slice(0, 4)}••••••••${config.apiToken.slice(-4)}`
          : "",
      },
    });
  } catch (error) {
    console.error("Get WhatsApp settings error:", error);
    return NextResponse.json({ error: "Gagal memuat pengaturan WhatsApp" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak (Hanya Admin)" }, { status: 403 });
    }

    const body = await req.json();
    const { mode, apiUrl, apiToken, adminNumber, enabled } = body;

    const updatePayload: Record<string, any> = {};

    if (mode === "mock" || mode === "production") {
      updatePayload.mode = mode;
    }

    if (typeof apiUrl === "string") {
      updatePayload.apiUrl = apiUrl.trim();
    }

    if (typeof apiToken === "string" && apiToken.trim() !== "") {
      // Only update if provided and not masked placeholder
      if (!apiToken.includes("••••")) {
        updatePayload.apiToken = apiToken.trim();
      }
    }

    if (typeof adminNumber === "string") {
      const cleaned = formatPhoneWhatsApp(adminNumber);
      if (cleaned.length < 9) {
        return NextResponse.json(
          { error: "Nomor WhatsApp admin tidak valid (minimal 10 digit, contoh: 628xxxxxxxxxx)" },
          { status: 400 }
        );
      }
      updatePayload.adminNumber = cleaned;
    }

    if (typeof enabled === "boolean") {
      updatePayload.enabled = enabled;
    }

    await saveWhatsAppConfig(updatePayload);

    const updated = await getWhatsAppConfig();

    return NextResponse.json({
      message: "Pengaturan WhatsApp berhasil disimpan",
      settings: {
        mode: updated.mode,
        apiUrl: updated.apiUrl,
        adminNumber: updated.adminNumber,
        enabled: updated.enabled,
        hasToken: Boolean(updated.apiToken && updated.apiToken.length > 0),
      },
    });
  } catch (error) {
    console.error("Save WhatsApp settings error:", error);
    return NextResponse.json({ error: "Gagal menyimpan pengaturan WhatsApp" }, { status: 500 });
  }
}
