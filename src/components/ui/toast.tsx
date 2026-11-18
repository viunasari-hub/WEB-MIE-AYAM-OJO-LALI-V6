"use client";

import React, { createContext, useContext, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "error" | "info";
}

interface ToastContextType {
  toast: (options: {
    title: string;
    description?: string;
    variant?: "default" | "success" | "error" | "info";
  }) => void;
}

const ToastContext = createContext<ToastContextType>({
  toast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = ({
    title,
    description,
    variant = "default",
  }: {
    title: string;
    description?: string;
    variant?: "default" | "success" | "error" | "info";
  }) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, variant }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border text-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
              t.variant === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : t.variant === "error"
                ? "bg-rose-50 border-rose-200 text-rose-900"
                : t.variant === "info"
                ? "bg-sky-50 border-sky-200 text-sky-900"
                : "bg-white border-zinc-200 text-zinc-900 shadow-md"
            }`}
          >
            {t.variant === "success" && (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            {t.variant === "error" && (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            {t.variant === "info" && (
              <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            )}
            {t.variant === "default" && (
              <CheckCircle2 className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-semibold">{t.title}</p>
              {t.description && (
                <p className="text-xs mt-0.5 opacity-90">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-zinc-400 hover:text-zinc-700 transition"
              aria-label="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
