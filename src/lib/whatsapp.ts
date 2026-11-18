import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";

export interface WhatsAppConfig {
  mode: "mock" | "production";
  apiUrl: string;
  apiToken: string;
  adminNumber: string;
  enabled: boolean;
}

export interface SendWhatsAppResult {
  success: boolean;
  status: "Terkirim" | "Simulasi Terkirim" | "Gagal";
  mode: "mock" | "production";
  message: string;
  error?: string;
  recipientPhone: string;
}

export interface OrderItemDetail {
  id?: string;
  quantity: number;
  price: number;
  subtotal: number;
  product?: {
    name: string;
  } | null;
}

export interface OrderDetailForNotification {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string | null;
  total: number;
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
  notes?: string | null;
  createdAt: Date | string;
  items?: OrderItemDetail[];
}

/**
 * Format phone number to international format without + or spaces: 628xxxxxxxxxx
 */
export function formatPhoneWhatsApp(rawPhone: string | null | undefined): string {
  if (!rawPhone) return "";
  let cleaned = rawPhone.replace(/\D/g, ""); // keep only numbers

  // 08xx -> 628xx
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  }
  // 8xx -> 628xx
  else if (cleaned.startsWith("8")) {
    cleaned = "62" + cleaned;
  }
  // +62 was already converted to 62 by stripping \D

  return cleaned;
}

/**
 * Validate WhatsApp number format (Indonesian 628... with 10-15 digits)
 */
export function isValidWhatsAppNumber(phone: string): boolean {
  const formatted = formatPhoneWhatsApp(phone);
  return /^62\d{9,14}$/.test(formatted);
}

/**
 * Get active WhatsApp configuration from Database Settings with fallback to Environment Variables
 */
export async function getWhatsAppConfig(): Promise<WhatsAppConfig> {
  const defaultMode = (process.env.WHATSAPP_MODE === "production" ? "production" : "mock") as "mock" | "production";
  const defaultApiUrl = process.env.WHATSAPP_API_URL || "https://api.fonnte.com/send";
  const defaultApiToken = process.env.WHATSAPP_API_TOKEN || "";
  const defaultAdminNumber = formatPhoneWhatsApp(process.env.WHATSAPP_ADMIN_NUMBER || "6281234567890");

  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            "whatsapp_mode",
            "whatsapp_api_url",
            "whatsapp_api_token",
            "whatsapp_admin_number",
            "whatsapp_enabled",
          ],
        },
      },
    });

    const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

    const mode = (settingsMap.get("whatsapp_mode") as "mock" | "production") || defaultMode;
    const apiUrl = settingsMap.get("whatsapp_api_url") || defaultApiUrl;
    const apiToken = settingsMap.get("whatsapp_api_token") || defaultApiToken;
    const adminNumber = formatPhoneWhatsApp(settingsMap.get("whatsapp_admin_number") || defaultAdminNumber);
    const enabled = settingsMap.get("whatsapp_enabled") !== "false";

    return {
      mode: mode === "production" ? "production" : "mock",
      apiUrl,
      apiToken,
      adminNumber: adminNumber || defaultAdminNumber,
      enabled,
    };
  } catch (err) {
    console.error("Error reading WhatsApp settings from DB, using fallback:", err);
    return {
      mode: defaultMode,
      apiUrl: defaultApiUrl,
      apiToken: defaultApiToken,
      adminNumber: defaultAdminNumber,
      enabled: true,
    };
  }
}

/**
 * Save WhatsApp configuration to database
 */
