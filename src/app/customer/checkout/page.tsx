"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/components/ui/toast";
import { formatRupiah } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle2,
  Banknote,
  QrCode,
  Building,
  User,
  Phone,
  FileText,
  ShieldCheck,
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, totalItems, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TRANSFER" | "QRIS">("QRIS");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (user) {
      if (user.name) setCustomerName(user.name);
      if (user.phone) setCustomerPhone(user.phone);
    }
  }, [user]);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0 && !submitting) {
      router.push("/menu");
    }
  }, [items, submitting, router]);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!customerName.trim()) {
      setErrorMsg("Nama pelanggan wajib diisi");
      return;
    }

    if (items.length === 0) {
      setErrorMsg("Keranjang belanja kosong");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          paymentMethod,
          notes: notes.trim(),
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Gagal membuat pesanan");
        toast({
          title: "Pesanan Gagal",
          description: data.error || "Silakan coba kembali.",
          variant: "error",
        });
        return;
      }

      // Success
      clearCart();
      toast({
        title: "Pesanan Berhasil Dibuat!",
        description: `Nomor Pesanan Anda: ${data.order.orderNumber}`,
        variant: "success",
      });

      router.push(`/customer/orders/${data.order.id}`);
    } catch {
      setErrorMsg("Terjadi gangguan koneksi jaringan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/customer/cart"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-orange-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Keranjang</span>
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            Checkout Pesanan
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Lengkapi data pemesanan dan pilih metode pembayaran favorit Anda.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmitOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Customer Details Form */}
            <div className="lg:col-span-7 space-y-6">
              {/* Card 1: Data Pemesan */}
              <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs space-y-4">
                <h2 className="font-extrabold text-base text-zinc-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-orange-600" />
                  <span>Informasi Pemesan</span>
                </h2>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                    Nama Pelanggan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso / Meja 05"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                    Nomor WhatsApp / HP (Untuk Notifikasi Status)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="tel"
                      placeholder="081234567890"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Notifikasi WhatsApp otomatis akan dikirim saat pesanan diproses dan siap saji.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                    Nomor Meja / Catatan Pesanan
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                    <textarea
                      rows={3}
                      placeholder="Contoh: Makan di tempat Meja No. 04 / Kuah dipisah / Bungkus bawa pulang"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white transition resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Metode Pembayaran */}
              <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs space-y-4">
                <h2 className="font-extrabold text-base text-zinc-900 flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-orange-600" />
                  <span>Pilih Metode Pembayaran</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* QRIS */}
                  <div
                    onClick={() => setPaymentMethod("QRIS")}
                    className={`cursor-pointer p-4 rounded-2xl border transition text-center space-y-2 ${
                      paymentMethod === "QRIS"
                        ? "border-orange-600 bg-orange-50/50 text-orange-950 ring-2 ring-orange-500/20"
                        : "border-zinc-200 hover:border-zinc-300 bg-zinc-50/50"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <span className="block font-bold text-xs">QRIS Instan</span>
                    <span className="block text-[10px] text-zinc-500">Scan GoPay, OVO, Dana, BCA, dll.</span>
                  </div>

                  {/* CASH */}
                  <div
                    onClick={() => setPaymentMethod("CASH")}
                    className={`cursor-pointer p-4 rounded-2xl border transition text-center space-y-2 ${
                      paymentMethod === "CASH"
                        ? "border-orange-600 bg-orange-50/50 text-orange-950 ring-2 ring-orange-500/20"
                        : "border-zinc-200 hover:border-zinc-300 bg-zinc-50/50"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <span className="block font-bold text-xs">Tunai di Kasir</span>
                    <span className="block text-[10px] text-zinc-500">Bayar langsung saat pesanan disiapkan</span>
                  </div>

                  {/* TRANSFER */}
                  <div
                    onClick={() => setPaymentMethod("TRANSFER")}
                    className={`cursor-pointer p-4 rounded-2xl border transition text-center space-y-2 ${
                      paymentMethod === "TRANSFER"
                        ? "border-orange-600 bg-orange-50/50 text-orange-950 ring-2 ring-orange-500/20"
                        : "border-zinc-200 hover:border-zinc-300 bg-zinc-50/50"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
                      <Building className="w-5 h-5" />
                    </div>
                    <span className="block font-bold text-xs">Transfer Bank</span>
                    <span className="block text-[10px] text-zinc-500">BCA / BRI / Mandiri Ojolali</span>
                  </div>
                </div>

                {/* Method Preview Box */}
                {paymentMethod === "QRIS" && (
                  <div className="mt-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                    <div className="w-24 h-24 bg-white p-2 border border-zinc-300 rounded-xl shadow-xs flex items-center justify-center shrink-0">
                      <QrCode className="w-16 h-16 text-zinc-800" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-xs text-zinc-900">QRIS Ojolali Kuliner</p>
                      <p className="text-[11px] text-zinc-500">
                        NMID: ID10202610080123. QR code resmi dapat Anda scan langsung di kasir atau melalui struk pesanan.
                      </p>
                    </div>
                  </div>
                )}

                {paymentMethod === "TRANSFER" && (
                  <div className="mt-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
                    <p className="font-bold text-zinc-900">Rekening Resmi UMKM Ojolali:</p>
                    <div className="p-3 bg-white rounded-xl border border-zinc-200 space-y-1">
                      <p className="text-[11px] text-zinc-500">Bank Central Asia (BCA)</p>
                      <p className="font-mono font-bold text-sm text-zinc-900">882-0192-3841</p>
                      <p className="text-[11px] text-zinc-600">a.n. Baso & Mie Ayam Ojolali</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary Column */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-zinc-200 shadow-xs p-6 space-y-5 sticky top-24">
              <h3 className="font-extrabold text-base text-zinc-900">
                Ringkasan Pesanan ({totalItems} item)
              </h3>

              <div className="max-h-60 overflow-y-auto space-y-3 pr-1 divide-y divide-zinc-100">
                {items.map((item) => (
                  <div key={item.productId} className="pt-2 first:pt-0 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-zinc-800">{item.name}</p>
                      <p className="text-zinc-500 text-[11px]">
                        {item.quantity} x {formatRupiah(item.price)}
                      </p>
                    </div>
                    <span className="font-bold text-zinc-900">
                      {formatRupiah(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-zinc-200 space-y-2 text-xs text-zinc-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-zinc-900">{formatRupiah(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Biaya Layanan</span>
                  <span className="font-semibold text-emerald-600">Rp0</span>
                </div>
                <div className="pt-2 border-t border-zinc-100 flex justify-between items-center text-sm font-black text-zinc-900">
                  <span>Total Tagihan:</span>
                  <span className="text-xl text-orange-600">{formatRupiah(total)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-700 hover:to-rose-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50 hover:scale-[1.01]"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Konfirmasi & Buat Pesanan</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Transaksi aman & langsung terhubung ke kasir</span>
              </div>
            </div>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
