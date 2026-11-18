"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/dashboard/admin-layout";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import {
  MessageSquare,
  Send,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sliders,
  Phone,
  Shield,
  FileText,
  Eye,
  X,
  ExternalLink,
  Cpu,
} from "lucide-react";
import Link from "next/link";

interface WhatsAppSettings {
  mode: "mock" | "production";
  apiUrl: string;
  adminNumber: string;
  enabled: boolean;
  hasToken: boolean;
  maskedToken?: string;
}

interface NotificationLogItem {
  id: string;
  orderId: string;
  rawOrderId?: string | null;
  recipientPhone: string;
  recipientType: string;
  type: string;
  message: string;
  status: string;
  errorMessage?: string | null;
  createdAt: string;
}

export default function AdminWhatsAppSettingsPage() {
  const { toast } = useToast();

  // Settings State
  const [settings, setSettings] = useState<WhatsAppSettings>({
    mode: "mock",
    apiUrl: "https://api.fonnte.com/send",
    adminNumber: "6281234567890",
    enabled: true,
    hasToken: false,
    maskedToken: "",
  });
  const [apiTokenInput, setApiTokenInput] = useState("");
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Test send state
  const [testNumber, setTestNumber] = useState("");
  const [testingSend, setTestingSend] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    status: string;
    message: string;
    recipientPhone?: string;
    error?: string;
  } | null>(null);

  // Logs state
  const [logs, setLogs] = useState<NotificationLogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [searchLog, setSearchLog] = useState("");
  const [selectedLogMessage, setSelectedLogMessage] = useState<NotificationLogItem | null>(null);

  // Load Settings
  const fetchSettings = async () => {
    try {
      setLoadingSettings(true);
      const res = await fetch("/api/admin/whatsapp/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setTestNumber(data.settings.adminNumber || "");
      }
    } catch (err) {
      console.error("Error loading WA settings:", err);
    } finally {
      setLoadingSettings(false);
    }
  };

  // Load Logs
  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await fetch(`/api/admin/whatsapp/logs?limit=50&search=${encodeURIComponent(searchLog)}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Error loading WA logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchLogs();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const res = await fetch("/api/admin/whatsapp/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: settings.mode,
          apiUrl: settings.apiUrl,
          adminNumber: settings.adminNumber,
          enabled: settings.enabled,
          apiToken: apiTokenInput.trim() ? apiTokenInput : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Gagal Menyimpan",
          description: data.error || "Terjadi kesalahan",
          variant: "error",
        });
        return;
      }

      toast({
        title: "Pengaturan Disimpan",
        description: "Pengaturan notifikasi WhatsApp berhasil diperbarui.",
        variant: "success",
      });
      setApiTokenInput("");
      fetchSettings();
    } catch {
      toast({
        title: "Gagal",
        description: "Gangguan koneksi server",
        variant: "error",
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTestSend = async () => {
    try {
      setTestingSend(true);
      setTestResult(null);
      const res = await fetch("/api/admin/whatsapp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPhone: testNumber }),
      });
      const data = await res.json();
      setTestResult(data);

      if (res.ok && data.success) {
        toast({
          title: "Pesan Terkirim",
          description: `Notifikasi uji coba berhasil dikirim ke ${data.recipientPhone} (${data.status})`,
          variant: "success",
        });
        fetchLogs();
      } else {
        toast({
          title: "Uji Coba Gagal",
          description: data.error || data.message || "Gagal mengirim WhatsApp",
          variant: "error",
        });
      }
    } catch {
      toast({ title: "Gagal", description: "Gangguan jaringan", variant: "error" });
    } finally {
      setTestingSend(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-6xl pb-16">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                <MessageSquare className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                Pengaturan Notifikasi WhatsApp
              </h1>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Konfigurasi nomor WhatsApp admin, penyedia gateway, simulasi pengiriman, dan riwayat log notifikasi
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/settings/ai"
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
            >
              <Cpu className="w-3.5 h-3.5 text-orange-600" />
              <span>Konfigurasi AI</span>
            </Link>
            <span
              className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 ${
                settings.mode === "mock"
                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  settings.mode === "mock" ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                }`}
              />
              {settings.mode === "mock" ? "Mode: Mock (Simulasi)" : "Mode: Production (Live)"}
            </span>
          </div>
        </div>

        {/* Top Grid: Form Pengaturan & Panel Uji Coba */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Settings Form (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-orange-600" />
                <h2 className="text-sm font-bold text-zinc-900">Konfigurasi Pengaturan</h2>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-700">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                  className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                />
                Notifikasi Aktif
              </label>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-5">
              {/* Mode Selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-2">
                  Mode Pengiriman WhatsApp
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setSettings({ ...settings, mode: "mock" })}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition ${
                      settings.mode === "mock"
                        ? "border-orange-500 bg-orange-50/50"
                        : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-zinc-900">Mode Mock (Simulasi)</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800">
                        Rekomendasi Dev
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      Pesan disimulasikan di terminal log dan tercatat di riwayat sebagai &quot;Simulasi Terkirim&quot; tanpa kuota gateway.
                    </p>
                  </div>

                  <div
                    onClick={() => setSettings({ ...settings, mode: "production" })}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition ${
                      settings.mode === "production"
                        ? "border-emerald-500 bg-emerald-50/50"
                        : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-zinc-900">Mode Production (Live)</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                        Kirim Nyata
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      Mengirim pesan WhatsApp sungguhan ke nomor tujuan melalui WhatsApp Business API / Provider Gateway.
                    </p>
                  </div>
                </div>
              </div>

              {/* Admin Phone Number */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                  Nomor WhatsApp Admin / Pemilik <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 6281234567890"
                    value={settings.adminNumber}
                    onChange={(e) => setSettings({ ...settings, adminNumber: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white font-mono"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3 text-zinc-400 shrink-0" />
                  Gunakan format internasional tanpa tanda + dan spasi (contoh: <strong>628xxxxxxxxxx</strong>).
                </p>
              </div>

              {/* Provider API URL */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                  WhatsApp API Gateway URL
                </label>
                <input
                  type="url"
                  placeholder="https://api.fonnte.com/send"
                  value={settings.apiUrl}
                  onChange={(e) => setSettings({ ...settings, apiUrl: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white font-mono"
                />
                <p className="text-[10px] text-zinc-400 mt-1">
                  Mendukung Fonnte, Wablas, WhatsApp Cloud API (Meta), RuangWA, atau REST gateway sejenis.
                </p>
              </div>

              {/* Provider API Token */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                  API Token / Secret Key (Tersimpan Aman di Backend)
                </label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="password"
                    placeholder={
                      settings.hasToken
                        ? `Token sudah tersimpan (${settings.maskedToken || "••••••••"}). Ketik token baru untuk mengganti.`
                        : "Masukkan token API WhatsApp Gateway..."
                    }
                    value={apiTokenInput}
                    onChange={(e) => setApiTokenInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white font-mono"
                  />
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Token tidak pernah ditampilkan ke publik atau klien JavaScript untuk menjamin keamanan kredensial.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 flex items-center gap-2"
                >
                  {savingSettings ? "Menyimpan..." : "Simpan Pengaturan WhatsApp"}
                </button>
              </div>
            </form>
          </div>

          {/* Test Sending Panel (1 col) */}
          <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-4">
                <Send className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-zinc-900">Uji Coba Pengiriman</h2>
              </div>
              <p className="text-xs text-zinc-500 mt-3 leading-relaxed">
                Kirim pesan notifikasi uji coba untuk memverifikasi apakah koneksi dan konfigurasi nomor tujuan bekerja dengan baik.
              </p>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                    Nomor Tujuan Uji Coba
                  </label>
                  <input
                    type="text"
                    placeholder="628xxxxxxxxxx"
                    value={testNumber}
                    onChange={(e) => setTestNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
                  />
                </div>

                <button
                  onClick={handleTestSend}
                  disabled={testingSend}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{testingSend ? "Mengirim Pesan Uji..." : "Kirim Pesan Uji Coba"}</span>
                </button>
              </div>

              {testResult && (
                <div
                  className={`mt-4 p-3.5 rounded-2xl text-xs space-y-1.5 border animate-in fade-in ${
                    testResult.success
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-rose-50 border-rose-200 text-rose-900"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                    )}
                    <span>{testResult.success ? "Berhasil" : "Gagal Mengirim"}</span>
                  </div>
                  <p className="text-[11px] text-zinc-600 leading-normal">{testResult.message}</p>
                  {testResult.status && (
                    <p className="text-[10px] font-mono font-semibold">
                      Status: <span className="underline">{testResult.status}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200 text-[11px] text-zinc-500 space-y-1">
              <span className="font-bold text-zinc-700 block">ℹ️ Informasi Format Otomatis:</span>
              <p>• Pesanan Baru dikirimkan otomatis ke Admin saat checkout.</p>
              <p>• Perubahan Status (Diproses, Siap, Selesai) dikirimkan otomatis ke Pelanggan.</p>
            </div>
          </div>
        </div>

        {/* Bottom Section: Riwayat Log Notifikasi (Requirement #7) */}
        <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-600" />
                <h2 className="text-base font-bold text-zinc-900">Riwayat Notifikasi WhatsApp</h2>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Daftar log setiap pesan notifikasi yang dikirimkan oleh sistem ke admin dan pelanggan
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative w-56 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Cari order / nomor / jenis..."
                  value={searchLog}
                  onChange={(e) => setSearchLog(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchLogs()}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white"
                />
              </div>

              <button
                onClick={() => fetchLogs()}
                className="p-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-600 rounded-xl transition"
                title="Muat Ulang Log"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Logs Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Nomor Tujuan</th>
                  <th className="py-3 px-4">Penerima</th>
                  <th className="py-3 px-4">Jenis Notifikasi</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4 text-right">Isi Pesan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-800">
                {loadingLogs ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-400">
                      Memuat riwayat log notifikasi...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-400">
                      Belum ada riwayat notifikasi tercatat. Lakukan transaksi atau uji coba pengiriman pesan.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-zinc-900">
                        {log.orderId}
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-700">
                        {log.recipientPhone}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            log.recipientType === "ADMIN"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {log.recipientType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-zinc-900">
                        {log.type}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                            log.status === "Terkirim"
                              ? "bg-emerald-100 text-emerald-800"
                              : log.status === "Simulasi Terkirim"
                              ? "bg-sky-100 text-sky-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              log.status === "Terkirim"
                                ? "bg-emerald-600"
                                : log.status === "Simulasi Terkirim"
                                ? "bg-sky-600"
                                : "bg-rose-600"
                            }`}
                          />
                          {log.status}
                        </span>
                        {log.errorMessage && (
                          <span className="block text-[10px] text-rose-500 truncate max-w-xs mt-0.5">
                            {log.errorMessage}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-400 text-[11px]">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedLogMessage(log)}
                          className="px-2.5 py-1 rounded-lg text-zinc-600 hover:text-orange-600 hover:bg-orange-50 font-medium inline-flex items-center gap-1 transition text-[11px]"
                          title="Lihat Rincian Pesan"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Message Modal Preview */}
      {selectedLogMessage && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="font-bold text-sm text-zinc-900">
                  Detail Pesan Notifikasi WhatsApp
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Tujuan: {selectedLogMessage.recipientPhone} ({selectedLogMessage.recipientType}) • {selectedLogMessage.type}
                </p>
              </div>
              <button
                onClick={() => setSelectedLogMessage(null)}
                className="text-zinc-400 hover:text-zinc-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-zinc-900 text-zinc-100 p-4 rounded-2xl font-sans text-xs whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
              {selectedLogMessage.message}
            </div>

            {selectedLogMessage.errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                Error Gateway: {selectedLogMessage.errorMessage}
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-zinc-400">
                Waktu: {formatDate(selectedLogMessage.createdAt)}
              </span>
              <button
                onClick={() => setSelectedLogMessage(null)}
                className="px-4 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
