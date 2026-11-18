"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/dashboard/admin-layout";
import { useToast } from "@/components/ui/toast";
import {
  Bot,
  Sparkles,
  Zap,
  Key,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Activity,
  Check,
  MessageSquare,
  Server,
  Layers,
  ArrowRight,
} from "lucide-react";

type AiProvider = "gemini" | "groq" | "openai" | "deepseek" | "anthropic" | "local";

interface ProviderConfigState {
  hasKey: boolean;
  maskedKey: string;
  model: string;
}

interface AllAiSettings {
  activeProvider: AiProvider;
  gemini: ProviderConfigState;
  groq: ProviderConfigState;
  openai: ProviderConfigState;
  deepseek: ProviderConfigState;
  anthropic: ProviderConfigState;
  fallbackToLocal: boolean;
}

const PROVIDER_METADATA = [
  {
    id: "gemini" as AiProvider,
    name: "Google Gemini",
    badge: "Rekomendasi Google",
    tagline: "Multimodal cerdas, cepat, dan integrasi resmi Google AI.",
    color: "from-blue-500 to-indigo-600",
    bgActive: "border-blue-500 bg-blue-50/50",
    icon: Sparkles,
    getKeyUrl: "https://aistudio.google.com/app/apikey",
    models: [
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (Terbaru & Cepat)" },
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash (Stabil & Ringan)" },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro (Penalaran Kompleks)" },
    ],
  },
  {
    id: "groq" as AiProvider,
    name: "Groq Cloud (LPU)",
    badge: "Super Cepat & Kuota Gratis",
    tagline: "Inferensi ultra-cepat (<0.5 detik) berbasis model open-source Llama 3.",
    color: "from-orange-500 to-amber-600",
    bgActive: "border-orange-500 bg-orange-50/50",
    icon: Zap,
    getKeyUrl: "https://console.groq.com/keys",
    models: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B (Sangat Cerdas & Lengkap)" },
      { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B (Kecepatan Maksimal)" },
      { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B (Konteks Panjang)" },
    ],
  },
  {
    id: "openai" as AiProvider,
    name: "OpenAI (ChatGPT)",
    badge: "Populer",
    tagline: "Standar industri AI dengan model GPT-4o dan GPT-4o-mini.",
    color: "from-emerald-500 to-teal-600",
    bgActive: "border-emerald-500 bg-emerald-50/50",
    icon: Bot,
    getKeyUrl: "https://platform.openai.com/api-keys",
    models: [
      { id: "gpt-4o-mini", name: "GPT-4o Mini (Hemat & Sangat Cerdas)" },
      { id: "gpt-4o", name: "GPT-4o (Model Unggulan OpenAI)" },
      { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo (Klasik)" },
    ],
  },
  {
    id: "deepseek" as AiProvider,
    name: "DeepSeek AI",
    badge: "Efisiensi Tinggi",
    tagline: "Kemampuan penalaran mendalam dengan biaya token sangat terjangkau.",
    color: "from-cyan-500 to-blue-600",
    bgActive: "border-cyan-500 bg-cyan-50/50",
    icon: Layers,
    getKeyUrl: "https://platform.deepseek.com/api_keys",
    models: [
      { id: "deepseek-chat", name: "DeepSeek-V3 Chat (Cerdas & Cepat)" },
      { id: "deepseek-reasoner", name: "DeepSeek-R1 (Penalaran Matematika & Logika)" },
    ],
  },
  {
    id: "anthropic" as AiProvider,
    name: "Anthropic Claude",
    badge: "Bahasa Alami Halus",
    tagline: "Gaya penulisan bahasa Indonesia yang sangat natural dan sopan.",
    color: "from-purple-500 to-rose-600",
    bgActive: "border-purple-500 bg-purple-50/50",
    icon: Activity,
    getKeyUrl: "https://console.anthropic.com/settings/keys",
    models: [
      { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku (Ringan & Cepat)" },
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet (Akurasi Tinggi)" },
    ],
  },
  {
    id: "local" as AiProvider,
    name: "Mesin Lokal (Bawaan)",
    badge: "Selalu Aktif & Offline",
    tagline: "Membaca 8 tabel database secara instan tanpa API key dan tanpa kuota.",
    color: "from-zinc-600 to-zinc-800",
    bgActive: "border-zinc-800 bg-zinc-50",
    icon: Server,
    getKeyUrl: "",
    models: [{ id: "local-db-engine", name: "Oji Local Prisma Engine" }],
  },
];

export default function AdminAiSettingsPage() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Active form states
  const [activeProvider, setActiveProvider] = useState<AiProvider>("gemini");
  const [fallbackToLocal, setFallbackToLocal] = useState(true);

  // Raw API Key Inputs (allows typing new keys)
  const [keysInput, setKeysInput] = useState<Record<string, string>>({
    gemini: "",
    groq: "",
    openai: "",
    deepseek: "",
    anthropic: "",
  });

  // Selected Models per provider
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>({
    gemini: "gemini-2.5-flash",
    groq: "llama-3.3-70b-versatile",
    openai: "gpt-4o-mini",
    deepseek: "deepseek-chat",
    anthropic: "claude-3-5-haiku-20241022",
  });

  // Existing saved states from server
  const [savedSettings, setSavedSettings] = useState<AllAiSettings | null>(null);

  // Show/Hide password toggle
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  // Testing connection state
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { success: boolean; message: string; latencyMs: number }>>({});

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/ai/settings");
      if (res.ok) {
        const data = await res.json();
        const s: AllAiSettings = data.settings;
        setSavedSettings(s);
        setActiveProvider(s.activeProvider);
        setFallbackToLocal(s.fallbackToLocal);

        setSelectedModels({
          gemini: s.gemini.model || "gemini-2.5-flash",
          groq: s.groq.model || "llama-3.3-70b-versatile",
          openai: s.openai.model || "gpt-4o-mini",
          deepseek: s.deepseek.model || "deepseek-chat",
          anthropic: s.anthropic.model || "claude-3-5-haiku-20241022",
        });

        setKeysInput({
          gemini: s.gemini.maskedKey || "",
          groq: s.groq.maskedKey || "",
          openai: s.openai.maskedKey || "",
          deepseek: s.deepseek.maskedKey || "",
          anthropic: s.anthropic.maskedKey || "",
        });
      }
    } catch (err) {
      console.error("Error loading AI settings:", err);
      toast({ title: "Gagal memuat pengaturan AI", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        activeProvider,
        fallbackToLocal,
        gemini: {
          apiKey: keysInput.gemini,
          model: selectedModels.gemini,
        },
        groq: {
          apiKey: keysInput.groq,
          model: selectedModels.groq,
        },
        openai: {
          apiKey: keysInput.openai,
          model: selectedModels.openai,
        },
        deepseek: {
          apiKey: keysInput.deepseek,
          model: selectedModels.deepseek,
        },
        anthropic: {
          apiKey: keysInput.anthropic,
          model: selectedModels.anthropic,
        },
      };

      const res = await fetch("/api/admin/ai/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        toast({ title: "Konfigurasi AI berhasil disimpan!", variant: "success" });
        setSavedSettings(data.settings);
      } else {
        toast({ title: "Gagal menyimpan konfigurasi AI", variant: "error" });
      }
    } catch (err) {
      console.error("Save error:", err);
      toast({ title: "Terjadi kesalahan saat menyimpan", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (providerId: AiProvider) => {
    try {
      setTestingProvider(providerId);

      const keyToSend = keysInput[providerId] || "";
      const modelToSend = selectedModels[providerId] || "";

      const res = await fetch("/api/admin/ai/settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: providerId,
          apiKey: keyToSend,
          model: modelToSend,
        }),
      });

      const data = await res.json();
      setTestResult((prev) => ({
        ...prev,
        [providerId]: data,
      }));

      if (data.success) {
        toast({ title: data.message, variant: "success" });
      } else {
        toast({ title: data.message, variant: "error" });
      }
    } catch {
      toast({ title: "Gagal menghubungi server tes", variant: "error" });
    } finally {
      setTestingProvider(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-5xl">
        {/* Navigation Tabs between WhatsApp & AI */}
        <div className="flex items-center justify-between gap-4 border-b border-zinc-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                <Bot className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                Konfigurasi Multi-AI & API Key
              </h1>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Pilih provider AI utama dan masukkan API Key Anda. Asisten Oji dapat menggunakan berbagai penyedia AI kelas dunia.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/settings/whatsapp"
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
            >
              <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
              <span>Pengaturan WhatsApp</span>
            </Link>
          </div>
        </div>

        {/* 1. VISUAL PICKER: PILIH PROVIDER AI UTAMA */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wider">
                1. Pilih Provider AI Yang Aktif
              </h2>
              <p className="text-xs text-zinc-500">
                AI yang Anda pilih di bawah akan digunakan secara instan oleh seluruh asisten di web.
              </p>
            </div>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
              Provider Aktif: {activeProvider.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {PROVIDER_METADATA.map((prov) => {
              const isSelected = activeProvider === prov.id;
              const Icon = prov.icon;
              const hasSavedKey =
                prov.id === "local" ||
                Boolean(savedSettings && (savedSettings as any)[prov.id]?.hasKey);

              return (
                <div
                  key={prov.id}
                  onClick={() => setActiveProvider(prov.id)}
                  className={`relative p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? `${prov.bgActive} shadow-xs ring-2 ring-orange-500/20`
                      : "bg-white border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-xl bg-gradient-to-br ${prov.color} text-white flex items-center justify-center shrink-0 shadow-2xs`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-zinc-900 leading-tight">
                            {prov.name}
                          </h3>
                          <span className="text-[10px] font-bold text-zinc-400">
                            {prov.badge}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-zinc-600 leading-relaxed">
                      {prov.tagline}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between text-[11px]">
                    <span
                      className={`font-semibold flex items-center gap-1 ${
                        hasSavedKey ? "text-emerald-600" : "text-amber-600"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          hasSavedKey ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                      />
                      {prov.id === "local"
                        ? "Selalu Siap"
                        : hasSavedKey
                        ? "API Key Tersimpan"
                        : "Key Belum Diisi"}
                    </span>

                    <span className="font-mono text-zinc-400 text-[10px]">
                      {selectedModels[prov.id] || "Bawaan"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. FORM KONFIGURASI API KEY & MODEL PER PROVIDER */}
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-xs p-6 space-y-6">
          <div className="border-b border-zinc-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-zinc-900">
                2. Konfigurasi API Key & Model
              </h2>
              <p className="text-xs text-zinc-500">
                Masukkan API Key untuk provider yang ingin Anda gunakan. Anda dapat menyimpan banyak API Key sekaligus dan bebas berganti kapan saja.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {PROVIDER_METADATA.filter((p) => p.id !== "local").map((prov) => {
              const currentKey = keysInput[prov.id] || "";
              const currentModel = selectedModels[prov.id] || prov.models[0].id;
              const isVisible = showKey[prov.id] || false;
              const isTesting = testingProvider === prov.id;
              const lastResult = testResult[prov.id];
              const isActive = activeProvider === prov.id;

              return (
                <div
                  key={prov.id}
                  className={`p-5 rounded-2xl border transition space-y-4 ${
                    isActive
                      ? "border-orange-300 bg-orange-50/20 shadow-2xs"
                      : "border-zinc-200 bg-zinc-50/50"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg bg-gradient-to-br ${prov.color} text-white flex items-center justify-center text-xs font-bold`}
                      >
                        {prov.name[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-sm text-zinc-900">
                            {prov.name}
                          </h3>
                          {isActive && (
                            <span className="text-[10px] font-black uppercase text-orange-700 bg-orange-100 px-2 py-0.5 rounded-md">
                              Sedang Digunakan
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500">
                          {prov.models.length} model didukung
                        </p>
                      </div>
                    </div>

                    {prov.getKeyUrl && (
                      <a
                        href={prov.getKeyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 w-fit"
                      >
                        <span>Dapatkan API Key Gratis</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    {/* API Key Input */}
                    <div className="sm:col-span-8 space-y-1">
                      <label className="text-xs font-bold text-zinc-700 block">
                        API Key:
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                          <Key className="w-4 h-4" />
                        </div>
                        <input
                          type={isVisible ? "text" : "password"}
                          placeholder={`Masukkan ${prov.name} API Key...`}
                          value={currentKey}
                          onChange={(e) =>
                            setKeysInput((prev) => ({
                              ...prev,
                              [prov.id]: e.target.value,
                            }))
                          }
                          className="w-full pl-9 pr-10 py-2.5 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 transition font-mono"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowKey((prev) => ({
                              ...prev,
                              [prov.id]: !prev[prov.id],
                            }))
                          }
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 cursor-pointer"
                        >
                          {isVisible ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Model Selector */}
                    <div className="sm:col-span-4 space-y-1">
                      <label className="text-xs font-bold text-zinc-700 block">
                        Pilihan Model AI:
                      </label>
                      <select
                        value={currentModel}
                        onChange={(e) =>
                          setSelectedModels((prev) => ({
                            ...prev,
                            [prov.id]: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2.5 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 transition font-semibold text-zinc-800"
                      >
                        {prov.models.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Test Connection Button & Result Alert */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isTesting}
                      onClick={() => handleTestConnection(prov.id)}
                      className="px-3.5 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-2xs w-fit cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`}
                      />
                      <span>{isTesting ? "Menguji Koneksi..." : "Tes Koneksi API"}</span>
                    </button>

                    {lastResult && (
                      <div
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                          lastResult.success
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-rose-50 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {lastResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span>{lastResult.message}</span>
                        {lastResult.latencyMs > 0 && (
                          <span className="font-mono text-[10px] text-zinc-400">
                            ({lastResult.latencyMs}ms)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. SAFETY SETTINGS: FALLBACK LOCAL INTELLIGENCE */}
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-xs p-6 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <h3 className="font-extrabold text-sm text-zinc-900">
                Otomatis Beralih ke Mesin Database Lokal (Failover Protection)
              </h3>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Jika diaktifkan, saat API Key eksternal kehabisan kuota, saldo, atau terjadi kendala jaringan, asisten AI warung tidak akan berhenti bekerja melainkan otomatis beralih menjawab menggunakan data database lokal secara mulus.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
            <input
              type="checkbox"
              checked={fallbackToLocal}
              onChange={(e) => setFallbackToLocal(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
          </label>
        </div>

        {/* 4. TOMBOL SIMPAN KONFIGURASI */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={saving || loading}
            onClick={handleSave}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-md shadow-orange-600/20 transition flex items-center gap-2 cursor-pointer"
          >
            <Save className={`w-4 h-4 ${saving ? "animate-spin" : ""}`} />
            <span>{saving ? "Menyimpan Konfigurasi..." : "Simpan Semua Pengaturan AI"}</span>
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

