"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/dashboard/admin-layout";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import { UserCheck, Plus, Mail, Phone, Lock, X, Shield } from "lucide-react";

interface CashierUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  createdAt: string;
}

export default function AdminCashiersPage() {
  const { toast } = useToast();
  const [cashiers, setCashiers] = useState<CashierUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadCashiers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users?role=CASHIER");
      if (res.ok) {
        const data = await res.json();
        setCashiers(data.users || []);
      }
    } catch (err) {
      console.error("Error loading cashiers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCashiers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name || !phone || !password) {
      setErrorMsg("Nama, nomor HP, dan kata sandi wajib diisi");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          password,
          role: "CASHIER",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Gagal membuat akun kasir");
        return;
      }

      toast({
        title: "Akun Kasir Dibuat",
        description: `Akun kasir ${name} berhasil didaftarkan.`,
        variant: "success",
      });

      setModalOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      loadCashiers();
    } catch {
      setErrorMsg("Gangguan koneksi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
              Kelola Petugas Kasir
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Daftar staf kasir yang memiliki hak akses sistem POS Ojolali
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kasir Baru</span>
          </button>
        </div>

        {/* Cashiers List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-full py-12 text-center text-xs text-zinc-400">
              Memuat data kasir...
            </div>
          ) : cashiers.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-zinc-400 bg-white rounded-2xl border border-zinc-200">
              Belum ada kasir terdaftar.
            </div>
          ) : (
            cashiers.map((c) => (
              <div
                key={c.id}
                className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs flex items-start gap-4 hover:border-orange-300 transition"
              >
                <div className="w-11 h-11 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-zinc-900">{c.name}</h3>
                    <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-md text-[10px] font-bold">
                      {c.role}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{c.email}</span>
                  </p>
                  {c.phone && (
                    <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{c.phone}</span>
                    </p>
                  )}
                  <p className="text-[10px] text-zinc-400 pt-1">
                    Dibuat: {formatDate(c.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Tambah Kasir */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h3 className="font-bold text-sm text-zinc-900">Tambah Akun Kasir</h3>
              <button onClick={() => setModalOpen(false)} className="text-zinc-400 hover:text-zinc-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                  Nama Kasir <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Siti Rahma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                  Nomor HP / WhatsApp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="081298765432"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Alamat Email
                  </label>
                  <span className="text-[10px] text-zinc-400 font-medium">Opsional</span>
                </div>
                <input
                  type="email"
                  placeholder="kasir2@ojolali.test (opsional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                  Kata Sandi Sementara <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-zinc-300 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : "Buat Akun Kasir"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
