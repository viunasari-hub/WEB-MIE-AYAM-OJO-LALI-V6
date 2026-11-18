import { prisma } from "../prisma";

export type AiProvider =
  | "gemini"
  | "groq"
  | "openai"
  | "deepseek"
  | "anthropic"
  | "local";

export interface ProviderDetail {
  apiKey: string;
  model: string;
}

export interface AiConfig {
  activeProvider: AiProvider;
  gemini: ProviderDetail;
  groq: ProviderDetail;
  openai: ProviderDetail;
  deepseek: ProviderDetail;
  anthropic: ProviderDetail;
  fallbackToLocal: boolean;
}

export const DEFAULT_AI_CONFIG: AiConfig = {
  activeProvider: "gemini",
  gemini: {
    apiKey: "",
    model: "gemini-2.5-flash",
  },
  groq: {
    apiKey: "",
    model: "llama-3.3-70b-versatile",
  },
  openai: {
    apiKey: "",
    model: "gpt-4o-mini",
  },
  deepseek: {
    apiKey: "",
    model: "deepseek-chat",
  },
  anthropic: {
    apiKey: "",
    model: "claude-3-5-haiku-20241022",
  },
  fallbackToLocal: true,
};

export function maskApiKey(key?: string | null): string {
  if (!key || key.trim().length === 0) return "";
  const trimmed = key.trim();
  if (trimmed.length <= 8) return "••••••••";
  return `${trimmed.slice(0, 4)}••••••••${trimmed.slice(-4)}`;
}

export async function getAiConfig(): Promise<AiConfig> {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: "ai_",
        },
      },
    });

    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }

    const activeProvider = (map["ai_active_provider"] || "gemini") as AiProvider;

    return {
      activeProvider,
      gemini: {
        apiKey: map["ai_gemini_api_key"] || process.env.GEMINI_API_KEY || "",
        model: map["ai_gemini_model"] || "gemini-2.5-flash",
      },
      groq: {
        apiKey: map["ai_groq_api_key"] || process.env.GROQ_API_KEY || "",
        model: map["ai_groq_model"] || "llama-3.3-70b-versatile",
      },
      openai: {
        apiKey: map["ai_openai_api_key"] || process.env.OPENAI_API_KEY || "",
        model: map["ai_openai_model"] || "gpt-4o-mini",
      },
      deepseek: {
        apiKey: map["ai_deepseek_api_key"] || process.env.DEEPSEEK_API_KEY || "",
        model: map["ai_deepseek_model"] || "deepseek-chat",
      },
      anthropic: {
        apiKey: map["ai_anthropic_api_key"] || process.env.ANTHROPIC_API_KEY || "",
        model: map["ai_anthropic_model"] || "claude-3-5-haiku-20241022",
      },
      fallbackToLocal: map["ai_fallback_to_local"] !== "false",
    };
  } catch (error) {
    console.error("Error reading AI config from database:", error);
    return {
      ...DEFAULT_AI_CONFIG,
      gemini: {
        apiKey: process.env.GEMINI_API_KEY || "",
        model: "gemini-2.5-flash",
      },
    };
  }
}

export async function saveAiConfig(data: Partial<AiConfig>): Promise<void> {
  const updates: Array<{ key: string; value: string }> = [];

  if (data.activeProvider) {
    updates.push({ key: "ai_active_provider", value: data.activeProvider });
  }

  if (data.gemini) {
    if (data.gemini.apiKey !== undefined && !data.gemini.apiKey.includes("••••")) {
      updates.push({ key: "ai_gemini_api_key", value: data.gemini.apiKey.trim() });
    }
    if (data.gemini.model) {
      updates.push({ key: "ai_gemini_model", value: data.gemini.model.trim() });
    }
  }

  if (data.groq) {
    if (data.groq.apiKey !== undefined && !data.groq.apiKey.includes("••••")) {
      updates.push({ key: "ai_groq_api_key", value: data.groq.apiKey.trim() });
    }
    if (data.groq.model) {
      updates.push({ key: "ai_groq_model", value: data.groq.model.trim() });
    }
  }

  if (data.openai) {
    if (data.openai.apiKey !== undefined && !data.openai.apiKey.includes("••••")) {
      updates.push({ key: "ai_openai_api_key", value: data.openai.apiKey.trim() });
    }
    if (data.openai.model) {
      updates.push({ key: "ai_openai_model", value: data.openai.model.trim() });
    }
  }

  if (data.deepseek) {
    if (data.deepseek.apiKey !== undefined && !data.deepseek.apiKey.includes("••••")) {
      updates.push({ key: "ai_deepseek_api_key", value: data.deepseek.apiKey.trim() });
    }
    if (data.deepseek.model) {
      updates.push({ key: "ai_deepseek_model", value: data.deepseek.model.trim() });
    }
  }

  if (data.anthropic) {
    if (data.anthropic.apiKey !== undefined && !data.anthropic.apiKey.includes("••••")) {
      updates.push({ key: "ai_anthropic_api_key", value: data.anthropic.apiKey.trim() });
    }
    if (data.anthropic.model) {
      updates.push({ key: "ai_anthropic_model", value: data.anthropic.model.trim() });
    }
  }

  if (data.fallbackToLocal !== undefined) {
    updates.push({ key: "ai_fallback_to_local", value: data.fallbackToLocal ? "true" : "false" });
  }

  for (const item of updates) {
    await prisma.setting.upsert({
      where: { key: item.key },
      create: { key: item.key, value: item.value },
      update: { value: item.value },
    });
  }
}

