"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CashierLayout } from "@/components/dashboard/cashier-layout";
import { ThermalReceiptModal, ReceiptOrder } from "@/components/thermal-receipt";
import { useToast } from "@/components/ui/toast";
import { formatRupiah, formatDate } from "@/lib/utils";
import {
  CreditCard,
  Clock,
  ChefHat,
  CheckCircle2,
  Printer,
  RefreshCw,
  AlertCircle,
  Eye,
  Check,
  XCircle,
} from "lucide-react";

export default function CashierDashboardPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<ReceiptOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptOrder | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/orders?limit=30");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error("Error fetching cashier orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000); // 8s live refresh
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string, newPayment?: string) => {
    try {
      setUpdatingId(orderId);
      const body: Record<string, string> = { status: newStatus };
      if (newPayment) body.paymentStatus = newPayment;

      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Gagal Mengubah Status",
          description: data.error || "Terjadi kesalahan.",
          variant: "error",
        });
        return;
      }

      toast({
        title: "Status Diperbarui",
        description: `Pesanan diubah menjadi: ${newStatus}`,
        variant: "success",
      });

      fetchOrders();
    } catch {
      toast({
        title: "Gangguan Jaringan",
        description: "Gagal menghubungi server.",
        variant: "error",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // Stats
  const pendingOrders = orders.filter((o) => o.status === "PENDING");
  const processingOrders = orders.filter((o) => o.status === "PROCESSING");
  const readyOrders = orders.filter((o) => o.status === "READY");
  const completedToday = orders.filter((o) => o.status === "COMPLETED");

  const todayOmzet = completedToday.reduce((sum, o) => sum + o.total, 0);

  return (
    <CashierLayout>
      <div className="space-y-6">
        {/* Top Bar with Live Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h1 className="text-xl font-black text-zinc-900 tracking-tight">
                POS Kasir — Pesanan Masuk
              </h1>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Kelola antrean dan konfirmasi pembayaran dengan cepat
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchOrders}
              className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Segarkan Data</span>
            </button>
            <Link
              href="/cashier/orders"
              className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
            >
              Semua Pesanan
            </Link>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800">Menunggu Kasir</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-amber-900 mt-2">{pendingOrders.length}</p>
            <p className="text-[10px] text-amber-700 mt-0.5">Perlu segera diterima</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/40 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-800">Sedang Dimasak</span>
              <ChefHat className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-blue-900 mt-2">{processingOrders.length}</p>
            <p className="text-[10px] text-blue-700 mt-0.5">Proses dapur</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800">Siap Diambil</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-900 mt-2">{readyOrders.length}</p>
            <p className="text-[10px] text-emerald-700 mt-0.5">Menunggu penyerahan</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-600">Omzet Transaksi</span>
              <CreditCard className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-lg font-black text-zinc-900 mt-2 truncate">
              {formatRupiah(todayOmzet)}
            </p>
            <p className="text-[10px] text-zinc-500 mt-0.5">{completedToday.length} transaksi selesai</p>
          </div>
        </div>

        {/* Live Active Orders Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900">
              Antrean Pesanan Aktif ({pendingOrders.length + processingOrders.length + readyOrders.length})
            </h2>
            <span className="text-xs text-zinc-400">Diperbarui otomatis secara berkala</span>
          </div>

          {loading && orders.length === 0 ? (
            <div className="py-16 text-center text-xs text-zinc-400">
              Memuat data antrean pesanan kasir...
            </div>
          ) : pendingOrders.length + processingOrders.length + readyOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center space-y-3 shadow-xs">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-base text-zinc-900">Semua Antrean Selesai!</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Tidak ada pesanan aktif saat ini. Pesanan baru akan langsung muncul di sini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...pendingOrders, ...processingOrders, ...readyOrders].map((o) => (
                <div
                  key={o.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between space-y-4 transition ${
                    o.status === "PENDING"
                      ? "border-amber-300 ring-2 ring-amber-400/20"
                      : o.status === "READY"
                      ? "border-emerald-300"
                      : "border-zinc-200"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-black text-base text-zinc-900 block">
                          {o.orderNumber}
                        </span>
                        <p className="text-xs font-bold text-zinc-700 mt-0.5">
                          {o.customerName} {o.customerPhone ? `(${o.customerPhone})` : ""}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          o.status === "PENDING"
                            ? "bg-amber-100 text-amber-900"
                            : o.status === "PROCESSING"
                            ? "bg-blue-100 text-blue-900"
                            : "bg-emerald-100 text-emerald-900"
                        }`}
                      >
                        {o.status}
                      </span>
                    </div>

                    {/* Order Items */}
                    <div className="bg-zinc-50 rounded-xl p-3 space-y-1.5 border border-zinc-100 text-xs">
                      {o.items.map((i, idx) => (
                        <div key={idx} className="flex justify-between text-zinc-800">
                          <span>
                            <strong className="text-orange-600">{i.quantity}x</strong> {i.product.name}
                          </span>
                          <span className="font-medium text-zinc-600">
                            {formatRupiah(i.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {o.notes && (
                      <div className="text-[11px] bg-amber-50/70 border border-amber-200/60 p-2 rounded-lg text-amber-900 italic">
                        <strong>Catatan:</strong> {o.notes}
                      </div>
                    )}

                    {/* Payment info */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-zinc-500">
                        Metode: <strong className="uppercase">{o.paymentMethod}</strong>
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-md text-[10px] ${
                          o.paymentStatus === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {o.paymentStatus === "PAID" ? "LUNAS" : "BELUM LUNAS"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm font-black text-zinc-900 pt-1 border-t border-zinc-100">
                      <span>Total:</span>
                      <span className="text-base text-orange-600">{formatRupiah(o.total)}</span>
                    </div>
                  </div>

                  {/* Quick Action Buttons for Cashier */}
                  <div className="space-y-2 pt-2 border-t border-zinc-100">
                    {o.status === "PENDING" && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleUpdateStatus(o.id, "PROCESSING")}
                          disabled={updatingId === o.id}
                          className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs"
                        >
                          <ChefHat className="w-3.5 h-3.5" />
                          <span>Terima & Masak</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(o.id, "CANCELLED")}
                          disabled={updatingId === o.id}
                          className="py-2.5 bg-zinc-100 hover:bg-rose-50 text-zinc-600 hover:text-rose-600 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Tolak</span>
                        </button>
                      </div>
                    )}

                    {o.status === "PROCESSING" && (
                      <button
                        onClick={() => handleUpdateStatus(o.id, "READY")}
                        disabled={updatingId === o.id}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Pesanan Siap Diambil</span>
                      </button>
                    )}

                    {o.status === "READY" && (
                      <button
                        onClick={() => handleUpdateStatus(o.id, "COMPLETED", "PAID")}
                        disabled={updatingId === o.id}
                        className="w-full py-2.5 bg-zinc-900 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Selesaikan & Terima Bayar</span>
                      </button>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedReceipt(o)}
                        className="flex-1 py-1.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5 text-orange-600" />
                        <span>Cetak Struk</span>
                      </button>
                      <Link
                        href={`/cashier/orders/${o.id}`}
                        className="p-1.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-500 rounded-xl transition"
                        title="Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <ThermalReceiptModal
          order={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </CashierLayout>
  );
}