export async function saveWhatsAppConfig(config: Partial<WhatsAppConfig>): Promise<void> {
  const entries: { key: string; value: string }[] = [];

  if (config.mode !== undefined) entries.push({ key: "whatsapp_mode", value: config.mode });
  if (config.apiUrl !== undefined) entries.push({ key: "whatsapp_api_url", value: config.apiUrl });
  if (config.apiToken !== undefined) entries.push({ key: "whatsapp_api_token", value: config.apiToken });
  if (config.adminNumber !== undefined) {
    entries.push({ key: "whatsapp_admin_number", value: formatPhoneWhatsApp(config.adminNumber) });
  }
  if (config.enabled !== undefined) {
    entries.push({ key: "whatsapp_enabled", value: config.enabled ? "true" : "false" });
  }

  for (const item of entries) {
    await prisma.setting.upsert({
      where: { key: item.key },
      create: { key: item.key, value: item.value },
      update: { value: item.value },
    });
  }
}

/**
 * Core function to send WhatsApp message (Supports Mock and Production Mode)
 */
export async function sendWhatsAppMessage(params: {
  to: string;
  message: string;
  orderId?: string;
  recipientType?: "ADMIN" | "CUSTOMER";
  type: string;
}): Promise<SendWhatsAppResult> {
  const { to, message, orderId, recipientType = "ADMIN", type } = params;
  const config = await getWhatsAppConfig();

  const formattedTo = formatPhoneWhatsApp(to);

  if (!formattedTo) {
    const errorMsg = "Nomor WhatsApp tujuan tidak valid atau kosong";
    // Log failure
    await logNotification({
      orderId,
      recipientPhone: to || "-",
      recipientType,
      type,
      message,
      status: "Gagal",
      errorMessage: errorMsg,
    });
    return {
      success: false,
      status: "Gagal",
      mode: config.mode,
      message: errorMsg,
      error: errorMsg,
      recipientPhone: to || "-",
    };
  }

  // --- MOCK MODE ---
  if (config.mode === "mock") {
    console.log("====================================================");
    console.log(`[WHATSAPP MOCK SIMULASI] -> ${recipientType} (${formattedTo})`);
    console.log(`Tipe Notifikasi: ${type}`);
    console.log(`Order ID: ${orderId || "-"}`);
    console.log("------------------ ISI PESAN -----------------------");
    console.log(message);
    console.log("====================================================");

    // Save log to DB
    await logNotification({
      orderId,
      recipientPhone: formattedTo,
      recipientType,
      type,
      message,
      status: "Simulasi Terkirim",
    });

    if (orderId) {
      await updateOrderWhatsAppStatus(orderId, "MOCK_SENT");
    }

    return {
      success: true,
      status: "Simulasi Terkirim",
      mode: "mock",
      message: "Pesan disimulasikan terkirim (Mode Mock)",
      recipientPhone: formattedTo,
    };
  }

  // --- PRODUCTION MODE ---
  try {
    if (!config.apiToken && !config.apiUrl) {
      throw new Error("WHATSAPP_API_TOKEN atau WHATSAPP_API_URL belum dikonfigurasi di Pengaturan WhatsApp");
    }

    // Provider integration: Default standard format (Fonnte / Wablas / generic REST)
    // We send JSON payload compatible with most WhatsApp Gateways
    let response: Response;

    if (config.apiUrl.includes("facebook.com") || config.apiUrl.includes("whatsapp.biz")) {
      // WhatsApp Cloud API (Meta)
      response = await fetch(config.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: formattedTo,
          type: "text",
          text: { body: message },
        }),
      });
    } else {
      // Standard Gateway (e.g. Fonnte, Wablas, RuangWA, Starsender, etc.)
      response = await fetch(config.apiUrl, {
        method: "POST",
        headers: {
          Authorization: config.apiToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target: formattedTo,
          phone: formattedTo,
          receiver: formattedTo,
          message: message,
        }),
      });
    }

    const responseText = await response.text();
    let responseData: Record<string, unknown> = {};
    try {
      responseData = JSON.parse(responseText);
    } catch {
      // response might be raw text
    }

    if (!response.ok) {
      const errorMsg = `HTTP ${response.status}: ${responseData.reason || responseData.message || responseText || "Gagal mengirim ke gateway WhatsApp"}`;
      await logNotification({
        orderId,
        recipientPhone: formattedTo,
        recipientType,
        type,
        message,
        status: "Gagal",
        errorMessage: errorMsg,
      });
      if (orderId) {
        await updateOrderWhatsAppStatus(orderId, "FAILED");
      }
      return {
        success: false,
        status: "Gagal",
        mode: "production",
        message: errorMsg,
        error: errorMsg,
        recipientPhone: formattedTo,
      };
    }

    // Success in Production
    await logNotification({
      orderId,
      recipientPhone: formattedTo,
      recipientType,
      type,
      message,
      status: "Terkirim",
    });

    if (orderId) {
      await updateOrderWhatsAppStatus(orderId, "SENT");
    }

    return {
      success: true,
      status: "Terkirim",
      mode: "production",
      message: "Pesan WhatsApp berhasil dikirim ke server gateway",
      recipientPhone: formattedTo,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Kesalahan koneksi gateway WhatsApp";
    console.error("WhatsApp Send Error:", err);
    await logNotification({
      orderId,
      recipientPhone: formattedTo,
      recipientType,
      type,
      message,
      status: "Gagal",
      errorMessage: errorMsg,
    });
    if (orderId) {
      await updateOrderWhatsAppStatus(orderId, "FAILED");
    }
    return {
      success: false,
      status: "Gagal",
      mode: "production",
      message: errorMsg,
      error: errorMsg,
      recipientPhone: formattedTo,
    };
  }
}

