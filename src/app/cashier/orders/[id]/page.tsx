"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CashierLayout } from "@/components/dashboard/cashier-layout";
import { ThermalReceiptModal, ReceiptOrder } from "@/components/thermal-receipt";
import { useToast } from "@/components/ui/toast";
import { formatRupiah, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Printer,
  ChefHat,
  CheckCircle2,
  Check,
  XCircle,
  CreditCard,
  User,
  Clock,
  UtensilsCrossed,
} from "lucide-react";

function CashierOrderDetailContent() {
  const routeParams = useParams();
  const id = routeParams?.id as string;
  const { toast } = useToast();

  const [order, setOrder] = useState<ReceiptOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders/${id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
      }
    } catch (err) {
      console.error("Error loading order:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleUpdate = async (status?: string, paymentStatus?: string) => {
    if (!order) return;
    try {
      setUpdating(true);
      const body: Record<string, string> = {};
      if (status) body.status = status;
      if (paymentStatus) body.paymentStatus = paymentStatus;

      const res = await fetch(`/api/orders/${order.id}`, {
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
        title: "Pesanan Diperbarui",
        description: "Perubahan status berhasil disimpan.",
        variant: "success",
      });

      fetchOrder();
    } catch {
      toast({
        title: "Kesalahan Jaringan",
        description: "Gagal memperbarui pesanan.",
        variant: "error",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading && !order) {
    return (
      <div className="py-20 text-center flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-zinc-500">Memuat data pesanan...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center space-y-4 max-w-md mx-auto">
        <h2 className="text-base font-bold text-zinc-900">Pesanan Tidak Ditemukan</h2>
        <Link
          href="/cashier/orders"
          className="inline-block px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold"
        >
          Kembali ke Daftar Pesanan
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <Link
            href="/cashier/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-orange-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Pesanan</span>
          </Link>

          <button
            onClick={() => setShowReceipt(true)}
            className="px-4 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5 text-orange-400" />
            <span>Cetak Struk Pembayaran</span>
          </button>
        </div>

        {/* Status Action Panel */}
        <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 block">
                Nomor Pesanan
              </span>
              <h1 className="text-2xl font-black text-zinc-900">{order.orderNumber}</h1>
              <p className="text-xs text-zinc-400 mt-0.5">{formatDate(order.createdAt)}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-zinc-100 text-zinc-800">
                Status: {order.status}
              </span>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  order.paymentStatus === "PAID"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                Bayar: {order.paymentStatus}
              </span>
            </div>
          </div>

          {/* Quick Flow Buttons */}
          <div className="flex flex-wrap gap-2.5 pt-2">
            {order.status === "PENDING" && (
              <button
                onClick={() => handleUpdate("PROCESSING")}
                disabled={updating}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
              >
                <ChefHat className="w-4 h-4" />
                <span>Terima Pesanan (Mulai Masak)</span>
              </button>
            )}

            {order.status === "PROCESSING" && (
              <button
                onClick={() => handleUpdate("READY")}
                disabled={updating}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Pesanan Selesai Dimasak (Siap Diambil)</span>
              </button>
            )}

            {order.status === "READY" && (
              <button
                onClick={() => handleUpdate("COMPLETED", "PAID")}
                disabled={updating}
                className="px-4 py-2.5 bg-zinc-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Selesaikan & Konfirmasi Lunas</span>
              </button>
            )}

            {order.paymentStatus !== "PAID" && (
              <button
                onClick={() => handleUpdate(undefined, "PAID")}
                disabled={updating}
                className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-300 transition"
              >
                Tandai Pembayaran LUNAS
              </button>
            )}

            {order.status !== "CANCELLED" && order.status !== "COMPLETED" && (
              <button
                onClick={() => handleUpdate("CANCELLED", "CANCELLED")}
                disabled={updating}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition"
              >
                Batalkan Pesanan
              </button>
            )}
          </div>
        </div>

        {/* Customer & Item details */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-zinc-900 flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-orange-600" />
              <span>Item yang Dipesan</span>
            </h3>

            <div className="divide-y divide-zinc-100">
              {order.items.map((i, idx) => (
                <div key={idx} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-zinc-900">{i.product.name}</p>
                    <p className="text-zinc-500">
                      {i.quantity} x {formatRupiah(i.price)}
                    </p>
                  </div>
                  <span className="font-bold text-zinc-900">{formatRupiah(i.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-zinc-200 flex justify-between items-center text-sm font-black text-zinc-900">
              <span>Total Tagihan:</span>
              <span className="text-lg text-orange-600">{formatRupiah(order.total)}</span>
            </div>
          </div>

          <div className="md:col-span-4 bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs space-y-4 text-xs">
            <h3 className="font-extrabold text-base text-zinc-900 flex items-center gap-2">
              <User className="w-4 h-4 text-orange-600" />
              <span>Data Pelanggan</span>
            </h3>

            <div className="space-y-2 text-zinc-700">
              <div>
                <span className="text-[10px] text-zinc-400 block">Nama</span>
                <p className="font-bold text-zinc-900">{order.customerName}</p>
              </div>
              {order.customerPhone && (
                <div>
                  <span className="text-[10px] text-zinc-400 block">Nomor Telepon</span>
                  <p className="font-medium text-zinc-900">{order.customerPhone}</p>
                </div>
              )}
              <div>
                <span className="text-[10px] text-zinc-400 block">Metode Pembayaran</span>
                <p className="font-bold uppercase text-zinc-900">{order.paymentMethod}</p>
              </div>
              {order.notes && (
                <div className="pt-2 border-t border-zinc-100">
                  <span className="text-[10px] text-zinc-400 block">Catatan Pesanan</span>
                  <p className="italic text-zinc-600">{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showReceipt && (
        <ThermalReceiptModal order={order} onClose={() => setShowReceipt(false)} />
      )}
    </>
  );
}

export default function CashierOrderDetailPage() {
  return (
    <CashierLayout>
      <Suspense
        fallback={
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-zinc-500">Menyiapkan data kasir...</p>
          </div>
        }
      >
        <CashierOrderDetailContent />
      </Suspense>
    </CashierLayout>
  );
}
