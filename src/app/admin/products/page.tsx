"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/dashboard/admin-layout";
import { useToast } from "@/components/ui/toast";
import { formatRupiah } from "@/lib/utils";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  X,
  UtensilsCrossed,
  Image as ImageIcon,
  DollarSign,
  Tag,
} from "lucide-react";

interface ProductItem {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  available: boolean;
  category: {
    id: string;
    name: string;
  };
}

interface CategoryItem {
  id: string;
  name: string;
}

export default function AdminProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formAvailable, setFormAvailable] = useState(true);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
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
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName("");
    setFormCategoryId(categories[0]?.id || "");
    setFormPrice("");
    setFormDescription("");
    setFormImage("");
    setFormAvailable(true);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (p: ProductItem) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCategoryId(p.categoryId);
    setFormPrice(p.price.toString());
    setFormDescription(p.description || "");
    setFormImage(p.image || "");
    setFormAvailable(p.available);
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formName.trim()) {
      setFormError("Nama produk wajib diisi");
      return;
    }
    if (!formCategoryId) {
      setFormError("Kategori wajib dipilih");
      return;
    }
    const numPrice = Number(formPrice);
    if (isNaN(numPrice) || numPrice <= 0) {
      setFormError("Harga harus berupa angka positif");
      return;
    }

    try {
      setSubmitting(true);
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          categoryId: formCategoryId,
          price: numPrice,
          description: formDescription.trim(),
          image: formImage.trim(),
          available: formAvailable,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Gagal menyimpan produk");
        return;
      }

      toast({
        title: editingProduct ? "Produk Diperbarui" : "Produk Ditambahkan",
        description: `Produk "${formName}" berhasil disimpan.`,
        variant: "success",
      });

      setModalOpen(false);
      loadData();
    } catch {
      setFormError("Terjadi kesalahan jaringan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAvailable = async (p: ProductItem) => {
    try {
      const res = await fetch(`/api/products/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: !p.available }),
      });
      if (res.ok) {
        toast({
          title: "Status Diubah",
          description: `${p.name} kini ${!p.available ? "Tersedia" : "Habis"}.`,
          variant: "info",
        });
        loadData();
      }
    } catch {
      toast({ title: "Gagal", description: "Gangguan koneksi.", variant: "error" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Berhasil",
          description: data.message || "Produk berhasil dihapus.",
          variant: "success",
        });
        setDeleteConfirmId(null);
        loadData();
      } else {
        toast({ title: "Gagal Menghapus", description: data.error, variant: "error" });
      }
    } catch {
      toast({ title: "Gagal", description: "Gangguan koneksi.", variant: "error" });
    }
  };

  const filtered = products.filter((p) => {
    const matchesCat = selectedCat === "all" || p.categoryId === selectedCat;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
              Kelola Produk & Menu
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Tambah, perbarui harga, foto, dan status ketersediaan menu baso & mie ayam
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk Baru</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs justify-between items-stretch md:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari nama menu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setSelectedCat("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCat === "all"
                  ? "bg-orange-600 text-white shadow-xs"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              Semua Kategori
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCat(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedCat === c.id
                    ? "bg-orange-600 text-white shadow-xs"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-4">Foto & Menu</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Harga Satuan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-400">
                      Memuat katalog produk...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-400">
                      Tidak ada produk ditemukan.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image || "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=100"}
                            alt={p.name}
                            className="w-12 h-12 rounded-xl object-cover bg-zinc-100 border border-zinc-200 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-sm text-zinc-900 block">{p.name}</span>
                            <span className="text-[11px] text-zinc-400 line-clamp-1 max-w-xs">
                              {p.description || "Tidak ada deskripsi"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-zinc-100 text-zinc-700">
                          {p.category.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-black text-sm text-orange-600">
                        {formatRupiah(p.price)}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleAvailable(p)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition flex items-center gap-1 ${
                            p.available
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                          }`}
                        >
                          {p.available ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Tersedia</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>Habis</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-zinc-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(p.id)}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
              <h3 className="font-extrabold text-sm text-zinc-900">
                {editingProduct ? "Edit Data Produk" : "Tambah Produk Baru"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                  {formError}
                </div>
              )}

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                  Nama Menu Produk <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Baso Komplit Urat Jumbo"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                    Kategori <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                    Harga (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    required
                    placeholder="25000"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                  URL Foto Produk
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                  Deskripsi Menu
                </label>
                <textarea
                  rows={3}
                  placeholder="Keterangan isi porsi, bahan utama, kuah kaldu..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white transition resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="prod-available"
                  checked={formAvailable}
                  onChange={(e) => setFormAvailable(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded-sm border-zinc-300 focus:ring-orange-500"
                />
                <label htmlFor="prod-available" className="text-xs font-bold text-zinc-700 cursor-pointer">
                  Produk Tersedia untuk Dipesan
                </label>
              </div>

              <div className="pt-4 border-t border-zinc-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-zinc-300 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : "Simpan Produk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-zinc-900">Konfirmasi Hapus Produk</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Apakah Anda yakin ingin menghapus produk ini? Jika produk pernah dipesan, sistem akan menonaktifkannya untuk menjaga riwayat transaksi.
              </p>
            </div>
            <div className="flex justify-center gap-2.5 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-zinc-300 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
