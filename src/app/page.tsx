import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ChatbotWidget } from "@/components/chatbot-widget";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";
import {
  UtensilsCrossed,
  Sparkles,
  ShoppingBag,
  Award,
  Clock,
  HeartHandshake,
  CheckCircle2,
  ArrowRight,
  Flame,
} from "lucide-react";

export default async function HomePage() {
  const featuredProducts = await prisma.product.findMany({
    where: { available: true },
    include: { category: true },
    take: 6,
    orderBy: { price: "desc" },
  });

  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-50 via-white to-zinc-50 py-16 sm:py-24 border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 fill-orange-600 text-orange-600" />
                Kuliner Legendaris Kecamatan
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-900 tracking-tight leading-[1.1]">
                Baso & Mie Ayam{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-rose-600">
                  Ojolali
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-zinc-600 font-medium max-w-xl mx-auto lg:mx-0">
                Nikmat, cepat, dan mudah dipesan.
              </p>

              <p className="text-sm text-zinc-500 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Olahan daging sapi pilihan dengan kaldu rempah gurih hangat dan mie kenyal racikan resep turun-temurun. Siap memanjakan selera makan Anda setiap hari.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  href="/menu"
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-700 hover:to-rose-700 text-white font-bold rounded-xl shadow-lg shadow-orange-600/25 flex items-center justify-center gap-2 transition hover:scale-[1.02]"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Pesan Sekarang</span>
                </Link>
                <Link
                  href="/menu"
                  className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-zinc-100 text-zinc-800 font-bold rounded-xl border border-zinc-300 shadow-xs flex items-center justify-center gap-2 transition"
                >
                  <UtensilsCrossed className="w-4 h-4 text-orange-600" />
                  <span>Lihat Menu</span>
                </Link>
              </div>

              {/* Badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-semibold text-zinc-600">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>100% Halal & Daging Sapi Asli</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Bisa Bayar QRIS & Tunai</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Dine In & Take Away</span>
                </div>
              </div>
            </div>

            {/* Right Hero Image Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-white group">
                <img
                  src="https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80"
                  alt="Semangkuk Baso dan Mie Ayam Lezat"
                  className="w-full h-80 sm:h-96 object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                  <span className="px-2.5 py-1 bg-orange-600 text-white rounded-md text-[10px] font-bold w-fit uppercase mb-2">
                    Menu Favorit
                  </span>
                  <h3 className="font-extrabold text-xl">Baso Komplit & Mie Ayam Spesial</h3>
                  <p className="text-xs text-zinc-200 mt-1">
                    Kuah kaldu sapi kaya rempah gurih berpadu baso urat kenyal dan tetelan empuk.
                  </p>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -bottom-4 -left-2 sm:left-4 bg-white/95 backdrop-blur-md border border-orange-200 p-3.5 rounded-2xl shadow-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-900">Rekomendasi Pintar AI</p>
                  <p className="text-[11px] text-zinc-500">Pilih menu pas dengan budget!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Bar */}
      <section className="py-8 bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-orange-600">
              Kategori Menu
            </h2>
            <p className="text-xl font-bold text-zinc-900 mt-1">Pilihan Kuliner Khas Ojolali</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/menu?category=${cat.id}`}
                className="p-5 rounded-2xl border border-zinc-200 hover:border-orange-500 bg-zinc-50 hover:bg-orange-50/40 transition group flex items-center justify-between"
              >
                <div>
                  <h3 className="font-bold text-base text-zinc-900 group-hover:text-orange-600 transition">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    {cat._count.products} pilihan menu tersedia
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 group-hover:bg-orange-600 group-hover:text-white group-hover:border-orange-600 transition shadow-xs">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-14 sm:py-20 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                Pilihan Terbaik
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 mt-1">
                Produk Unggulan Kami
              </h2>
              <p className="text-sm text-zinc-500 mt-1">
                Paling sering dipesan oleh para penikmat kuliner di lingkungan kecamatan.
              </p>
            </div>
            <Link
              href="/menu"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline"
            >
              <span>Lihat Semua Menu</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col group"
              >
                <div className="relative h-48 w-full overflow-hidden bg-zinc-100">
                  <img
                    src={p.image || "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80"}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-xs text-zinc-800 text-[10px] font-bold rounded-lg shadow-xs">
                    {p.category.name}
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base text-zinc-900 group-hover:text-orange-600 transition">
                      {p.name}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {p.description || "Olahan istimewa dengan bahan segar dan kaldu rempah pilihan."}
                    </p>
                  </div>
                  <div className="pt-4 mt-3 border-t border-zinc-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-400 block font-medium">Harga</span>
                      <span className="text-lg font-black text-orange-600">
                        {formatRupiah(p.price)}
                      </span>
                    </div>
                    <Link
                      href={`/menu/${p.id}`}
                      className="px-3.5 py-2 bg-orange-50 hover:bg-orange-600 text-orange-600 hover:text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Pesan</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Order */}
      <section className="py-14 sm:py-20 bg-white border-y border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
              Mudah & Praktis
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 mt-1">
              Cara Memesan di Ojolali
            </h2>
            <p className="text-xs text-zinc-500 mt-2">
              Hanya 3 langkah sederhana untuk menikmati semangkuk baso atau mie ayam hangat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 font-black text-lg flex items-center justify-center mx-auto shadow-xs">
                1
              </div>
              <h3 className="font-bold text-base text-zinc-900">Pilih Menu Favorit</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Jelajahi menu baso, mie ayam, atau minuman segar. Tambahkan ke keranjang sesuai porsi yang diinginkan.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 font-black text-lg flex items-center justify-center mx-auto shadow-xs">
                2
              </div>
              <h3 className="font-bold text-base text-zinc-900">Checkout & Pembayaran</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Isi catatan pesanan (meja/takeaway) dan pilih metode bayar: Tunai di kasir, Transfer Bank, atau QRIS instan.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 font-black text-lg flex items-center justify-center mx-auto shadow-xs">
                3
              </div>
              <h3 className="font-bold text-base text-zinc-900">Pesanan Siap Disantap</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Kasir & dapur menyiapkan hidangan Anda secepat kilat. Pantau status pesanan hingga siap dihidangkan hangat!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Keunggulan UMKM */}
      <section className="py-14 sm:py-20 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
              Kenapa Ojolali?
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 mt-1">
              Keunggulan UMKM Ojolali
            </h2>
            <p className="text-xs text-zinc-500 mt-2">
              Komitmen kami menjaga kualitas rasa otentik untuk kenyamanan seluruh pelanggan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-zinc-900">Daging Sapi Pilihan</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Menggunakan 100% daging sapi segar tanpa bahan pengawet kimia berbahaya.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-zinc-900">Kuah Kaldu Gurih Mantap</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Direbus berjam-jam bersama sumsum tulang sapi dan rempah pala asli Indonesia.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-zinc-900">Pelayanan Cepat</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Didukung sistem POS digital modern agar antrean makanan Anda cepat disajikan.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-zinc-900">Harga Ramah Kantong</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Porsi melimpah dengan harga terjangkau mulai dari Rp15.000 untuk semua kalangan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Assistant Banner */}
      <section className="py-12 bg-gradient-to-r from-orange-600 via-rose-600 to-amber-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-xs rounded-full text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                Fitur Asisten Pintar Ojolali
              </div>
              <h2 className="text-2xl sm:text-3xl font-black">
                Bingung Mau Makan Apa Hari Ini?
              </h2>
              <p className="text-sm text-orange-100 max-w-xl">
                Tanya asisten AI kami! Cukup sebutkan budget Anda (misal: &quot;budget 25 ribu&quot;), dan AI akan merekomendasikan menu paling pas dan kenyang dari warung kami.
              </p>
            </div>

            <Link
              href="/customer/ai"
              className="px-6 py-3.5 bg-white text-orange-700 hover:bg-orange-50 font-bold text-sm rounded-xl shadow-lg transition flex items-center gap-2 whitespace-nowrap hover:scale-105"
            >
              <Sparkles className="w-4 h-4 text-orange-600" />
              <span>Coba Asisten AI Sekarang</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <ChatbotWidget />
    </div>
  );
}