/**
 * Log notification to database
 */
async function logNotification(data: {
  orderId?: string;
  recipientPhone: string;
  recipientType: "ADMIN" | "CUSTOMER";
  type: string;
  message: string;
  status: string;
  errorMessage?: string;
}) {
  try {
    let validOrderId: string | null = null;
    if (data.orderId) {
      const orderExists = await prisma.order.findUnique({
        where: { id: data.orderId },
        select: { id: true },
      });
      if (orderExists) {
        validOrderId = orderExists.id;
      }
    }

    await prisma.notificationLog.create({
      data: {
        orderId: validOrderId,
        recipientPhone: data.recipientPhone,
        recipientType: data.recipientType,
        type: data.type,
        message: data.message,
        status: data.status,
        errorMessage: data.errorMessage || null,
      },
    });
  } catch (err) {
    console.error("Failed to save notification log:", err);
  }
}

/**
 * Update order's WhatsApp status
 */
async function updateOrderWhatsAppStatus(orderId: string, status: "SENT" | "FAILED" | "MOCK_SENT") {
  try {
    const exists = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });
    if (!exists) return;

    await prisma.order.update({
      where: { id: orderId },
      data: {
        whatsappStatus: status,
        whatsappLastSent: new Date(),
      },
    });
  } catch (err) {
    console.error("Failed to update order WhatsApp status:", err);
  }
}

/**
 * Format order date & time in Indonesian
 */
function formatOrderDateTime(dateInput: Date | string) {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const dateStr = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
  const timeStr = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return { dateStr, timeStr };
}

/**
 * Template 1: NOTIFIKASI PESANAN BARU (Dikirim ke Admin)
 * Sesuai format yang diminta user
 */
export function buildNewOrderAdminMessage(order: OrderDetailForNotification): string {
  const { dateStr, timeStr } = formatOrderDateTime(order.createdAt);
  const itemsText = (order.items || [])
    .map((item) => {
      const name = item.product?.name || "Item Menu";
      const icon = name.toLowerCase().includes("mie") ? "🍜" : "🍲";
      return `${icon} ${name} x${item.quantity} = ${formatRupiah(item.subtotal)}`;
    })
    .join("\n");

  const statusLabel =
    order.status === "PENDING"
      ? "Menunggu"
      : order.status === "PROCESSING"
      ? "Diproses"
      : order.status === "READY"
      ? "Siap"
      : order.status === "COMPLETED"
      ? "Selesai"
      : "Dibatalkan";

  return `🔔 PESANAN BARU - MIE AYAM & BAKSO OJOLALI

No. Pesanan: ${order.orderNumber}
Tanggal: ${dateStr}
Jam: ${timeStr}

Pelanggan: ${order.customerName}
No. WhatsApp: ${order.customerPhone || "-"}

Detail Pesanan:
${itemsText || "-"}

Total Pesanan: ${formatRupiah(order.total)}
Metode Pembayaran: ${order.paymentMethod || "CASH"}
Status: ${statusLabel}${order.notes ? `\nCatatan: ${order.notes}` : ""}

Silakan buka dashboard admin untuk memproses pesanan.`;
}

