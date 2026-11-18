"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { CustomerLayout } from "@/components/dashboard/customer-layout";
import { useAuth } from "@/context/auth-context";
import {
  Sparkles,
  Send,
  Bot,
  User,
  UtensilsCrossed,
} from "lucide-react";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
  guarded?: boolean;
}

const quickPrompts = [
  "Siapa saya?",
  "Tampilkan semua menu",
  "Cek pesanan saya",
  "Rekomendasikan menu buat saya",
  "Menu apa yang paling laris?",
  "Berapa total pesanan hari ini?",
  "Cara pesan di sini gimana?",
  "Ada promo atau diskon?",
  "Statistik warung dong",
  "Info pembayaran apa saja?",
];

export default function CustomerAiPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Halo kak! Saya **AI Asisten Ojolali**, asisten virtual khusus Baso di Lingkungan Kecamatan dan Mie Ayam Ojolali. Saya siap membantu mencari menu, rekomendasi sesuai budget, info harga, hingga panduan pemesanan. Ada yang bisa saya bantu hari ini? 😊",
      time: "Baru saja",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `${Date.now()}-user`,
      sender: "user",
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!messageText) setInput("");
    setLoading(true);

    try {
      // Build conversation history
      const history = messages.slice(-6).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend, history, userId: user?.id }),
      });

      const data = await res.json();
      const botMsg: Message = {
        id: `${Date.now()}-bot`,
        sender: "bot",
        text: data.reply || "Mohon maaf, saya belum memahami pertanyaan tersebut.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        guarded: data.guarded,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "bot",
          text: "Maaf, terjadi gangguan koneksi ke sistem rekomendasi. Silakan coba sesaat lagi.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerLayout>
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-zinc-900 tracking-tight">
                  AI Asisten Ojolali
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Database Terhubung · Siap Menjawab
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Asisten virtual resmi Baso & Mie Ayam Ojolali berbasis database restoran
              </p>
            </div>
          </div>

          <Link
            href="/menu"
            className="px-4 py-2 bg-orange-50 hover:bg-orange-600 text-orange-600 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 w-fit"
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Lihat Semua Menu</span>
          </Link>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              disabled={loading}
              className="px-3.5 py-1.5 bg-white hover:bg-orange-50 border border-zinc-200 hover:border-orange-300 rounded-xl text-xs text-zinc-700 hover:text-orange-700 whitespace-nowrap transition shadow-2xs font-medium disabled:opacity-50"
            >
              💬 {q}
            </button>
          ))}
        </div>

        {/* Chat Window Container */}
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-xs overflow-hidden flex flex-col h-[520px]">
          {/* Chat Messages Log */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-zinc-50/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex items-start gap-3 ${m.sender === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs ${m.sender === "user"
                      ? "bg-zinc-800"
                      : "bg-gradient-to-br from-orange-500 to-rose-600"
                    }`}
                >
                  {m.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-lg rounded-2xl p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-xs ${m.sender === "user"
                      ? "bg-orange-600 text-white rounded-tr-none"
                      : "bg-white border border-zinc-200 text-zinc-800 rounded-tl-none"
                    }`}
                >
                  <p>{m.text}</p>
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-black/5">
                    <span className="text-[10px] text-zinc-400 font-medium">
                      {m.sender === "bot" ? "AI Oji · Terhubung Database" : user?.name || "Anda"}
                    </span>
                    <span
                      className={`text-[10px] ml-auto ${m.sender === "user" ? "text-orange-200" : "text-zinc-400"
                        }`}
                    >
                      {m.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-white shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-zinc-200 rounded-2xl rounded-tl-none p-3.5 shadow-xs flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-600 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-orange-600 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-orange-600 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-xs text-zinc-400 ml-1">Oji sedang mencari jawaban...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <div className="p-4 bg-white border-t border-zinc-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Tanya apapun tentang menu, pesanan, statistik warung..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Kirim</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
