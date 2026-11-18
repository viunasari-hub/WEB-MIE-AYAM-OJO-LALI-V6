import { processChatbotQuery } from "./chatbot-engine";

export interface AssistantInput {
  userMessage: string;
  userId?: string | null;
  history?: Array<{ sender: "user" | "bot"; text: string }>;
}

export interface AssistantOutput {
  reply: string;
  guarded: boolean;
  topicAllowed: boolean;
}

export async function askOjolaliAssistant({
  userMessage,
  userId,
}: AssistantInput): Promise<AssistantOutput> {
  const cleanMsg = (userMessage || "").trim();
  if (!cleanMsg) {
    return {
      reply: "Silakan masukkan pertanyaan seputar menu, harga, pesanan, atau informasi warung Ojolali.",
      guarded: false,
      topicAllowed: true,
    };
  }

  const reply = await processChatbotQuery(cleanMsg, userId);

  return {
    reply,
    guarded: false,
    topicAllowed: true,
  };
}

