import { prisma } from "../prisma";
import { formatRupiah, formatDate } from "../utils";
import { getSession } from "../auth";
import { getAiConfig, executeAiQuery } from "./ai-config";

// Interface for complete database snapshot
export interface FullDatabaseSnapshot {
  timestamp: string;
  totals: {
    users: number;
    customers: number;
    admins: number;
    cashiers: number;
    categories: number;
    products: number;
    availableProducts: number;
    outOfStockProducts: number;
    orders: number;
    completedOrders: number;
    pendingOrders: number;
    processingOrders: number;
    readyOrders: number;
    cancelledOrders: number;
    notificationLogs: number;
    sentNotifications: number;
    failedNotifications: number;
    settings: number;
    otpCodes: number;
  };
  financials: {
    totalRevenue: number;
    todayRevenue: number;
    weekRevenue: number;
    monthRevenue: number;
    averageOrderValue: number;
    todayOrdersCount: number;
    todayCompletedCount: number;
    todayPendingCount: number;
    pendingTotalRevenue: number;
    readyTotalRevenue: number;
    lastOrderDate: string | null;
    lastCompletedOrder: {
      orderNumber: string;
      customerName: string;
      total: number;
      date: string;
    } | null;
    paymentMethods: {
      cash: { count: number; total: number };
      qris: { count: number; total: number };
      transfer: { count: number; total: number };
    };
    paymentStatuses: {
      paid: number;
      pending: number;
      failed: number;
    };
  };
  products: {
    topSellers: Array<{ name: string; category: string; price: number; qty: number; revenue: number }>;
    slowSellers: Array<{ name: string; category: string; price: number; qty: number }>;
    outOfStock: Array<{ name: string; category: string; price: number }>;
    allList: Array<{ id: string; name: string; category: string; price: number; available: boolean; description: string | null }>;
  };
  customers: {
    topSpenders: Array<{ name: string; phone: string; count: number; total: number }>;
    recentUsers: Array<{ name: string; email: string; phone: string | null; role: string; createdAt: string }>;
    staff: Array<{ name: string; email: string; phone: string | null; role: string }>;
  };
  orders: {
    recent: Array<{
      orderNumber: string;
      customerName: string;
      customerPhone: string | null;
      total: number;
      status: string;
      paymentMethod: string;
      paymentStatus: string;
      notes: string | null;
      createdAt: string;
      rawDate: Date;
      items: Array<{ name: string; quantity: number; price: number; subtotal: number }>;
    }>;
    uncompleted: Array<{
      orderNumber: string;
      customerName: string;
      status: string;
      total: number;
      createdAt: string;
      items: string;
    }>;
    todayOrders: Array<{
      orderNumber: string;
      customerName: string;
      status: string;
      total: number;
      createdAt: string;
      items: string;
    }>;
  };
  notifications: {
    total: number;
    sent: number;
    failed: number;
    recent: Array<{ phone: string; type: string; status: string; date: string; error?: string | null }>;
  };
  settings: Record<string, string>;
}

function isSameCalendarDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// Fetch complete live data snapshot from all Prisma models
export async function getCompleteDatabaseSnapshot(): Promise<FullDatabaseSnapshot> {
  const now = new Date();

  // Date ranges
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Parallel database reads across all models
  const [
    users,
    categories,
    products,
    allOrders,
    orderItems,
    settings,
    notifications,
    otpCodesCount,
  ] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      include: { category: true },
      orderBy: [{ categoryId: "asc" }, { price: "asc" }],
    }),
    prisma.order.findMany({
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true, subtotal: true },
    }),
    prisma.setting.findMany(),
    prisma.notificationLog.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.otpCode.count(),
  ]);

  // Aggregate Users
  const admins = users.filter((u) => u.role === "ADMIN");
  const cashiers = users.filter((u) => u.role === "CASHIER");
  const customers = users.filter((u) => u.role === "CUSTOMER");

  // Aggregate Orders & Financials
  let totalRevenue = 0;
  let todayRevenue = 0;
  let weekRevenue = 0;
  let monthRevenue = 0;

  let completedOrders = 0;
  let pendingOrders = 0;
  let processingOrders = 0;
  let readyOrders = 0;
  let cancelledOrders = 0;

  let todayOrdersCount = 0;
  let todayCompletedCount = 0;
  let todayPendingCount = 0;
  let pendingTotalRevenue = 0;
  let readyTotalRevenue = 0;

  let lastOrderDate: string | null = null;
  let lastCompletedOrder: {
    orderNumber: string;
    customerName: string;
    total: number;
    date: string;
  } | null = null;

  const paymentMethods = {
    cash: { count: 0, total: 0 },
    qris: { count: 0, total: 0 },
    transfer: { count: 0, total: 0 },
  };

  const paymentStatuses = {
    paid: 0,
    pending: 0,
    failed: 0,
  };

  const todayOrdersList: Array<{
    orderNumber: string;
    customerName: string;
    status: string;
    total: number;
    createdAt: string;
    items: string;
  }> = [];

  for (const o of allOrders) {
    const orderTime = new Date(o.createdAt);
    if (!lastOrderDate) {
      lastOrderDate = formatDate(orderTime);
    }

    const isToday = isSameCalendarDay(orderTime, now) || orderTime >= startOfToday;
    if (isToday) {
      todayOrdersCount++;
      todayOrdersList.push({
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        status: o.status,
        total: o.total,
        createdAt: formatDate(orderTime),
        items: o.items.map((i) => `${i.product.name} (x${i.quantity})`).join(", "),
      });
    }

    // Status counts
    if (o.status === "COMPLETED") {
      completedOrders++;
      if (isToday) {
        todayCompletedCount++;
        todayRevenue += o.total;
      }
      if (!lastCompletedOrder) {
        lastCompletedOrder = {
          orderNumber: o.orderNumber,
          customerName: o.customerName,
          total: o.total,
          date: formatDate(orderTime),
        };
      }
    } else if (o.status === "PENDING") {
      pendingOrders++;
      pendingTotalRevenue += o.total;
      if (isToday) todayPendingCount++;
    } else if (o.status === "PROCESSING") {
      processingOrders++;
      pendingTotalRevenue += o.total;
    } else if (o.status === "READY") {
      readyOrders++;
      readyTotalRevenue += o.total;
    } else if (o.status === "CANCELLED" || o.status === "CANCELED") {
      cancelledOrders++;
    }

    // Payment status counts
    if (o.paymentStatus === "PAID") paymentStatuses.paid++;
    else if (o.paymentStatus === "PENDING") paymentStatuses.pending++;
    else if (o.paymentStatus === "FAILED") paymentStatuses.failed++;

    // Financials from COMPLETED orders
    if (o.status === "COMPLETED") {
      totalRevenue += o.total;

      if (orderTime >= sevenDaysAgo) {
        weekRevenue += o.total;
      }
      if (orderTime >= thirtyDaysAgo) {
        monthRevenue += o.total;
      }

      // Method breakdown
      const methodKey = o.paymentMethod.toLowerCase();
      if (methodKey.includes("cash") || methodKey.includes("tunai")) {
        paymentMethods.cash.count++;
        paymentMethods.cash.total += o.total;
      } else if (methodKey.includes("qris")) {
        paymentMethods.qris.count++;
        paymentMethods.qris.total += o.total;
      } else if (methodKey.includes("transfer")) {
        paymentMethods.transfer.count++;
        paymentMethods.transfer.total += o.total;
      }
    }
  }

  const averageOrderValue = completedOrders > 0 ? Math.round(totalRevenue / completedOrders) : 0;

  // Aggregate Product Performance
  const productMap = new Map(products.map((p) => [p.id, p]));
  const productSalesMap = new Map<string, { qty: number; revenue: number }>();
  for (const item of orderItems) {
    productSalesMap.set(item.productId, {
      qty: item._sum.quantity || 0,
      revenue: item._sum.subtotal || 0,
    });
  }

  const productStats = products.map((p) => {
    const s = productSalesMap.get(p.id) || { qty: 0, revenue: 0 };
    return {
      id: p.id,
      name: p.name,
      category: p.category.name,
      price: p.price,
      available: p.available,
      description: p.description,
      qty: s.qty,
      revenue: s.revenue,
    };
  });

  const sortedBySales = [...productStats].sort((a, b) => b.qty - a.qty);
  const topSellers = sortedBySales.slice(0, 5).map((p) => ({
    name: p.name,
    category: p.category,
    price: p.price,
    qty: p.qty,
    revenue: p.revenue,
  }));
  const slowSellers = sortedBySales
    .filter((p) => p.qty < 5)
    .slice(0, 5)
    .map((p) => ({
      name: p.name,
      category: p.category,
      price: p.price,
      qty: p.qty,
    }));
  const outOfStock = products
    .filter((p) => !p.available)
    .map((p) => ({
      name: p.name,
      category: p.category.name,
      price: p.price,
    }));

  // Top Customer spenders
  const customerMap = new Map<string, { name: string; phone: string; count: number; total: number }>();
  for (const o of allOrders) {
    if (o.status === "COMPLETED") {
      const key = `${o.customerName}-${o.customerPhone || ""}`.toLowerCase();
      const existing = customerMap.get(key);
      if (existing) {
        existing.count += 1;
        existing.total += o.total;
      } else {
        customerMap.set(key, {
          name: o.customerName,
          phone: o.customerPhone || "-",
          count: 1,
          total: o.total,
        });
      }
    }
  }

  const topSpenders = Array.from(customerMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Settings Map
  const settingsMap: Record<string, string> = {};
  for (const s of settings) {
    settingsMap[s.key] = s.value;
  }

  // Notifications (support both 'SENT' and 'Terkirim')
  const sentNotifications = notifications.filter((n) =>
    ["SENT", "TERKIRIM", "DELIVERED", "SUCCESS"].includes((n.status || "").toUpperCase())
  ).length;
  const failedNotifications = notifications.filter((n) =>
    ["FAILED", "GAGAL", "ERROR"].includes((n.status || "").toUpperCase())
  ).length;
  const recentNotifications = notifications.slice(0, 5).map((n) => ({
    phone: n.recipientPhone,
    type: n.type,
    status: n.status,
    date: formatDate(n.createdAt),
    error: n.errorMessage,
  }));

  // Recent & Uncompleted Orders
  const recentOrders = allOrders.slice(0, 10).map((o) => ({
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    total: o.total,
    status: o.status,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    notes: o.notes,
    createdAt: formatDate(o.createdAt),
    rawDate: new Date(o.createdAt),
    items: o.items.map((i) => ({
      name: i.product.name,
      quantity: i.quantity,
      price: i.price,
      subtotal: i.subtotal,
    })),
  }));

  const uncompletedOrders = allOrders
    .filter((o) => ["PENDING", "PROCESSING", "READY"].includes(o.status))
    .slice(0, 8)
    .map((o) => ({
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      status: o.status,
      total: o.total,
      createdAt: formatDate(o.createdAt),
      items: o.items.map((i) => `${i.product.name} (x${i.quantity})`).join(", "),
    }));

  return {
    timestamp: formatDate(now),
    totals: {
      users: users.length,
      customers: customers.length,
      admins: admins.length,
      cashiers: cashiers.length,
      categories: categories.length,
      products: products.length,
      availableProducts: products.filter((p) => p.available).length,
      outOfStockProducts: outOfStock.length,
      orders: allOrders.length,
      completedOrders,
      pendingOrders,
      processingOrders,
      readyOrders,
      cancelledOrders,
      notificationLogs: notifications.length,
      sentNotifications,
      failedNotifications,
      settings: settings.length,
      otpCodes: otpCodesCount,
    },
    financials: {
      totalRevenue,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      averageOrderValue,
      todayOrdersCount,
      todayCompletedCount,
      todayPendingCount,
      pendingTotalRevenue,
      readyTotalRevenue,
      lastOrderDate,
      lastCompletedOrder,
      paymentMethods,
      paymentStatuses,
    },
    products: {
      topSellers,
      slowSellers,
      outOfStock,
      allList: products.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category.name,
        price: p.price,
        available: p.available,
        description: p.description,
      })),
    },
    customers: {
      topSpenders,
      recentUsers: users.slice(0, 5).map((u) => ({
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        createdAt: formatDate(u.createdAt),
      })),
      staff: [...admins, ...cashiers].map((u) => ({
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
      })),
    },
    orders: {
      recent: recentOrders,
      uncompleted: uncompletedOrders,
      todayOrders: todayOrdersList,
    },
    notifications: {
      total: notifications.length,
      sent: sentNotifications,
      failed: failedNotifications,
      recent: recentNotifications,
    },
    settings: settingsMap,
  };
}

