"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/components/ui/toast";
import { formatRupiah } from "@/lib/utils";
import {
  Search,
  ShoppingBag,
  Plus,
  UtensilsCrossed,
  ArrowRight,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  available: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const { addItem, totalItems, total } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/categories"),
        ]);
        const prodData = await prodRes.json();
        const catData = await catRes.json();

        if (prodData.products) setProducts(prodData.products);
        if (catData.categories) setCategories(catData.categories);
      } catch (err) {
        console.error("Error loading menu:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === "all" ||
      p.category.id === selectedCategory ||
      p.category.slug === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    if (!product.available) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      categoryName: product.category.name,
    });
    toast({
      title: "Ditambahkan ke Keranjang",
      description: `${product.name} telah masuk ke pesanan Anda.`,
      variant: "success",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 pb-20">
      <Navbar />

      {/* Header Banner */}
      <div className="bg-gradient-to-b from-orange-600 via-orange-600 to-rose-600 text-white py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center space-y-3">
          <span className="px-3 py-1 bg-white/20 backdrop-blur-xs rounded-full text-xs font-bold uppercase tracking-wider inline-block">
            Menu Pilihan Ojolali
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Daftar Menu Makanan & Minuman
          </h1>
          <p className="text-sm text-orange-100 max-w-lg mx-auto">
            Baso sapi kuah kaldu rempah, mie ayam kenyal lezat, dan aneka minuman segar siap saji.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Search & Category Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs mb-8">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari baso, mie ayam, atau minuman..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === "all"
                  ? "bg-orange-600 text-white shadow-xs"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              Semua Menu
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? "bg-orange-600 text-white shadow-xs"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-zinc-200 p-4 space-y-4 animate-pulse"
              >
                <div className="h-44 bg-zinc-200 rounded-xl" />
                <div className="h-4 bg-zinc-200 rounded w-3/4" />
                <div className="h-3 bg-zinc-200 rounded w-full" />
                <div className="h-8 bg-zinc-200 rounded" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200 p-8 space-y-3">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-zinc-900">Menu Tidak Ditemukan</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Tidak ada menu yang sesuai dengan pencarian &quot;{searchQuery}&quot;. Coba gunakan kata kunci lain.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="px-4 py-2 bg-orange-50 text-orange-600 rounded-xl text-xs font-bold hover:bg-orange-100 transition"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className={`bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col group ${
                  !p.available ? "opacity-75 grayscale-[20%]" : ""
                }`}
              >
                {/* Image */}
                <Link href={`/menu/${p.id}`} className="relative h-48 w-full overflow-hidden bg-zinc-100 block">
                  <img
                    src={p.image || "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80"}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 bg-white/95 backdrop-blur-xs text-zinc-800 text-[10px] font-bold rounded-lg shadow-xs">
                      {p.category.name}
                    </span>
                    {!p.available && (
                      <span className="px-2.5 py-1 bg-rose-600 text-white text-[10px] font-bold rounded-lg shadow-xs">
                        Habis
                      </span>
                    )}
                  </div>
                </Link>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <Link href={`/menu/${p.id}`}>
                      <h3 className="font-bold text-base text-zinc-900 group-hover:text-orange-600 transition">
                        {p.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-zinc-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {p.description || "Olahan istimewa dengan bahan segar dan kaldu rempah pilihan."}
                    </p>
                  </div>

                  {/* Price & Action */}
                  <div className="pt-4 mt-3 border-t border-zinc-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-400 block font-medium">Harga</span>
                      <span className="text-lg font-black text-orange-600">
                        {formatRupiah(p.price)}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleAddToCart(p, e)}
                      disabled={!p.available}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                        p.available
                          ? "bg-orange-600 hover:bg-orange-700 text-white"
                          : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>{p.available ? "Tambah" : "Habis"}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Bottom Cart Bar for Convenience */}
      {totalItems > 0 && (
        <div className="fixed bottom-4 inset-x-4 max-w-lg mx-auto z-40 bg-zinc-900 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between border border-zinc-800 animate-in slide-in-from-bottom-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center font-bold text-white shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold">
                {totalItems} item di keranjang
              </p>
              <p className="text-sm font-black text-orange-400">
                Total: {formatRupiah(total)}
              </p>
            </div>
          </div>
          <Link
            href="/customer/cart"
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
          >
            <span>Lihat Keranjang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      <Footer />
    </div>
  );
}
