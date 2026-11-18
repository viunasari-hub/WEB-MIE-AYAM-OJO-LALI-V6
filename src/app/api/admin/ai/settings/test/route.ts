import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { testAiProviderConnection, getAiConfig, AiProvider } from "@/lib/ai/ai-config";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak (Hanya Admin)" }, { status: 403 });
    }

    const body = await req.json();
    const { provider, apiKey, model } = body as {
      provider: AiProvider;
      apiKey?: string;
      model?: string;
    };

    if (!provider) {
      return NextResponse.json({ error: "Provider AI wajib dipilih" }, { status: 400 });
    }

    // If key not passed in body, lookup from saved config
    let finalKey = apiKey || "";
    let finalModel = model || "";

    if (!finalKey || finalKey.includes("••••")) {
      const config = await getAiConfig();
      if (provider === "gemini") {
        finalKey = config.gemini.apiKey;
        if (!finalModel) finalModel = config.gemini.model;
      } else if (provider === "groq") {
        finalKey = config.groq.apiKey;
        if (!finalModel) finalModel = config.groq.model;
      } else if (provider === "openai") {
        finalKey = config.openai.apiKey;
        if (!finalModel) finalModel = config.openai.model;
      } else if (provider === "deepseek") {
        finalKey = config.deepseek.apiKey;
        if (!finalModel) finalModel = config.deepseek.model;
      } else if (provider === "anthropic") {
        finalKey = config.anthropic.apiKey;
        if (!finalModel) finalModel = config.anthropic.model;
      }
    }

    const testResult = await testAiProviderConnection(provider, finalKey, finalModel);

    return NextResponse.json(testResult);
  } catch (error) {
    console.error("Test AI connection error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan internal saat menguji koneksi AI." },
      { status: 500 }
    );
  }
}

