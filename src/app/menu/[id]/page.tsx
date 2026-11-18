"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/components/ui/toast";
import { formatRupiah } from "@/lib/utils";
import {
  ArrowLeft,
  ShoppingBag,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  UtensilsCrossed,
} from "lucide-react";

interface ProductDetail {
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

function ProductDetailContent() {
  const routeParams = useParams();
  const id = routeParams?.id as string;
  const router = useRouter();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);

  const { addItem } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data.product);
        }
      } catch (err) {
        console.error("Error loading product:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product || !product.available) return;

    addItem(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        categoryName: product.category.name,
      },
      quantity,
      notes
    );

    toast({
      title: "Berhasil Ditambahkan",
      description: `${quantity}x ${product.name} dimasukkan ke keranjang belanja.`,
      variant: "success",
    });

    router.push("/customer/cart");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50">
        <Navbar />
        <div className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-zinc-500">Memuat rincian menu...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50">
        <Navbar />
        <div className="flex-1 max-w-md mx-auto px-4 py-20 text-center space-y-4">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900">Produk Tidak Ditemukan</h2>
          <p className="text-xs text-zinc-500">
            Menu yang Anda cari mungkin sudah tidak tersedia atau dihapus.
          </p>
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Menu</span>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Breadcrumb / Back button */}
        <div className="mb-6">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-orange-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Menu</span>
          </Link>
        </div>

        {/* Product Card Container */}
        <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-xs grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-8">
          {/* Product Image */}
          <div className="relative rounded-2xl overflow-hidden bg-zinc-100 h-72 sm:h-96 w-full shadow-inner">
            <img
              src={product.image || "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80"}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 bg-white/95 backdrop-blur-xs text-zinc-800 text-xs font-bold rounded-lg shadow-xs">
                {product.category.name}
              </span>
            </div>
          </div>

          {/* Product Details & Actions */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      product.available
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {product.available ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Tersedia Hari Ini
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3" /> Sedang Habis
                      </>
                    )}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
                  {product.name}
                </h1>
                <p className="text-2xl font-black text-orange-600 mt-2">
                  {formatRupiah(product.price)}
                </p>
              </div>

              <div className="border-t border-zinc-100 pt-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Deskripsi Menu
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  {product.description ||
                    "Semangkuk olahan daging sapi istimewa dengan racikan rempah lezat khas Ojolali. Disajikan hangat dan nikmat untuk Anda."}
                </p>
              </div>

              {/* Special Notes Field */}
              <div className="border-t border-zinc-100 pt-3">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">
                  Catatan Khusus (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kuah dipisah, tidak pakai daun bawang, dll."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="space-y-4 pt-4 border-t border-zinc-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-700">Jumlah Porsi</span>
                <div className="flex items-center gap-3 bg-zinc-100 p-1 rounded-xl border border-zinc-200">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 rounded-lg bg-white text-zinc-700 flex items-center justify-center hover:bg-zinc-200 disabled:opacity-40 transition shadow-2xs"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-zinc-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-white text-zinc-700 flex items-center justify-center hover:bg-zinc-200 transition shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-1 text-sm font-bold text-zinc-800">
                <span>Total Harga:</span>
                <span className="text-lg font-black text-orange-600">
                  {formatRupiah(product.price * quantity)}
                </span>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!product.available}
                className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition ${
                  product.available
                    ? "bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-700 hover:to-rose-700 text-white shadow-orange-600/25"
                    : "bg-zinc-200 text-zinc-400 cursor-not-allowed shadow-none"
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {product.available
                    ? `Tambah ke Keranjang (${formatRupiah(product.price * quantity)})`
                    : "Menu Sedang Tidak Tersedia"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-zinc-50">
          <Navbar />
          <div className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-zinc-500">Memuat rincian menu...</p>
            </div>
          </div>
          <Footer />
        </div>
      }
    >
      <ProductDetailContent />
    </Suspense>
  );
}
