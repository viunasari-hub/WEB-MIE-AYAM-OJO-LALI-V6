"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/dashboard/admin-layout";
import { useToast } from "@/components/ui/toast";
import { formatRupiah, formatDate } from "@/lib/utils";
import { Search, Phone, Mail, Trash2 } from "lucide-react";

interface CustomerUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
}

export default function AdminCustomersPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<CustomerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteCustomer, setDeleteCustomer] = useState<CustomerUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users?role=CUSTOMER");
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.users || []);
      }
    } catch (err) {
      console.error("Error loading customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleDeleteCustomer = async () => {
    if (!deleteCustomer) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/admin/users/${deleteCustomer.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Pelanggan Berhasil Dihapus",
          description: data.message || `Data ${deleteCustomer.name} telah dihapus`,
          variant: "success",
        });
        setDeleteCustomer(null);
        loadCustomers();
      } else {
        toast({
          title: "Gagal Menghapus",
          description: data.error || "Gagal menghapus data pelanggan",
          variant: "error",
        });
      }
    } catch {
      toast({
        title: "Gagal",
        description: "Terjadi gangguan koneksi",
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search))
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
            Data Pelanggan Terdaftar
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Daftar pelanggan, frekuensi pesanan, dan total kontribusi belanja kuliner
          </p>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari nama, email, no. telepon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-4">Nama Pelanggan</th>
                  <th className="py-3 px-4">Kontak (Email / Telp)</th>
                  <th className="py-3 px-4">Frekuensi Pesanan</th>
                  <th className="py-3 px-4">Total Belanja</th>
                  <th className="py-3 px-4">Terdaftar Sejak</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-400">
                      Memuat data pelanggan...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-400">
                      Tidak ada data pelanggan ditemukan.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-50/70 transition">
                      <td className="py-3.5 px-4 font-bold text-zinc-900">{c.name}</td>
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-zinc-600">
                          <Mail className="w-3 h-3 text-zinc-400" />
                          <span>{c.email}</span>
                        </div>
                        {c.phone && (
                          <div className="flex items-center gap-1.5 text-zinc-600">
                            <Phone className="w-3 h-3 text-emerald-500" />
                            <span>{c.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-zinc-900">
                        {c.totalOrders} Kali Pesan
                      </td>
                      <td className="py-3.5 px-4 font-black text-orange-600">
                        {formatRupiah(c.totalSpent)}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400">{formatDate(c.createdAt)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setDeleteCustomer(c)}
                          className="p-1.5 hover:bg-rose-50 text-zinc-400 hover:text-rose-600 rounded-lg transition"
                          title="Hapus Pelanggan"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Delete Confirmation Modal */}
      {deleteCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-zinc-900">Hapus Pelanggan?</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Apakah Anda yakin ingin menghapus akun pelanggan{" "}
                <span className="font-bold text-zinc-800">{deleteCustomer.name}</span> ({deleteCustomer.email})?
              </p>
              <p className="text-[11px] text-amber-700 bg-amber-50 rounded-xl p-2.5 mt-2.5 font-medium border border-amber-200">
                Riwayat transaksi belanja pelanggan ini akan tetap aman tersimpan di sistem.
              </p>
            </div>
            <div className="flex justify-center gap-2.5 pt-1">
              <button
                onClick={() => setDeleteCustomer(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-zinc-300 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteCustomer}
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
