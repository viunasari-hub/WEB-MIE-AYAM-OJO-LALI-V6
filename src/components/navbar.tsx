"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import {
  ShoppingBag,
  UtensilsCrossed,
  Sparkles,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  ReceiptText,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getDashboardLink = () => {
    if (!user) return "/customer";
    if (user.role === "ADMIN") return "/admin";
    if (user.role === "CASHIER") return "/cashier";
    return "/customer";
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-zinc-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-lg sm:text-xl text-zinc-900 tracking-tight block leading-none">
              Ojolali <span className="text-orange-600 font-semibold text-sm sm:text-base">UMKM</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-medium block">
              Baso & Mie Ayam Kecamatan
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 font-medium text-sm text-zinc-600">
          <Link
            href="/"
            className={`px-3.5 py-2 rounded-lg transition ${
              pathname === "/" ? "text-orange-600 font-semibold bg-orange-50" : "hover:text-zinc-900 hover:bg-zinc-100"
            }`}
          >
            Beranda
          </Link>
          <Link
            href="/menu"
            className={`px-3.5 py-2 rounded-lg transition ${
              pathname.startsWith("/menu") ? "text-orange-600 font-semibold bg-orange-50" : "hover:text-zinc-900 hover:bg-zinc-100"
            }`}
          >
            Daftar Menu
          </Link>
          <Link
            href="/customer/ai"
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition ${
              pathname === "/customer/ai"
                ? "text-orange-600 font-semibold bg-orange-50"
                : "text-zinc-700 hover:text-orange-600 hover:bg-orange-50/50"
            }`}
          >
            <Sparkles className="w-4 h-4 text-orange-500" />
            AI Asisten
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Cart Button */}
          <Link
            href="/customer/cart"
            className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition border border-orange-200"
            aria-label="Keranjang Belanja"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[11px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center shadow-xs">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Link>

          {/* User auth state */}
          {user ? (
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-zinc-200">
              <Link
                href={getDashboardLink()}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-zinc-600" />
                <span>
                  {user.role === "ADMIN" ? "Admin" : user.role === "CASHIER" ? "Kasir" : "Akun"}
                </span>
              </Link>
              <button
                onClick={() => logout()}
                className="p-1.5 text-zinc-400 hover:text-rose-600 transition rounded-lg hover:bg-rose-50"
                title="Keluar / Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-950 transition"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm transition"
              >
                Daftar
              </Link>
            </div>
          )}

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-zinc-700 hover:bg-zinc-100 rounded-lg transition"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white px-4 py-3 space-y-2 shadow-lg">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-zinc-800 hover:bg-zinc-100"
          >
            Beranda
          </Link>
          <Link
            href="/menu"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-zinc-800 hover:bg-zinc-100"
          >
            Daftar Menu
          </Link>
          <Link
            href="/customer/ai"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-orange-600 bg-orange-50"
          >
            <Sparkles className="w-4 h-4" />
            AI Asisten Kuliner
          </Link>
          <Link
            href="/customer/orders"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-zinc-800 hover:bg-zinc-100"
          >
            <ReceiptText className="w-4 h-4 text-zinc-500" />
            Pesanan Saya
          </Link>

          <div className="pt-2 border-t border-zinc-100 flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  href={getDashboardLink()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold bg-zinc-100 text-zinc-800"
                >
                  <span>Dashboard ({user.role})</span>
                  <LayoutDashboard className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50"
                >
                  Keluar ({user.name})
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-sm font-semibold border border-zinc-200 rounded-lg text-zinc-700"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-sm font-semibold bg-orange-600 text-white rounded-lg"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
