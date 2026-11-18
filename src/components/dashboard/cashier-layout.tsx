"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  CreditCard,
  ShoppingBag,
  History,
  LogOut,
  Menu,
  X,
  UtensilsCrossed,
  ShieldAlert,
} from "lucide-react";

const cashierNav = [
  { label: "Kasir POS", href: "/cashier", icon: CreditCard },
  { label: "Daftar Pesanan", href: "/cashier/orders", icon: ShoppingBag },
  { label: "Riwayat Transaksi", href: "/cashier/transactions", icon: History },
];

export function CashierLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-500 font-medium">Memuat portal Kasir...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== "CASHIER" && user.role !== "ADMIN")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-zinc-200 shadow-md text-center space-y-4">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900">403 - Akses Ditolak</h2>
          <p className="text-sm text-zinc-500">
            Halaman ini khusus untuk Kasir atau Admin Baso & Mie Ayam Ojolali.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 transition"
            >
              Masuk Akun Kasir
            </Link>
            <Link
              href="/"
              className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-lg text-sm font-semibold hover:bg-zinc-50 transition"
            >
              Ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      {/* Top Navbar Optimized for Tablets/Mobiles */}
      <header className="sticky top-0 z-30 bg-white border-b border-zinc-200 h-16 px-4 sm:px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/cashier" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold shadow-xs">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base text-zinc-900 leading-none block">
                POS Kasir Ojolali
              </span>
              <span className="text-[10px] text-zinc-500 font-medium">
                {user.name} ({user.role})
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-1">
          {cashierNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                  active
                    ? "bg-orange-50 text-orange-600 shadow-xs"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-orange-600" : "text-zinc-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-2">
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="hidden sm:inline-flex px-3 py-1.5 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg transition"
            >
              Ke Admin Panel
            </Link>
          )}
          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-zinc-200 p-3 space-y-1">
          {cashierNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-semibold ${
                  active ? "bg-orange-50 text-orange-600" : "text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
