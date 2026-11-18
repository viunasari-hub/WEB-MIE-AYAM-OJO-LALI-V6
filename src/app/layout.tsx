import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { CartProvider } from "@/context/cart-context";
import { ToastProvider } from "@/components/ui/toast";
import { ChatbotWidget } from "@/components/chatbot-widget";

export const metadata: Metadata = {
  title: "Baso & Mie Ayam Ojolali — UMKM Kuliner Pilihan",
  description: "Sistem manajemen dan pemesanan makanan UMKM Baso di Lingkungan Kecamatan dan Mie Ayam Ojolali. Nikmat, cepat, dan mudah dipesan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col bg-zinc-50/50 text-zinc-900 antialiased selection:bg-orange-500 selection:text-white">
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              {children}
              <ChatbotWidget />
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
