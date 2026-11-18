"use client";

import React from "react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { Printer, X } from "lucide-react";

export interface ReceiptOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string | null;
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  notes?: string | null;
  whatsappStatus?: string | null;
  whatsappLastSent?: string | Date | null;
  createdAt: string | Date;
  items: Array<{
    id: string;
    product: {
      name: string;
      price: number;
    };
    quantity: number;
    price: number;
    subtotal: number;
  }>;
}

interface ThermalReceiptProps {
  order: ReceiptOrder;
  onClose?: () => void;
}

export function ThermalReceiptModal({ order, onClose }: ThermalReceiptProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-orange-600" />
            <h3 className="font-bold text-zinc-900 text-sm">Struk Pembayaran</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak Struk
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-200/50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="p-6 overflow-y-auto bg-zinc-100 flex justify-center">
          <div
            id="thermal-receipt"
            className="w-full max-w-[340px] bg-white p-6 rounded-lg shadow-sm border border-zinc-200 font-mono text-xs text-zinc-800"
          >
            {/* Store Header */}
            <div className="text-center pb-3 border-b border-dashed border-zinc-400">
              <h2 className="text-base font-black tracking-wider text-black uppercase">
                Baso & Mie Ayam Ojolali
              </h2>
              <p className="text-[11px] text-zinc-600 mt-0.5">
                Jl. Raya Lingkungan Kecamatan No. 45
              </p>
              <p className="text-[10px] text-zinc-500">Telp/WA: 0812-3456-7890</p>
            </div>

            {/* Order Meta */}
            <div className="py-2.5 border-b border-dashed border-zinc-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>No. Order:</span>
                <span className="font-bold">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Tanggal:</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span className="font-semibold">{order.customerName}</span>
              </div>
              {order.notes && (
                <div className="text-[10px] text-zinc-500 italic pt-1">
                  Catatan: {order.notes}
                </div>
              )}
            </div>

            {/* Items */}
            <div className="py-3 border-b border-dashed border-zinc-400 space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-semibold text-zinc-900">{item.product.name}</div>
                  <div className="flex justify-between text-zinc-600 text-[11px]">
                    <span>
                      {item.quantity} x {formatRupiah(item.price)}
                    </span>
                    <span className="font-medium text-zinc-900">
                      {formatRupiah(item.subtotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total & Payment */}
            <div className="py-3 border-b border-dashed border-zinc-400 space-y-1.5">
              <div className="flex justify-between text-sm font-black text-black">
                <span>TOTAL:</span>
                <span>{formatRupiah(order.total)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-zinc-600 pt-1">
                <span>Metode Bayar:</span>
                <span className="font-bold uppercase text-zinc-900">
                  {order.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-zinc-600">
                <span>Status Bayar:</span>
                <span
                  className={`font-bold ${
                    order.paymentStatus === "PAID"
                      ? "text-emerald-700"
                      : "text-amber-700"
                  }`}
                >
                  {order.paymentStatus === "PAID" ? "LUNAS" : "BELUM LUNAS"}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-4 text-[10px] text-zinc-600 space-y-1">
              <p className="font-bold uppercase tracking-wider">
                Terima Kasih Atas Kunjungan Anda!
              </p>
              <p>Nikmat, Cepat, dan Jangan Lupa Balik Lagi</p>
              <p className="text-[9px] text-zinc-400 pt-1">
                *** Struk Resmi Ojolali UMKM ***
              </p>
            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="px-5 py-3 border-t border-zinc-200 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
