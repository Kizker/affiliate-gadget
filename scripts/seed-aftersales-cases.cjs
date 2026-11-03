const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('--- STARTING AFTERSALES DIVERSE SEED (ALL FRESH PENDING) ---');

  // Verify Budi's store group
  const budi = await prisma.user.findFirst({
    where: { email: 'aftersales.roxy@affiliategadget.com' },
    include: {
      managedGroup: {
        include: { stores: true },
      },
    },
  });

  if (!budi || !budi.managedGroup) {
    console.error('Budi or Budi store group not found!');
    return;
  }

  // Ensure Semarang & Surabaya stores are attached to Budi's group if they exist in DB
  const allStores = await prisma.store.findMany();
  for (const s of allStores) {
    if (s.name.includes('Semarang') || s.name.includes('Surabaya') || s.name.includes('Roxy')) {
      await prisma.store.update({
        where: { id: s.id },
        data: { groupId: budi.managedGroup.id },
      });
    }
  }

  // Refetch stores
  const updatedGroup = await prisma.storeGroup.findUnique({
    where: { id: budi.managedGroup.id },
    include: { stores: true },
  });

  const stores = updatedGroup.stores.length > 0 ? updatedGroup.stores : allStores;
  console.log('Stores in group:', stores.map(s => s.name));
  const storeRoxy = stores.find(s => s.slug.includes('roxy') || s.name.includes('Roxy')) || stores[0];
  const storeSemarang = stores.find(s => s.slug.includes('semarang') || s.name.includes('Semarang')) || stores[1] || storeRoxy;
  const storeSurabaya = stores.find(s => s.slug.includes('surabaya') || s.name.includes('Surabaya')) || stores[2] || storeRoxy;

  // Cleanup old test seed orders
  console.log('Cleaning up old test seed orders...');
  const oldOrders = await prisma.order.findMany({
    where: {
      OR: [
        { orderNumber: { startsWith: 'ORD-ROX-' } },
        { orderNumber: { startsWith: 'ORD-SMG-' } },
        { orderNumber: { startsWith: 'ORD-SBY-' } },
      ],
    },
    select: { id: true },
  });

  const oldOrderIds = oldOrders.map(o => o.id);
  if (oldOrderIds.length > 0) {
    // Delete chat messages in rooms linked to these orders
    const oldRooms = await prisma.adminChatRoom.findMany({
      where: { orderId: { in: oldOrderIds } },
      select: { id: true },
    });
    const oldRoomIds = oldRooms.map(r => r.id);
    if (oldRoomIds.length > 0) {
      await prisma.adminChatMessage.deleteMany({ where: { roomId: { in: oldRoomIds } } });
      await prisma.adminChatRoom.deleteMany({ where: { id: { in: oldRoomIds } } });
    }

    await prisma.complaint.deleteMany({ where: { orderId: { in: oldOrderIds } } });
    await prisma.returnRequest.deleteMany({ where: { orderId: { in: oldOrderIds } } });
    await prisma.payment.deleteMany({ where: { orderId: { in: oldOrderIds } } });
    await prisma.orderItem.deleteMany({ where: { orderId: { in: oldOrderIds } } });
    await prisma.order.deleteMany({ where: { id: { in: oldOrderIds } } });
    console.log(`Cleaned up ${oldOrderIds.length} old test orders.`);
  }

  // Get real customer accounts
  const customers = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    take: 10,
  });

  const getCust = (idx) => customers[idx % customers.length];

  // Cases definitions - ALL RETURN REQUESTS ARE STRICTLY 'PENDING' (NO DECISIONS MADE YET)
  const testCases = [
    // 1. ROXY MAS - Siti Aminah - iPhone 15 Pro Max - COMPLETED (Normal inquiry - No return)
    {
      storeId: storeRoxy.id,
      customer: getCust(1),
      productName: 'iPhone 15 Pro Max 8GB/1TB White Titanium',
      productPrice: 26999000,
      orderNumber: `ORD-ROX-101-IP15`,
      courierCode: 'JNE',
      courierService: 'YES',
      trackingNumber: `WYB-ROX-00101`,
      chatMessages: [
        {
          type: 'order_reference',
          content: null,
          sender: 'CUSTOMER',
        },
        {
          type: 'text',
          content: 'Halo kak, unit iPhone 15 Pro Max nya sudah sampai dengan mulus ya. Garansi toko 30 hari nya terhitung mulai hari ini ya? Kalau mau klaim baterai misal drop bagaimana prosedurnya?',
          sender: 'CUSTOMER',
        },
        {
          type: 'text',
          content: 'Halo Kak Siti! Betul sekali, garansi 30 hari tukar unit baru terhitung sejak barang diterima. Jika ada kendala teknis atau baterai drop, silakan langsung infokan ke kami di chat ini ya kak.',
          sender: 'ADMIN',
        },
      ],
      returnRequest: null,
      complaint: null,
    },

    // 2. ROXY MAS - Dimas Setiawan - Galaxy Z Fold 6 - COMPLETED (Return Request: PENDING - Tukar Unit)
    {
      storeId: storeRoxy.id,
      customer: getCust(2),
      productName: 'Galaxy Z Fold 6 12GB/256GB Silver Shadow',
      productPrice: 26499000,
      orderNumber: `ORD-ROX-102-ZFOLD`,
      courierCode: 'GOJEK',
      courierService: 'Instant',
      trackingNumber: `GK-ROX-00102`,
      chatMessages: [
        {
          type: 'order_reference',
          content: null,
          sender: 'CUSTOMER',
        },
        {
          type: 'text',
          content: 'Pagi kak, Z Fold 6 nya saat saya buka layarnya engselnya agak bersuara klik kasar dan terasa berat. Saya sudah ajukan penukaran unit baru di menu retur mohon ditinjau ya kak.',
          sender: 'CUSTOMER',
        },
        {
          type: 'text',
          content: 'Halo Kak Dimas, pengajuan tukar unit baru telah kami terima. Tim After Sales kami sedang mengecek dokumen dan bukti kendalanya.',
          sender: 'ADMIN',
        },
      ],
      returnRequest: {
        type: 'REPLACEMENT',
        reason: 'PRODUK_RUSAK',
        reasonLabel: 'Cacat Fisik / Engsel Kasar',
        description: 'Engsel layar lipat bersuara keras saat dibuka, ada hambatan saat melipat unit baru',
        images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500'],
        status: 'PENDING',
        storeResponse: null,
      },
      complaint: null,
    },

    // 3. ROXY MAS - Maya Kartika - Blackberry Z10 - COMPLETED (Return Request: PENDING - Belum Diputuskan)
    {
      storeId: storeRoxy.id,
      customer: getCust(3),
      productName: 'Blackberry Z10 12GB/12GB White Cream',
      productPrice: 25000000,
      orderNumber: `ORD-ROX-103-BBZ10`,
      courierCode: 'JNE',
      courierService: 'REG',
      trackingNumber: `WYB-ROX-00103`,
      chatMessages: [
        {
          type: 'order_reference',
          content: null,
          sender: 'CUSTOMER',
        },
        {
          type: 'text',
          content: 'Halo kak, layar HP saya retak karena terjatuh dari meja kerja kemarin malam. Saya sudah buat pengajuan retur di sistem, apakah bisa diproses ganti unit?',
          sender: 'CUSTOMER',
        },
        {
          type: 'text',
          content: 'Halo Kak Maya, kami telah menerima pengajuan retur Kakak. Tim After Sales akan meninjau foto bukti dan syarat ketentuan garansi 30 hari terlebih dahulu.',
          sender: 'ADMIN',
        },
      ],
      returnRequest: {
        type: 'REFUND',
        reason: 'CACAT_PENGGUNA',
        reasonLabel: 'Kerusakan Fisik Terjatuh',
        description: 'Layar retak akibat benturan keras setelah jatuh dari meja kerja',
        images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500'],
        bankName: 'BCA',
        bankAccountNumber: '5420918231',
        bankAccountName: 'Maya Kartika',
        status: 'PENDING',
        storeResponse: null,
      },
      complaint: null,
    },

    // 4. SEMARANG - Fajar Nugroho - Xiaomi 14 Ultra - COMPLETED (Return Request: PENDING - Salah Varian)
    {
      storeId: storeSemarang.id,
      customer: getCust(4),
      productName: 'Xiaomi Xiaomi 14 Ultra Leica Optics #9',
      productPrice: 15599000,
      orderNumber: `ORD-SMG-104-MI14U`,
      courierCode: 'JNE',
      courierService: 'YES',
      trackingNumber: `WYB-SMG-00104`,
      chatMessages: [
        {
          type: 'order_reference',
          content: null,
          sender: 'CUSTOMER',
        },
        {
          type: 'text',
          content: 'Halo aftersales Semarang, unit Xiaomi 14 Ultra pesanan saya tertukar warna. Saya pesan warna hitam, tapi yang tiba warna putih. Dus segel utuh belum saya buka. Mohon ditukar unit sesuai pesanan ya.',
          sender: 'CUSTOMER',
        },
        {
          type: 'text',
          content: 'Halo Kak Fajar, mohon maaf atas ketidaknyamanannya. Pengajuan tukar unit varian warna sudah masuk di menu retur dan sedang diverifikasi oleh admin after sales.',
          sender: 'ADMIN',
        },
      ],
      returnRequest: {
        type: 'REPLACEMENT',
        reason: 'SALAH_VARIAN',
        reasonLabel: 'Varian Warna Tertukar',
        description: 'Pesanan varian warna hitam, yang tiba warna putih. Dus segel utuh belum digunakan.',
        images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500'],
        status: 'PENDING',
        storeResponse: null,
      },
      complaint: null,
    },

    // 5. SEMARANG - Anisa Putri Wijaya - Sony WH-1000XM5 - COMPLETED (Feedback normal - No return)
    {
      storeId: storeSemarang.id,
      customer: getCust(5),
      productName: 'Sony Sony WH-1000XM5 Wireless Headphones #25',
      productPrice: 4699000,
      orderNumber: `ORD-SMG-105-SONY`,
      courierCode: 'GOJEK',
      courierService: 'SameDay',
      trackingNumber: `GK-SMG-00105`,
      chatMessages: [
        {
          type: 'order_reference',
          content: null,
          sender: 'CUSTOMER',
        },
        {
          type: 'text',
          content: 'Barang sudah sampai kak! Suara mantap, ANC bekerja sempurna, terima kasih bonus pouch dan kabel cadangannya ya Affiliate Gadget Semarang!',
          sender: 'CUSTOMER',
        },
        {
          type: 'text',
          content: 'Sama-sama Kak Anisa! Senang sekali mendengarnya. Nikmati audio berkualitas tinggi dan simpan invoice garansi digital Kakak ya.',
          sender: 'ADMIN',
        },
      ],
      returnRequest: null,
      complaint: null,
    },

    // 6. SURABAYA - Rian Pratama - Galaxy S24 Ultra - COMPLETED (Return Request: PENDING - Refund Mic Rusak)
    {
      storeId: storeSurabaya.id,
      customer: getCust(0),
      productName: 'Galaxy S24 Ultra 12GB/512GB Titanium Violet',
      productPrice: 21999000,
      orderNumber: `ORD-SBY-106-S24U`,
      courierCode: 'JNE',
      courierService: 'YES',
      trackingNumber: `WYB-SBY-00106`,
      chatMessages: [
        {
          type: 'order_reference',
          content: null,
          sender: 'CUSTOMER',
        },
        {
          type: 'text',
          content: 'Halo admin after sales Surabaya, mikrofon noise cancelling S24 Ultra saya tidak berfungsi saat dipakai telepon biasa dan WA call. Saya ajukan pengembalian dana, data rekening sudah saya isi lengkap di menu retur.',
          sender: 'CUSTOMER',
        },
        {
          type: 'text',
          content: 'Halo Kak, terima kasih atas laporannya. Pengajuan refund dana telah masuk di dashboard after sales kami dan sedang dalam antrean verifikasi bukti kendala.',
          sender: 'ADMIN',
        },
      ],
      returnRequest: {
        type: 'REFUND',
        reason: 'MIC_ERROR',
        reasonLabel: 'Mikrofon Noise Cancelling Eror',
        description: 'Microphone telepon tidak menangkap suara lawan bicara saat panggilan cellular dan WhatsApp',
        images: ['https://images.unsplash.com/photo-1580910051074-3eb694886505?w=500'],
        bankName: 'BCA',
        bankAccountNumber: '8910239120',
        bankAccountName: 'Rian Pratama',
        refundAmount: 21999000,
        status: 'PENDING',
        storeResponse: null,
      },
      complaint: null,
    },

    // 7. SURABAYA - Budi Santoso (Customer) - iPhone 14 - COMPLETED (Return Request: PENDING - Tukar Unit Face ID)
    {
      storeId: storeSurabaya.id,
      customer: getCust(6),
      productName: 'iPhone 14 6GB/256GB Blue',
      productPrice: 13450000,
      orderNumber: `ORD-SBY-107-IP14`,
      courierCode: 'JNE',
      courierService: 'REG',
      trackingNumber: `WYB-SBY-00107`,
      chatMessages: [
        {
          type: 'order_reference',
          content: null,
          sender: 'CUSTOMER',
        },
        {
          type: 'text',
          content: 'Malam after sales, sensor Face ID iPhone 14 pesanan saya tidak bisa membaca wajah sama sekali. Saya sudah ajukan tukar unit baru garansi 30 hari di sistem.',
          sender: 'CUSTOMER',
        },
        {
          type: 'text',
          content: 'Malam Kak Budi, baik pengajuan tukar unit baru untuk kendala Face ID sudah kami terima dan sedang ditinjau oleh staf after sales kami.',
          sender: 'ADMIN',
        },
      ],
      returnRequest: {
        type: 'REPLACEMENT',
        reason: 'HARDWARE_FACEID',
        reasonLabel: 'Sensor Face ID Tidak Berfungsi',
        description: 'Kamera TrueDepth dan sensor Face ID tidak dapat mendeteksi wajah saat registrasi',
        images: ['https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500'],
        status: 'PENDING',
        storeResponse: null,
      },
      complaint: null,
    },
  ];

  for (const tc of testCases) {
    console.log(`\nCreating case: ${tc.orderNumber} - ${tc.productName} (${tc.customer.name})`);

    // 1. Create or find product
    let product = await prisma.product.findFirst({
      where: { storeId: tc.storeId, name: { contains: tc.productName.split(' ')[0] } },
    });

    if (!product) {
      product = await prisma.product.create({
        data: {
          storeId: tc.storeId,
          name: tc.productName,
          slug: `${tc.productName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`,
          price: tc.productPrice,
          stock: 15,
          isActive: true,
          images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500'],
        },
      });
    }

    // 2. Create Order
    const order = await prisma.order.create({
      data: {
        orderNumber: tc.orderNumber,
        userId: tc.customer.id,
        storeId: tc.storeId,
        status: 'COMPLETED',
        subtotal: tc.productPrice,
        total: tc.productPrice + 25000 + 15000,
        shippingCost: 25000,
        insuranceFee: 15000,
        courierCode: tc.courierCode,
        courierService: tc.courierService,
        trackingNumber: tc.trackingNumber,
        notes: `Penerima: ${tc.customer.name} | Telp: ${tc.customer.phone || '08123456789'} | Alamat: Jl. Protokol No. 12, ${tc.storeId === storeRoxy.id ? 'Jakarta Pusat' : tc.storeId === storeSemarang.id ? 'Semarang' : 'Surabaya'}`,
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        items: {
          create: {
            type: 'PRODUCT',
            productId: product.id,
            quantity: 1,
            price: tc.productPrice,
            costPrice:
              product.costPrice || Math.round(tc.productPrice * 0.85),
            subtotal: tc.productPrice,
          },
        },
        payment: {
          create: {
            method: 'MANUAL_TRANSFER',
            status: 'VERIFIED',
            amount: tc.productPrice + 25000 + 15000,
          },
        },
      },
    });

    // 3. Create ReturnRequest if specified (ALL STRICTLY 'PENDING')
    if (tc.returnRequest) {
      await prisma.returnRequest.create({
        data: {
          orderId: order.id,
          userId: tc.customer.id,
          storeId: tc.storeId,
          type: tc.returnRequest.type,
          reason: tc.returnRequest.reason,
          reasonLabel: tc.returnRequest.reasonLabel,
          description: tc.returnRequest.description,
          images: tc.returnRequest.images,
          status: 'PENDING',
          refundAmount: tc.returnRequest.refundAmount || tc.productPrice,
          bankName: tc.returnRequest.bankName || 'BCA',
          bankAccountNumber: tc.returnRequest.bankAccountNumber || '1234567890',
          bankAccountName: tc.returnRequest.bankAccountName || tc.customer.name,
          storeResponse: null,
          resolvedAt: null,
        },
      });
      console.log(`  -> Created ReturnRequest: PENDING (${tc.returnRequest.type})`);
    }

    // 4. Create ChatRoom and Messages
    const chatRoom = await prisma.adminChatRoom.create({
      data: {
        customerId: tc.customer.id,
        storeId: tc.storeId,
        orderId: order.id,
        claimedById: budi.id,
        claimedAt: new Date(),
        lastMessageAt: new Date(),
      },
    });

    for (let i = 0; i < tc.chatMessages.length; i++) {
      const msg = tc.chatMessages[i];
      let content = msg.content;
      if (msg.type === 'order_reference') {
        content = JSON.stringify({
          type: 'order_reference',
          orderId: order.id,
          orderNumber: order.orderNumber,
          total: order.total,
          status: 'COMPLETED',
          productName: tc.productName,
          items: [{ product: { name: tc.productName, price: tc.productPrice } }],
        });
      }

      await prisma.adminChatMessage.create({
        data: {
          roomId: chatRoom.id,
          senderId: msg.sender === 'CUSTOMER' ? tc.customer.id : budi.id,
          content,
          messageType: msg.type,
          isRead: true,
          createdAt: new Date(Date.now() - (tc.chatMessages.length - i) * 15 * 60 * 1000),
        },
      });
    }
    console.log(`  -> Created ChatRoom: ${chatRoom.id} with ${tc.chatMessages.length} messages`);
  }

  console.log('\n--- SEED COMPLETED SUCCESSFULLY! ---');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
