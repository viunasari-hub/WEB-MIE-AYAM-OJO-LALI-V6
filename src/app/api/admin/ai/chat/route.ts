import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { processAdminDatabaseAiQuery } from "@/lib/ai/admin-database-ai";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const body = await req.json().catch(() => ({}));
    const { message, history, userId: bodyUserId } = body as {
      message?: string;
      history?: Array<{ role: "user" | "assistant"; content: string }>;
      userId?: string;
    };

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { reply: "Silakan ajukan pertanyaan seputar database, omzet, pesanan, menu, atau pelanggan Ojolali." },
        { status: 400 }
      );
    }

    // Role check: verify session or userId
    const currentUserId = session?.id || bodyUserId || null;
    const isAuthorized = session ? ["ADMIN", "CASHIER"].includes(session.role) : true;

    if (!isAuthorized) {
      return NextResponse.json(
        { reply: "Akses ditolak: Asisten AI Database hanya dapat diakses oleh Administrator dan Kasir." },
        { status: 403 }
      );
    }

    const reply = await processAdminDatabaseAiQuery(message, history, currentUserId);

    return NextResponse.json({
      reply,
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Admin AI Chat API error:", error);
    return NextResponse.json(
      {
        reply: "Terjadi kesalahan internal saat memproses data database. Pastikan koneksi database aktif.",
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

