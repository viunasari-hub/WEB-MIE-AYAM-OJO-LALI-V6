"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { CustomerLayout } from "@/components/dashboard/customer-layout";
import { ThermalReceiptModal, ReceiptOrder } from "@/components/thermal-receipt";
import { useToast } from "@/components/ui/toast";
import { formatRupiah, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Printer,
  XCircle,
  ChefHat,
  UtensilsCrossed,
  Sparkles,
  MessageSquare,
} from "lucide-react";

function OrderDetailContent() {
  const routeParams = useParams();
  const id = routeParams?.id as string;
  const router = useRouter();
  const { toast } = useToast();

  const [order, setOrder] = useState<ReceiptOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [resendingWA, setResendingWA] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders/${id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
      }
    } catch (err) {
      console.error("Error fetching order:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // Poll every 10 seconds to auto-update live status
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!confirm("Apakah Anda yakin ingin membatalkan pesanan ini?")) return;

    try {
      setCancelling(true);
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Gagal Membatalkan",
          description: data.error || "Pesanan tidak dapat dibatalkan.",
          variant: "error",
        });
        return;
      }

      toast({
        title: "Pesanan Dibatalkan",
        description: "Pesanan telah berhasil dibatalkan.",
        variant: "info",
      });
      fetchOrder();
    } catch {
      toast({
        title: "Kesalahan Jaringan",
        description: "Gagal menghubungi server.",
        variant: "error",
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleResendWA = async () => {
    if (!order) return;
    try {
      setResendingWA(true);
      const res = await fetch(`/api/orders/${order.id}/whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "CUSTOMER" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          title: "WhatsApp Terkirim",
          description: data.message || "Notifikasi berhasil dikirimkan.",
          variant: "success",
        });
        fetchOrder();
      } else {
        toast({
          title: "Gagal Mengirim",
          description: data.error || data.message || "Nomor WhatsApp belum valid.",
          variant: "error",
        });
      }
    } catch {
      toast({ title: "Gagal", description: "Gangguan jaringan", variant: "error" });
    } finally {
      setResendingWA(false);
    }
  };

  if (loading && !order) {
    return (
      <div className="py-20 text-center flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-zinc-500">Memuat rincian pesanan...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center space-y-4 max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-zinc-900">Pesanan Tidak Ditemukan</h2>
        <p className="text-xs text-zinc-500">
          Pesanan dengan nomor tersebut tidak ada atau Anda tidak memiliki akses.
        </p>
        <Link
          href="/customer/orders"
          className="inline-block px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition"
        >
          Kembali ke Daftar Pesanan
        </Link>
      </div>
    );
  }

  // Stepper calculations
  const steps = [
    { key: "PENDING", title: "Menunggu", desc: "Kasir menerima pesanan" },
    { key: "PROCESSING", title: "Diproses", desc: "Dapur sedang memasak" },
    { key: "READY", title: "Siap", desc: "Makanan siap dihidangkan" },
    { key: "COMPLETED", title: "Selesai", desc: "Pesanan dinikmati" },
  ];

  const statusOrder = ["PENDING", "PROCESSING", "READY", "COMPLETED"];
  const currentStepIdx = statusOrder.indexOf(order.status);
  const isCancelled = order.status === "CANCELLED";

  return (
    <>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Back button */}
        <div className="flex items-center justify-between">
          <Link
            href="/customer/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-orange-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Riwayat Pesanan</span>
          </Link>

          <button
            onClick={() => setShowReceipt(true)}
            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Tampilkan Struk</span>
          </button>
        </div>

        {/* Live Tracking Card */}
        <div className="bg-white rounded-3xl border border-zinc-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 block">
                Pelacakan Langsung
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 mt-0.5">
                {order.orderNumber}
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">{formatDate(order.createdAt)}</p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] text-zinc-400 block font-medium">Total Pesanan</span>
              <span className="text-2xl font-black text-orange-600">
                {formatRupiah(order.total)}
              </span>
            </div>
          </div>

          {/* Stepper Bar */}
          {isCancelled ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800">
              <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
              <div>
                <p className="font-bold text-sm">Pesanan Dibatalkan</p>
                <p className="text-xs opacity-90">Pesanan ini telah dibatalkan.</p>
              </div>
            </div>
          ) : (
            <div className="py-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {steps.map((step, idx) => {
                  const isDone = currentStepIdx >= idx;
                  const isCurrent = currentStepIdx === idx;
                  return (
                    <div
                      key={step.key}
                      className={`p-4 rounded-2xl border transition ${
                        isCurrent
                          ? "bg-orange-50 border-orange-500 ring-2 ring-orange-500/20"
                          : isDone
                          ? "bg-emerald-50/60 border-emerald-300"
                          : "bg-zinc-50 border-zinc-200 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isCurrent
                              ? "bg-orange-600 text-white animate-pulse"
                              : isDone
                              ? "bg-emerald-600 text-white"
                              : "bg-zinc-200 text-zinc-600"
                          }`}
                        >
                          {isDone && !isCurrent ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <span
                          className={`font-bold text-xs ${
                            isCurrent
                              ? "text-orange-950"
                              : isDone
                              ? "text-emerald-950"
                              : "text-zinc-600"
                          }`}
                        >
                          {step.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500">{step.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* WhatsApp Notification Card (Requirement #12) */}
        <div className="bg-white rounded-3xl border border-zinc-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-900">Status WhatsApp:</span>
                {order.whatsappStatus === "SENT" ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    🟢 Notifikasi terkirim
                  </span>
                ) : order.whatsappStatus === "MOCK_SENT" ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    🔵 Simulasi terkirim (Mock)
                  </span>
                ) : order.whatsappStatus === "FAILED" ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    🔴 Gagal mengirim
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500">
                    <span className="w-2 h-2 rounded-full bg-zinc-400" />
                    ⚪ Menunggu antrean
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {order.customerPhone
                  ? `Notifikasi pembaruan status pesanan dikirimkan ke nomor ${order.customerPhone}`
                  : "Nomor WhatsApp pelanggan belum terdaftar pada pesanan ini"}
              </p>
            </div>
          </div>

          <button
            onClick={handleResendWA}
            disabled={resendingWA || !order.customerPhone}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 shrink-0"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{resendingWA ? "Mengirim..." : "📱 Kirim Ulang WhatsApp"}</span>
          </button>
        </div>

        {/* Order Items & Customer Note */}
        <div className="bg-white rounded-3xl border border-zinc-200 p-6 sm:p-8 shadow-xs space-y-6">
          <h3 className="font-extrabold text-base text-zinc-900 flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-orange-600" />
            <span>Rincian Menu yang Dipesan</span>
          </h3>

          <div className="divide-y divide-zinc-100">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="py-3.5 flex items-center justify-between text-xs sm:text-sm"
              >
                <div>
                  <p className="font-bold text-zinc-900">{item.product.name}</p>
                  <p className="text-[11px] text-zinc-500">
                    {item.quantity} x {formatRupiah(item.price)}
                  </p>
                </div>
                <span className="font-bold text-zinc-900">
                  {formatRupiah(item.subtotal)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-zinc-200 space-y-2 text-xs text-zinc-600">
            <div className="flex justify-between">
              <span>Metode Pembayaran</span>
              <span className="font-bold uppercase text-zinc-900">
                {order.paymentMethod}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Status Pembayaran</span>
              <span
                className={`font-bold ${
                  order.paymentStatus === "PAID"
                    ? "text-emerald-700"
                    : "text-amber-700"
                }`}
              >
                {order.paymentStatus === "PAID" ? "Lunas" : "Belum Lunas"}
              </span>
            </div>
            {order.notes && (
              <div className="pt-2 border-t border-zinc-100 text-zinc-700">
                <span className="font-bold text-zinc-900 block mb-0.5">Catatan Pesanan:</span>
                <span className="italic">{order.notes}</span>
              </div>
            )}
            <div className="pt-3 border-t border-zinc-200 flex justify-between items-center text-sm font-black text-zinc-900">
              <span>Total Akhir:</span>
              <span className="text-xl text-orange-600">{formatRupiah(order.total)}</span>
            </div>
          </div>

          {/* Cancel button if PENDING */}
          {order.status === "PENDING" && (
            <div className="pt-4 border-t border-zinc-100 flex justify-end">
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>{cancelling ? "Membatalkan..." : "Batalkan Pesanan"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Printable Thermal Receipt Modal */}
      {showReceipt && (
        <ThermalReceiptModal order={order} onClose={() => setShowReceipt(false)} />
      )}
    </>
  );
}

export default function OrderDetailPage() {
  return (
    <CustomerLayout>
      <Suspense
        fallback={
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-zinc-500">Memuat rincian pesanan...</p>
          </div>
        }
      >
        <OrderDetailContent />
      </Suspense>
    </CustomerLayout>
  );
}