// Universal AI Caller Supporting Gemini, Groq, OpenAI, DeepSeek, Anthropic
export async function executeAiQuery(
  provider: AiProvider,
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string | null> {
  if (!apiKey || !apiKey.trim()) return null;
  const cleanKey = apiKey.trim();

  try {
    // 1. Google Gemini Provider
    if (provider === "gemini") {
      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
      if (history && history.length > 0) {
        for (const h of history.slice(-4)) {
          contents.push({
            role: h.role === "assistant" ? "model" : "user",
            parts: [{ text: h.content }],
          });
        }
      }
      contents.push({
        role: "user",
        parts: [{ text: userMessage }],
      });

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: { temperature: 0.2, maxOutputTokens: 1500 },
          }),
          signal: AbortSignal.timeout(12000),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      }
      return null;
    }

    // 2. Groq Provider (OpenAI Compatible)
    if (provider === "groq") {
      const messages: Array<{ role: string; content: string }> = [
        { role: "system", content: systemPrompt },
      ];
      if (history && history.length > 0) {
        for (const h of history.slice(-4)) {
          messages.push({ role: h.role, content: h.content });
        }
      }
      messages.push({ role: "user", content: userMessage });

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cleanKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
          max_tokens: 1500,
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return text.trim();
      }
      return null;
    }

    // 3. OpenAI Provider
    if (provider === "openai") {
      const messages: Array<{ role: string; content: string }> = [
        { role: "system", content: systemPrompt },
      ];
      if (history && history.length > 0) {
        for (const h of history.slice(-4)) {
          messages.push({ role: h.role, content: h.content });
        }
      }
      messages.push({ role: "user", content: userMessage });

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cleanKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
          max_tokens: 1500,
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return text.trim();
      }
      return null;
    }

    // 4. DeepSeek Provider (OpenAI Compatible)
    if (provider === "deepseek") {
      const messages: Array<{ role: string; content: string }> = [
        { role: "system", content: systemPrompt },
      ];
      if (history && history.length > 0) {
        for (const h of history.slice(-4)) {
          messages.push({ role: h.role, content: h.content });
        }
      }
      messages.push({ role: "user", content: userMessage });

      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cleanKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
          max_tokens: 1500,
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return text.trim();
      }
      return null;
    }

    // 5. Anthropic Claude Provider
    if (provider === "anthropic") {
      const messages: Array<{ role: string; content: string }> = [];
      if (history && history.length > 0) {
        for (const h of history.slice(-4)) {
          messages.push({ role: h.role, content: h.content });
        }
      }
      messages.push({ role: "user", content: userMessage });

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": cleanKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          system: systemPrompt,
          messages,
          max_tokens: 1500,
          temperature: 0.2,
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.content?.[0]?.text;
        if (text) return text.trim();
      }
      return null;
    }

    return null;
  } catch (error) {
    console.error(`Error executing AI query with ${provider}:`, error);
    return null;
  }
}

// Quick connection test for admin UI
export async function testAiProviderConnection(
  provider: AiProvider,
  apiKey: string,
  model: string
): Promise<{ success: boolean; message: string; latencyMs: number }> {
  if (provider === "local") {
    return {
      success: true,
      message: "Mesin Database Lokal Bawaan aktif dan selalu siap tanpa API Key.",
      latencyMs: 5,
    };
  }

  if (!apiKey || !apiKey.trim()) {
    return {
      success: false,
      message: "API Key belum diisi. Masukkan API Key terlebih dahulu.",
      latencyMs: 0,
    };
  }

  const startTime = Date.now();
  try {
    const reply = await executeAiQuery(
      provider,
      apiKey,
      model,
      "Kamu adalah asisten penguji koneksi. Jawab hanya dengan kata: OK",
      "Tes koneksi API Key."
    );

    const latencyMs = Date.now() - startTime;
    if (reply) {
      return {
        success: true,
        message: `Koneksi berhasil! Respon AI (${model}): "${reply.slice(0, 50)}"`,
        latencyMs,
      };
    } else {
      return {
        success: false,
        message: `Koneksi ke ${provider.toUpperCase()} (${model}) gagal. Periksa kembali API Key dan kuota akun Anda.`,
        latencyMs,
      };
    }
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      success: false,
      message: `Error koneksi: ${err?.message || "Gagal menghubungi server penyedia AI"}`,
      latencyMs,
    };
  }
}