/**
 * Template Customer: Konfirmasi Pesanan Baru diterima
 */
export function buildNewOrderCustomerMessage(order: OrderDetailForNotification): string {
  const { dateStr, timeStr } = formatOrderDateTime(order.createdAt);
  const itemsText = (order.items || [])
    .map((item) => {
      const name = item.product?.name || "Item Menu";
      return `• ${name} x${item.quantity} = ${formatRupiah(item.subtotal)}`;
    })
    .join("\n");

  return `🍜 Halo Kak ${order.customerName}!

Terima kasih telah memesan di *Mie Ayam & Bakso Ojolali*. Pesanan Anda telah kami terima dan segera diteruskan ke dapur.

No. Pesanan: ${order.orderNumber}
Waktu: ${dateStr}, ${timeStr}

Rincian:
${itemsText}

Total: ${formatRupiah(order.total)} (${order.paymentMethod || "CASH"})
Status: Menunggu konfirmasi

Kami akan mengirimkan notifikasi kembali saat pesanan Anda mulai diproses. Selamat menikmati!`;
}

/**
 * Template 2: NOTIFIKASI PERUBAHAN STATUS (Dikirim ke Pelanggan)
 * Sesuai instruksi spesifik user:
 * - DIPROSES (PROCESSING)
 * - SIAP (READY)
 * - SELESAI (COMPLETED)
 * - DIBATALKAN (CANCELLED)
 */
export function buildOrderStatusCustomerMessage(
  order: OrderDetailForNotification,
  newStatus: string
): string | null {
  switch (newStatus) {
    case "PROCESSING":
      return `🍳 PESANAN SEDANG DIPROSES

No. Pesanan: ${order.orderNumber}

Pesanan Anda sedang diproses oleh dapur Mie Ayam & Bakso Ojolali.

Mohon menunggu.`;

    case "READY":
      return `✅ PESANAN SUDAH SIAP

No. Pesanan: ${order.orderNumber}

Pesanan Anda sudah siap diambil/dihidangkan.

Silakan datang ke tempat pengambilan pesanan.`;

    case "COMPLETED":
      return `🎉 PESANAN SELESAI

No. Pesanan: ${order.orderNumber}

Pesanan Anda telah selesai.

Terima kasih telah memesan di Mie Ayam & Bakso Ojolali.`;

    case "CANCELLED":
      return `❌ PESANAN DIBATALKAN

No. Pesanan: ${order.orderNumber}

Pesanan Anda telah dibatalkan.

Silakan hubungi kasir atau buat pesanan kembali melalui website.`;

    default:
      return null;
  }
}

/**
 * Template Status Change for Admin
 */
export function buildOrderStatusAdminMessage(
  order: OrderDetailForNotification,
  newStatus: string,
  updatedBy: string = "Sistem/Kasir"
): string {
  const statusLabels: Record<string, string> = {
    PENDING: "Menunggu",
    PROCESSING: "Sedang Diproses Dapur",
    READY: "Siap Disajikan/Diambil",
    COMPLETED: "Selesai",
    CANCELLED: "DIBATALKAN",
  };

  return `📢 UPDATE STATUS PESANAN - OJOLALI

No. Pesanan: ${order.orderNumber}
Pelanggan: ${order.customerName}
Status Terbaru: ${statusLabels[newStatus] || newStatus}
Diperbarui oleh: ${updatedBy}
Total: ${formatRupiah(order.total)}`;
}

