"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/dashboard/admin-layout";
import { formatRupiah, formatDate } from "@/lib/utils";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Award,
  RefreshCw,
  Flame,
  ArrowUpRight,
} from "lucide-react";
import { AdminAiChat } from "@/components/dashboard/admin-ai-chat";

interface AiInsightResponse {
  summary: string;
  metrics: {
    totalOmzet: number;
    totalTransactions: number;
    avgOrderValue: number;
    topProducts: Array<{ name: string; qty: number; revenue: number }>;
    lowProducts: Array<{ name: string; qty: number }>;
  };
  recommendations: Array<{
    title: string;
    description: string;
    impact: string;
  }>;
  generatedAt: string;
}

export default function AdminAiInsightsPage() {
  const [insight, setInsight] = useState<AiInsightResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadInsight = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ai/insights");
      if (res.ok) {
        const data = await res.json();
        setInsight(data);
      }
    } catch (err) {
      console.error("Error loading AI insights:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsight();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                AI Business Insights Ojolali
              </h1>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Analisis cerdas berdasarkan data transaksi riil dari database penjualan
            </p>
          </div>

          <button
            onClick={loadInsight}
            className="px-4 py-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-2xs w-fit"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Generate Ulang Insight</span>
          </button>
        </div>

        {/* Executive AI Summary Box */}
        <div className="bg-gradient-to-br from-orange-500 via-rose-600 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-xs rounded-full text-xs font-bold uppercase tracking-wider">
              Ringkasan Eksekutif AI
            </span>
            {insight && (
              <span className="text-[11px] text-orange-100 opacity-90">
                Diperbarui: {formatDate(insight.generatedAt)}
              </span>
            )}
          </div>

          <p className="text-sm sm:text-base leading-relaxed text-orange-50">
            {loading ? (
              "Sedang menganalisis jutaan titik data transaksi warung..."
            ) : insight ? (
              insight.summary
            ) : (
              "Data transaksi belum mencukupi untuk analisis AI."
            )}
          </p>
        </div>

        {/* 2-Columns: Top vs Low Performers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Selling Card */}
          <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h2 className="font-extrabold text-base text-zinc-900">
                  Produk Paling Laris
                </h2>
              </div>
              <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                Pilar Omzet
              </span>
            </div>

            <div className="space-y-3">
              {loading || !insight ? (
                <p className="text-xs text-zinc-400">Menganalisis...</p>
              ) : insight.metrics.topProducts.length === 0 ? (
                <p className="text-xs text-zinc-400">Belum ada transaksi.</p>
              ) : (
                insight.metrics.topProducts.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-100"
                  >
                    <div>
                      <span className="font-bold text-xs text-zinc-900 block">{p.name}</span>
                      <span className="text-[11px] text-zinc-500">
                        {p.qty} porsi terjual ({formatRupiah(p.revenue)})
                      </span>
                    </div>
                    <span className="text-xs font-black text-orange-600">
                      #{idx + 1}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Underperforming Card */}
          <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <h2 className="font-extrabold text-base text-zinc-900">
                  Produk Butuh Perhatian
                </h2>
              </div>
              <span className="text-[10px] font-bold uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                Slow Moving
              </span>
            </div>

            <div className="space-y-3">
              {loading || !insight ? (
                <p className="text-xs text-zinc-400">Menganalisis...</p>
              ) : insight.metrics.lowProducts.length === 0 ? (
                <p className="text-xs text-zinc-500 p-3 bg-zinc-50 rounded-xl">
                  Semua produk memiliki tingkat penjualan yang merata dan stabil.
                </p>
              ) : (
                insight.metrics.lowProducts.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-100"
                  >
                    <div>
                      <span className="font-bold text-xs text-zinc-900 block">{p.name}</span>
                      <span className="text-[11px] text-zinc-500">
                        Terjual kurang dari 5 porsi periode ini
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-rose-600">
                      Tingkatkan Promo
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Asisten AI Interaktif Admin (Tanya Jawab Database Real-Time) */}
        <AdminAiChat />

        {/* Actionable Promo Recommendations */}
        <div className="bg-white rounded-3xl border border-zinc-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h2 className="font-extrabold text-base text-zinc-900">
              Rekomendasi Promo & Strategi UMKM
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loading || !insight ? (
              <div className="col-span-full py-8 text-center text-xs text-zinc-400">
                Memproses rekomendasi strategis...
              </div>
            ) : (
              insight.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-zinc-50/80 border border-zinc-200 space-y-3 hover:border-orange-400 transition flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xs">
                      {idx + 1}
                    </span>
                    <h3 className="font-bold text-sm text-zinc-900">{rec.title}</h3>
                    <p className="text-xs text-zinc-600 leading-relaxed">{rec.description}</p>
                  </div>
                  <div className="pt-3 border-t border-zinc-200 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-md">
                      {rec.impact}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
