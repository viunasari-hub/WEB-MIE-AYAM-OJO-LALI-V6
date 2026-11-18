import { prisma } from "../prisma";
import { formatRupiah } from "../utils";

// Helper function to normalize text
function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("62")) {
    const rest = digits.slice(2);
    return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`;
  }
  if (digits.startsWith("0")) {
    const rest = digits.slice(1);
    return `0${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`;
  }
  return phone;
}

export async function processChatbotQuery(rawMessage: string, userId?: string | null): Promise<string> {
  const query = rawMessage.trim();
  const lower = normalize(query);

  if (!query) {
    return "Silakan masukkan pertanyaan Anda seputar akun, menu, harga, pesanan, atau informasi warung Ojolali.";
  }

  // Ambil data user yang sedang login (jika ada userId)
  let currentUser = null;
  if (userId) {
    try {
      currentUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          orders: {
            include: { items: { include: { product: true } } },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      });
    } catch (e) {
      console.error("Error fetching currentUser in chatbot-engine:", e);
    }
  }

  // ==========================================
  // 1. CEK IDENTITAS USER ("SIAPA SAYA / NAMA SAYA / AKUN SAYA")
  // ==========================================
  const isUserIdentityQuery =
    /(siapa\s+(saya|aku|gue|gw|me)|siapakah\s+(saya|aku)|saya\s+siapa|aku\s+siapa|nama\s+(saya|aku|ku)|siapa\s+nama\s+(saya|aku)|nama\s+lengkap\s+(saya|aku)|nama\s+asli\s+(saya|aku)|kenal\s+(saya|aku)|tau\s+(siapa\s+)?(saya|aku)|tahu\s+gak\s+siapa\s+(saya|aku)|profil\s+(saya|aku)|akun\s+(saya|aku)|data\s+(saya|aku)|identitas\s+(saya|aku)|role\s+(saya|aku)|siapa\s+yang\s+(lagi\s+|sedang\s+)?login)/i.test(lower) ||
    lower === "siapa saya" ||
    lower === "siapa aku" ||
    lower === "nama saya" ||
    lower === "profil saya" ||
    lower === "akun saya";

  if (isUserIdentityQuery) {
    if (currentUser) {
      let roleLabel = "🌟 Pelanggan Setia Ojolali";
      if (currentUser.role === "ADMIN") {
        roleLabel = "👑 Administrator / Pengelola Warung";
      } else if (currentUser.role === "CASHIER") {
        roleLabel = "💼 Kasir Warung Ojolali";
      }

      const totalUserOrders = await prisma.order.count({
        where: { userId: currentUser.id },
      });

      const joinDate = currentUser.createdAt.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const userPhone = currentUser.phone ? formatPhone(currentUser.phone) : "Belum dicantumkan";

      let orderSnippet = "";
      if (currentUser.orders && currentUser.orders.length > 0) {
        const latest = currentUser.orders[0];
        const latestItems = latest.items
          .map((i) => `${i.product.name} (x${i.quantity})`)
          .join(", ");
        const latestDate = latest.createdAt.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        orderSnippet = `\n📦 **Pesanan Terakhir Anda:**
• No. Pesanan: **#${latest.orderNumber}**
• Status: **${latest.status}** (${latest.paymentStatus})
• Menu: ${latestItems}
• Total: **${formatRupiah(latest.total)}** (${latestDate})`;
      }

      return `Halo kak **${currentUser.name}**! 👋

Saya mengenali Anda berdasarkan akun yang terdaftar di database sistem Ojolali:
• **Nama Terdaftar**: **${currentUser.name}**
• **Nomor WhatsApp**: ${userPhone}
• **Email Akun**: ${currentUser.email}
• **Peran Akun**: ${roleLabel}
• **Terdaftar Sejak**: ${joinDate}
• **Total Pesanan**: ${totalUserOrders} pesanan tercatat
${orderSnippet}

Ada yang bisa Oji bantu lagi hari ini, kak **${currentUser.name}**? 😊`;
    } else {
      return `Halo! Saat ini Anda terdeteksi mengakses sistem sebagai **Tamu / Pengunjung** (belum masuk ke akun terdaftar).

Agar saya dapat mengenali nama Anda sesuai data akun yang Anda daftarkan dan menampilkan riwayat pesanan pribadi Anda:
1. Silakan masuk melalui halaman **[Masuk ke Akun / Login](/login)**.
2. Atau jika belum memiliki akun, silakan buat akun di **[Daftar Akun Baru](/register)**.

Setelah masuk, silakan tanyakan kembali *"siapa saya"* dan saya akan langsung memanggil nama akun Anda! 😊`;
    }
  }

  // ==========================================
  // 2. CEK NOMOR PESANAN SPESIFIK (Misal: ORD-20261008-001)
  // ==========================================
  const orderNumberMatch = query.match(/ORD-[\w-]+/i);
  if (orderNumberMatch) {
    const orderNumber = orderNumberMatch[0].toUpperCase();
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!order) {
      return `Pesanan dengan nomor **${orderNumber}** tidak ditemukan dalam database sistem. Mohon periksa kembali nomor pesanan Anda.`;
    }

    const itemsStr = order.items
      .map((item) => `• ${item.product.name} x${item.quantity} (${formatRupiah(item.subtotal)})`)
      .join("\n");

    const dateStr = order.createdAt.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return `Informasi Pesanan **#${order.orderNumber}**:
• Pelanggan: **${order.customerName}**${order.customerPhone ? ` (${formatPhone(order.customerPhone)})` : ""}
• Status Pesanan: **${order.status}**
• Status Pembayaran: **${order.paymentStatus}** (${order.paymentMethod})
• Total Pembayaran: **${formatRupiah(order.total)}**
• Waktu Transaksi: ${dateStr}
• Rincian Item:
${itemsStr}${order.notes ? `\n• Catatan: ${order.notes}` : ""}`;
  }

  // ==========================================
  // 3. AMBIL DATA MASTER RESTORAN SECARA REAL-TIME
  // ==========================================
  const [products, categories, settings, totalOrdersCount] = await Promise.all([
    prisma.product.findMany({
      include: { category: true },
      orderBy: [{ categoryId: "asc" }, { price: "asc" }],
    }),
    prisma.category.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.setting.findMany(),
    prisma.order.count(),
  ]);

  const settingsMap: Record<string, string> = {};
  for (const s of settings) {
    settingsMap[s.key] = s.value;
  }

  const rawPhone = settingsMap["whatsapp_admin_number"] || "6289682519919";
  const formattedPhone = formatPhone(rawPhone);

  // ==========================================
  // 4. IDENTITAS AI / BOT ("SIAPA KAMU / KAMU SIAPA / TENTANG OJI")
  // ==========================================
  if (
    /^(siapa\s+(kamu|anda|dirimu|namamu)|kamu\s+siapa|anda\s+siapa|namamu\s+siapa|nama\s+kamu|perkenalkan\s+diri|apa\s+namamu|bot\s+apa\s+ini|siapa\s+oji)$/i.test(lower) ||
    lower === "siapa kamu" ||
    lower === "kamu siapa" ||
    lower === "siapa oji"
  ) {
    return `Saya **Oji**, asisten AI cerdas resmi dari **Baso & Mie Ayam Ojolali**! 🍜

Saya terhubung langsung ke seluruh database sistem untuk membantu Anda:
• **Profil Akun**: Cek nama dan detail akun terdaftar Anda *(coba ketik 'siapa saya')*
• **Menu & Harga**: Cek ketersediaan stok, harga, dan komposisi menu
• **Rekomendasi**: Menyarankan menu terlaris dan rekomendasi sesuai budget Anda
• **Cek Pesanan**: Melacak status pesanan Anda secara real-time
• **Statistik Warung**: Mengetahui total penjualan, omzet, dan menu favorit
• **Informasi Warung**: Jam buka, alamat, kontak WhatsApp, dan metode pembayaran.

Ada yang ingin Anda tanyakan atau pesan hari ini? 😊`;
  }

  // ==========================================
  // 5. ARTI NAMA OJOLALI
  // ==========================================
  if (/(kenapa\s+namanya\s+ojolali|arti\s+ojolali|makna\s+ojolali|apa\s+itu\s+ojolali|artinya\s+ojolali)/i.test(lower)) {
    return `Nama **Ojolali** berasal dari bahasa Jawa: **"Ojo"** (Jangan) dan **"Lali"** (Lupa), yang berarti **"Jangan Lupa"**! 

Filosofinya adalah agar siapapun yang sudah mencicipi kenikmatan racikan Baso Sapi asli dan Mie Ayam kenyal khas kami selalu rindu dan **tidak pernah lupa** untuk mampir kembali ke warung kami! 🍜❤️`;
  }

  // ==========================================
  // 6. DATABASE USER / PELANGGAN / ADMIN / KASIR
  // ==========================================
  if (
    /(siapa\s+saja\s+yang\s+daftar|daftar\s+(user|pengguna|pelanggan|customer)|berapa\s+(user|pengguna|pelanggan|customer)|siapa\s+admin|siapa\s+kasir|siapa\s+pemilik|pegawai\s+warung|data\s+pelanggan)/i.test(lower)
  ) {
    const [totalUsers, totalCustomers, admins, cashiers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.user.findMany({ where: { role: "ADMIN" }, select: { name: true, phone: true } }),
      prisma.user.findMany({ where: { role: "CASHIER" }, select: { name: true, phone: true } }),
    ]);

    const adminList = admins.map((a) => `• Admin: **${a.name}** (${a.phone ? formatPhone(a.phone) : "-"})`).join("\n");
    const cashierList = cashiers.map((c) => `• Kasir: **${c.name}** (${c.phone ? formatPhone(c.phone) : "-"})`).join("\n");

    return `Informasi Akun & Pengguna di Database Ojolali:
• Total Akun Terdaftar: **${totalUsers} akun**
• Total Pelanggan: **${totalCustomers} pelanggan**
${adminList ? `${adminList}\n` : ""}${cashierList ? `${cashierList}\n` : ""}
Semua akun pelanggan terintegrasi dengan riwayat transaksi dan poin pemesanan di web Ojolali.`;
  }

  // ==========================================
  // 6B. PELANGGAN TERLOYAL / TOP CUSTOMERS (KHUSUS ADMIN/MANAJEMEN)
  // ==========================================
  if (
    /(pelanggan|customer|pembeli)/i.test(lower) && /(loyal|terloyal|setia|terbanyak|paling\s+banyak|sering|top|terbaik)/i.test(lower) ||
    /(top\s+customer|loyal\s+customer|siapa\s+.*(paling\s+banyak\s+belanja|sering\s+beli))/i.test(lower)
  ) {
    const loyalCustomers = await prisma.order.groupBy({
      by: ["customerName", "customerPhone"],
      where: { status: "COMPLETED" },
      _sum: { total: true },
      _count: { id: true },
      orderBy: [{ _sum: { total: "desc" } }, { _count: { id: "desc" } }],
      take: 5,
    });

    if (loyalCustomers.length === 0) {
      return "Belum ada riwayat pesanan selesai untuk menganalisis pelanggan terloyal.";
    }

    const list = loyalCustomers
      .map((c, idx) => {
        const phone = c.customerPhone ? formatPhone(c.customerPhone) : "Tanpa No. HP";
        const totalSpent = formatRupiah(c._sum.total || 0);
        const count = c._count.id;
        return `${idx + 1}. **${c.customerName}** (${phone})\n   • Total Belanja: **${totalSpent}** (${count}x transaksi selesai)`;
      })
      .join("\n\n");

    return `🏆 **Daftar Pelanggan Paling Loyal & Terbanyak Belanja:**\n\n${list}\n\n💡 *Tips Admin: Berikan diskon khusus atau reward apresiasi kepada pelanggan ini untuk menjaga retensi!*`;
  }

  // ==========================================
  // 6C. STATUS ANTREAN OPERASIONAL & PESANAN PENDING (KHUSUS ADMIN/DAPUR)
  // ==========================================
  if (
    /(pesanan\s+(pending|diproses|antrean|belum\s+selesai|perlu\s+diproses)|status\s+antrean|antrean\s+dapur|antrean\s+kasir)/i.test(lower)
  ) {
    const [pendingCount, processingCount, readyCount, uncompletedList] = await Promise.all([
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: "PROCESSING" } }),
      prisma.order.count({ where: { status: "READY" } }),
      prisma.order.findMany({
        where: { status: { in: ["PENDING", "PROCESSING", "READY"] } },
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: "asc" },
        take: 5,
      }),
    ]);

    const list = uncompletedList
      .map((o) => {
        const items = o.items.map((i) => `${i.product.name} (x${i.quantity})`).join(", ");
        return `• **#${o.orderNumber}** [${o.status}] — **${o.customerName}** (${formatRupiah(o.total)})\n  Item: ${items}`;
      })
      .join("\n");

    return `⏳ **Status Antrean Operasional Warung Ojolali:**
• **Menunggu Konfirmasi (PENDING)**: **${pendingCount} pesanan**
• **Sedang Dimasak (PROCESSING)**: **${processingCount} pesanan**
• **Siap Diambil/Diantar (READY)**: **${readyCount} pesanan**

${uncompletedList.length > 0 ? `Daftar antrean tertua yang perlu segera diselesaikan:\n${list}` : "✅ Semua pesanan saat ini sudah selesai diproses (tidak ada antrean pending)!"}`;
  }

  // ==========================================
  // 6D. CEK STOK / PRODUK HABIS (KHUSUS ADMIN)
  // ==========================================
  if (
    /(produk\s+habis|menu\s+habis|stok\s+kosong|produk\s+tidak\s+tersedia|ada\s+yang\s+habis|cek\s+stok|stok\s+habis|stok\s+produk)/i.test(lower)
  ) {
    const outOfStock = products.filter((p) => !p.available);
    if (outOfStock.length === 0) {
      return `✅ **Semua Menu Tersedia!**\n\nSeluruh ${products.length} menu makanan dan minuman di sistem saat ini berstatus **TERSEDIA** dan siap dipesan. Tidak ada menu yang stoknya habis.`;
    }

    const list = outOfStock.map((p) => `• **${p.name}** (${p.category.name}) — ${formatRupiah(p.price)}`).join("\n");
    return `⚠️ **Daftar Produk yang Sedang Habis / Tidak Tersedia:**\n\n${list}\n\n💡 *Silakan perbarui ketersediaan menu di halaman 'Kelola Produk' jika bahan baku sudah siap!*`;
  }

  // ==========================================
  // 6E. LOG WHATSAPP & STATUS NOTIFIKASI
  // ==========================================
  if (
    /(log\s+whatsapp|status\s+whatsapp|notifikasi\s+whatsapp|pesan\s+wa|wa\s+gateway|fonnte|notifikasi\s+terkirim)/i.test(lower)
  ) {
    const [totalLogs, sentLogs, failedLogs, recentLogs] = await Promise.all([
      prisma.notificationLog.count(),
      prisma.notificationLog.count({ where: { status: "SENT" } }),
      prisma.notificationLog.count({ where: { status: "FAILED" } }),
      prisma.notificationLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const list = recentLogs
      .map((l) => {
        const dStr = l.createdAt.toLocaleDateString("id-ID", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });
        return `• [${l.status}] ke ${formatPhone(l.recipientPhone)} (${l.type}) — ${dStr}`;
      })
      .join("\n");

    return `📱 **Status Log Notifikasi WhatsApp Warung:**
• Total Notifikasi Tercatat: **${totalLogs} pesan**
• Berhasil Terkirim: **${sentLogs} pesan**
• Gagal / Kendala: **${failedLogs} pesan**

Log notifikasi terakhir:
${list || "Belum ada riwayat pengiriman notifikasi WhatsApp."}`;
  }

  // ==========================================
  // 6F. ANALISIS BISNIS & INSIGHT STRATEGIS ADMIN
  // ==========================================
  if (
    /(analisis\s+bisnis|rekomendasi\s+admin|saran\s+bisnis|insight\s+penjualan|strategi\s+penjualan|performa\s+warung|evaluasi)/i.test(lower)
  ) {
    const [completedOrders, totalOmzetData] = await Promise.all([
      prisma.order.count({ where: { status: "COMPLETED" } }),
      prisma.order.aggregate({ where: { status: "COMPLETED" }, _sum: { total: true } }),
    ]);
    const omzet = totalOmzetData._sum.total || 0;
    const aov = completedOrders > 0 ? Math.round(omzet / completedOrders) : 0;

    return `📈 **Analisis Bisnis & Rekomendasi Strategis untuk Admin:**

• **Total Omzet Bersih**: **${formatRupiah(omzet)}** dari ${completedOrders} transaksi berhasil.
• **Average Order Value (Rata-rata Belanja)**: **${formatRupiah(aov)}** per transaksi.

💡 **3 Rekomendasi Tindakan untuk Warung Ojolali:**
1. **Upselling Minuman & Ekstra**: Tawarkan ekstra Pangsit Goreng atau Es Teh Manis Jumbo di kasir karena margin keuntungannya tinggi.
2. **Pemberitahuan Otomatis**: Pastikan integrasi WhatsApp aktif agar pelanggan menerima update status pesanan seketika.
3. **Paket Promo Siang Hari**: Buat promo bundling di jam 11:30 - 14:00 WIB untuk memaksimalkan kapasitas meja makan di jam sibuk.`;
  }


  // ==========================================
  // 7. RIWAYAT PESANAN MILIK USER ("PESANAN SAYA / CEK ORDER SAYA")
  // ==========================================
  if (/(pesanan\s+saya|order\s+saya|status\s+pesanan|cek\s+pesanan|riwayat\s+pesanan|orderan\s+saya)/i.test(lower)) {
    if (currentUser) {
      const userOrders = await prisma.order.findMany({
        where: { userId: currentUser.id },
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      if (userOrders.length === 0) {
        return `Halo kak **${currentUser.name}**, akun Anda belum memiliki riwayat pesanan di sistem kami. Yuk pesan menu favorit Anda di halaman Menu! 🍜`;
      }

      const list = userOrders
        .map((o) => {
          const itemsStr = o.items.map((i) => `${i.product.name} (x${i.quantity})`).join(", ");
          const dStr = o.createdAt.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          return `• **#${o.orderNumber}** — ${formatRupiah(o.total)}\n  Status: **${o.status}** | Pembayaran: **${o.paymentStatus}** (${o.paymentMethod})\n  Item: ${itemsStr}\n  Waktu: ${dStr}`;
        })
        .join("\n\n");

      return `Riwayat pesanan atas nama kak **${currentUser.name}**:\n\n${list}\n\nKetik nomor pesanan (contoh: #${userOrders[0].orderNumber}) untuk melihat detail lengkap.`;
    } else {
      return "Untuk mengecek riwayat pesanan pribadi Anda, silakan **[Masuk ke Akun Anda](/login)**. Jika Anda memiliki nomor pesanan resmi, Anda juga bisa langsung mengetikkannya di sini (contoh: `ORD-20261008-001`).";
    }
  }

  // ==========================================
  // 8. SALAM / GREETING
  // ==========================================
  if (/^(halo|hai|hey|hei|assalamu['a]?laikum|pagi|selamat\s+(pagi|siang|sore|malam))$/i.test(lower)) {
    const sapaan = currentUser ? `kak **${currentUser.name}**` : "kak";
    return `Halo ${sapaan}! Selamat datang di Baso & Mie Ayam Ojolali 🍜\n\nAda yang bisa Oji bantu hari ini? Anda bisa tanya seputar menu, rekomendasi makanan, cek pesanan, atau profil akun Anda!`;
  }

  // ==========================================
  // 9. UCAPAN TERIMA KASIH & APRESIASI
  // ==========================================
  if (/\b(terima\s*kasih|makasih|thanks|thank\s*you|matur\s*nuwun|mantap|keren|enak|sip|oke|siap)\b/i.test(lower) && lower.split(" ").length <= 3 && !/(siapa|apa|berapa|mana|kapan|kenapa)/i.test(lower)) {
    const sapaan = currentUser ? `kak **${currentUser.name}**` : "kak";
    return `Sama-sama ${sapaan}! Senang bisa membantu Anda. Jika butuh informasi lain atau mau pesan menu lezat Ojolali, jangan ragu untuk tanya ke Oji ya! Selamat menikmati hari Anda! 🍜😊`;
  }

  // ==========================================
  // 10. JAM BUKA & OPERASIONAL
  // ==========================================
  if (
    /(jam\s+(buka|tutup|operasional)|buka\s+jam\s+berapa|kapan\s+buka|kapan\s+tutup|hari\s+apa\s+(saja\s+)?buka|jadwal\s+buka|buka\s+(hari\s+)?(senin|selasa|rabu|kamis|jumat|sabtu|minggu|weekend)|libur)/i.test(lower)
  ) {
    return "Warung Baso & Mie Ayam Ojolali buka **setiap hari** (termasuk hari Minggu dan hari libur nasional) mulai pukul **10:00 - 21:00 WIB**.";
  }

  // ==========================================
  // 11. ALAMAT & LOKASI
  // ==========================================
  if (
    /(lokasi|alamat|dimana\s+(lokasi|warung|alamat)|di\s+mana\s+(lokasi|warung|alamat)|tempat\s+warung|posisi\s+warung|patokan)/i.test(lower)
  ) {
    return "📍 **Alamat Warung Ojolali**:\nJl. Raya Lingkungan Kecamatan No. 45 (Sangat dekat dengan Kantor Camat).\nWarung kami menyediakan area makan yang nyaman, bersih, dan parkir luas!";
  }

  // ==========================================
  // 12. KONTAK WHATSAPP & CUSTOMER SERVICE
  // ==========================================
  if (
    /(nomor\s+(telepon|telp|hp|wa|whatsapp)|kontak|hubungi|no\s+wa|customer\s+service|admin\s+wa)/i.test(lower)
  ) {
    return `Kontak WhatsApp resmi warung Ojolali: **${formattedPhone}** (Layanan Pemesanan, Bantuan, & Konfirmasi Pembayaran).`;
  }

  // ==========================================
  // 13. METODE PEMBAYARAN
  // ==========================================
  if (
    /(metode\s+pembayaran|cara\s+bayar|bisa\s+bayar\s+pakai|bayar\s+pake\s+apa|bisa\s+qris|bisa\s+transfer|bisa\s+cash|bisa\s+tunai|pembayaran\s+apa\s+saja|info\s+pembayaran)/i.test(lower)
  ) {
    return `Metode pembayaran yang didukung di Baso & Mie Ayam Ojolali:
1. **QRIS**: Scan cepat dengan GoPay, OVO, DANA, ShopeePay, BCA, Mandiri, dan semua aplikasi perbankan digital.
2. **Tunai (Cash)**: Pembayaran langsung di kasir warung.
3. **Transfer Bank**: Pembayaran via transfer antar bank resmi.`;
  }

  // ==========================================
  // 14. DINE IN & TAKE AWAY
  // ==========================================
  if (
    /(dine\s*in|take\s*away|makan\s+di\s+tempat|bawa\s+pulang|dibungkus|bungkus)/i.test(lower)
  ) {
    return "Warung Baso & Mie Ayam Ojolali melayani **Makan di Tempat (Dine In)** dengan suasana nyaman dan **Bungkus Bawa Pulang (Take Away)** dengan kemasan higienis tahan panas.";
  }

  // ==========================================
  // 15. KEHALALAN & BAHAN DAGING
  // ==========================================
  if (
    /(halal|daging\s+apa|daging\s+sapi|bahan\s+dasar|sapi\s+asli|apakah\s+halal)/i.test(lower)
  ) {
    return "Semua menu di Baso & Mie Ayam Ojolali dijamin **100% Halal**, dibuat menggunakan daging sapi lokal segar pilihan kualitas terbaik, mie telur buatan sendiri, dan kuah kaldu rempah alami tanpa bahan pengawet berbahaya.";
  }

  // ==========================================
  // 16. CARA PEMESANAN DI WEBSITE
  // ==========================================
  if (
    /(cara\s+(pesan|order|beli|checkout|pemesanan)|gimana\s+cara\s+(pesan|order|beli)|bagaimana\s+cara\s+(pesan|order|beli))/i.test(lower)
  ) {
    return `Panduan Pemesanan di Website Ojolali:
1. Masuk ke halaman **Menu Makanan**.
2. Pilih menu baso, mie ayam, atau minuman lalu klik **"+ Keranjang"**.
3. Buka halaman **Keranjang Belanja**.
4. Isi data pemesan dan pilih metode pembayaran (QRIS, Tunai, atau Transfer).
5. Klik **"Konfirmasi Pesanan"** untuk mendapatkan nomor resmi dan status pesanan langsung diproses!`;
  }

  // ==========================================
  // 17. MENU TERLARIS / BEST SELLER / PALING DIMINATI
  // ==========================================
  if (
    /(terlaris|paling\s+(laris|laku|banyak\s+dipesan|diminati)|produk\s+(yg\s+|yang\s+)?(terlaris|laris)|menu\s+(yg\s+|yang\s+)?(terlaris|laris)|best\s*seller|favorit)/i.test(lower) ||
    lower.includes("terlaris") ||
    lower.includes("paling laris") ||
    lower.includes("paling diminati")
  ) {
    const popularItems = await prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    });

    if (popularItems.length === 0) {
      return "Belum ada data transaksi tercatat di sistem.";
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    const list = popularItems
      .map((item, idx) => {
        const prod = productMap.get(item.productId);
        const name = prod?.name || "Produk";
        const price = prod ? formatRupiah(prod.price) : "";
        const qty = item._sum.quantity || 0;
        return `${idx + 1}. **${name}** (${price}) — Terjual **${qty} porsi** 🔥`;
      })
      .join("\n");

    return `🔥 **Daftar Menu Terlaris di Ojolali:**\n\n${list}\n\nMenu-menu ini adalah favorit para pelanggan setia kami!`;
  }

  // ==========================================
  // 18. REKOMENDASI & SARAN MAKANAN
  // ==========================================
  if (
    /(rekomendasi|rekomendasikan|saran\s+menu|sarankan|makan\s+apa\s+ya|mau\s+makan|bingung\s+mau\s+makan|paket\s+hemat)/i.test(lower) &&
    !/(budget|uang|dana)/i.test(lower)
  ) {
    return `💡 **Rekomendasi Menu Favorit Pilihan Oji:**

1. **Paket Puas Komplit**:
   • **Baso Komplit** (${formatRupiah(25000)}) + **Es Teh Manis Jumbo** (${formatRupiah(5000)})
   → *Kombinasi baso urat jumbo, baso telur, tetelan melimpah dengan es teh segar.*

2. **Paket Gurih Mantap**:
   • **Mie Ayam Baso** (${formatRupiah(20000)}) + **Pangsit Goreng Renyah** (${formatRupiah(5000)})
   → *Mie kenyal ayam manis gurih dilengkapi 2 butir baso halus dan pangsit renyah.*

3. **Paket Segar Spesial**:
   • **Baso Spesial** (${formatRupiah(20000)}) + **Es Jeruk Peras Segar** (${formatRupiah(7000)})
   → *Baso urat gurih + tetelan berpadu dengan perasan jeruk asli.*

Semua menu siap disajikan hangat! Mau pesan yang mana kak? 😊`;
  }

  // ==========================================
  // 19. TOTAL PESANAN, PENJUALAN & STATISTIK WARUNG
  // ==========================================
  if (
    /(penjualan|omzet|omset|pendapatan|total\s+pesanan|jumlah\s+pesanan|berapa\s+pesanan|ada\s+berapa\s+pesanan|total\s+omzet|total\s+pendapatan|statistik|laporan\s+penjualan|pesanan\s+hari\s+ini|berapa\s+penjualan|ada\s+berapa\s+penjualan)/i.test(lower)
  ) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [completedOrders, todayOrders, totalUsersCount] = await Promise.all([
      prisma.order.aggregate({
        where: { status: "COMPLETED" },
        _sum: { total: true },
        _count: { id: true },
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: startOfToday } },
        _sum: { total: true },
        _count: { id: true },
      }),
      prisma.user.count(),
    ]);

    const rev = completedOrders._sum.total || 0;
    const todayRev = todayOrders._sum.total || 0;

    return `📊 **Data Statistik Sistem Ojolali (Real-Time):**
• **Total Pesanan Tercatat**: ${totalOrdersCount} pesanan
• **Pesanan Hari Ini**: ${todayOrders._count.id} pesanan (${formatRupiah(todayRev)})
• **Pesanan Selesai (Completed)**: ${completedOrders._count.id} pesanan
• **Total Pendapatan Terkonfirmasi**: **${formatRupiah(rev)}**
• **Katalog Produk**: ${products.length} menu (${products.filter((p) => p.available).length} tersedia)
• **Total Pengguna Terdaftar**: ${totalUsersCount} akun`;
  }

  // ==========================================
  // 20. CEK BUDGET (Misal: "budget 20 ribu", "uang 15k", "punya dana 25000")
  // ==========================================
  const budgetKMatch = lower.match(/(\d+)\s*(?:rb|ribu|k)\b/i);
  const budgetFullMatch = lower.match(/(?:rp\.?|budget|dana|uang)?\s*(\d{1,3}(?:\.\d{3})+|\d{4,6})/i);
  const isBudgetContext = /(budget|uang|dana|modal|kantong|hemat)/i.test(lower);

  if ((budgetKMatch || (budgetFullMatch && isBudgetContext)) && /(budget|uang|dana|makan\s+apa|dapat\s+apa|bisa\s+beli\s+apa)/i.test(lower)) {
    let budgetAmount = 0;
    if (budgetKMatch) {
      budgetAmount = parseInt(budgetKMatch[1], 10) * 1000;
    } else if (budgetFullMatch) {
      budgetAmount = parseInt(budgetFullMatch[1].replace(/\./g, ""), 10);
    }

    if (budgetAmount > 0) {
      const affordable = products.filter((p) => p.available && p.price <= budgetAmount);
      if (affordable.length === 0) {
        const cheapest = products.filter((p) => p.available).sort((a, b) => a.price - b.price)[0];
        return `Dengan budget **${formatRupiah(budgetAmount)}**, belum ada menu makanan utama yang mencukupi. Menu termurah yang tersedia adalah **${cheapest?.name}** seharga **${formatRupiah(cheapest?.price || 0)}**.`;
      }

      const list = affordable.map((p) => `• **${p.name}** — ${formatRupiah(p.price)} (${p.category.name})`).join("\n");
      return `Pilihan menu yang pas dengan budget **${formatRupiah(budgetAmount)}**:\n\n${list}\n\nSemua menu di atas tersedia dan siap dipesan!`;
    }
  }

  // ==========================================
  // 21. MENU TERMURAH & TERMAHAL
  // ==========================================
  if (/(paling\s+murah|termurah|harga\s+terendah)/i.test(lower)) {
    const sorted = [...products].filter((p) => p.available).sort((a, b) => a.price - b.price);
    const minPrice = sorted[0]?.price;
    const cheapestItems = sorted.filter((p) => p.price === minPrice);
    return `Menu paling terjangkau saat ini (**${formatRupiah(minPrice || 0)}**):
${cheapestItems.map((p) => `• **${p.name}** (${p.category.name})`).join("\n")}`;
  }

  if (/(paling\s+mahal|termahal|harga\s+tertinggi)/i.test(lower)) {
    const sorted = [...products].filter((p) => p.available).sort((a, b) => b.price - a.price);
    const maxPrice = sorted[0]?.price;
    const expensiveItems = sorted.filter((p) => p.price === maxPrice);
    return `Menu paling komplit & istimewa saat ini (**${formatRupiah(maxPrice || 0)}**):
${expensiveItems.map((p) => `• **${p.name}** (${p.category.name}) — Porsi jumbo paling puas!`).join("\n")}`;
  }

  // ==========================================
  // 22. PENCARIAN PRODUK SPESIFIK (Harga, Stok, Isi/Deskripsi)
  // ==========================================
  const productMatches = products.filter((p) => {
    const pName = normalize(p.name);
    if (lower.includes(pName)) return true;

    // Cek alias nama menu
    if (pName.includes("es teh") && lower.includes("es teh")) return true;
    if (pName.includes("es jeruk") && lower.includes("es jeruk")) return true;
    if (pName.includes("pangsit") && lower.includes("pangsit")) return true;
    if (pName.includes("mie ayam baso") && lower.includes("mie ayam baso")) return true;
    if (pName.includes("mie ayam original") && (lower.includes("mie ayam original") || lower.includes("mie ayam ori") || lower.includes("mie ayam biasa"))) return true;
    if (pName.includes("mie ayam spesial") && lower.includes("mie ayam spesial")) return true;
    if (pName.includes("baso biasa") && lower.includes("baso biasa")) return true;
    if (pName.includes("baso spesial") && lower.includes("baso spesial")) return true;
    if (pName.includes("baso komplit") && lower.includes("baso komplit")) return true;

    // Cek bahan spesifik (tetelan, ceker, telur, urat)
    if (lower.includes("tetelan") && (p.description || "").toLowerCase().includes("tetelan")) return true;
    if (lower.includes("ceker") && (p.description || "").toLowerCase().includes("ceker")) return true;
    if (lower.includes("telur") && (p.description || "").toLowerCase().includes("telur")) return true;
    if (lower.includes("urat") && (p.description || "").toLowerCase().includes("urat")) return true;

    return false;
  });

  if (productMatches.length > 0) {
    if (/(berapa\s+harga|harganya\s+berapa|harga|biaya|tarif|bayar)/i.test(lower)) {
      return productMatches
        .map((p) => `Harga **${p.name}** adalah **${formatRupiah(p.price)}** (Status: **${p.available ? "Tersedia" : "Habis"}**).`)
        .join("\n");
    }

    if (/(isi(nya)?|komposisi|deskripsi|apa\s+saja\s+isinya|porsi|terdiri\s+dari|resep)/i.test(lower)) {
      return productMatches
        .map((p) => `**${p.name}** (${formatRupiah(p.price)}):\n${p.description || "Dibuat dengan bahan baku segar pilihan khas resep Ojolali."}`)
        .join("\n\n");
    }

    if (/(ada|tersedia|ready|habis|stok)/i.test(lower)) {
      return productMatches
        .map((p) => `**${p.name}** saat ini **${p.available ? "Tersedia & Siap Dipesan" : "Sedang Habis"}** dengan harga **${formatRupiah(p.price)}**.`)
        .join("\n");
    }

    return productMatches
      .map((p) => `**${p.name}** — **${formatRupiah(p.price)}**\n• Kategori: ${p.category.name}\n• Status: ${p.available ? "Tersedia" : "Habis"}\n• Deskripsi: ${p.description || "Menu lezat khas Ojolali."}`)
      .join("\n\n");
  }

  // ==========================================
  // 23. KATEGORI MENU SPESIFIK
  // ==========================================
  const isBasoCategory = /(baso|bakso)/i.test(lower);
  const isMieAyamCategory = /(mie\s*ayam)/i.test(lower);
  const isMinumanCategory = /(minum|minuman|ekstra)/i.test(lower);
  const isMakananGeneral = /(menu\s+makanan|makanan\s+apa)/i.test(lower);

  if (isMieAyamCategory) {
    const cat = categories.find((c) => c.slug.includes("mie-ayam") || c.name.toLowerCase().includes("mie ayam"));
    const catProds = products.filter((p) => p.categoryId === cat?.id);
    if (catProds.length > 0) {
      const list = catProds
        .map((p) => `• **${p.name}** — ${formatRupiah(p.price)} (${p.available ? "Tersedia" : "Habis"})`)
        .join("\n");
      return `🍜 **Daftar Menu Mie Ayam Ojolali:**\n\n${list}\n\nMie kenyal racikan sendiri dengan topping ayam kecap gurih manis melimpah!`;
    }
  }

  if (isBasoCategory) {
    const cat = categories.find((c) => c.slug.includes("baso") || c.name.toLowerCase().includes("baso"));
    const catProds = products.filter((p) => p.categoryId === cat?.id);
    if (catProds.length > 0) {
      const list = catProds
        .map((p) => `• **${p.name}** — ${formatRupiah(p.price)} (${p.available ? "Tersedia" : "Habis"})`)
        .join("\n");
      return `🥣 **Daftar Menu Baso Sapi Asli Ojolali:**\n\n${list}\n\n100% daging sapi asli dengan kuah kaldu rempah hangat gurih!`;
    }
  }

  if (isMinumanCategory) {
    const cat = categories.find((c) => c.slug.includes("minuman") || c.name.toLowerCase().includes("minum"));
    const catProds = products.filter((p) => p.categoryId === cat?.id);
    if (catProds.length > 0) {
      const list = catProds
        .map((p) => `• **${p.name}** — ${formatRupiah(p.price)} (${p.available ? "Tersedia" : "Habis"})`)
        .join("\n");
      return `🥤 **Daftar Minuman & Ekstra Pelengkap:**\n\n${list}`;
    }
  }

  if (isMakananGeneral) {
    const foodProds = products.filter((p) => !p.category.slug.includes("minuman"));
    const list = foodProds
      .map((p) => `• **${p.name}** — ${formatRupiah(p.price)} (${p.available ? "Tersedia" : "Habis"})`)
      .join("\n");
    return `🍜 **Daftar Menu Makanan Ojolali:**\n\n${list}`;
  }

  // ==========================================
  // 24. SEMUA MENU / KATALOG LENGKAP
  // ==========================================
  if (
    /(daftar\s+menu|semua\s+menu|ada\s+menu\s+apa|menu\s+apa\s+saja|lihat\s+menu|katalog|minta\s+menu|list\s+menu|daftar\s+harga|price\s*list|tampilkan\s+semua\s+menu)/i.test(lower) ||
    lower === "menu"
  ) {
    const lines: string[] = ["📋 **Katalog Lengkap Baso & Mie Ayam Ojolali:**"];
    for (const cat of categories) {
      const catProds = products.filter((p) => p.categoryId === cat.id);
      if (catProds.length > 0) {
        lines.push(`\n**${cat.name}:**`);
        for (const p of catProds) {
          lines.push(`• **${p.name}** — ${formatRupiah(p.price)} (${p.available ? "Tersedia" : "Habis"})`);
        }
      }
    }
    return lines.join("\n");
  }

  // ==========================================
  // 25. PENCARIAN DATABASE FLEKSIBEL (UNIVERSAL SMART SEARCH)
  // ==========================================
  // Cari apakah ada kata kunci yang cocok di nama produk atau deskripsi produk
  const queryTokens = lower.split(" ").filter((t) => t.length >= 3);
  const matchedAnyProduct = products.filter((p) => {
    const combined = `${p.name} ${p.description || ""} ${p.category.name}`.toLowerCase();
    return queryTokens.some((t) => combined.includes(t));
  });

  if (matchedAnyProduct.length > 0) {
    const results = matchedAnyProduct
      .slice(0, 4)
      .map((p) => `• **${p.name}** (${formatRupiah(p.price)}) — ${p.available ? "Tersedia" : "Habis"}\n  ${p.description || "Menu lezat khas Ojolali."}`)
      .join("\n\n");

    return `Berikut menu yang berkaitan dengan pencarian Anda:\n\n${results}\n\nIngin memesan atau melihat menu lainnya? Silakan tanyakan ya!`;
  }

  // Respon ramah dan cerdas jika tidak ada kata kunci yang spesifik
  const userGreeting = currentUser ? `kak **${currentUser.name}**` : "kak";
  return `Halo ${userGreeting}! Saya **Oji**, asisten virtual Baso & Mie Ayam Ojolali yang terhubung langsung ke database sistem.

Saya dapat membantu menjawab:
• **Profil & Akun**: Ketik *"siapa saya"* untuk melihat data akun terdaftar Anda
• **Menu & Harga**: Ketik *"tampilkan semua menu"* atau nama menu seperti *"harga baso komplit"*
• **Rekomendasi**: Ketik *"menu terlaris"* atau *"budget 20 ribu dapat apa"*
• **Pesanan Anda**: Ketik *"pesanan saya"* atau masukkan nomor pesanan Anda
• **Informasi Warung**: Alamat lokasi, jam operasional, dan nomor WhatsApp resmi
• **Statistik Warung**: Ketik *"statistik"* untuk melihat data penjualan

Ada yang bisa Oji bantu jelaskan lebih lanjut? 😊`;
}
