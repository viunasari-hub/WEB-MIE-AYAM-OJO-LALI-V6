"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import {
  User,
  ShoppingBag,
  Clock,
  Sparkles,
  LogOut,
  ArrowLeft,
} from "lucide-react";

const customerNav = [
  { label: "Ringkasan Akun", href: "/customer", icon: User },
  { label: "Keranjang Belanja", href: "/customer/cart", icon: ShoppingBag },
  { label: "Riwayat Pesanan", href: "/customer/orders", icon: Clock },
  { label: "AI Asisten", href: "/customer/ai", icon: Sparkles },
];

export function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const { totalItems } = useCart();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-500 font-medium">Memuat profil pelanggan...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900">Silakan Masuk Terlebih Dahulu</h2>
          <p className="text-xs text-zinc-500">
            Untuk melihat riwayat pesanan dan fitur pelanggan, silakan masuk dengan akun Anda.
          </p>
          <div className="flex gap-2 justify-center pt-2">
            <Link
              href="/login"
              className="px-4 py-2 bg-orange-600 text-white rounded-lg text-xs font-semibold hover:bg-orange-700 transition"
            >
              Masuk Sekarang
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-lg text-xs font-semibold hover:bg-zinc-50 transition"
            >
              Daftar Akun Baru
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Customer Header */}
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/menu"
              className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-900 transition flex items-center gap-1.5 text-xs font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Kembali ke Menu</span>
            </Link>
            <span className="text-zinc-300 hidden sm:inline">|</span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-zinc-800">
                Halo, {user.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/customer/cart"
              className="relative p-2 text-zinc-600 hover:text-orange-600 rounded-lg hover:bg-orange-50 transition"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute 0 top-0.5 right-0.5 bg-rose-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
            <button
              onClick={() => logout()}
              className="p-2 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal Navigation Pills */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-2 overflow-x-auto py-2 no-scrollbar">
          {customerNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  active
                    ? "bg-orange-600 text-white shadow-xs"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
