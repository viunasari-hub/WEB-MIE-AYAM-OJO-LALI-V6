import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clear existing data (in correct cascade order)
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Users
  const passwordHash = await bcrypt.hash("password123", 10);
  const adminHash = await bcrypt.hash("admin123", 10);
  const cashierHash = await bcrypt.hash("kasir123", 10);
  const customerHash = await bcrypt.hash("customer123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Budi Santoso (Admin Ojolali)",
      email: "admin@ojolali.test",
      password: adminHash,
      role: "ADMIN",
      phone: "081234567890",
    },
  });

  const cashier = await prisma.user.create({
    data: {
      name: "Siti Rahma (Kasir 1)",
      email: "kasir@ojolali.test",
      password: cashierHash,
      role: "CASHIER",
      phone: "081298765432",
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      name: "Ahmad Fauzi",
      email: "customer@ojolali.test",
      password: customerHash,
      role: "CUSTOMER",
      phone: "085712345678",
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      name: "Dewi Lestari",
      email: "dewi@ojolali.test",
      password: passwordHash,
      role: "CUSTOMER",
      phone: "081377889900",
    },
  });

  console.log("Created users:", { admin: admin.email, cashier: cashier.email, customer: customer1.email });

  // 2. Categories
  const catBaso = await prisma.category.create({
    data: {
      name: "Baso Sapi",
      slug: "baso-sapi",
    },
  });

  const catMieAyam = await prisma.category.create({
    data: {
      name: "Mie Ayam",
      slug: "mie-ayam",
    },
  });

  const catMinuman = await prisma.category.create({
    data: {
      name: "Minuman & Ekstra",
      slug: "minuman-ekstra",
    },
  });

  // 3. Products
  const productsData = [
    {
      categoryId: catBaso.id,
      name: "Baso Biasa",
      description: "Semangkuk baso daging sapi asli berisi 5 butir baso halus, mie kuning, bihun, tahu, dan kuah kaldu sapi gurih khas Ojolali.",
      price: 15000,
      image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80",
      available: true,
    },
    {
      categoryId: catBaso.id,
      name: "Baso Spesial",
      description: "Baso urat gurih besar + 3 baso halus, tahu baso, pangsit renyah, tetelan empuk dan kuah kaldu rempah nikmat.",
      price: 20000,
      image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&auto=format&fit=crop&q=80",
      available: true,
    },
    {
      categoryId: catBaso.id,
      name: "Baso Komplit",
      description: "Pilihan paling puas! Baso urat jumbo, baso telur, baso halus, tahu bakso, tetelan sapi melimpah, dan taburan bawang goreng.",
      price: 25000,
      image: "https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&auto=format&fit=crop&q=80",
      available: true,
    },
    {
      categoryId: catMieAyam.id,
      name: "Mie Ayam Original",
      description: "Mie kenyal buatan sendiri disajikan dengan tumisan ayam kecap bumbu rempah gurih manis, sawi hijau segar, dan kaldu terpisah.",
      price: 15000,
      image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80",
      available: true,
    },
    {
      categoryId: catMieAyam.id,
      name: "Mie Ayam Baso",
      description: "Perpaduan favorit! Mie ayam manis gurih dilengkapi 2 butir baso sapi halus berkuah kaldu hangat dan renyahnya kerupuk pangsit.",
      price: 20000,
      image: "https://images.unsplash.com/photo-1552611052-33e04de081de?w=600&auto=format&fit=crop&q=80",
      available: true,
    },
    {
      categoryId: catMieAyam.id,
      name: "Mie Ayam Spesial",
      description: "Porsi jumbo komplit mie ayam dengan potongan ayam melimpah, 2 butir baso halus, 1 baso urat, ceker empuk, dan pangsit basah/goreng.",
      price: 25000,
      image: "https://images.unsplash.com/photo-1594998893017-36147cbcae05?w=600&auto=format&fit=crop&q=80",
      available: true,
    },
    {
      categoryId: catMinuman.id,
      name: "Pangsit Goreng Renyah (3 pcs)",
      description: "Pangsit renyah gurih dengan cocolan saus sambal khas Ojolali.",
      price: 5000,
      image: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=600&auto=format&fit=crop&q=80",
      available: true,
    },
    {
      categoryId: catMinuman.id,
      name: "Es Teh Manis Jumbo",
      description: "Teh melati wangi diseduh segar dengan gula pasir alami dan es batu menyegarkan.",
      price: 5000,
      image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80",
      available: true,
    },
    {
      categoryId: catMinuman.id,
      name: "Es Jeruk Peras Segar",
      description: "Perasan jeruk segar asli kaya vitamin C, manis asam dingin yang menyegarkan dahaga.",
      price: 7000,
      image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80",
      available: true,
    },
  ];

  const createdProducts = [];
  for (const prod of productsData) {
    const created = await prisma.product.create({ data: prod });
    createdProducts.push(created);
  }

  console.log(`Created ${createdProducts.length} products`);

  // 4. Dummy Orders across dates
  const now = new Date();
  const getPastDate = (daysAgo: number, hoursAgo = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(d.getHours() - hoursAgo);
    return d;
  };

  const sampleOrders = [
    {
      orderNumber: "ORD-20261001-001",
      userId: customer1.id,
      customerName: "Ahmad Fauzi",
      customerPhone: "085712345678",
      status: "COMPLETED",
      paymentMethod: "QRIS",
      paymentStatus: "PAID",
      notes: "Kuah dipisah, sambal sedikit",
      createdAt: getPastDate(7, 2),
      items: [
        { product: createdProducts[1], qty: 2 }, // Baso Spesial (2 x 20.000)
        { product: createdProducts[7], qty: 2 }, // Es Teh (2 x 5.000)
      ],
    },
    {
      orderNumber: "ORD-20261002-002",
      userId: customer2.id,
      customerName: "Dewi Lestari",
      customerPhone: "081377889900",
      status: "COMPLETED",
      paymentMethod: "CASH",
      paymentStatus: "PAID",
      notes: "Mie ayam tanpa daun bawang ya",
      createdAt: getPastDate(6, 4),
      items: [
        { product: createdProducts[4], qty: 2 }, // Mie Ayam Baso (2 x 20.000)
        { product: createdProducts[8], qty: 2 }, // Es Jeruk (2 x 7.000)
      ],
    },
    {
      orderNumber: "ORD-20261003-003",
      userId: null,
      customerName: "Pak Camat & Staf",
      customerPhone: "081200112233",
      status: "COMPLETED",
      paymentMethod: "TRANSFER",
      paymentStatus: "PAID",
      notes: "Pesanan kantor kecamatan, bawa ke lantai 2",
      createdAt: getPastDate(5, 3),
      items: [
        { product: createdProducts[2], qty: 4 }, // Baso Komplit (4 x 25.000)
        { product: createdProducts[5], qty: 3 }, // Mie Ayam Spesial (3 x 25.000)
        { product: createdProducts[7], qty: 7 }, // Es Teh (7 x 5.000)
      ],
    },
    {
      orderNumber: "ORD-20261004-004",
      userId: customer1.id,
      customerName: "Ahmad Fauzi",
      customerPhone: "085712345678",
      status: "COMPLETED",
      paymentMethod: "QRIS",
      paymentStatus: "PAID",
      notes: "Makan di tempat meja 4",
      createdAt: getPastDate(4, 1),
      items: [
        { product: createdProducts[0], qty: 2 }, // Baso Biasa (2 x 15.000)
        { product: createdProducts[6], qty: 1 }, // Pangsit (1 x 5.000)
        { product: createdProducts[7], qty: 2 }, // Es Teh (2 x 5.000)
      ],
    },
    {
      orderNumber: "ORD-20261005-005",
      userId: customer2.id,
      customerName: "Dewi Lestari",
      customerPhone: "081377889900",
      status: "COMPLETED",
      paymentMethod: "CASH",
      paymentStatus: "PAID",
      notes: "Bungkus bawa pulang",
      createdAt: getPastDate(3, 5),
      items: [
        { product: createdProducts[4], qty: 3 }, // Mie Ayam Baso (3 x 20.000)
        { product: createdProducts[7], qty: 3 }, // Es Teh (3 x 5.000)
      ],
    },
    {
      orderNumber: "ORD-20261006-006",
      userId: null,
      customerName: "Rudi Hartono",
      customerPhone: "081599887766",
      status: "COMPLETED",
      paymentMethod: "QRIS",
      paymentStatus: "PAID",
      notes: "Banyakin bawang goreng",
      createdAt: getPastDate(2, 6),
      items: [
        { product: createdProducts[1], qty: 2 }, // Baso Spesial (2 x 20.000)
        { product: createdProducts[4], qty: 1 }, // Mie Ayam Baso (1 x 20.000)
        { product: createdProducts[8], qty: 2 }, // Es Jeruk (2 x 7.000)
      ],
    },
    {
      orderNumber: "ORD-20261007-007",
      userId: customer1.id,
      customerName: "Ahmad Fauzi",
      customerPhone: "085712345678",
      status: "COMPLETED",
      paymentMethod: "QRIS",
      paymentStatus: "PAID",
      notes: "Sambal banyak ya mas",
      createdAt: getPastDate(1, 3),
      items: [
        { product: createdProducts[2], qty: 2 }, // Baso Komplit (2 x 25.000)
        { product: createdProducts[7], qty: 2 }, // Es Teh (2 x 5.000)
      ],
    },
    // Today's orders
    {
      orderNumber: "ORD-20261008-001",
      userId: customer1.id,
      customerName: "Ahmad Fauzi",
      customerPhone: "085712345678",
      status: "READY",
      paymentMethod: "QRIS",
      paymentStatus: "PAID",
      notes: "Meja No. 03",
      createdAt: getPastDate(0, 2),
      items: [
        { product: createdProducts[4], qty: 2 }, // Mie Ayam Baso
        { product: createdProducts[1], qty: 1 }, // Baso Spesial
        { product: createdProducts[7], qty: 2 }, // Es Teh
      ],
    },
    {
      orderNumber: "ORD-20261008-002",
      userId: null,
      customerName: "Ibu Nurul Hidayah",
      customerPhone: "082133445566",
      status: "PROCESSING",
      paymentMethod: "CASH",
      paymentStatus: "PAID",
      notes: "Baso kuah panas, tidak pedas sama sekali",
      createdAt: getPastDate(0, 1),
      items: [
        { product: createdProducts[2], qty: 2 }, // Baso Komplit
        { product: createdProducts[8], qty: 2 }, // Es Jeruk
      ],
    },
    {
      orderNumber: "ORD-20261008-003",
      userId: customer2.id,
      customerName: "Dewi Lestari",
      customerPhone: "081377889900",
      status: "PENDING",
      paymentMethod: "QRIS",
      paymentStatus: "PENDING",
      notes: "Tolong segera disiapkan",
      createdAt: getPastDate(0, 0),
      items: [
        { product: createdProducts[3], qty: 2 }, // Mie Ayam Original
        { product: createdProducts[6], qty: 2 }, // Pangsit Goreng
        { product: createdProducts[7], qty: 2 }, // Es Teh
      ],
    },
  ];

  for (const o of sampleOrders) {
    const total = o.items.reduce((acc, item) => acc + item.product.price * item.qty, 0);

    const createdOrder = await prisma.order.create({
      data: {
        orderNumber: o.orderNumber,
        userId: o.userId,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        total,
        status: o.status,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        notes: o.notes,
        createdAt: o.createdAt,
        updatedAt: o.createdAt,
      },
    });

    for (const item of o.items) {
      await prisma.orderItem.create({
        data: {
          orderId: createdOrder.id,
          productId: item.product.id,
          quantity: item.qty,
          price: item.product.price,
          subtotal: item.product.price * item.qty,
        },
      });
    }
  }

  console.log(`Created ${sampleOrders.length} sample orders successfully!`);
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
