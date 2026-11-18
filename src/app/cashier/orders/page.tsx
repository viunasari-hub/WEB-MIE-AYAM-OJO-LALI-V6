"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CashierLayout } from "@/components/dashboard/cashier-layout";
import { ThermalReceiptModal, ReceiptOrder } from "@/components/thermal-receipt";
import { useToast } from "@/components/ui/toast";
import { formatRupiah, formatDate } from "@/lib/utils";
import {
  Search,
  Printer,
  Eye,
  Filter,
  CheckCircle2,
  Clock,
  ChefHat,
  XCircle,
  MoreVertical,
} from "lucide-react";

export default function CashierOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<ReceiptOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptOrder | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error("Error loading cashier orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, status: string, paymentStatus?: string) => {
    try {
      const body: Record<string, string> = { status };
      if (paymentStatus) body.paymentStatus = paymentStatus;

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
        title: "Status Berhasil Diubah",
        description: `Pesanan diubah menjadi: ${status}`,
        variant: "success",
      });

      fetchOrders();
    } catch {
      toast({
        title: "Kesalahan Jaringan",
        description: "Gagal menghubungi server.",
        variant: "error",
      });
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">Menunggu</span>;
      case "PROCESSING":
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">Diproses</span>;
      case "READY":
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">Siap Ambil</span>;
      case "COMPLETED":
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-zinc-100 text-zinc-700">Selesai</span>;
      case "CANCELLED":
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">Dibatalkan</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-zinc-100 text-zinc-700">{status}</span>;
    }
  };

  return (
    <CashierLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
              Daftar Semua Pesanan
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Kelola status dan cetak struk pesanan yang masuk
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs justify-between items-stretch md:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari nomor order atau nama pemesan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {["ALL", "PENDING", "PROCESSING", "READY", "COMPLETED", "CANCELLED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  statusFilter === st
                    ? "bg-orange-600 text-white shadow-xs"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {st === "ALL" ? "Semua Status" : st}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-4">No. Order</th>
                  <th className="py-3 px-4">Pelanggan</th>
                  <th className="py-3 px-4">Item Menu</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Metode Bayar</th>
                  <th className="py-3 px-4">Status Pesanan</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-400">
                      Memuat pesanan...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-400">
                      Tidak ada pesanan ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-zinc-50/70 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-zinc-900">
                        {o.orderNumber}
                        <span className="block text-[10px] font-sans font-normal text-zinc-400">
                          {formatDate(o.createdAt)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-zinc-900">
                        {o.customerName}
                        {o.customerPhone && (
                          <span className="block text-[10px] text-zinc-500 font-normal">
                            {o.customerPhone}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-zinc-600">
                        {o.items.map((i) => `${i.quantity}x ${i.product.name}`).join(", ")}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-orange-600">
                        {formatRupiah(o.total)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold uppercase text-[11px] block">
                          {o.paymentMethod}
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            o.paymentStatus === "PAID" ? "text-emerald-600" : "text-amber-600"
                          }`}
                        >
                          {o.paymentStatus === "PAID" ? "Lunas" : "Belum Bayar"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(o.status)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedReceipt(o)}
                            className="p-1.5 hover:bg-orange-50 text-zinc-500 hover:text-orange-600 rounded-lg transition"
                            title="Cetak Struk"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/cashier/orders/${o.id}`}
                            className="p-1.5 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 rounded-lg transition"
                            title="Detail Pesanan"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Quick transition dropdown */}
                          <select
                            value={o.status}
                            onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                            className="text-[10px] font-bold bg-zinc-100 border border-zinc-300 rounded-lg px-2 py-1 focus:ring-1 focus:ring-orange-500"
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="PROCESSING">PROCESSING</option>
                            <option value="READY">READY</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedReceipt && (
        <ThermalReceiptModal
          order={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </CashierLayout>
  );
}
