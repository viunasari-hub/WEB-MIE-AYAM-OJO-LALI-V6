"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  Sparkles,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const INITIAL_MESSAGE: Message = {
  id: "init",
  role: "assistant",
  content:
    "Halo! Saya **Oji**, asisten AI Ojolali 🍜\n\nSaya siap membantu Anda soal menu, harga, pesanan, akun Anda, atau rekomendasi makanan. Ada yang bisa saya bantu?",
  timestamp: new Date(),
};

const QUICK_QUESTIONS = [
  "Siapa saya? 👤",
  "Menu apa yang paling laris? 🔥",
  "Budget 20 ribu makan apa? 💰",
  "Cara pesan via QRIS? 📱",
  "Jam buka warung? 🕐",
];

function formatContent(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function ChatbotWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [showRefreshConfirm, setShowRefreshConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollDown(distanceFromBottom > 80);
  };

  const handleRefresh = useCallback(() => {
    if (isLoading) return;
    setMessages([
      {
        ...INITIAL_MESSAGE,
        id: Date.now().toString(),
        timestamp: new Date(),
      },
    ]);
    setInput("");
    setShowScrollDown(false);
    setShowRefreshConfirm(true);
    setTimeout(() => setShowRefreshConfirm(false), 2000);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [isLoading]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      const historyForApi = messages
        .filter((m) => m.id !== "init")
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const res = await fetch("/api/chatbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            history: historyForApi,
            userId: user?.id,
          }),
        });

        const data = await res.json();
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            data.reply ||
            "Maaf, saya tidak bisa memproses pesan Anda saat ini.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Maaf, terjadi kendala koneksi. Silakan coba lagi 🙏",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [isLoading, messages]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Tooltip bubble - only when closed */}
        {!isOpen && (
          <div
            style={{
              background: "white",
              border: "1px solid #fed7aa",
              borderRadius: "12px",
              padding: "8px 12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
              fontSize: "12px",
              fontWeight: 600,
              color: "#9a3412",
              whiteSpace: "nowrap",
              animation: "fadeSlideUp 0.4s ease forwards",
            }}
          >
            Tanya Oji, asisten AI kami! 🍜
          </div>
        )}

        <button
          id="chatbot-toggle-btn"
          onClick={() => setIsOpen((v) => !v)}
          aria-label={isOpen ? "Tutup chatbot" : "Buka chatbot"}
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #ea580c, #e11d48)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 32px rgba(234,88,12,0.45)",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            position: "relative",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          }}
        >
          {isOpen ? (
            <X size={24} color="white" />
          ) : (
            <MessageCircle size={26} color="white" fill="white" />
          )}

          {/* Pulse ring */}
          {!isOpen && (
            <span
              style={{
                position: "absolute",
                inset: -4,
                borderRadius: "50%",
                border: "2px solid rgba(234,88,12,0.4)",
                animation: "pulse-ring 2s infinite",
              }}
            />
          )}
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div
          id="chatbot-window"
          style={{
            position: "fixed",
            bottom: 84,
            right: 24,
            width: 360,
            maxWidth: "calc(100vw - 32px)",
            height: 520,
            maxHeight: "calc(100vh - 120px)",
            borderRadius: 20,
            background: "white",
            boxShadow:
              "0 24px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(234,88,12,0.12)",
            border: "1px solid #fed7aa",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "slideUpIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards",
            zIndex: 50,
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #ea580c 0%, #e11d48 100%)",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid rgba(255,255,255,0.3)",
              }}
            >
              <Bot size={20} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  color: "white",
                  fontWeight: 800,
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                Oji
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                    background: "rgba(255,255,255,0.2)",
                    borderRadius: 8,
                    padding: "1px 6px",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  <Sparkles size={9} color="white" />
                  AI
                </span>
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.8)",
                  fontSize: 11,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#4ade80",
                    display: "inline-block",
                  }}
                />
                Asisten Ojolali · Online
              </div>
            </div>
            <button
              id="chatbot-refresh-btn"
              onClick={handleRefresh}
              disabled={isLoading}
              title="Mulai percakapan baru"
              style={{
                background: showRefreshConfirm
                  ? "rgba(74,222,128,0.25)"
                  : "rgba(255,255,255,0.15)",
                border: "none",
                borderRadius: 8,
                padding: 6,
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s",
                position: "relative",
              }}
            >
              {showRefreshConfirm ? (
                <span style={{ fontSize: 13 }}>✓</span>
              ) : (
                <RotateCcw size={15} color="white" />
              )}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "none",
                borderRadius: 8,
                padding: 6,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} color="white" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              background: "#fafaf9",
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: msg.role === "user" ? "row-reverse" : "row",
                  alignItems: "flex-end",
                  gap: 7,
                }}
              >
                {msg.role === "assistant" && (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #ea580c, #e11d48)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginBottom: 16,
                    }}
                  >
                    <Bot size={14} color="white" />
                  </div>
                )}

                <div
                  style={{
                    maxWidth: "78%",
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      background:
                        msg.role === "user"
                          ? "linear-gradient(135deg, #ea580c, #e11d48)"
                          : "white",
                      color: msg.role === "user" ? "white" : "#1c1917",
                      borderRadius:
                        msg.role === "user"
                          ? "18px 18px 4px 18px"
                          : "18px 18px 18px 4px",
                      padding: "9px 13px",
                      fontSize: 13,
                      lineHeight: 1.55,
                      boxShadow:
                        msg.role === "user"
                          ? "0 2px 12px rgba(234,88,12,0.3)"
                          : "0 2px 8px rgba(0,0,0,0.08)",
                      border:
                        msg.role === "assistant"
                          ? "1px solid #fde8d3"
                          : "none",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {msg.role === "assistant"
                      ? formatContent(msg.content)
                      : msg.content}
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      color: "#a8a29e",
                      paddingLeft: 4,
                      paddingRight: 4,
                    }}
                  >
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 7 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #ea580c, #e11d48)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Bot size={14} color="white" />
                </div>
                <div
                  style={{
                    background: "white",
                    border: "1px solid #fde8d3",
                    borderRadius: "18px 18px 18px 4px",
                    padding: "12px 16px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "#ea580c",
                        display: "inline-block",
                        animation: `typingDot 1.2s ${i * 0.2}s ease-in-out infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Scroll to bottom button */}
          {showScrollDown && (
            <button
              onClick={() => scrollToBottom()}
              style={{
                position: "absolute",
                bottom: 80,
                left: "50%",
                transform: "translateX(-50%)",
                background: "#ea580c",
                border: "none",
                borderRadius: "50%",
                width: 30,
                height: 30,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 12px rgba(234,88,12,0.4)",
                zIndex: 10,
              }}
            >
              <ChevronDown size={16} color="white" />
            </button>
          )}

          {/* Quick Questions - show only on first message */}
          {messages.length <= 1 && (
            <div
              style={{
                padding: "0 14px 10px",
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                background: "#fafaf9",
              }}
            >
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 20,
                    border: "1px solid #fed7aa",
                    background: "#fff7ed",
                    color: "#9a3412",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "#ffedd5";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#f97316";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "#fff7ed";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#fed7aa";
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div
            style={{
              padding: "10px 12px",
              borderTop: "1px solid #fde8d3",
              background: "white",
              display: "flex",
              alignItems: "flex-end",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <textarea
              ref={inputRef}
              id="chatbot-input"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height =
                  Math.min(e.target.scrollHeight, 100) + "px";
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ketik pesan... (Enter kirim)"
              rows={1}
              disabled={isLoading}
              style={{
                flex: 1,
                borderRadius: 14,
                border: "1.5px solid #fed7aa",
                padding: "9px 12px",
                fontSize: 13,
                outline: "none",
                resize: "none",
                fontFamily: "inherit",
                lineHeight: 1.5,
                color: "#1c1917",
                background: "#fafaf9",
                transition: "border-color 0.15s",
                overflow: "hidden",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#ea580c";
                e.target.style.background = "white";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#fed7aa";
                e.target.style.background = "#fafaf9";
              }}
            />
            <button
              id="chatbot-send-btn"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                border: "none",
                background:
                  !input.trim() || isLoading
                    ? "#e2e8f0"
                    : "linear-gradient(135deg, #ea580c, #e11d48)",
                cursor: !input.trim() || isLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.2s",
                boxShadow:
                  !input.trim() || isLoading
                    ? "none"
                    : "0 4px 12px rgba(234,88,12,0.35)",
              }}
            >
              <Send
                size={16}
                color={!input.trim() || isLoading ? "#94a3b8" : "white"}
              />
            </button>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUpIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          70% { transform: scale(1.3); opacity: 0; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        @keyframes typingDot {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </>
  );
}
