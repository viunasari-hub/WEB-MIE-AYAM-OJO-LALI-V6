"use client";

import React, { useEffect, useState } from "react";
import { CashierLayout } from "@/components/dashboard/cashier-layout";
import { ThermalReceiptModal, ReceiptOrder } from "@/components/thermal-receipt";
import { formatRupiah, formatDate } from "@/lib/utils";
import {
  CreditCard,
  Banknote,
  QrCode,
  Search,
  Printer,
  Calendar,
  CheckCircle2,
} from "lucide-react";

export default function CashierTransactionsPage() {
  const [orders, setOrders] = useState<ReceiptOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptOrder | null>(null);

  useEffect(() => {
    async function loadTransactions() {
      try {
        setLoading(true);
        const res = await fetch("/api/orders?status=COMPLETED");
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (err) {
        console.error("Error loading transactions:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTransactions();
  }, []);

  const totalOmzet = orders.reduce((sum, o) => sum + o.total, 0);
  const qrisOrders = orders.filter((o) => o.paymentMethod === "QRIS");
  const cashOrders = orders.filter((o) => o.paymentMethod === "CASH");
  const transferOrders = orders.filter((o) => o.paymentMethod === "TRANSFER");

  const filtered = orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <CashierLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
            Riwayat Transaksi Kasir
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Semua transaksi pembayaran yang telah selesai dan lunas
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500">Total Omzet</p>
              <p className="text-xl font-black text-zinc-900">{formatRupiah(totalOmzet)}</p>
              <p className="text-[10px] text-zinc-400">{orders.length} transaksi sukses</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500">Transaksi QRIS</p>
              <p className="text-xl font-black text-zinc-900">
                {formatRupiah(qrisOrders.reduce((s, o) => s + o.total, 0))}
              </p>
              <p className="text-[10px] text-zinc-400">{qrisOrders.length} transaksi</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500">Transaksi Tunai (Cash)</p>
              <p className="text-xl font-black text-zinc-900">
                {formatRupiah(cashOrders.reduce((s, o) => s + o.total, 0))}
              </p>
              <p className="text-[10px] text-zinc-400">{cashOrders.length} transaksi</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari transaksi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-4">No. Order</th>
                  <th className="py-3 px-4">Pelanggan</th>
                  <th className="py-3 px-4">Waktu Transaksi</th>
                  <th className="py-3 px-4">Metode Bayar</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4 text-right">Struk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-400">
                      Memuat transaksi...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-400">
                      Tidak ada data transaksi.
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => (
                    <tr key={t.id} className="hover:bg-zinc-50/70 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-zinc-900">
                        {t.orderNumber}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-zinc-900">
                        {t.customerName}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500">{formatDate(t.createdAt)}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold uppercase text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800">
                          {t.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-orange-600">
                        {formatRupiah(t.total)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedReceipt(t)}
                          className="px-3 py-1.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition"
                        >
                          <Printer className="w-3.5 h-3.5 text-orange-600" />
                          <span>Cetak</span>
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

      {selectedReceipt && (
        <ThermalReceiptModal
          order={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </CashierLayout>
  );
}
