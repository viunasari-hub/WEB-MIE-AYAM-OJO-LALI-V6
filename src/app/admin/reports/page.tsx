"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/dashboard/admin-layout";
import { formatRupiah, formatDate } from "@/lib/utils";
import {
  CreditCard,
  TrendingUp,
  ShoppingBag,
  Award,
  Download,
  Calendar,
  Filter,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface ReportData {
  period: string;
  totalOmzet: number;
  totalTransaksi: number;
  completedCount: number;
  rataRataTransaksi: number;
  topProducts: Array<{ id: string; name: string; quantity: number; revenue: number }>;
  chartData: Array<{ label: string; omzet: number; orders: number }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    status: string;
    paymentMethod: string;
    createdAt: string;
    itemCount: number;
  }>;
}

export default function AdminReportsPage() {
  const [period, setPeriod] = useState("week"); // today, week, month, custom
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async (p = period) => {
    try {
      setLoading(true);
      let query = `?period=${p}`;
      if (p === "custom" && startDate && endDate) {
        query += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await fetch(`/api/admin/reports${query}`);
      if (res.ok) {
        const report = await res.json();
        setData(report);
      }
    } catch (err) {
      console.error("Error loading reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(period);
  }, [period]);

  const handleExportCSV = () => {
    if (!data || data.orders.length === 0) return;

    const headers = [
      "Nomor Order",
      "Nama Pelanggan",
      "Total (Rp)",
      "Status",
      "Metode Pembayaran",
      "Jumlah Item",
      "Waktu Transaksi",
    ];

    const rows = data.orders.map((o) => [
      `"${o.orderNumber}"`,
      `"${o.customerName}"`,
      o.total,
      `"${o.status}"`,
      `"${o.paymentMethod}"`,
      o.itemCount,
      `"${new Date(o.createdAt).toLocaleString("id-ID")}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `laporan_penjualan_ojolali_${period}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header & Export Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
              Laporan Penjualan Ojolali
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Analisis pendapatan, rata-rata transaksi, dan ranking menu paling diminati
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={!data || data.orders.length === 0}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition disabled:opacity-50 w-fit"
          >
            <Download className="w-4 h-4" />
            <span>Export Laporan (CSV)</span>
          </button>
        </div>

        {/* Period Selector Tabs */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {[
              { key: "today", label: "Hari Ini" },
              { key: "week", label: "Minggu Ini (7 Hari)" },
              { key: "month", label: "Bulan Ini (30 Hari)" },
              { key: "custom", label: "Kustom Tanggal" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setPeriod(t.key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  period === t.key
                    ? "bg-orange-600 text-white shadow-xs"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {period === "custom" && (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl"
              />
              <span className="text-xs text-zinc-400">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl"
              />
              <button
                onClick={() => fetchReports("custom")}
                className="px-3 py-1.5 bg-zinc-900 text-white text-xs font-bold rounded-xl hover:bg-black transition"
              >
                Terapkan
              </button>
            </div>
          )}
        </div>

        {/* 4 Summary Metric Cards Required by Section 15 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Omzet */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase">Total Omzet</span>
              <CreditCard className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-black text-zinc-900">
              {data ? formatRupiah(data.totalOmzet) : "..."}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold">Pesanan yang telah lunas</p>
          </div>

          {/* Card 2: Total Transaksi */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase">Total Transaksi</span>
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-zinc-900">
              {data ? `${data.totalTransaksi} Pesanan` : "..."}
            </p>
            <p className="text-[11px] text-zinc-400">
              {data ? `${data.completedCount} berhasil` : "..."}
            </p>
          </div>

          {/* Card 3: Rata-rata Transaksi */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase">Rata-rata Transaksi</span>
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-zinc-900">
              {data ? formatRupiah(data.rataRataTransaksi) : "..."}
            </p>
            <p className="text-[11px] text-zinc-400">Nilai keranjang rata-rata</p>
          </div>

          {/* Card 4: Produk Terlaris */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase">Produk Terlaris</span>
              <Award className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-lg font-black text-zinc-900 truncate">
              {data?.topProducts?.[0]?.name || "Belum ada"}
            </p>
            <p className="text-[11px] text-amber-600 font-bold">
              {data?.topProducts?.[0] ? `${data.topProducts[0].quantity} porsi terjual` : "-"}
            </p>
          </div>
        </div>

        {/* Sales Chart */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-zinc-900">Grafik Penjualan Periode Ini</h2>
          <div className="h-64 sm:h-80 w-full pt-4">
            {data && data.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `Rp${v / 1000}k`}
                  />
                  <Tooltip
                    formatter={(val) => [formatRupiah(Number(val) || 0), "Omzet"]}
                    labelStyle={{ fontWeight: "bold" }}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }}
                  />
                  <Bar dataKey="omzet" fill="#ea580c" radius={[6, 6, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                Memuat grafik...
              </div>
            )}
          </div>
        </div>

        {/* Top Products Ranking */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-zinc-100">
            <h2 className="text-base font-bold text-zinc-900">Ranking Produk Terlaris</h2>
            <p className="text-xs text-zinc-500">Urutan menu berdasarkan jumlah porsi yang terjual</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-4">Peringkat</th>
                  <th className="py-3 px-4">Nama Menu</th>
                  <th className="py-3 px-4">Porsi Terjual</th>
                  <th className="py-3 px-4 text-right">Kontribusi Omzet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-800">
                {!data || data.topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-400">
                      Tidak ada data penjualan pada periode ini.
                    </td>
                  </tr>
                ) : (
                  data.topProducts.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-zinc-50/70 transition">
                      <td className="py-3.5 px-4 font-bold text-zinc-500">
                        <span className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-700 flex items-center justify-center font-bold text-xs">
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-zinc-900">{p.name}</td>
                      <td className="py-3.5 px-4 font-bold text-orange-600">
                        {p.quantity} Porsi
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-zinc-900">
                        {formatRupiah(p.revenue)}
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