// Convert snapshot to structured plain-text for Gemini LLM context
export function formatSnapshotForGemini(snapshot: FullDatabaseSnapshot): string {
  return `=== SNAPSHOT LENGKAP DATABASE RESTORAN BASO & MIE AYAM OJOLALI (${snapshot.timestamp}) ===

1. STATISTIK UTAMA DASHBOARD ADMIN:
- Penjualan Hari Ini (Transaksi Lunas): ${formatRupiah(snapshot.financials.todayRevenue)} (${snapshot.financials.todayCompletedCount} transaksi lunas)
- Pesanan Masuk Hari Ini: ${snapshot.financials.todayOrdersCount} pesanan
- Total Pesanan Tercatat: ${snapshot.totals.orders} pesanan (${snapshot.totals.completedOrders} lunas/selesai)
- Antrean Yang Sedang Berjalan (Perlu Ditindaklanjuti): ${snapshot.totals.pendingOrders} Pending, ${snapshot.totals.processingOrders} Dimasak, ${snapshot.totals.readyOrders} Siap

2. RINGKASAN SELURUH TABEL DATABASE:
- Total Pengguna (Users): ${snapshot.totals.users} (Admin: ${snapshot.totals.admins}, Kasir: ${snapshot.totals.cashiers}, Pelanggan: ${snapshot.totals.customers})
- Total Kategori Menu: ${snapshot.totals.categories}
- Total Menu (Products): ${snapshot.totals.products} (${snapshot.totals.availableProducts} tersedia, ${snapshot.totals.outOfStockProducts} habis)
- Total Transaksi (Orders): ${snapshot.totals.orders} (Selesai: ${snapshot.totals.completedOrders}, Pending: ${snapshot.totals.pendingOrders}, Siap: ${snapshot.totals.readyOrders}, Batal: ${snapshot.totals.cancelledOrders})
- Total Log WA (NotificationLogs): ${snapshot.totals.notificationLogs} (${snapshot.totals.sentNotifications} berhasil, ${snapshot.totals.failedNotifications} gagal)
- Total Pengaturan (Settings): ${snapshot.totals.settings}
- Total Kode OTP: ${snapshot.totals.otpCodes}

3. DATA KEUANGAN & OMZET:
- Total Omzet Terkonfirmasi (Completed): ${formatRupiah(snapshot.financials.totalRevenue)}
- Omzet Hari Ini: ${formatRupiah(snapshot.financials.todayRevenue)}
- Omzet 7 Hari Terakhir: ${formatRupiah(snapshot.financials.weekRevenue)}
- Omzet 30 Hari Terakhir: ${formatRupiah(snapshot.financials.monthRevenue)}
- Rata-rata Belanja per Transaksi (AOV): ${formatRupiah(snapshot.financials.averageOrderValue)}
- Metode Pembayaran:
  * QRIS: ${snapshot.financials.paymentMethods.qris.count} transaksi (${formatRupiah(snapshot.financials.paymentMethods.qris.total)})
  * Tunai/Cash: ${snapshot.financials.paymentMethods.cash.count} transaksi (${formatRupiah(snapshot.financials.paymentMethods.cash.total)})
  * Transfer Bank: ${snapshot.financials.paymentMethods.transfer.count} transaksi (${formatRupiah(snapshot.financials.paymentMethods.transfer.total)})

4. MENU & INVENTARIS:
- Produk Paling Laris (Top Sellers):
${snapshot.products.topSellers.map((p, i) => `  ${i + 1}. ${p.name} (${p.category}) - ${p.qty} porsi terjual - Omzet ${formatRupiah(p.revenue)}`).join("\n") || "  Belum ada data penjualan."}
- Produk Sedang Habis / Stok Kosong:
${snapshot.products.outOfStock.map((p) => `  - ${p.name} (${p.category}) - ${formatRupiah(p.price)}`).join("\n") || "  Semua produk saat ini TERSEDIA."}
- Seluruh Menu:
${snapshot.products.allList.map((p) => `  * ${p.name} [${p.category}] - ${formatRupiah(p.price)} - ${p.available ? "Tersedia" : "Habis"}`).join("\n")}

5. PELANGGAN & KARYAWAN:
- Pelanggan Paling Loyal:
${snapshot.customers.topSpenders.map((c, i) => `  ${i + 1}. ${c.name} (${c.phone}) - ${c.count}x belanja - Total ${formatRupiah(c.total)}`).join("\n") || "  Belum ada pesanan selesai."}
- Karyawan (Admin & Kasir):
${snapshot.customers.staff.map((s) => `  - [${s.role}] ${s.name} (${s.email}, HP: ${s.phone || "-"})`).join("\n")}

6. ANTREAN OPERASIONAL & PESANAN TERBARU:
${snapshot.orders.uncompleted.map((o) => `  - #${o.orderNumber} [${o.status}] ${o.customerName} - ${formatRupiah(o.total)} - Menu: ${o.items}`).join("\n") || "  Semua antrean operasional telah selesai."}
`;
}

// Call Google Gemini API if GEMINI_API_KEY is available
async function tryCallGemini(
  apiKey: string,
  userMessage: string,
  snapshot: FullDatabaseSnapshot,
  currentUser?: any,
  history?: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string | null> {
  try {
    const dbContext = formatSnapshotForGemini(snapshot);
    const systemPrompt = `Kamu adalah "Oji Enterprise", Asisten AI resmi Manajemen & Analis Database Utama untuk warung "Baso & Mie Ayam Ojolali".
Tugasmu adalah membantu Administrator warung membaca, memantau, dan menganalisis SELURUH database restoran secara akurat, ramah, profesional, dan 100% berbasis data riil database yang disertakan di bawah.

INFORMASI PENGGUNA YANG SEDANG BERTANYA:
- Nama: ${currentUser ? currentUser.name : "Budi Santoso (Admin Ojolali)"}
- Role Akun: ${currentUser ? currentUser.role : "ADMIN"} (Administrator)
- Email: ${currentUser ? currentUser.email : "admin@ojolali.test"}
- Nomor WhatsApp: ${currentUser ? currentUser.phone || "-" : "081234567890"}

PANDUAN MENJAWAB:
1. Jika pengguna bertanya "siapa saya", "nama saya", "profil saya", atau "akun saya", sebutkan langsung nama lengkapnya, role (Administrator), email, nomor WhatsApp, dan status hak aksesnya berdasarkan data pengguna di atas.
2. Jawablah langsung, jelas, dan akurat sesuai data database yang tersedia.
3. Gunakan format Markdown rapi: teks tebal (**...**) untuk angka, nama produk, status, omzet, dan poin penting agar sangat nyaman dibaca.
4. Selalu sebutkan angka dan rincian riil (misalnya jika ditanya "ada berapa penjualan hari ini", jawablah sesuai data: omzet hari ini ${formatRupiah(snapshot.financials.todayRevenue)}, jumlah transaksi selesai hari ini, status antrean saat ini, dan total transaksi keseluruhan).
5. Kamu memiliki visibilitas penuh ke seluruh 8 tabel database (Users, Categories, Products, Orders, OrderItems, Settings, NotificationLogs, OtpCodes).

${dbContext}`;

    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    if (history && history.length > 0) {
      for (const h of history.slice(-4)) {
        contents.push({
          role: h.role === "assistant" ? "model" : "user",
          parts: [{ text: h.content }],
        });
      }
    }

    contents.push({
      role: "user",
      parts: [{ text: userMessage }],
    });

    const body = {
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1500,
      },
    };

    const models = ["gemini-2.5-flash", "gemini-1.5-flash"];

    for (const model of models) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(10000),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText && typeof candidateText === "string") {
            return candidateText.trim();
          }
        }
      } catch (err) {
        console.warn(`Gemini API call to ${model} failed:`, err);
      }
    }

    return null;
  } catch (error) {
    console.error("Gemini invocation error:", error);
    return null;
  }
}

// Local Deterministic Database Intelligence Engine (Always-Reliable Native Brain)
export function runLocalDatabaseIntelligence(
  userQuery: string,
  snapshot: FullDatabaseSnapshot,
  currentUser?: any
): string {
  const q = userQuery.toLowerCase().trim();
  const cleanQ = q.replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();

  // =========================================================================
  // 0. IDENTITAS USER ("SIAPA SAYA / SIAPA AKU / PROFIL SAYA / AKUN SAYA")
  // =========================================================================
  const isUserIdentityQuery =
    /(siapa\s+(saya|aku|gue|gw|me)|siapakah\s+(saya|aku)|saya\s+siapa|aku\s+siapa|nama\s+(saya|aku|ku)|siapa\s+nama\s+(saya|aku)|nama\s+lengkap\s+(saya|aku)|nama\s+asli\s+(saya|aku)|kenal\s+(saya|aku)|tau\s+(siapa\s+)?(saya|aku)|tahu\s+gak\s+siapa\s+(saya|aku)|profil\s+(saya|aku)|akun\s+(saya|aku)|data\s+(saya|aku)|identitas\s+(saya|aku)|role\s+(saya|aku)|siapa\s+yang\s+(lagi\s+|sedang\s+)?login|login\s+sebagai\s+siapa)/i.test(
      cleanQ
    ) ||
    cleanQ === "siapa saya" ||
    cleanQ === "siapa aku" ||
    cleanQ === "nama saya" ||
    cleanQ === "profil saya" ||
    cleanQ === "akun saya" ||
    q.startsWith("siapa saya");

  if (isUserIdentityQuery) {
    if (currentUser) {
      let roleBadge = "🌟 Pelanggan Setia Ojolali";
      let permissions = "Dapat memesan menu, cek riwayat pesanan pribadi, dan konfirmasi pembayaran.";
      if (currentUser.role === "ADMIN") {
        roleBadge = "👑 Administrator Utama (Super Admin)";
        permissions = "Akses Penuh Seluruh Sistem Ojolali (Kelola Produk, Semua Pesanan, Laporan Penjualan, Manajemen Kasir, Pelanggan, Integrasi WhatsApp Gateway, & Database AI).";
      } else if (currentUser.role === "CASHIER") {
        roleBadge = "💼 Kasir Warung Ojolali";
        permissions = "Akses Operasional Kasir (Proses Pesanan, Kasir POS, Update Status Masakan, & Terima Pembayaran).";
      }

      const userPhone = currentUser.phone || "Belum dicantumkan";
      const joinDate = formatDate(currentUser.createdAt);

      return `Halo kak **${currentUser.name}**! 👋

Saya mengenali Anda secara akurat berdasarkan akun yang sedang aktif di database sistem Ojolali:

👤 **Detail Profil Akun Anda:**
• **Nama Akun**: **${currentUser.name}**
• **Peran / Role**: **${roleBadge}**
• **Email Terdaftar**: \`${currentUser.email}\`
• **Nomor WhatsApp**: **${userPhone}**
• **Hak Akses Sistem**: ${permissions}
• **Terdaftar Sejak**: ${joinDate}

Ada data atau laporan database yang ingin Anda periksa hari ini, kak **${currentUser.name}**? 😊`;
    } else {
      return `Halo! Saat ini Anda terdeteksi mengakses sistem sebagai **Tamu / Pengunjung** (belum masuk ke akun terdaftar).

Silakan masuk melalui halaman **[Masuk ke Akun / Login](/login)** agar saya dapat mengenali nama dan akun Anda sesuai database! 😊`;
    }
  }

  // =========================================================================
  // 0B. IDENTITAS BOT ("SIAPA KAMU / KAMU SIAPA / TENTANG OJI")
  // =========================================================================
  const isAiIdentityQuery =
    /(siapa\s+(kamu|anda|dirimu|namamu|oji)|kamu\s+siapa|anda\s+siapa|namamu\s+siapa|nama\s+kamu|perkenalkan\s+diri|apa\s+namamu|bot\s+apa\s+ini|siapa\s+bot\s+ini)/i.test(
      cleanQ
    ) ||
    cleanQ === "siapa kamu" ||
    cleanQ === "kamu siapa" ||
    cleanQ === "siapa oji";

  if (isAiIdentityQuery) {
    return `Saya **Oji Enterprise**, asisten AI cerdas resmi dari **Baso & Mie Ayam Ojolali**! 🍜🤖

Saya terhubung langsung membaca seluruh 8 tabel database restoran via Prisma ORM secara real-time:
• 👥 **Users**: Seluruh akun pelanggan, kasir, dan administrator
• 🍜 **Produk & Kategori**: Daftar menu, harga, ketersediaan stok, dan resep
• 📦 **Pesanan & Antrean**: Status antrean dapur, pemesanan, dan metode pembayaran
• 💰 **Omzet & Finansial**: Laporan penjualan harian/mingguan/bulanan dan rekap pendapatan
• 📱 **WhatsApp Gateway**: Pemantauan log pengiriman notifikasi Fonnte
• ⚙️ **Pengaturan**: Konfigurasi sistem dan operasional warung

Ada data atau informasi warung yang ingin Anda tanyakan hari ini? 😊`;
  }

  // =========================================================================
  // 1. STATISTIK UTAMA DASHBOARD: PENJUALAN HARI INI & TRANSAKSI HARI INI
  // =========================================================================
  const isTodaySalesQuery =
    /(penjualan\s+(hari\s+ini|today)|omzet\s+(hari\s+ini|today)|omset\s+(hari\s+ini|today)|transaksi\s+(hari\s+ini|today)|pesanan\s+(hari\s+ini|today)|orderan?\s+(hari\s+ini|today)|pemasukan\s+(hari\s+ini|today)|uang\s+masuk\s+(hari\s+ini|today)|rekap\s+(hari\s+ini|today)|laporan\s+(hari\s+ini|today))/i.test(
      q
    ) ||
    (/(ada\s+)?berapa\s+penjualan(\s+hari\s+ini)?/i.test(q)) ||
    (q.includes("penjualan") && (q.includes("hari ini") || q.includes("today") || q.includes("sekarang"))) ||
    (q.includes("omzet") && (q.includes("hari ini") || q.includes("today"))) ||
    (q.includes("omset") && (q.includes("hari ini") || q.includes("today"))) ||
    (q.includes("pesanan") && (q.includes("hari ini") || q.includes("today"))) ||
    q === "penjualan hari ini" ||
    q === "ada berapa penjualan hari ini" ||
    q === "berapa penjualan hari ini";

  if (isTodaySalesQuery) {
    const todayRevenue = snapshot.financials.todayRevenue;
    const todayCompleted = snapshot.financials.todayCompletedCount;
    const todayTotal = snapshot.financials.todayOrdersCount;
    const pendingTotal = snapshot.financials.pendingTotalRevenue;
    const lastCompleted = snapshot.financials.lastCompletedOrder;

    let todayDetailStr = "";
    if (todayCompleted > 0) {
      todayDetailStr = `• **Penjualan Hari Ini (Transaksi Lunas)**: **${formatRupiah(todayRevenue)}** dari **${todayCompleted} transaksi selesai**.\n• **Total Pesanan Masuk Hari Ini**: **${todayTotal} pesanan**.`;
    } else {
      todayDetailStr = `• **Penjualan Hari Ini (Transaksi Lunas)**: **${formatRupiah(0)}**\n  *(Sesuai kartu dashboard: saat ini belum ada pesanan yang diselesaikan/lunas hari ini, ${snapshot.timestamp})*.\n• **Pesanan Baru Masuk Hari Ini**: **${todayTotal} pesanan**.`;
    }

    return `📊 **Laporan Penjualan & Antrean Hari Ini (${snapshot.timestamp}):**

${todayDetailStr}

⏳ **Status Antrean Operasional Saat Ini (Perlu Ditindaklanjuti Kasir/Dapur):**
• **Menunggu Konfirmasi (PENDING)**: **${snapshot.totals.pendingOrders} Antrean** (Nilai order pending: **${formatRupiah(pendingTotal)}**)
• **Sedang Dimasak (PROCESSING)**: **${snapshot.totals.processingOrders} Antrean**
• **Siap Diambil/Diantar (READY)**: **${snapshot.totals.readyOrders} Antrean**

💰 **Rekap Akumulasi Penjualan di Database Ojolali:**
• **Total Pesanan Tercatat**: **${snapshot.totals.orders} Transaksi**
• **Total Transaksi Selesai (Completed)**: **${snapshot.totals.completedOrders} Pesanan**
• **Total Omzet Terkonfirmasi**: **${formatRupiah(snapshot.financials.totalRevenue)}**
• **Rata-rata Nilai Belanja (AOV)**: **${formatRupiah(snapshot.financials.averageOrderValue)}** per transaksi
${lastCompleted ? `\n📦 *Transaksi selesai terakhir tercatat atas nama **${lastCompleted.customerName}** (#${lastCompleted.orderNumber}) sebesar **${formatRupiah(lastCompleted.total)}** pada ${lastCompleted.date}.*` : ""}`;
  }

  // =========================================================================
  // 2. KARTU DASHBOARD: JUMLAH PESANAN / TOTAL TRANSAKSI
  // =========================================================================
  if (
    /(jumlah\s+pesanan|total\s+pesanan|berapa\s+(banyak\s+)?pesanan|ada\s+berapa\s+pesanan|pesanan\s+selesai|total\s+transaksi|berapa\s+transaksi|jumlah\s+transaksi)/i.test(
      q
    )
  ) {
    return `📦 **Data Jumlah Pesanan & Transaksi di Database:**
• **Total Riwayat Pesanan**: **${snapshot.totals.orders} Transaksi**
• **Pesanan Selesai (Completed)**: **${snapshot.totals.completedOrders} Transaksi** (Omzet: **${formatRupiah(snapshot.financials.totalRevenue)}**)
• **Antrean Aktif**: **${snapshot.totals.pendingOrders} Pending**, **${snapshot.totals.processingOrders} Dimasak**, **${snapshot.totals.readyOrders} Siap**
• **Pesanan Dibatalkan (Cancelled)**: **${snapshot.totals.cancelledOrders} Transaksi**

💳 **Status Pembayaran:**
• **Lunas (PAID)**: **${snapshot.financials.paymentStatuses.paid} pesanan**
• **Menunggu Pembayaran (PENDING)**: **${snapshot.financials.paymentStatuses.pending} pesanan**`;
  }

  // =========================================================================
  // 3. KARTU DASHBOARD: PESANAN DIPROSES / ANTREAN DAPUR
  // =========================================================================
  if (
    /(pesanan\s+diproses|antrean\s+dapur|pesanan\s+pending|berapa\s+antrean|ada\s+berapa\s+antrean|antrean\s+saat\s+ini|antrean\s+berjalan|status\s+antrean)/i.test(
      q
    )
  ) {
    const uncompleted = snapshot.orders.uncompleted;
    const listStr =
      uncompleted.length > 0
        ? uncompleted
            .map(
              (o) =>
                `• **#${o.orderNumber}** [**${o.status}**] — **${o.customerName}** (${formatRupiah(o.total)})\n  Item: ${o.items} | Waktu: ${o.createdAt}`
            )
            .join("\n\n")
        : "✅ **Semua antrean operasional saat ini bersih!** Tidak ada pesanan pending atau sedang dimasak.";

    return `⏳ **Data Pesanan Diproses & Antrean Operasional:**
• **Total Antrean Aktif**: **${snapshot.totals.pendingOrders + snapshot.totals.processingOrders + snapshot.totals.readyOrders} Pesanan**
• **Menunggu Konfirmasi (PENDING)**: **${snapshot.totals.pendingOrders} Antrean** (Sesuai kartu dashboard: perlu ditindaklanjuti kasir)
• **Sedang Dimasak (PROCESSING)**: **${snapshot.totals.processingOrders} Antrean**
• **Siap Diambil/Diantar (READY)**: **${snapshot.totals.readyOrders} Antrean**

📋 **Rincian Antrean Terkini:**
${listStr}`;
  }

  // =========================================================================
  // 4. RINGKASAN DATABASE LENGKAP (ALL 8 TABLES & SYSTEM HEALTH)
  // =========================================================================
  if (
    /(ringkasan\s+database|baca\s+(semua\s+)?database|semua\s+database|isi\s+database|tabel|status\s+database|overview|rangkuman\s+database|seluruh\s+database|data\s+apa\s+saja|ada\s+data\s+apa|baca\s+semua\s+data)/i.test(
      q
    )
  ) {
    return `📊 **Laporan Lengkap Seluruh Database Warung Ojolali:**
Diperbarui secara real-time via Prisma ORM (${snapshot.timestamp}).

📁 **1. Master Produk & Kategori (Katalog):**
• Total Kategori Menu: **${snapshot.totals.categories} Kategori** (Baso Sapi, Mie Ayam, Minuman)
• Total Menu: **${snapshot.totals.products} Produk** (**${snapshot.totals.availableProducts} Tersedia**, **${snapshot.totals.outOfStockProducts} Habis**)

👥 **2. Akun & Pengguna Sistem (Users):**
• Total Pengguna Terdaftar: **${snapshot.totals.users} Akun**
• Pelanggan Terdaftar: **${snapshot.totals.customers} Orang**
• Administrator: **${snapshot.totals.admins} Akun**
• Kasir: **${snapshot.totals.cashiers} Akun**

📦 **3. Transaksi & Penjualan (Orders & Items):**
• Total Riwayat Pesanan: **${snapshot.totals.orders} Transaksi**
• Pesanan Selesai (Completed): **${snapshot.totals.completedOrders} Transaksi**
• Antrean Berjalan: **${snapshot.totals.pendingOrders} Pending**, **${snapshot.totals.processingOrders} Dimasak**, **${snapshot.totals.readyOrders} Siap**
• Dibatalkan (Cancelled): **${snapshot.totals.cancelledOrders} Transaksi**

💰 **4. Finansial & Pendapatan Riil:**
• **Total Omzet Terkonfirmasi**: **${formatRupiah(snapshot.financials.totalRevenue)}**
• Omzet Hari Ini: **${formatRupiah(snapshot.financials.todayRevenue)}**
• Rata-rata Nilai Belanja (AOV): **${formatRupiah(snapshot.financials.averageOrderValue)}**

📱 **5. Integrasi WhatsApp & Notifikasi (Fonnte):**
• Total Log Notifikasi: **${snapshot.totals.notificationLogs} Pesan** (**${snapshot.totals.sentNotifications} Berhasil**, **${snapshot.totals.failedNotifications} Gagal**)

⚙️ **6. Konfigurasi Sistem & Keamanan:**
• Pengaturan Tersimpan (Settings): **${snapshot.totals.settings} Item Konfigurasi**
• Kode OTP Tercatat: **${snapshot.totals.otpCodes} Kode**

💡 *Tanyakan hal spesifik seperti "penjualan hari ini", "siapa pelanggan terloyal", "cek stok habis", atau nomor pesanan tertentu!*`;
  }

  // =========================================================================
  // 5. KEUANGAN, OMZET, METODE PEMBAYARAN, & REKAP KESELURUHAN
  // =========================================================================
  if (
    /(omzet|omset|pendapatan|keuangan|uang\s+masuk|hasil\s+jualan|laba|untung|kas\s+masuk|rata\s*rata\s+belanja|aov|laporan\s+penjualan|pemasukan|penjualan)/i.test(
      q
    )
  ) {
    const isWeek = /(minggu\s+ini|7\s+hari)/i.test(q);
    const isMonth = /(bulan\s+ini|30\s+hari)/i.test(q);
    const isMethod = /(metode|qris|tunai|cash|transfer|cara\s+bayar)/i.test(q);

    if (isWeek) {
      return `📅 **Laporan Keuangan 7 Hari Terakhir:**
• **Omzet 7 Hari**: **${formatRupiah(snapshot.financials.weekRevenue)}**
• Rata-rata Performa Harian: **${formatRupiah(Math.round(snapshot.financials.weekRevenue / 7))} / hari**`;
    }

    if (isMonth) {
      return `🗓️ **Laporan Keuangan 30 Hari Terakhir:**
• **Omzet 30 Hari**: **${formatRupiah(snapshot.financials.monthRevenue)}**
• Kontribusi Tertinggi: Menu **${snapshot.products.topSellers[0]?.name || "Mie Ayam Baso"}**`;
    }

    if (isMethod) {
      const qris = snapshot.financials.paymentMethods.qris;
      const cash = snapshot.financials.paymentMethods.cash;
      const tf = snapshot.financials.paymentMethods.transfer;
      return `💳 **Rincian Omzet Berdasarkan Metode Pembayaran:**
1. **QRIS Digital**:
   • Total Transaksi: **${qris.count} transaksi**
   • Nominal: **${formatRupiah(qris.total)}**
2. **Tunai di Kasir (Cash)**:
   • Total Transaksi: **${cash.count} transaksi**
   • Nominal: **${formatRupiah(cash.total)}**
3. **Transfer Bank**:
   • Total Transaksi: **${tf.count} transaksi**
   • Nominal: **${formatRupiah(tf.total)}**

Status Lunas: **${snapshot.financials.paymentStatuses.paid} transaksi**, Menunggu Konfirmasi: **${snapshot.financials.paymentStatuses.pending} transaksi**.`;
    }

    return `💰 **Ringkasan Lengkap Finansial Warung Ojolali:**
• **Total Omzet Terkonfirmasi (Sepanjang Waktu)**: **${formatRupiah(snapshot.financials.totalRevenue)}**
• **Omzet Hari Ini**: **${formatRupiah(snapshot.financials.todayRevenue)}**
• **Omzet 7 Hari Terakhir**: **${formatRupiah(snapshot.financials.weekRevenue)}**
• **Omzet 30 Hari Terakhir**: **${formatRupiah(snapshot.financials.monthRevenue)}**
• **Rata-rata Nilai Belanja (AOV)**: **${formatRupiah(snapshot.financials.averageOrderValue)}** per transaksi selesai

Metode Pembayaran Terfavorit: **${snapshot.financials.paymentMethods.qris.count >= snapshot.financials.paymentMethods.cash.count ? "QRIS Digital" : "Tunai / Cash"}**.`;
  }

  // =========================================================================
  // 6. PELANGGAN TERLOYAL / TOP SPENDERS
  // =========================================================================
  if (
    /(loyal|terloyal|top\s+customers?|top\s+spenders?)/i.test(q) ||
    (/(pelanggan|customer|pembeli)/i.test(q) && /(loyal|terloyal|setia|terbanyak|paling\s+banyak|sering|top|spenders|terbaik|belanja)/i.test(q))
  ) {
    if (snapshot.customers.topSpenders.length === 0) {
      return "Belum ada transaksi selesai untuk menganalisis peringkat pelanggan terloyal.";
    }

    const listStr = snapshot.customers.topSpenders
      .map(
        (c, idx) =>
          `${idx + 1}. **${c.name}** (${c.phone})\n   • Total Belanja: **${formatRupiah(c.total)}**\n   • Frekuensi: **${c.count}x pesanan selesai**`
      )
      .join("\n\n");

    return `👑 **Daftar Pelanggan Terloyal & Paling Banyak Belanja:**\n\n${listStr}\n\n💡 *Tips Admin: Pertimbangkan memberi apresiasi atau diskon loyalty untuk pelanggan teratas guna mempertahankan retensi!*`;
  }

  // =========================================================================
  // 7. USER / KARYAWAN (ADMIN & KASIR & AKUN TERDAFTAR)
  // =========================================================================
  if (
    /(siapa\s+(saja\s+)?(admin|kasir|petugas|karyawan|staff|pegawai)|daftar\s+(user|pengguna|pelanggan|kasir|admin)|total\s+(user|pengguna|akun)|data\s+user)/i.test(
      q
    )
  ) {
    const staffStr = snapshot.customers.staff
      .map(
        (s) =>
          `• [**${s.role}**] **${s.name}**\n  Email: ${s.email} | HP: ${s.phone || "-"}`
      )
      .join("\n");

    return `👥 **Data Pengguna & Karyawan di Database Ojolali:**
• **Total Akun Terdaftar**: **${snapshot.totals.users} Akun**
• **Pelanggan Aktif**: **${snapshot.totals.customers} Orang**
• **Administrator**: **${snapshot.totals.admins} Akun**
• **Kasir Warung**: **${snapshot.totals.cashiers} Akun**

🛡️ **Daftar Petugas & Karyawan (Admin & Kasir):**
${staffStr}`;
  }

  // =========================================================================
  // 8. ANTREAN, OPERASIONAL, PESANAN PENDING / BATAL
  // =========================================================================
  if (
    /(pending|antrean|dapur|diproses|processing|\bsiap\b|\bready\b|operasional|belum\s+selesai|dibatalkan|\bcancel\b)/i.test(
      q
    ) &&
    !/(siapa\s+(admin|kasir|user|pelanggan))/i.test(q)
  ) {
    const isCancelled = /(dibatalkan|\bcancel\b)/i.test(q);
    if (isCancelled) {
      return `🚫 **Data Pesanan Dibatalkan (Cancelled):**
• Total Pesanan Batal: **${snapshot.totals.cancelledOrders} transaksi**
Pesanan yang dibatalkan tidak dimasukkan ke dalam perhitungan omzet bersih warung.`;
    }

    const uncompleted = snapshot.orders.uncompleted;
    const listStr =
      uncompleted.length > 0
        ? uncompleted
            .map(
              (o) =>
                `• **#${o.orderNumber}** [**${o.status}**] — **${o.customerName}** (${formatRupiah(o.total)})\n  Item: ${o.items} | Waktu: ${o.createdAt}`
            )
            .join("\n\n")
        : "✅ **Semua antrean operasional saat ini bersih!** Tidak ada pesanan pending atau sedang dimasak.";

    return `⏳ **Status Antrean Operasional & Dapur Warung:**
• **Menunggu Konfirmasi (PENDING)**: **${snapshot.totals.pendingOrders} Pesanan**
• **Sedang Dimasak (PROCESSING)**: **${snapshot.totals.processingOrders} Pesanan**
• **Siap Diambil/Diantar (READY)**: **${snapshot.totals.readyOrders} Pesanan**

📋 **Rincian Antrean yang Perlu Diperhatikan:**
${listStr}`;
  }

  // =========================================================================
  // 9. CEK STOK / PRODUK HABIS (OUT OF STOCK)
  // =========================================================================
  if (
    /(stok|habis|kosong|tidak\s+tersedia|out\s+of\s+stock|sisa\s+stok)/i.test(
      q
    ) &&
    !/(laris|laku|paling\s+banyak)/i.test(q)
  ) {
    if (snapshot.products.outOfStock.length === 0) {
      return `✅ **Seluruh Menu Tersedia Lengkap!**
Dari total **${snapshot.totals.products} menu** yang terdaftar di database, semuanya berstatus **TERSEDIA** dan siap dipesan oleh pelanggan.`;
    }

    const listStr = snapshot.products.outOfStock
      .map((p) => `• **${p.name}** (${p.category}) — ${formatRupiah(p.price)}`)
      .join("\n");

    return `⚠️ **Daftar Menu yang Sedang HABIS / Tidak Tersedia (${snapshot.products.outOfStock.length} Menu):**

${listStr}

💡 *Admin dapat mengaktifkan kembali ketersediaan menu di halaman 'Kelola Produk' segera setelah bahan baku di dapur siap.*`;
  }

  // =========================================================================
  // 10. KARTU DASHBOARD: PRODUK TERLARIS (PALING DIMINATI) & SLOW MOVING
  // =========================================================================
  const isTopProductsQuery =
    /(terlaris|paling\s+laris|paling\s+diminati|diminati|best\s*sellers?|paling\s+laku|terlaku|favorit|paling\s+banyak\s+(dipesan|terjual|dibeli|laku)|produk\s+(yg\s+|yang\s+)?(terlaris|laris)|menu\s+(yg\s+|yang\s+)?(terlaris|laris)|makanan\s+(yg\s+|yang\s+)?(terlaris|laris)|minuman\s+(yg\s+|yang\s+)?(terlaris|laris)|kurang\s+laku|slow\s*moving|sepi)/i.test(
      q
    ) ||
    cleanQ.includes("terlaris") ||
    cleanQ.includes("best seller") ||
    cleanQ.includes("paling diminati") ||
    cleanQ.includes("diminati") ||
    (cleanQ.includes("laris") && (cleanQ.includes("produk") || cleanQ.includes("menu") || cleanQ.includes("apa") || cleanQ.includes("paling") || cleanQ.includes("yg") || cleanQ.includes("yang")));

  if (isTopProductsQuery) {
    const isSlow = /(kurang\s+laku|slow\s*moving|sepi|jarang)/i.test(q);

    if (isSlow) {
      if (snapshot.products.slowSellers.length === 0) {
        return "✨ Seluruh menu memiliki volume penjualan yang merata dan aktif!";
      }
      const listStr = snapshot.products.slowSellers
        .map((p) => `• **${p.name}** (${p.category}) — Terjual: **${p.qty} porsi** (${formatRupiah(p.price)})`)
        .join("\n");
      return `📉 **Daftar Menu Slow Moving (Penjualan Rendah):**\n\n${listStr}\n\n💡 *Saran: Buat paket bundling hemat dengan menu terlaris atau berikan diskon promo untuk mendongkrak penjualan.*`;
    }

    if (snapshot.products.topSellers.length === 0) {
      return "Belum ada transaksi selesai yang tercatat untuk menghitung menu terlaris.";
    }

    const top1 = snapshot.products.topSellers[0];
    const top1Product = top1
      ? snapshot.products.allList.find(
          (p) => p.name.toLowerCase() === top1.name.toLowerCase()
        )
      : null;
    const top1Price = top1Product ? formatRupiah(top1Product.price) : (top1 ? formatRupiah(top1.price) : "");
    const top1Desc =
      top1Product?.description ||
      "Perpaduan favorit mie ayam manis gurih dilengkapi 2 butir baso sapi halus berkuah kaldu hangat dan renyahnya kerupuk pangsit.";

    const listStr = snapshot.products.topSellers
      .map(
        (p, idx) =>
          `${idx + 1}. **${p.name}** (${p.category})\n   • Total Terjual: **${p.qty} porsi**\n   • Kontribusi Omzet: **${formatRupiah(p.revenue)}**`
      )
      .join("\n\n");

    return `🔥 **Produk Terlaris: ${top1?.name || "Mie Ayam Baso"} (Paling Diminati)**

Sesuai kartu dashboard warung Ojolali, produk paling laris dan diminati pelanggan saat ini adalah:
• **Nama Menu**: **${top1?.name || "Mie Ayam Baso"}** (Kategori: ${top1?.category || "Mie Ayam"})
• **Total Terjual**: **${top1?.qty || 0} porsi** 🔥
• **Kontribusi Omzet**: **${formatRupiah(top1?.revenue || 0)}**
• **Harga Menu**: **${top1Price}** (Status: **${top1Product?.available ? "Tersedia" : "Habis"}**)
• **Deskripsi**: ${top1Desc}

🏆 **Daftar 5 Besar Menu Paling Laris (Top Sellers):**
${listStr}

💡 *Menu di atas adalah pilar utama pemasukan restoran Ojolali yang paling banyak dipesan oleh pelanggan!*`;
  }

  // =========================================================================
  // 11. LOG WHATSAPP & STATUS NOTIFIKASI
  // =========================================================================
  if (
    /(whatsapp|wa|notifikasi|fonnte|gateway|pesan\s+wa|status\s+wa|log\s+wa)/i.test(
      q
    )
  ) {
    const recentLogsStr =
      snapshot.notifications.recent.length > 0
        ? snapshot.notifications.recent
            .map(
              (n) =>
                `• [**${n.status}**] ke **${n.phone}** (${n.type}) — ${n.date}${n.error ? `\n  Error: ${n.error}` : ""}`
            )
            .join("\n")
        : "Belum ada riwayat notifikasi WhatsApp.";

    const adminPhone = snapshot.settings["whatsapp_admin_number"] || "6289682519919";

    return `📱 **Status Integrasi WhatsApp Gateway (Fonnte):**
• **Nomor WhatsApp Admin Terkonfigurasi**: **${adminPhone}**
• **Total Log Notifikasi**: **${snapshot.notifications.total} Pesan**
• **Berhasil Terkirim**: **${snapshot.notifications.sent} Pesan** ✅
• **Gagal Terkirim**: **${snapshot.notifications.failed} Pesan** ⚠️

📋 **5 Log Notifikasi Terakhir:**
${recentLogsStr}`;
  }

  // =========================================================================
  // 12. SETTING & PENGATURAN DATABASE
  // =========================================================================
  if (
    /(setting|pengaturan|konfigurasi|nomor\s+admin|jam\s+buka|alamat|lokasi)/i.test(
      q
    )
  ) {
    const settingsEntries = Object.entries(snapshot.settings);
    const settingsStr =
      settingsEntries.length > 0
        ? settingsEntries
            .map(([k, v]) => `• **${k}**: \`${v}\``)
            .join("\n")
        : "Tidak ada data pengaturan kustom tersimpan di database.";

    return `⚙️ **Konfigurasi Sistem Terdaftar di Tabel Settings:**\n\n${settingsStr}\n\nSemua perubahan pengaturan ini langsung berdampak secara sistemik ke notifikasi WhatsApp dan perilaku web.`;
  }

  // =========================================================================
  // 13. TENTANG WEB & FITUR SISTEM
  // =========================================================================
  if (
    /(tentang\s+web|web\s+ini|website|aplikasi|fitur|sistem|bisa\s+apa\s+saja)/i.test(
      q
    )
  ) {
    return `🌐 **Tentang Sistem Web Baso & Mie Ayam Ojolali:**
Aplikasi web ini merupakan platform manajemen restoran terintegrasi yang mencakup:
1. **Pemesanan Online**: Pelanggan dapat melihat menu, memesan makanan, memilih pembayaran (QRIS/Tunai/Transfer), dan cek status pesanan.
2. **Dashboard Manajemen Admin & Kasir**: Pengelolaan transaksi real-time, laporan omzet, kontrol ketersediaan stok menu, dan manajemen akun pengguna.
3. **WhatsApp Notification Gateway**: Pengiriman notifikasi otomatis via Fonnte ke nomor WhatsApp pembeli dan admin ketika pesanan masuk atau status diperbarui.
4. **AI Asisten Cerdas (Oji)**: Didukung koneksi langsung ke seluruh 8 tabel database Prisma ORM untuk membantu pelanggan & menjawab kebutuhan data pemilik warung secara akurat.`;
  }

  // =========================================================================
  // 14. CEK NOMOR PESANAN SPESIFIK (Misal: ORD-20261022-356)
  // =========================================================================
  const orderMatch = userQuery.match(/ORD-[\w-]+/i);
  if (orderMatch) {
    const orderNo = orderMatch[0].toUpperCase();
    const found = snapshot.orders.recent.find(
      (o) => o.orderNumber.toUpperCase() === orderNo
    );

    if (found) {
      const itemsList = found.items
        .map((i) => `• ${i.name} x${i.quantity} (${formatRupiah(i.subtotal)})`)
        .join("\n");

      return `🔍 **Rincian Pesanan #${found.orderNumber}:**
• **Pelanggan**: **${found.customerName}** (${found.customerPhone || "Tanpa No. HP"})
• **Total Belanja**: **${formatRupiah(found.total)}**
• **Status Pesanan**: **${found.status}**
• **Pembayaran**: **${found.paymentStatus}** via **${found.paymentMethod}**
• **Waktu Transaksi**: ${found.createdAt}
${found.notes ? `• **Catatan Khusus**: ${found.notes}\n` : ""}
📋 **Item Menu:**
${itemsList}`;
    }
  }

  // =========================================================================
  // 15. PENCARIAN CERDAS PRODUK (MENU SEARCH)
  // =========================================================================
  const matchedProducts = snapshot.products.allList.filter((p) => {
    const nameLower = p.name.toLowerCase();
    return q.includes(nameLower) || nameLower.split(" ").some((token) => token.length >= 4 && q.includes(token));
  });

  if (matchedProducts.length > 0) {
    const prodList = matchedProducts
      .map(
        (p) =>
          `• **${p.name}** (${p.category}) — **${formatRupiah(p.price)}** [${p.available ? "Tersedia" : "Habis"}]\n  ${p.description || "Menu lezat Ojolali."}`
      )
      .join("\n\n");

    return `🔍 **Informasi Menu Sesuai Database Ojolali:**\n\n${prodList}`;
  }

  // =========================================================================
  // 16. ANALISIS BISNIS & STRATEGI UMKM
  // =========================================================================
  if (
    /(analisis|strategi|saran|rekomendasi|evaluasi|ide\s+promo|tingkatkan\s+omzet)/i.test(
      q
    )
  ) {
    const topItem = snapshot.products.topSellers[0]?.name || "Mie Ayam Baso";
    const slowItem = snapshot.products.slowSellers[0]?.name;

    return `📈 **Analisis Bisnis & Rekomendasi Strategis Berbasis Data Riil:**

1. **Performa Penjualan**:
   • Total omzet terverifikasi saat ini **${formatRupiah(snapshot.financials.totalRevenue)}** dengan rata-rata belanja **${formatRupiah(snapshot.financials.averageOrderValue)}**.
   • Pilar penjualan utama adalah menu **${topItem}** (${snapshot.products.topSellers[0]?.qty || 0} porsi terjual).

2. **Rekomendasi Paket Bundling**:
   • Pasangkan **${topItem}** dengan minuman segar seperti Es Teh Manis Jumbo atau Es Jeruk dalam satu paket hemat untuk menaikkan nilai rata-rata belanja pelanggan.

3. **Optimasi Menu Kurang Laku**:
   ${slowItem ? `• Menu **${slowItem}** memiliki penjualan yang masih rendah. Pertimbangkan untuk mempromosikannya sebagai rekomendasi kasir atau memberikan bonus pangsit.` : "• Seluruh produk memiliki tingkat penjualan yang baik."}

4. **Kesiapan Jam Sibuk Operasional**:
   • Pastikan persediaan kaldu sapi, baso rebus, dan mie telur dalam kondisi puncak menjelang jam makan siang (11:30 - 13:30 WIB) untuk mencegah antrean pesanan pending menumpuk.`;
  }

  // =========================================================================
  // 17. UNIVERSAL FUZZY DATABASE QUERY RESOLVER (BILA PERTANYAAN BEBAS)
  // =========================================================================
  // Jika pertanyaan mengandung kata tanya atau minta informasi:
  const isQuestion = /(ada|berapa|siapa|apa|mana|cek|lihat|tampilkan|tolong|bagaimana|gimana|kapan|mengapa|kenapa|\?)/i.test(q);

  // Cek apakah menyebut nama pelanggan tertentu (misal: "sahlan", "arul", "abin", "ahmad", "dewi", "rudi")
  const matchedCustomerOrders = snapshot.orders.recent.filter((o) =>
    q.includes(o.customerName.toLowerCase())
  );
  if (matchedCustomerOrders.length > 0) {
    const custName = matchedCustomerOrders[0].customerName;
    const ordersList = matchedCustomerOrders
      .map(
        (o) =>
          `• **#${o.orderNumber}** [**${o.status}**] — ${formatRupiah(o.total)} (${o.paymentStatus} via ${o.paymentMethod})\n  Item: ${o.items.map((i) => `${i.name} (x${i.quantity})`).join(", ")} | ${o.createdAt}`
      )
      .join("\n\n");

    return `🔍 **Riwayat Pesanan Pelanggan "${custName}":**\n\n${ordersList}`;
  }

  if (isQuestion) {
    return `📊 **Informasi Terkait Database Ojolali:**
Berdasarkan data langsung dari sistem saat ini:
• **Penjualan Hari Ini**: **${formatRupiah(snapshot.financials.todayRevenue)}** (${snapshot.financials.todayCompletedCount} pesanan selesai lunas)
• **Antrean Berjalan**: **${snapshot.totals.pendingOrders} Pending**, **${snapshot.totals.processingOrders} Dimasak**, **${snapshot.totals.readyOrders} Siap**
• **Total Transaksi Selesai**: **${snapshot.totals.completedOrders} Pesanan** (Total Omzet: **${formatRupiah(snapshot.financials.totalRevenue)}**)
• **Menu Paling Laris**: **${snapshot.products.topSellers[0]?.name || "Mie Ayam Baso"}** (${snapshot.products.topSellers[0]?.qty || 0} porsi)
• **Katalog Menu**: **${snapshot.totals.products} Produk** (${snapshot.totals.availableProducts} tersedia, ${snapshot.totals.outOfStockProducts} habis)
• **Total Pengguna**: **${snapshot.totals.users} Akun** (${snapshot.totals.customers} pelanggan, ${snapshot.totals.admins} admin, ${snapshot.totals.cashiers} kasir)

💡 *Anda dapat menanyakan hal spesifik seperti "penjualan hari ini", "cek pesanan pending", "siapa pelanggan terloyal", atau nomor pesanan tertentu!*`;
  }

  // DEFAULT GREETING IF STRICTLY GREETING
  return `Halo Admin! Saya **Oji Enterprise**, asisten AI yang terhubung langsung ke **seluruh database** web Ojolali (${snapshot.timestamp}).

Saya dapat membaca dan menjawab pertanyaan Anda seputar:
• 💰 **Finansial & Omzet**: Ketik *"penjualan hari ini"*, *"laporan keuangan"*, atau *"omzet QRIS vs Tunai"*
• ⏳ **Operasional & Antrean**: Ketik *"cek pesanan pending"*, *"antrean dapur"*, atau nomor pesanan
• 🍜 **Inventaris & Menu**: Ketik *"cek menu habis"*, *"menu paling laris"*, atau *"harga baso spesial"*
• 👥 **Pelanggan & Kasir**: Ketik *"siapa pelanggan terloyal"*, *"siapa kasir yang bertugas"*, atau *"total user"*
• 📱 **WhatsApp & Sistem**: Ketik *"status log WhatsApp"* atau *"ringkasan database"*

Silakan ketik pertanyaan spesifik yang ingin Anda ketahui! 😊`;
}

