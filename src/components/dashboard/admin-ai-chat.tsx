"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import {
  Sparkles,
  Send,
  Bot,
  User,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
  Clock,
  Flame,
  AlertCircle,
  MessageSquare,
  Users,
  Database,
} from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
}

const ADMIN_QUICK_PROMPTS = [
  { label: "Ringkasan Seluruh Database", query: "Tampilkan ringkasan lengkap seluruh database sistem warung ini", icon: Database },
  { label: "Omzet & Keuangan Hari Ini", query: "Berapa omzet hari ini dan rincian total transaksi?", icon: TrendingUp },
  { label: "Antrean & Pesanan Pending", query: "Cek pesanan pending dan antrean operasional dapur", icon: Clock },
  { label: "Cek Stok / Menu Habis", query: "Cek produk yang stoknya habis atau tidak tersedia", icon: AlertCircle },
  { label: "Pelanggan Paling Loyal", query: "Siapa pelanggan paling loyal dan terbanyak belanja?", icon: Users },
  { label: "Menu Paling Laris & Omzet", query: "Menu apa yang paling laris dan berapa kontribusi omzetnya?", icon: Flame },
  { label: "Status Log WhatsApp", query: "Bagaimana status pengiriman log notifikasi WhatsApp?", icon: MessageSquare },
  { label: "Daftar Kasir & Admin", query: "Siapa saja akun kasir dan admin yang terdaftar?", icon: ShieldCheck },
  { label: "Analisis Bisnis & Rekomendasi", query: "Berikan analisis performa bisnis dan rekomendasi strategis", icon: Sparkles },
];

function formatAiText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-extrabold text-zinc-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function AdminAiChat({ defaultExpanded = true }: { defaultExpanded?: boolean }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "bot",
      text: `Halo ${user?.name ? `kak **${user.name}**` : "Admin"}! 👋 Saya **Oji Enterprise**, asisten AI cerdas manajemen warung Ojolali.

Saya terhubung langsung membaca **seluruh 8 tabel database** web ini secara real-time via Prisma ORM:
• 👥 **Users**: Seluruh akun pelanggan, admin, kasir, dan riwayat pendaftaran
• 📁 **Categories & Products**: Katalog menu lengkap, harga, deskripsi, dan status ketersediaan stok
• 📦 **Orders & Order Items**: Semua transaksi pesanan, status dapur, pembayaran, dan catatan khusus
• 💰 **Omzet & Finansial**: Total pendapatan, omzet hari ini/mingguan/bulanan, dan metode bayar
• 📱 **Notification Logs**: Status pengiriman pesan WhatsApp (Fonnte) sukses vs gagal
• ⚙️ **Settings**: Semua konfigurasi sistem restoran yang tersimpan

Silakan tanyakan apapun seputar database restoran, atau pilih salah satu menu analisis cepat di bawah! 🚀`,
      time: "Sistem Aktif",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRefreshAnim, setShowRefreshAnim] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `${Date.now()}-user`,
      sender: "user",
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput("");
    setLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
        content: m.text,
      }));

      // Call dedicated Admin Database AI API endpoint
      let res = await fetch("/api/admin/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history,
          userId: user?.id,
        }),
      });

      // Fallback to /api/chatbot if /api/admin/ai/chat is unavailable
      if (!res.ok && res.status !== 400 && res.status !== 403) {
        res = await fetch("/api/chatbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: textToSend,
            history,
            userId: user?.id,
          }),
        });
      }

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: `${Date.now()}-bot`,
        sender: "bot",
        text: data.reply || "Maaf, tidak dapat mengambil respon dari database saat ini.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "bot",
          text: "Terjadi kendala koneksi saat menghubungi database sistem. Pastikan koneksi database MySQL aktif.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setShowRefreshAnim(true);
    setMessages([
      {
        id: Date.now().toString(),
        sender: "bot",
        text: `Percakapan telah direset. Silakan tanyakan hal apapun mengenai database warung Ojolali, kak **${user?.name || "Admin"}**! 😊`,
        time: "Baru saja",
      },
    ]);
    setTimeout(() => setShowRefreshAnim(false), 800);
  };

  return (
    <div className="bg-white rounded-3xl border border-orange-200/80 shadow-md shadow-orange-500/5 overflow-hidden transition-all">
      {/* Header Panel */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-orange-50 via-white to-rose-50 border-b border-orange-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 via-rose-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/25 shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
                Asisten AI Database Warung (Oji Enterprise)
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Database Prisma Terhubung (8 Tabel Aktif)
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Membaca seluruh data: Omzet, Antrean Pesanan, Produk, Pelanggan, Kasir, Log WhatsApp, & Settings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            disabled={loading}
            title="Reset Percakapan"
            className="px-3 py-1.5 bg-white hover:bg-orange-50 text-zinc-600 hover:text-orange-600 border border-zinc-200 hover:border-orange-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${showRefreshAnim ? "animate-spin" : ""}`} />
            <span>Bersihkan Chat</span>
          </button>
        </div>
      </div>

      {/* Quick Analysis Chips */}
      <div className="p-3.5 bg-orange-50/40 border-b border-orange-100/60 flex gap-2 overflow-x-auto no-scrollbar">
        {ADMIN_QUICK_PROMPTS.map((p, idx) => {
          const Icon = p.icon;
          return (
            <button
              key={idx}
              onClick={() => handleSend(p.query)}
              disabled={loading}
              className="px-3 py-1.5 bg-white hover:bg-orange-600 text-zinc-700 hover:text-white border border-orange-200/80 hover:border-orange-600 rounded-xl text-xs font-semibold whitespace-nowrap transition shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Icon className="w-3.5 h-3.5 opacity-80" />
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Chat Messages Body */}
      <div className="p-5 overflow-y-auto space-y-4 bg-zinc-50/40 h-[360px] sm:h-[400px]">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${
              m.sender === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs ${
                m.sender === "user"
                  ? "bg-zinc-800"
                  : "bg-gradient-to-br from-orange-500 to-rose-600"
              }`}
            >
              {m.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-2xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-xs ${
                m.sender === "user"
                  ? "bg-orange-600 text-white rounded-tr-none"
                  : "bg-white border border-zinc-200 text-zinc-800 rounded-tl-none"
              }`}
            >
              <div className="space-y-1">
                {m.sender === "bot" ? formatAiText(m.text) : m.text}
              </div>

              <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-black/5 text-[10px]">
                <span className={m.sender === "user" ? "text-orange-200" : "text-zinc-400 font-medium"}>
                  {m.sender === "bot" ? "AI Oji (Database Restoran)" : user?.name || "Admin"}
                </span>
                <span className={m.sender === "user" ? "text-orange-200" : "text-zinc-400"}>
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
              <span className="text-xs text-zinc-400 ml-1">
                Oji sedang mengolah database sistem...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Field */}
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
            placeholder="Tanyakan apapun ke AI: omzet, antrean pesanan, data pelanggan, stok menu, WA..."
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
  );
}
