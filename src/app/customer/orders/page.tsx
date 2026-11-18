"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CustomerLayout } from "@/components/dashboard/customer-layout";
import { formatRupiah, formatDate } from "@/lib/utils";
import {
  ShoppingBag,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  UtensilsCrossed,
} from "lucide-react";

interface OrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  notes?: string | null;
  items: Array<{
    quantity: number;
    subtotal: number;
    product: {
      name: string;
    };
  }>;
}

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED" | "CANCELLED">("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        const res = await fetch("/api/orders");
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (err) {
        console.error("Error loading orders:", err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const filteredOrders = orders.filter((o) => {
    if (filter === "ACTIVE") return ["PENDING", "PROCESSING", "READY"].includes(o.status);
    if (filter === "COMPLETED") return o.status === "COMPLETED";
    if (filter === "CANCELLED") return o.status === "CANCELLED";
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Menunggu Kasir</span>;
      case "PROCESSING":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 animate-pulse">Sedang Dimasak</span>;
      case "READY":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Siap Disajikan</span>;
      case "COMPLETED":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-700">Selesai</span>;
      case "CANCELLED":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">Dibatalkan</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-700">{status}</span>;
    }
  };

  return (
    <CustomerLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
              Riwayat Pesanan Anda
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Pantau status pembuatan makanan dan struk belanja Anda
            </p>
          </div>

          <Link
            href="/menu"
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition w-fit shadow-xs"
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Pesan Menu Baru</span>
          </Link>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 border-b border-zinc-200 pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filter === "ALL" ? "bg-orange-600 text-white" : "bg-white text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            Semua ({orders.length})
          </button>
          <button
            onClick={() => setFilter("ACTIVE")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filter === "ACTIVE" ? "bg-orange-600 text-white" : "bg-white text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            Pesanan Aktif ({orders.filter((o) => ["PENDING", "PROCESSING", "READY"].includes(o.status)).length})
          </button>
          <button
            onClick={() => setFilter("COMPLETED")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filter === "COMPLETED" ? "bg-orange-600 text-white" : "bg-white text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            Selesai ({orders.filter((o) => o.status === "COMPLETED").length})
          </button>
          <button
            onClick={() => setFilter("CANCELLED")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filter === "CANCELLED" ? "bg-orange-600 text-white" : "bg-white text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            Dibatalkan ({orders.filter((o) => o.status === "CANCELLED").length})
          </button>
        </div>

        {/* Orders list */}
        {loading ? (
          <div className="py-16 text-center text-xs text-zinc-400">
            Memuat daftar pesanan...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center space-y-3 shadow-xs">
            <ShoppingBag className="w-12 h-12 text-zinc-300 mx-auto" />
            <h3 className="font-bold text-base text-zinc-900">Tidak Ada Pesanan</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Belum ada data pesanan pada kategori ini.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((o) => (
              <div
                key={o.id}
                className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs hover:shadow-md transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-sm text-zinc-900">{o.orderNumber}</span>
                    {getStatusBadge(o.status)}
                  </div>
                  <span className="text-xs text-zinc-400">{formatDate(o.createdAt)}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-zinc-700">
                      {o.items.map((i) => `${i.quantity}x ${i.product.name}`).join(", ")}
                    </p>
                    {o.notes && (
                      <p className="text-[11px] text-zinc-400 italic">
                        Catatan: {o.notes}
                      </p>
                    )}
                    <p className="text-[11px] text-zinc-500">
                      Metode Bayar: <span className="font-bold uppercase">{o.paymentMethod}</span> ({o.paymentStatus === "PAID" ? "Lunas" : "Belum Lunas"})
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 block">Total Biaya</span>
                      <span className="text-base font-black text-orange-600">
                        {formatRupiah(o.total)}
                      </span>
                    </div>

                    <Link
                      href={`/customer/orders/${o.id}`}
                      className="px-4 py-2 bg-orange-50 hover:bg-orange-600 text-orange-600 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <span>Lacak Pesanan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
