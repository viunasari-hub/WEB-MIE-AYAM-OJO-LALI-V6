import React from "react";
import Link from "next/link";
import { UtensilsCrossed, MapPin, Clock, Phone, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-zinc-900 text-zinc-300 border-t border-zinc-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-sm">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">
                Baso & Mie Ayam Ojolali
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Cita rasa baso sapi asli dan mie ayam kenyal gurih warisan resep istimewa. Nikmat, cepat, dan mudah dipesan untuk seluruh warga kecamatan.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200 mb-3">
              Navigasi Cepat
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/menu" className="hover:text-orange-400 transition">
                  Daftar Menu Makanan
                </Link>
              </li>
              <li>
                <Link href="/customer/cart" className="hover:text-orange-400 transition">
                  Keranjang Belanja
                </Link>
              </li>
              <li>
                <Link href="/customer/ai" className="hover:text-orange-400 transition flex items-center gap-1">
                  <span>Tanya AI Rekomendasi</span>
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-orange-400 transition">
                  Masuk Akun / Portal Kasir
                </Link>
              </li>
            </ul>
          </div>

          {/* Operational Hours */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200 mb-3">
              Jam Operasional
            </h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-zinc-200 font-medium">Setiap Hari</p>
                  <p>10:00 - 21:00 WIB</p>
                </div>
              </li>
              <li className="text-[11px] text-zinc-500 mt-2">
                *Tersedia makan di tempat (Dine In) dan bungkus bawa pulang (Takeaway).
              </li>
            </ul>
          </div>

          {/* Contact & Location */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200 mb-3">
              Lokasi & Kontak
            </h4>
            <ul className="space-y-2.5 text-xs text-zinc-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <span>Jl. Raya Lingkungan Kecamatan No. 45 (Dekat Kantor Camat)</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-orange-500 shrink-0" />
                <span>0812-3456-7890 (WhatsApp Pemesanan)</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-3">
          <p>© 2026 Baso & Mie Ayam Ojolali. Hak cipta dilindungi undang-undang.</p>
          <p className="flex items-center gap-1">
            Dibuat untuk kemajuan UMKM Kuliner Indonesia <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </p>
        </div>
      </div>
    </footer>
  );
}
