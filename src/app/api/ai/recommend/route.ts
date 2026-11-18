import { NextResponse } from "next/server";
import { askOjolaliAssistant } from "@/lib/ai/ojolali-assistant";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { reply: "Halo! Saya AI Asisten Ojolali. Ada yang bisa saya bantu terkait menu atau pemesanan Baso & Mie Ayam Ojolali? 😊" },
        { status: 400 }
      );
    }

    // Retrieve session if available (for personalized order context)
    const session = await getSession();
    const userId = session?.id || body.userId || null;

    const result = await askOjolaliAssistant({
      userMessage: message,
      userId,
      history,
    });

    return NextResponse.json({
      reply: result.reply,
      guarded: result.guarded,
      topicAllowed: result.topicAllowed,
    });
  } catch (error) {
    console.error("AI recommend route error:", error);
    return NextResponse.json(
      {
        reply: "Maaf, terjadi kendala saat memproses permintaan Anda. Silakan coba sesaat lagi.",
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
