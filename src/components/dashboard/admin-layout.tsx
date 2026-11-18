"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { formatDate } from "@/lib/utils";
import {
  LayoutDashboard,
  Utensils,
  FolderTree,
  ShoppingBag,
  Users,
  UserCheck,
  BarChart3,
  Sparkles,
  LogOut,
  Menu,
  X,
  Store,
  ShieldAlert,
  MessageSquare,
  Bell,
  Clock,
  ArrowRight,
  Cpu,
} from "lucide-react";

interface QuickNotification {
  id: string;
  orderId: string;
  rawOrderId?: string;
  recipientPhone: string;
  recipientType: string;
  type: string;
  status: string;
  createdAt: string;
  message: string;
}

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Kelola Produk", href: "/admin/products", icon: Utensils },
  { label: "Kategori", href: "/admin/categories", icon: FolderTree },
  { label: "Semua Pesanan", href: "/admin/orders", icon: ShoppingBag },
  { label: "Pelanggan", href: "/admin/customers", icon: Users },
  { label: "Kelola Kasir", href: "/admin/cashiers", icon: UserCheck },
  { label: "Laporan Penjualan", href: "/admin/reports", icon: BarChart3 },
  { label: "Pengaturan WhatsApp", href: "/admin/settings/whatsapp", icon: MessageSquare },
  { label: "Konfigurasi AI", href: "/admin/settings/ai", icon: Cpu },
  { label: "AI Insights", href: "/admin/ai-insights", icon: Sparkles },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Real-time Notification Bell State (Requirement #5)
  const [notifications, setNotifications] = useState<QuickNotification[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchRecentNotifications = async () => {
    try {
      const res = await fetch("/api/admin/whatsapp/logs?limit=5");
      if (res.ok) {
        const data = await res.json();
        const logs: QuickNotification[] = data.logs || [];
        setNotifications(logs);
        // Show count of today's notifications
        setUnreadCount(logs.length);
      }
    } catch {
      // quiet fail on polling
    }
  };

  useEffect(() => {
    if (user && user.role === "ADMIN") {
      fetchRecentNotifications();
      const interval = setInterval(fetchRecentNotifications, 12000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-500 font-medium">Memuat portal Admin...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-zinc-200 shadow-md text-center space-y-4">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900">403 - Akses Ditolak</h2>
          <p className="text-sm text-zinc-500">
            Halaman ini khusus untuk Administrator Baso &amp; Mie Ayam Ojolali. Silakan login dengan akun yang memiliki hak akses.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 transition"
            >
              Masuk Akun Admin
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
    <div className="min-h-screen flex bg-zinc-50/70">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-30 bg-white border-r border-zinc-200 shadow-xs">
        {/* Brand */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-zinc-100">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base text-zinc-900 leading-none block">
                Admin Ojolali
              </span>
              <span className="text-[10px] text-zinc-400 font-medium">Panel Manajemen</span>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  active
                    ? "bg-orange-50 text-orange-600 shadow-xs"
                    : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-orange-600" : "text-zinc-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center justify-between">
            <div className="truncate mr-2">
              <p className="text-xs font-bold text-zinc-900 truncate">{user.name}</p>
              <p className="text-[10px] text-zinc-500 truncate font-mono">{user.phone || user.email}</p>
            </div>
            <button
              onClick={() => logout()}
              className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-zinc-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm sm:text-base font-bold text-zinc-800">
              {navItems.find((n) => n.href === pathname)?.label || "Dashboard Admin"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Real-time Notification Bell Popover (Requirement #5) */}
            <div className="relative">
              <button
                onClick={() => setBellOpen(!bellOpen)}
                className="relative p-2 text-zinc-600 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition"
                title="Notifikasi Masuk"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
                )}
              </button>

              {bellOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setBellOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl border border-zinc-200 shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
                    <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-orange-600" />
                        <span className="text-xs font-bold text-zinc-900">
                          Notifikasi WhatsApp &amp; Pesanan
                        </span>
                      </div>
                      <Link
                        href="/admin/settings/whatsapp"
                        onClick={() => setBellOpen(false)}
                        className="text-[11px] font-bold text-orange-600 hover:underline flex items-center gap-1"
                      >
                        Semua Log <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>

                    <div className="divide-y divide-zinc-100 max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-zinc-400">
                          Belum ada notifikasi baru.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className="p-3.5 hover:bg-zinc-50 transition space-y-1 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-zinc-900 flex items-center gap-1.5">
                                {notif.type.includes("Baru") ? "🔔" : notif.type.includes("Batal") ? "❌" : "📢"}{" "}
                                {notif.type}
                              </span>
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                                  notif.status === "Terkirim"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : notif.status === "Simulasi Terkirim"
                                    ? "bg-sky-100 text-sky-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {notif.status}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-zinc-600">
                              <span className="font-mono font-semibold">{notif.orderId}</span>
                              <span className="text-zinc-400 font-mono">{notif.recipientPhone}</span>
                            </div>
                            <div className="text-[10px] text-zinc-400 flex items-center gap-1 pt-0.5">
                              <Clock className="w-3 h-3" />
                              <span>{formatDate(notif.createdAt)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-3 border-t border-zinc-100 bg-zinc-50 text-center">
                      <Link
                        href="/admin/orders"
                        onClick={() => setBellOpen(false)}
                        className="text-xs font-bold text-zinc-700 hover:text-orange-600 transition"
                      >
                        Buka Manajemen Semua Pesanan
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            <Link
              href="/"
              target="_blank"
              className="text-xs font-semibold text-zinc-600 hover:text-orange-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-orange-200 transition"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Lihat Toko Publik</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-64 bg-white flex flex-col z-10 shadow-xl">
            <div className="h-16 px-6 flex items-center justify-between border-b border-zinc-100">
              <span className="font-extrabold text-base text-zinc-900">Admin Ojolali</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                      active
                        ? "bg-orange-50 text-orange-600"
                        : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-zinc-100">
              <button
                onClick={() => logout()}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
