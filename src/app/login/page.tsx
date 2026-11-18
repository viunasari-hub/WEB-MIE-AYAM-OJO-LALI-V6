"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/components/ui/toast";
import {
  UtensilsCrossed,
  Phone,
  Lock,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  User,
  Eye,
  EyeOff,
  KeyRound,
  MessageSquareCode,
  RotateCw,
  CheckCircle2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();

  // Mode: "password" (Nomor HP + Sandi) or "otp" (Login WhatsApp OTP)
  const [loginMode, setLoginMode] = useState<"password" | "otp">("password");

  // State Password Form
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // State OTP Form
  const [otpPhone, setOtpPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [mockOtpCode, setMockOtpCode] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Countdown timer effect
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // Handle Standard Login (Nomor Handphone + Password)
  const handleLogin = async (e?: React.FormEvent, customPhone?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setErrorMsg("");

    const targetPhone = (customPhone ?? phone).trim();
    const targetPass = customPass ?? password;

    if (!targetPhone || !targetPass) {
      setErrorMsg("Nomor handphone dan kata sandi wajib diisi");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: targetPhone,
          identifier: targetPhone,
          password: targetPass,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Nomor handphone atau kata sandi tidak valid");
        toast({
          title: "Login Gagal",
          description: data.error || "Periksa kembali nomor handphone dan kata sandi Anda.",
          variant: "error",
        });
        return;
      }

      login(data.user);
      toast({
        title: "Login Berhasil",
        description: `Selamat datang kembali, ${data.user.name}!`,
        variant: "success",
      });

      router.push(data.redirectUrl || "/customer");
    } catch {
      setErrorMsg("Terjadi gangguan koneksi ke server");
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Selector using Phone Numbers
  const fillQuickDemo = (demoPhone: string, rolePass: string) => {
    setLoginMode("password");
    setPhone(demoPhone);
    setPassword(rolePass);
    handleLogin(undefined, demoPhone, rolePass);
  };

  // Handle Send WhatsApp OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setMockOtpCode(null);

    const cleanNumber = otpPhone.replace(/\D/g, "");
    if (!cleanNumber || cleanNumber.length < 8) {
      setErrorMsg("Nomor WhatsApp tidak valid (minimal 8-15 digit)");
      return;
    }

    try {
      setSendingOtp(true);
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: otpPhone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Gagal mengirimkan kode OTP");
        toast({
          title: "Kirim OTP Gagal",
          description: data.error || "Pastikan nomor WhatsApp Anda sudah terdaftar.",
          variant: "error",
        });
        return;
      }

      setOtpSent(true);
      setOtpCountdown(60);
      if (data.mockCode) {
        setMockOtpCode(data.mockCode);
        setOtpCode(data.mockCode);
      }

      toast({
        title: "Kode OTP Terkirim",
        description: data.message || "Silakan periksa pesan WhatsApp Anda.",
        variant: "success",
      });
    } catch {
      setErrorMsg("Gagal menghubungi server untuk mengirim OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  // Handle Verify WhatsApp OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!otpCode || otpCode.trim().length < 4) {
      setErrorMsg("Masukkan 6 digit kode OTP yang diterima");
      return;
    }

    try {
      setVerifyingOtp(true);
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: otpPhone,
          code: otpCode.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Kode verifikasi salah atau kedaluwarsa");
        toast({
          title: "Verifikasi Gagal",
          description: data.error || "Periksa kode OTP Anda.",
          variant: "error",
        });
        return;
      }

      login(data.user);
      toast({
        title: "Login Berhasil!",
        description: `Selamat datang kembali, ${data.user.name}!`,
        variant: "success",
      });

      router.push(data.redirectUrl || "/customer");
    } catch {
      setErrorMsg("Terjadi gangguan koneksi saat memverifikasi kode");
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-orange-50/50 via-white to-zinc-100 p-4 sm:p-6">
      {/* Brand logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-6 group">
        <div className="w-11 h-11 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-600/30 group-hover:scale-105 transition">
          <UtensilsCrossed className="w-6 h-6" />
        </div>
        <div>
          <span className="font-extrabold text-xl text-zinc-900 tracking-tight block leading-none">
            Baso &amp; Mie Ayam Ojolali
          </span>
          <span className="text-xs text-zinc-500 font-medium">Sistem Pemesanan UMKM</span>
        </div>
      </Link>

      <div className="max-w-md w-full bg-white rounded-3xl border border-zinc-200 shadow-xl overflow-hidden p-6 sm:p-8 space-y-5">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
            Masuk ke Akun Anda
          </h1>
          <p className="text-xs text-zinc-500">
            Akses dashboard pemesanan makanan Ojolali
          </p>
        </div>

        {/* Akses Demo Cepat (1-Klik) */}
        <div className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 text-center">

          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillQuickDemo("081234567890", "admin123")}
              className="p-2 rounded-xl bg-white border border-zinc-200 hover:border-orange-500 hover:bg-orange-50/50 text-zinc-700 hover:text-orange-600 transition flex flex-col items-center gap-1 shadow-2xs group cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-orange-600 group-hover:scale-110 transition" />
              <span className="text-[11px] font-bold">Admin</span>
              <span className="text-[9px] text-zinc-400 font-mono">081234567890</span>
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo("081298765432", "kasir123")}
              className="p-2 rounded-xl bg-white border border-zinc-200 hover:border-orange-500 hover:bg-orange-50/50 text-zinc-700 hover:text-orange-600 transition flex flex-col items-center gap-1 shadow-2xs group cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-orange-600 group-hover:scale-110 transition" />
              <span className="text-[11px] font-bold">Kasir</span>
              <span className="text-[9px] text-zinc-400 font-mono">081298765432</span>
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo("085712345678", "customer123")}
              className="p-2 rounded-xl bg-white border border-zinc-200 hover:border-orange-500 hover:bg-orange-50/50 text-zinc-700 hover:text-orange-600 transition flex flex-col items-center gap-1 shadow-2xs group cursor-pointer"
            >
              <User className="w-4 h-4 text-orange-600 group-hover:scale-110 transition" />
              <span className="text-[11px] font-bold">Pelanggan</span>
              <span className="text-[9px] text-zinc-400 font-mono">085712345678</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium text-center">
            {errorMsg}
          </div>
        )}

        {/* MODE 1: Nomor HP + Kata Sandi */}
        {loginMode === "password" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                Nomor Telepon / WhatsApp
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
                Masukkan nomor WhatsApp atau handphone yang terdaftar.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                Kata Sandi
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-700 hover:to-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-orange-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Masuk Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Alternatif WhatsApp OTP (Opsional) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  setLoginMode("otp");
                  setErrorMsg("");
                  setOtpPhone(phone);
                }}
                className="w-full py-2 px-3 rounded-xl border border-dashed border-zinc-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-zinc-600 hover:text-emerald-700 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <MessageSquareCode className="w-3.5 h-3.5 text-emerald-600" />
                <span>Masuk Cepat via WhatsApp OTP (Tanpa Sandi)</span>
              </button>
            </div>
          </form>
        ) : (
          /* MODE 2: WhatsApp OTP Form */
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                    Nomor WhatsApp Terdaftar
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                    <input
                      type="tel"
                      required
                      placeholder="081234567890"
                      value={otpPhone}
                      onChange={(e) => setOtpPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 pl-1">
                    Kode verifikasi 6 digit akan dikirimkan langsung ke nomor WhatsApp Anda.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={sendingOtp || !otpPhone.trim()}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                >
                  {sendingOtp ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <MessageSquareCode className="w-4 h-4" />
                      <span>Kirim Kode OTP WhatsApp</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold">Kode OTP Terkirim ke WhatsApp</p>
                    <p className="text-emerald-700 font-mono text-[11px]">
                      {otpPhone}
                    </p>
                  </div>
                </div>

                {mockOtpCode && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] uppercase tracking-wider text-amber-700">
                        ⚡ Mode Simulasi (Mock)
                      </span>
                      <span className="px-1.5 py-0.5 bg-amber-200 rounded text-[10px] font-mono font-bold">
                        Auto-Filled
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      Kode verifikasi Anda adalah:{" "}
                      <strong className="font-mono text-sm tracking-widest text-amber-950 font-black">
                        {mockOtpCode}
                      </strong>
                    </p>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Masukkan 6 Digit Kode OTP
                    </label>
                    {otpCountdown > 0 ? (
                      <span className="text-[10px] text-zinc-400 font-mono">
                        Kirim ulang ({otpCountdown}s)
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendOtp()}
                        className="text-[10px] font-bold text-orange-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Kirim Ulang</span>
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      className="w-full pl-10 pr-4 py-2.5 text-center tracking-[0.4em] font-mono text-base font-bold bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={verifyingOtp || otpCode.length < 4}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                >
                  {verifyingOtp ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Verifikasi &amp; Masuk</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtpCode("");
                    setMockOtpCode(null);
                  }}
                  className="w-full text-center text-xs text-zinc-500 hover:text-zinc-800 transition cursor-pointer"
                >
                  ← Ganti Nomor WhatsApp
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => {
                setLoginMode("password");
                setErrorMsg("");
              }}
              className="w-full py-2 text-center text-xs text-orange-600 font-bold hover:underline transition cursor-pointer"
            >
              ← Kembali ke Login Nomor &amp; Kata Sandi
            </button>
          </div>
        )}

        <div className="text-center pt-2 border-t border-zinc-100">
          <p className="text-xs text-zinc-500">
            Belum punya akun pelanggan?{" "}
            <Link
              href="/register"
              className="font-bold text-orange-600 hover:text-orange-700 hover:underline"
            >
              Daftar di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
