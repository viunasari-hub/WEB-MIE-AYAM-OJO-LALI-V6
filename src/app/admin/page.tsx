"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/dashboard/admin-layout";
import { formatRupiah, formatDate } from "@/lib/utils";
import {
  CreditCard,
  ShoppingBag,
  Clock,
  Flame,
  ArrowRight,
  TrendingUp,
  ChefHat,
  Eye,
  RefreshCw,
} from "lucide-react";
import { AdminAiChat } from "@/components/dashboard/admin-ai-chat";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface AdminDashboardData {
  todayOmzet: number;
  totalOrders: number;
  processingOrders: number;
  topProductName: string;
  chartData: Array<{ label: string; omzet: number; orders: number }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/reports?period=week");
      if (res.ok) {
        const report = await res.json();

        // Calculate today's stats from orders
        const todayStr = new Date().toISOString().split("T")[0];
        const todayOrders = report.orders.filter(
          (o: { createdAt: string }) => o.createdAt.startsWith(todayStr)
        );
        const todayOmzet = todayOrders
          .filter((o: { status: string }) => o.status === "COMPLETED")
          .reduce((sum: number, o: { total: number }) => sum + o.total, 0);

        const processingOrders = report.orders.filter(
          (o: { status: string }) => o.status === "PROCESSING" || o.status === "PENDING"
        ).length;

        const topProd = report.topProducts?.[0]?.name || "Mie Ayam Baso";

        setData({
          todayOmzet,
          totalOrders: report.totalTransaksi,
          processingOrders,
          topProductName: topProd,
          chartData: report.chartData,
          recentOrders: report.orders.slice(0, 7),
        });
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">PENDING</span>;
      case "PROCESSING":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">PROCESSING</span>;
      case "READY":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">READY</span>;
      case "COMPLETED":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700">COMPLETED</span>;
      case "CANCELLED":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">CANCELLED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700">{status}</span>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
              Dashboard Admin Ojolali
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Ringkasan performa penjualan kuliner dan status operasional warung
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadDashboard}
              className="px-3.5 py-1.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Segarkan</span>
            </button>
            <Link
              href="/admin/reports"
              className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1"
            >
              <span>Laporan Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 4 KPI Cards Required by Section 11 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Penjualan Hari Ini */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Penjualan Hari Ini
              </span>
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-zinc-900">
                {data ? formatRupiah(data.todayOmzet) : "..."}
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>Transaksi lunas</span>
              </p>
            </div>
          </div>

          {/* Card 2: Jumlah Pesanan */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Jumlah Pesanan
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-zinc-900">
                {data ? `${data.totalOrders} Pesanan` : "..."}
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Semua riwayat periode ini</p>
            </div>
          </div>

          {/* Card 3: Pesanan Diproses */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Pesanan Diproses
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <ChefHat className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-amber-900">
                {data ? `${data.processingOrders} Antrean` : "..."}
              </p>
              <p className="text-[11px] text-amber-600 font-medium mt-0.5">
                Perlu ditindaklanjuti kasir
              </p>
            </div>
          </div>

          {/* Card 4: Produk Terlaris */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Produk Terlaris
              </span>
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-lg font-black text-zinc-900 truncate">
                {data ? data.topProductName : "..."}
              </p>
              <p className="text-[11px] text-rose-600 font-semibold mt-0.5">Paling diminati</p>
            </div>
          </div>
        </div>

        {/* AI Assistant Admin Dashboard (Interaktif & Real-Time Database) */}
        <AdminAiChat />

        {/* Sales Chart: Penjualan 7 Hari Terakhir */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-900">
                Grafik Penjualan 7 Hari Terakhir
              </h2>
              <p className="text-xs text-zinc-500">Omzet penjualan harian UMKM Ojolali (Rp)</p>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            {data && data.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `Rp${v / 1000}k`}
                  />
                  <Tooltip
                    formatter={(val) => [formatRupiah(Number(val) || 0), "Omzet"]}
                    labelStyle={{ fontWeight: "bold", color: "#1e293b" }}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="omzet"
                    fill="#ea580c"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                Memuat data grafik penjualan...
              </div>
            )}
          </div>
        </div>

        {/* Asisten AI Database Oji Enterprise */}
        <AdminAiChat />

        {/* Pesanan Terbaru Table Required by Section 11 */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-900">Pesanan Terbaru</h2>
              <p className="text-xs text-zinc-500">Daftar transaksi pesanan paling mutakhir</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              <span>Lihat Semua Pesanan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-4">Nomor</th>
                  <th className="py-3 px-4">Pelanggan</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-800">
                {!data || data.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-400">
                      Tidak ada pesanan terbaru.
                    </td>
                  </tr>
                ) : (
                  data.recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-zinc-50/70 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-zinc-900">
                        {o.orderNumber}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-zinc-900">
                        {o.customerName}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-orange-600">
                        {formatRupiah(o.total)}
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(o.status)}</td>
                      <td className="py-3.5 px-4 text-zinc-500">{formatDate(o.createdAt)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/orders`}
                          className="px-2.5 py-1 text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg inline-flex items-center gap-1 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
