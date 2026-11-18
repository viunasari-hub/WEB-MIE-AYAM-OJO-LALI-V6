import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAiConfig, saveAiConfig, maskApiKey, AiProvider } from "@/lib/ai/ai-config";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak (Hanya Admin)" }, { status: 403 });
    }

    const config = await getAiConfig();

    return NextResponse.json({
      settings: {
        activeProvider: config.activeProvider,
        gemini: {
          hasKey: Boolean(config.gemini.apiKey && config.gemini.apiKey.length > 0),
          maskedKey: maskApiKey(config.gemini.apiKey),
          model: config.gemini.model,
        },
        groq: {
          hasKey: Boolean(config.groq.apiKey && config.groq.apiKey.length > 0),
          maskedKey: maskApiKey(config.groq.apiKey),
          model: config.groq.model,
        },
        openai: {
          hasKey: Boolean(config.openai.apiKey && config.openai.apiKey.length > 0),
          maskedKey: maskApiKey(config.openai.apiKey),
          model: config.openai.model,
        },
        deepseek: {
          hasKey: Boolean(config.deepseek.apiKey && config.deepseek.apiKey.length > 0),
          maskedKey: maskApiKey(config.deepseek.apiKey),
          model: config.deepseek.model,
        },
        anthropic: {
          hasKey: Boolean(config.anthropic.apiKey && config.anthropic.apiKey.length > 0),
          maskedKey: maskApiKey(config.anthropic.apiKey),
          model: config.anthropic.model,
        },
        fallbackToLocal: config.fallbackToLocal,
      },
    });
  } catch (error) {
    console.error("Get AI settings error:", error);
    return NextResponse.json({ error: "Gagal memuat konfigurasi AI" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak (Hanya Admin)" }, { status: 403 });
    }

    const body = await req.json();
    const {
      activeProvider,
      gemini,
      groq,
      openai,
      deepseek,
      anthropic,
      fallbackToLocal,
    } = body;

    const payloadToSave: any = {};

    if (activeProvider) {
      payloadToSave.activeProvider = activeProvider as AiProvider;
    }

    if (gemini) payloadToSave.gemini = gemini;
    if (groq) payloadToSave.groq = groq;
    if (openai) payloadToSave.openai = openai;
    if (deepseek) payloadToSave.deepseek = deepseek;
    if (anthropic) payloadToSave.anthropic = anthropic;

    if (typeof fallbackToLocal === "boolean") {
      payloadToSave.fallbackToLocal = fallbackToLocal;
    }

    await saveAiConfig(payloadToSave);

    const updated = await getAiConfig();

    return NextResponse.json({
      message: "Konfigurasi AI berhasil disimpan!",
      settings: {
        activeProvider: updated.activeProvider,
        gemini: {
          hasKey: Boolean(updated.gemini.apiKey && updated.gemini.apiKey.length > 0),
          maskedKey: maskApiKey(updated.gemini.apiKey),
          model: updated.gemini.model,
        },
        groq: {
          hasKey: Boolean(updated.groq.apiKey && updated.groq.apiKey.length > 0),
          maskedKey: maskApiKey(updated.groq.apiKey),
          model: updated.groq.model,
        },
        openai: {
          hasKey: Boolean(updated.openai.apiKey && updated.openai.apiKey.length > 0),
          maskedKey: maskApiKey(updated.openai.apiKey),
          model: updated.openai.model,
        },
        deepseek: {
          hasKey: Boolean(updated.deepseek.apiKey && updated.deepseek.apiKey.length > 0),
          maskedKey: maskApiKey(updated.deepseek.apiKey),
          model: updated.deepseek.model,
        },
        anthropic: {
          hasKey: Boolean(updated.anthropic.apiKey && updated.anthropic.apiKey.length > 0),
          maskedKey: maskApiKey(updated.anthropic.apiKey),
          model: updated.anthropic.model,
        },
        fallbackToLocal: updated.fallbackToLocal,
      },
    });
  } catch (error) {
    console.error("Save AI settings error:", error);
    return NextResponse.json({ error: "Gagal menyimpan konfigurasi AI" }, { status: 500 });
  }
}

