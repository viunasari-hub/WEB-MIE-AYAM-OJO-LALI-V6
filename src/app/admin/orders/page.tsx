"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/dashboard/admin-layout";
import { ThermalReceiptModal, ReceiptOrder } from "@/components/thermal-receipt";
import { useToast } from "@/components/ui/toast";
import { formatRupiah, formatDate } from "@/lib/utils";
import {
  Search,
  Printer,
  Trash2,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Send,
  ExternalLink,
  X,
  Phone,
} from "lucide-react";

export default function AdminOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<ReceiptOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptOrder | null>(null);
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<ReceiptOrder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // WhatsApp manual modal state (Requirement #6)
  const [selectedWhatsAppOrder, setSelectedWhatsAppOrder] = useState<ReceiptOrder | null>(null);
  const [sendingWA, setSendingWA] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error("Error loading admin orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast({
          title: "Status Berhasil Diubah",
          description: `Menjadi: ${status} (Notifikasi otomatis dikirimkan)`,
          variant: "success",
        });
        fetchOrders();
      }
    } catch {
      toast({ title: "Gangguan Jaringan", variant: "error" });
    }
  };

  const handleDeleteOrder = async () => {
    if (!deleteConfirmOrder) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/orders/${deleteConfirmOrder.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Pesanan Dihapus",
          description: data.message || `Pesanan ${deleteConfirmOrder.orderNumber} berhasil dihapus`,
          variant: "success",
        });
        setDeleteConfirmOrder(null);
        fetchOrders();
      } else {
        toast({
          title: "Gagal Menghapus",
          description: data.error || "Gagal menghapus pesanan",
          variant: "error",
        });
      }
    } catch {
      toast({
        title: "Gagal",
        description: "Terjadi gangguan jaringan",
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendWhatsApp = async (target: "ADMIN" | "CUSTOMER") => {
    if (!selectedWhatsAppOrder) return;
    try {
      setSendingWA(true);
      const res = await fetch(`/api/orders/${selectedWhatsAppOrder.id}/whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          title: "WhatsApp Terkirim",
          description: `Notifikasi ke ${target === "ADMIN" ? "Admin" : "Pelanggan"} berhasil diproses (${data.status}).`,
          variant: "success",
        });
        fetchOrders();
        setSelectedWhatsAppOrder(null);
      } else {
        toast({
          title: "Gagal Mengirim WhatsApp",
          description: data.error || data.message || "Gagal memproses pengiriman.",
          variant: "error",
        });
      }
    } catch {
      toast({ title: "Gagal", description: "Gangguan jaringan", variant: "error" });
    } finally {
      setSendingWA(false);
    }
  };

  const filtered = orders.filter((o) => {
    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">MENUNGGU</span>;
      case "PROCESSING":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">DIPROSES</span>;
      case "READY":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">SIAP</span>;
      case "COMPLETED":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700">SELESAI</span>;
      case "CANCELLED":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">DIBATALKAN</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700">{status}</span>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
            Semua Pesanan Masuk
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Daftar lengkap transaksi pesanan, status alur dapur, dan notifikasi WhatsApp otomatis
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs justify-between items-stretch md:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari order..."
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
                  <th className="py-3 px-4">Pelanggan &amp; WhatsApp</th>
                  <th className="py-3 px-4">Item Menu</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Metode Bayar</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-400">
                      Memuat data pesanan...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-400">
                      Tidak ada pesanan ditemukan.
                    </td>
                  </tr>
                ) : (
                  filtered.map((o) => (
                    <tr key={o.id} className="hover:bg-zinc-50/70 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-zinc-900">
                        {o.orderNumber}
                        <span className="block text-[10px] font-sans font-normal text-zinc-400">
                          {formatDate(o.createdAt)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-zinc-900">
                        <div>{o.customerName}</div>
                        {o.customerPhone && (
                          <div className="text-[10px] text-zinc-500 font-mono font-normal">
                            {o.customerPhone}
                          </div>
                        )}
                        {/* WhatsApp Indicator Badge (Requirement #6 & #12) */}
                        <div className="mt-1">
                          {o.whatsappStatus === "SENT" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              ✓ WhatsApp terkirim
                            </span>
                          ) : o.whatsappStatus === "MOCK_SENT" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                              <MessageSquare className="w-3 h-3 text-sky-600" />
                              📱 Simulasi terkirim
                            </span>
                          ) : o.whatsappStatus === "FAILED" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              ⚠ WhatsApp gagal dikirim
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-400">
                              ⚪ Menunggu notifikasi
                            </span>
                          )}
                        </div>
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
                          {/* WhatsApp Button (Requirement #6) */}
                          <button
                            onClick={() => setSelectedWhatsAppOrder(o)}
                            className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition"
                            title="Kirim / Kelola WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedReceipt(o)}
                            className="p-1.5 hover:bg-orange-50 text-zinc-500 hover:text-orange-600 rounded-lg transition"
                            title="Cetak Struk"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmOrder(o)}
                            className="p-1.5 hover:bg-rose-50 text-zinc-400 hover:text-rose-600 rounded-lg transition"
                            title="Hapus Pesanan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <select
                            value={o.status}
                            onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                            className="text-[10px] font-bold bg-zinc-100 border border-zinc-300 rounded-lg px-2 py-1"
                          >
                            <option value="PENDING">PENDING (Menunggu)</option>
                            <option value="PROCESSING">PROCESSING (Diproses)</option>
                            <option value="READY">READY (Siap)</option>
                            <option value="COMPLETED">COMPLETED (Selesai)</option>
                            <option value="CANCELLED">CANCELLED (Batal)</option>
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

      {/* Thermal Receipt Modal */}
      {selectedReceipt && (
        <ThermalReceiptModal
          order={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {/* WhatsApp Resend Modal (Requirement #6) */}
      {selectedWhatsAppOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-100 text-emerald-600 rounded-xl">
                  <MessageSquare className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-sm text-zinc-900">
                  Kirim Notifikasi WhatsApp
                </h3>
              </div>
              <button
                onClick={() => setSelectedWhatsAppOrder(null)}
                className="text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200 text-xs space-y-1">
              <p className="font-bold text-zinc-900">
                Pesanan: {selectedWhatsAppOrder.orderNumber}
              </p>
              <p className="text-zinc-600">Pelanggan: {selectedWhatsAppOrder.customerName}</p>
              <p className="text-zinc-600 font-mono">
                No. HP: {selectedWhatsAppOrder.customerPhone || "Tidak ada nomor"}
              </p>
              <p className="text-zinc-600">
                Status Saat Ini: <span className="font-bold">{selectedWhatsAppOrder.status}</span>
              </p>
              <div className="pt-1">
                <span className="text-[11px] text-zinc-500 block">Status WhatsApp Terakhir:</span>
                <span className="font-bold text-xs text-orange-600">
                  {selectedWhatsAppOrder.whatsappStatus === "SENT"
                    ? "🟢 Notifikasi Terkirim"
                    : selectedWhatsAppOrder.whatsappStatus === "MOCK_SENT"
                    ? "🔵 Simulasi Terkirim"
                    : selectedWhatsAppOrder.whatsappStatus === "FAILED"
                    ? "🔴 Gagal Mengirim"
                    : "⚪ Belum Ada Pengiriman"}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => handleSendWhatsApp("CUSTOMER")}
                disabled={sendingWA || !selectedWhatsAppOrder.customerPhone}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {sendingWA ? "Memproses..." : "📱 Kirim WhatsApp ke Pelanggan"}
                </span>
              </button>

              <button
                onClick={() => handleSendWhatsApp("ADMIN")}
                disabled={sendingWA}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {sendingWA ? "Memproses..." : "🔔 Kirim WhatsApp ke Admin"}
                </span>
              </button>

              {/* Direct WhatsApp Web link as emergency backup */}
              {selectedWhatsAppOrder.customerPhone && (
                <a
                  href={`https://wa.me/${selectedWhatsAppOrder.customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                    `Halo Kak ${selectedWhatsAppOrder.customerName}, kami dari Warung Bakso & Mie Ayam Ojolali menginfokan update pesanan ${selectedWhatsAppOrder.orderNumber}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Chat WhatsApp Web (Cadangan)</span>
                </a>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setSelectedWhatsAppOrder(null)}
                className="px-4 py-1.5 border border-zinc-200 text-zinc-600 rounded-xl text-xs font-semibold hover:bg-zinc-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-zinc-900">Hapus Pesanan?</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Apakah Anda yakin ingin menghapus data pesanan{" "}
                <span className="font-bold text-zinc-900">{deleteConfirmOrder.orderNumber}</span> ({deleteConfirmOrder.customerName})?
              </p>
              <p className="text-[11px] text-rose-600 bg-rose-50 rounded-xl p-2.5 mt-2.5 font-medium border border-rose-200">
                Data transaksi pesanan sebesar{" "}
                <span className="font-bold">{formatRupiah(deleteConfirmOrder.total)}</span> beserta seluruh item menu di dalamnya akan dihapus permanen.
              </p>
            </div>
            <div className="flex justify-center gap-2.5 pt-1">
              <button
                onClick={() => setDeleteConfirmOrder(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-zinc-300 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteOrder}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
