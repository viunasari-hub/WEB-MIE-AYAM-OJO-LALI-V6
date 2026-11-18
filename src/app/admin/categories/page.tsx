"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/dashboard/admin-layout";
import { useToast } from "@/components/ui/toast";
import {
  FolderTree,
  Plus,
  Pencil,
  Trash2,
  X,
  Layers,
} from "lucide-react";

interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  _count: {
    products: number;
  };
}

export default function AdminCategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Error loading categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openAdd = () => {
    setEditingCategory(null);
    setName("");
    setErrorMsg("");
    setModalOpen(true);
  };

  const openEdit = (c: CategoryWithCount) => {
    setEditingCategory(c);
    setName(c.name);
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Nama kategori wajib diisi");
      return;
    }

    try {
      setSubmitting(true);
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : "/api/categories";
      const method = editingCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Gagal menyimpan kategori");
        return;
      }

      toast({
        title: "Kategori Berhasil Disimpan",
        description: `Kategori "${name}" telah diperbarui.`,
        variant: "success",
      });

      setModalOpen(false);
      loadCategories();
    } catch {
      setErrorMsg("Gangguan koneksi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, productCount: number) => {
    if (productCount > 0) {
      alert(`Kategori ini memiliki ${productCount} produk aktif. Harap pindahkan produk terlebih dahulu.`);
      return;
    }
    if (!confirm("Hapus kategori ini?")) return;

    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Kategori Dihapus", variant: "info" });
        loadCategories();
      } else {
        toast({ title: "Gagal Menghapus", description: data.error, variant: "error" });
      }
    } catch {
      toast({ title: "Gangguan Koneksi", variant: "error" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
              Kelola Kategori Menu
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Klasifikasi menu makanan dan minuman Baso & Mie Ayam Ojolali
            </p>
          </div>

          <button
            onClick={openAdd}
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kategori</span>
          </button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full py-12 text-center text-xs text-zinc-400">
              Memuat data kategori...
            </div>
          ) : categories.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-zinc-400 bg-white rounded-2xl border border-zinc-200">
              Belum ada kategori ditambahkan.
            </div>
          ) : (
            categories.map((c) => (
              <div
                key={c.id}
                className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-orange-300 transition group"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold mb-3">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-zinc-900">{c.name}</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    {c._count.products} menu terdaftar
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => openEdit(c)}
                    className="p-1.5 text-zinc-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                    title="Ubah Nama"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id, c._count.products)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Hapus Kategori"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h3 className="font-bold text-sm text-zinc-900">
                {editingCategory ? "Edit Kategori" : "Tambah Kategori Baru"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-zinc-400 hover:text-zinc-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                  Nama Kategori
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Aneka Jus Buah"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
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
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
