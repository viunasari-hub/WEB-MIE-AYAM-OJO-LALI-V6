"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useCart } from "@/context/cart-context";
import { formatRupiah } from "@/lib/utils";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  UtensilsCrossed,
} from "lucide-react";

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, subtotal, total, totalItems } = useCart();

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/menu"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-orange-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Menu</span>
          </Link>

          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan Keranjang</span>
            </button>
          )}
        </div>

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            Keranjang Belanja Anda
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Periksa pesanan baso, mie ayam, dan minuman sebelum lanjut ke pembayaran.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-zinc-900">Keranjang Belanja Anda Kosong</h2>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Anda belum memilih menu makanan atau minuman. Yuk temukan menu favorit Anda sekarang!
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>Lihat Menu Ojolali</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Cart Items List */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-zinc-200 shadow-xs divide-y divide-zinc-100 overflow-hidden">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={
                        item.image ||
                        "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&auto=format&fit=crop&q=80"
                      }
                      alt={item.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover bg-zinc-100 shrink-0 border border-zinc-100"
                    />
                    <div className="space-y-1">
                      <h3 className="font-bold text-sm sm:text-base text-zinc-900">
                        {item.name}
                      </h3>
                      <p className="text-xs font-semibold text-orange-600">
                        {formatRupiah(item.price)}
                      </p>
                      {item.notes && (
                        <p className="text-[11px] text-zinc-400 italic">
                          Catatan: {item.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-xl border border-zinc-200">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-white text-zinc-700 flex items-center justify-center hover:bg-zinc-200 transition shadow-2xs"
                        aria-label="Kurangi"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-zinc-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-white text-zinc-700 flex items-center justify-center hover:bg-zinc-200 transition shadow-2xs"
                        aria-label="Tambah"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right min-w-[90px]">
                      <span className="text-sm font-black text-zinc-900 block">
                        {formatRupiah(item.price * item.quantity)}
                      </span>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      aria-label="Hapus produk"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary & Checkout Card */}
            <div className="lg:col-span-4 bg-white rounded-3xl border border-zinc-200 shadow-xs p-6 space-y-5 sticky top-24">
              <h3 className="font-extrabold text-base text-zinc-900">
                Ringkasan Pembelian
              </h3>

              <div className="space-y-3 text-xs text-zinc-600">
                <div className="flex justify-between">
                  <span>Total Item ({totalItems} porsi)</span>
                  <span className="font-semibold text-zinc-900">{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Biaya Layanan & Kemasan</span>
                  <span className="font-semibold text-emerald-600">GRATIS</span>
                </div>
                <div className="pt-3 border-t border-zinc-200 flex justify-between items-center text-sm font-black text-zinc-900">
                  <span>Total Bayar:</span>
                  <span className="text-lg text-orange-600">{formatRupiah(total)}</span>
                </div>
              </div>

              <Link
                href="/customer/checkout"
                className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-700 hover:to-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-orange-600/25 flex items-center justify-center gap-2 transition hover:scale-[1.01]"
              >
                <span>Lanjut Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="text-center">
                <Link
                  href="/menu"
                  className="text-xs font-semibold text-zinc-500 hover:text-orange-600 hover:underline inline-block"
                >
                  + Tambah Menu Lainnya
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
