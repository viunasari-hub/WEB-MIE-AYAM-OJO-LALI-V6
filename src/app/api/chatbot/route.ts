import { NextResponse } from "next/server";
import { processChatbotQuery } from "@/lib/ai/chatbot-engine";
import { processAdminDatabaseAiQuery } from "@/lib/ai/admin-database-ai";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history, userId: bodyUserId } = body as {
      message?: string;
      history?: Array<{ role: "user" | "assistant"; content: string }>;
      userId?: string;
    };

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { reply: "Silakan masukkan pertanyaan seputar menu, harga, pesanan, atau informasi warung Ojolali." },
        { status: 400 }
      );
    }

    const session = await getSession();
    const userId = session?.id || bodyUserId || null;

    let userRole = session?.role;
    if (!userRole && userId) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true },
        });
        if (dbUser) userRole = dbUser.role as any;
      } catch (err) {
        console.error("Error looking up user role in chatbot route:", err);
      }
    }

    // Jika pengguna adalah Admin atau Kasir, gunakan Admin Database AI Engine berkemampuan penuh
    let reply = "";
    if (userRole === "ADMIN" || userRole === "CASHIER") {
      reply = await processAdminDatabaseAiQuery(message, history, userId);
    } else {
      reply = await processChatbotQuery(message, userId);
    }

    return NextResponse.json({ reply, blocked: false });
  } catch (error) {
    console.error("Chatbot route error:", error);
    return NextResponse.json(
      { reply: "Maaf, terjadi kendala teknis saat memproses data. Silakan coba sesaat lagi." },
      { status: 500 }
    );
  }
}
