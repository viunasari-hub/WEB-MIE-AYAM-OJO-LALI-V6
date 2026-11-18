"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CustomerLayout } from "@/components/dashboard/customer-layout";
import { useAuth } from "@/context/auth-context";
import { formatRupiah, formatDate } from "@/lib/utils";
import {
  ShoppingBag,
  Clock,
  Sparkles,
  ArrowRight,
  UtensilsCrossed,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface OrderSummary {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  items: Array<{
    quantity: number;
    product: {
      name: string;
    };
  }>;
}

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        const res = await fetch("/api/orders?limit=5");
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (err) {
        console.error("Error loading customer orders:", err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const activeOrders = orders.filter((o) =>
    ["PENDING", "PROCESSING", "READY"].includes(o.status)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Menunggu Kasir</span>;
      case "PROCESSING":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 animate-pulse">Sedang Dimasak</span>;
      case "READY":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Siap Disajikan</span>;
      case "COMPLETED":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700">Selesai</span>;
      case "CANCELLED":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">Dibatalkan</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700">{status}</span>;
    }
  };

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-orange-600 via-rose-600 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 space-y-2 max-w-xl">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-xs rounded-full text-xs font-bold inline-block">
              Portal Pelanggan Ojolali
            </span>
            <h1 className="text-2xl sm:text-3xl font-black">
              Selamat Datang, {user?.name || "Pelanggan"}!
            </h1>
            <p className="text-xs sm:text-sm text-orange-100 leading-relaxed">
              Nikmati kelezatan Baso Sapi asli dan Mie Ayam gurih langsung dari tempat duduk Anda atau pesan untuk dibawa pulang.
            </p>
            <div className="pt-2 flex flex-wrap gap-2.5">
              <Link
                href="/menu"
                className="px-4 py-2 bg-white text-orange-700 hover:bg-orange-50 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Pesan Sekarang</span>
              </Link>
              <Link
                href="/customer/ai"
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl backdrop-blur-xs transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Tanya Rekomendasi AI</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Pesanan Aktif</p>
              <p className="text-2xl font-black text-zinc-900">{activeOrders.length}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Total Pesanan</p>
              <p className="text-2xl font-black text-zinc-900">{orders.length}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Asisten Virtual</p>
              <p className="text-xs font-bold text-purple-700 mt-1">Siap Rekomendasi Menu</p>
            </div>
          </div>
        </div>

        {/* Recent Orders Section */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-900">Pesanan Terakhir Anda</h2>
              <p className="text-xs text-zinc-500">Pantau status pesanan makanan yang baru dibuat</p>
            </div>
            <Link
              href="/customer/orders"
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-zinc-100">
            {loading ? (
              <div className="p-8 text-center text-xs text-zinc-400">
                Memuat riwayat pesanan...
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <UtensilsCrossed className="w-8 h-8 text-zinc-300 mx-auto" />
                <p className="text-sm font-semibold text-zinc-700">Belum Ada Pesanan</p>
                <p className="text-xs text-zinc-400">Yuk mulai pesan baso atau mie ayam favorit Anda sekarang!</p>
                <Link
                  href="/menu"
                  className="inline-block px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition"
                >
                  Buka Menu
                </Link>
              </div>
            ) : (
              orders.map((o) => (
                <div
                  key={o.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50/60 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-zinc-900">{o.orderNumber}</span>
                      {getStatusBadge(o.status)}
                    </div>
                    <p className="text-xs text-zinc-500">
                      {o.items.map((i) => `${i.quantity}x ${i.product.name}`).join(", ")}
                    </p>
                    <p className="text-[11px] text-zinc-400">{formatDate(o.createdAt)}</p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0">
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 block">Total Pembayaran</span>
                      <span className="text-sm font-bold text-orange-600">{formatRupiah(o.total)}</span>
                    </div>
                    <Link
                      href={`/customer/orders/${o.id}`}
                      className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-lg transition"
                    >
                      Lacak Pesanan
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