/**
 * High-level function: Send WhatsApp Notification when a New Order is Created
 */
export async function notifyNewOrder(order: OrderDetailForNotification) {
  const config = await getWhatsAppConfig();
  if (!config.enabled) return;

  // 1. Send notification to Admin
  const adminMsg = buildNewOrderAdminMessage(order);
  await sendWhatsAppMessage({
    to: config.adminNumber,
    message: adminMsg,
    orderId: order.id,
    recipientType: "ADMIN",
    type: "Pesanan Baru",
  });

  // 2. If customer has valid WhatsApp number, also send confirmation to customer
  if (order.customerPhone && isValidWhatsAppNumber(order.customerPhone)) {
    const customerMsg = buildNewOrderCustomerMessage(order);
    await sendWhatsAppMessage({
      to: order.customerPhone,
      message: customerMsg,
      orderId: order.id,
      recipientType: "CUSTOMER",
      type: "Konfirmasi Pesanan",
    });
  }
}

/**
 * High-level function: Send WhatsApp Notification when Order Status Changes
 */
export async function notifyOrderStatusChange(
  order: OrderDetailForNotification,
  newStatus: string,
  oldStatus?: string
) {
  // Prevent duplicate notifications if status hasn't actually changed
  if (oldStatus && oldStatus === newStatus) {
    return;
  }

  const config = await getWhatsAppConfig();
  if (!config.enabled) return;

  const typeNameMap: Record<string, string> = {
    PROCESSING: "Status Diproses",
    READY: "Status Siap",
    COMPLETED: "Status Selesai",
    CANCELLED: "Status Dibatalkan",
  };
  const typeName = typeNameMap[newStatus] || `Status ${newStatus}`;

  // 1. Send WhatsApp to Customer if customer provided a phone number
  if (order.customerPhone && isValidWhatsAppNumber(order.customerPhone)) {
    const customerMsg = buildOrderStatusCustomerMessage(order, newStatus);
    if (customerMsg) {
      await sendWhatsAppMessage({
        to: order.customerPhone,
        message: customerMsg,
        orderId: order.id,
        recipientType: "CUSTOMER",
        type: typeName,
      });
    }
  }

  // 2. If order is cancelled, notify admin immediately
  if (newStatus === "CANCELLED") {
    const adminMsg = buildOrderStatusAdminMessage(order, newStatus);
    await sendWhatsAppMessage({
      to: config.adminNumber,
      message: adminMsg,
      orderId: order.id,
      recipientType: "ADMIN",
      type: "Pesanan Dibatalkan",
    });
  }
}

/**
 * High-level function: Manual Resend WhatsApp for an Order
 */
export async function resendOrderWhatsApp(
  order: OrderDetailForNotification,
  target: "ADMIN" | "CUSTOMER"
): Promise<SendWhatsAppResult> {
  const config = await getWhatsAppConfig();

  if (target === "ADMIN") {
    const adminMsg = buildNewOrderAdminMessage(order);
    return await sendWhatsAppMessage({
      to: config.adminNumber,
      message: adminMsg,
      orderId: order.id,
      recipientType: "ADMIN",
      type: "Kirim Ulang Admin",
    });
  } else {
    if (!order.customerPhone || !isValidWhatsAppNumber(order.customerPhone)) {
      return {
        success: false,
        status: "Gagal",
        mode: config.mode,
        message: "Nomor WhatsApp pelanggan tidak valid atau kosong",
        error: "Nomor WhatsApp pelanggan tidak valid",
        recipientPhone: order.customerPhone || "-",
      };
    }

    // Determine appropriate message based on current order status
    let customerMsg = buildOrderStatusCustomerMessage(order, order.status);
    if (!customerMsg) {
      customerMsg = buildNewOrderCustomerMessage(order);
    }

    return await sendWhatsAppMessage({
      to: order.customerPhone,
      message: customerMsg,
      orderId: order.id,
      recipientType: "CUSTOMER",
      type: `Kirim Ulang (${order.status})`,
    });
  }
}
