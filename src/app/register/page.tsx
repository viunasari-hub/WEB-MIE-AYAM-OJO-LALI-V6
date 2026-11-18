"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/components/ui/toast";
import {
  UtensilsCrossed,
  User,
  Phone,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name || !phone || !password) {
      setErrorMsg("Nama, nomor handphone, dan kata sandi wajib diisi");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Kata sandi minimal 6 karakter");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          password,
          email: email.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Gagal melakukan registrasi");
        toast({
          title: "Registrasi Gagal",
          description: data.error || "Silakan cek data yang Anda masukkan.",
          variant: "error",
        });
        return;
      }

      login(data.user);
      toast({
        title: "Registrasi Berhasil!",
        description: `Selamat bergabung di Ojolali UMKM, ${data.user.name}.`,
        variant: "success",
      });

      router.push("/customer");
    } catch {
      setErrorMsg("Terjadi gangguan koneksi ke server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-orange-50/50 via-white to-zinc-100 p-4 sm:p-6">
      <Link href="/" className="flex items-center gap-2.5 mb-6 group">
        <div className="w-11 h-11 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-600/30 group-hover:scale-105 transition">
          <UtensilsCrossed className="w-6 h-6" />
        </div>
        <div>
          <span className="font-extrabold text-xl text-zinc-900 tracking-tight block leading-none">
            Baso &amp; Mie Ayam Ojolali
          </span>
          <span className="text-xs text-zinc-500 font-medium">Daftar Akun Pelanggan</span>
        </div>
      </Link>

      <div className="max-w-md w-full bg-white rounded-3xl border border-zinc-200 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
            Buat Akun Baru
          </h1>
          <p className="text-xs text-zinc-500">
            Daftar cukup gunakan nomor handphone dan kata sandi
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">
              Nama Lengkap <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                required
                placeholder="Contoh: Ahmad Fauzi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">
              Nomor Handphone / WhatsApp <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-600" />
              <input
                type="tel"
                inputMode="tel"
                required
                placeholder="081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white transition font-medium"
              />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1 pl-1">
              Nomor ini akan digunakan sebagai identitas saat login ke aplikasi.
            </p>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">
              Kata Sandi (Minimal 6 Karakter) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Alamat Email
              </label>
              <span className="text-[10px] text-zinc-400 font-medium">Opsional</span>
            </div>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="email"
                placeholder="nama@email.com (tidak wajib)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-700 hover:to-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-orange-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Daftar Akun Pelanggan</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-zinc-100">
          <p className="text-xs text-zinc-500">
            Sudah memiliki akun?{" "}
            <Link
              href="/login"
              className="font-bold text-orange-600 hover:text-orange-700 hover:underline"
            >
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