// Main Entry Point for Admin Database AI Query
export async function processAdminDatabaseAiQuery(
  rawMessage: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>,
  userId?: string | null
): Promise<string> {
  const query = (rawMessage || "").trim();
  if (!query) {
    return "Silakan masukkan pertanyaan Anda seputar database, omzet, pesanan, menu, atau pelanggan.";
  }

  try {
    // 1. Fetch live snapshot from Prisma
    const snapshot = await getCompleteDatabaseSnapshot();

    // Resolve current user from userId, session, or default admin in DB
    let currentUser: any = null;
    if (userId) {
      try {
        currentUser = await prisma.user.findUnique({
          where: { id: userId },
        });
      } catch (err) {
        console.error("Error fetching user by id in processAdminDatabaseAiQuery:", err);
      }
    }

    if (!currentUser) {
      try {
        const session = await getSession();
        if (session?.id) {
          currentUser = await prisma.user.findUnique({
            where: { id: session.id },
          });
        }
      } catch (err) {
        console.error("Error fetching session user in processAdminDatabaseAiQuery:", err);
      }
    }

    // Default fallback to first admin if in admin context
    if (!currentUser) {
      try {
        currentUser = await prisma.user.findFirst({
          where: { role: "ADMIN" },
        });
      } catch (err) {
        console.error("Error fetching default admin in processAdminDatabaseAiQuery:", err);
      }
    }

    // 2. Multi-Provider AI Routing (Gemini, Groq, OpenAI, DeepSeek, Anthropic, or Local)
    const aiConfig = await getAiConfig();
    const activeProvider = aiConfig.activeProvider;

    if (activeProvider !== "local") {
      let apiKey = "";
      let model = "";

      if (activeProvider === "gemini") {
        apiKey = aiConfig.gemini.apiKey;
        model = aiConfig.gemini.model;
      } else if (activeProvider === "groq") {
        apiKey = aiConfig.groq.apiKey;
        model = aiConfig.groq.model;
      } else if (activeProvider === "openai") {
        apiKey = aiConfig.openai.apiKey;
        model = aiConfig.openai.model;
      } else if (activeProvider === "deepseek") {
        apiKey = aiConfig.deepseek.apiKey;
        model = aiConfig.deepseek.model;
      } else if (activeProvider === "anthropic") {
        apiKey = aiConfig.anthropic.apiKey;
        model = aiConfig.anthropic.model;
      }

      if (apiKey && apiKey.trim()) {
        const dbContext = formatSnapshotForGemini(snapshot);
        const systemPrompt = `Kamu adalah "Oji Enterprise", Asisten AI resmi Manajemen & Analis Database Utama untuk warung "Baso & Mie Ayam Ojolali".
Tugasmu adalah membantu Administrator warung membaca, memantau, dan menganalisis SELURUH database restoran secara akurat, ramah, profesional, dan 100% berbasis data riil database yang disertakan di bawah.

INFORMASI PENGGUNA YANG SEDANG BERTANYA:
- Nama: ${currentUser ? currentUser.name : "Budi Santoso (Admin Ojolali)"}
- Role Akun: ${currentUser ? currentUser.role : "ADMIN"} (Administrator)
- Email: ${currentUser ? currentUser.email : "admin@ojolali.test"}
- Nomor WhatsApp: ${currentUser ? currentUser.phone || "-" : "081234567890"}

PANDUAN MENJAWAB:
1. Jika pengguna bertanya "siapa saya", "nama saya", "profil saya", atau "akun saya", sebutkan langsung nama lengkapnya, role (Administrator), email, nomor WhatsApp, dan status hak aksesnya berdasarkan data pengguna di atas.
2. Jawablah langsung, jelas, dan akurat sesuai data database yang tersedia.
3. Gunakan format Markdown rapi: teks tebal (**...**) untuk angka, nama produk, status, omzet, dan poin penting agar sangat nyaman dibaca.
4. Selalu sebutkan angka dan rincian riil (misalnya jika ditanya "ada berapa penjualan hari ini", jawablah sesuai data: omzet hari ini ${formatRupiah(snapshot.financials.todayRevenue)}, jumlah transaksi selesai hari ini, status antrean saat ini, dan total transaksi keseluruhan).
5. Kamu memiliki visibilitas penuh ke seluruh 8 tabel database (Users, Categories, Products, Orders, OrderItems, Settings, NotificationLogs, OtpCodes).

${dbContext}`;

        const remoteReply = await executeAiQuery(
          activeProvider,
          apiKey,
          model,
          systemPrompt,
          query,
          history
        );

        if (remoteReply) {
          return remoteReply;
        }
      }
    }

    // 3. Fallback to Local Deterministic Database Intelligence Engine
    return runLocalDatabaseIntelligence(query, snapshot, currentUser);
  } catch (error: any) {
    console.error("Admin Database AI processing error:", error);
    if (error?.message?.includes("Can't reach database") || error?.message?.includes("localhost:3306")) {
      return `⚠️ **Koneksi Database Terputus:**\nTidak dapat terhubung ke database MySQL di \`localhost:3306\`. Mohon pastikan layanan MySQL di **Laragon** sudah aktif (**Start All**).`;
    }
    return `Maaf, terjadi kendala saat membaca database sistem. Silakan periksa koneksi database dan coba lagi.`;
  }
}
