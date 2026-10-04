# Analisis File Codebase Berukuran Besar (> 1.000 Baris)

Dokumen ini mencatat seluruh file kode di dalam repositori **Affiliate Gadget** yang memiliki panjang mencapai ribuan baris, dikelompokkan berdasarkan modul dan tingkat urgensi pemecahan (refactoring).

---

## 📊 Ringkasan Metrik

- **Total File > 1.000 Baris:** 32 File
- **Halaman Aplikasi (`src/app/`):** 20 File
- **Komponen UI (`src/components/`):** 5 File
- **API Route Handlers (`src/app/api/`):** 2 File
- **Database Seeds & E2E Tests:** 5 File
- **File Terpanjang:** `src/app/dashboard/admin/ads/page.tsx` (3.619 baris)

---

## 🗂 Daftar Lengkap Berdasarkan Kategori

### 1. Halaman Dashboard & Client Page (`src/app/`) — 20 File

| No  | File Path                                                                                                                                                                         |   Baris   | Modul / Fungsi                                                               |
| :-: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------: | ---------------------------------------------------------------------------- |
|  1  | [`src/app/dashboard/admin/ads/page.tsx`](file:///c:/.PROJECT/affiliate-gadget/src/app/dashboard/admin/ads/page.tsx)                                                               | **3.619** | CMS Iklan Platform (Hero, Sidebar, Footer, Approval Iklan Toko)              |
|  2  | [`src/app/dashboard/admin/finance/page.tsx`](file:///c:/.PROJECT/affiliate-gadget/src/app/dashboard/admin/finance/page.tsx)                                                       | **3.028** | Keuangan Multi-PT, Mutasi Escrow, Saldo Siap Cair, PPh 23 & Penarikan Dana   |
|  3  | [`src/app/dashboard/customer/chat/page.tsx`](file:///c:/.PROJECT/affiliate-gadget/src/app/dashboard/customer/chat/page.tsx)                                                       | **2.838** | Antarmuka Chat Pelanggan ke Berbagai Cabang Toko                             |
|  4  | [`src/app/dashboard/customer/orders/[orderId]/order-detail-client.tsx`](file:///c:/.PROJECT/affiliate-gadget/src/app/dashboard/customer/orders/[orderId]/order-detail-client.tsx) | **2.440** | Pelacakan Pengiriman, Timeline Kurir, Konfirmasi Penerimaan & Ulasan         |
|  5  | [`src/app/dashboard/admin/chat/page.tsx`](file:///c:/.PROJECT/affiliate-gadget/src/app/dashboard/admin/chat/page.tsx)                                                             | **2.236** | Inbox Omnichannel Live Chat Admin Platform & Admin Toko Cabang               |
|  6  | [`src/app/dashboard/admin/returns/page.tsx`](file:///c:/.PROJECT/affiliate-gadget/src/app/dashboard/admin/returns/page.tsx)                                                       | **2.090** | Pusat Resolusi Klaim Garansi 30 Hari Ganti Unit Baru & Pengembalian Dana     |
|  7  | [`src/app/dashboard/customer/settings/page.tsx`](file:///c:/.PROJECT/affiliate-gadget/src/app/dashboard/customer/settings/page.tsx)                                               | **1.855** | Manajemen Profil Customer, Buku Alamat, 2FA & Perangkat Aktif                |
|  8  | [`src/app/dashboard/admin/products/page.tsx`](file:///c:/.PROJECT/affiliate-gadget/src/app/dashboard/admin/products/page.tsx)                                                     | **1.705** | Master Tabel Produk, Stok Multi-Cabang, Filter Merek & Update Massal         |
|  9  | [`src/app/dashboard/admin/orders/page.tsx`](file:///c:/.PROJECT/affiliate-gadget/src/app/dashboard/admin/orders/page.tsx)                                                         | **1.422** | Manajemen Pemrosesan Pesanan JNE/Gojek, Cetak Thermal Label & Resi           |
| 10  | [`src/app/checkout/page.tsx`](file:///c:/.PROJECT/affiliate-gadget/src/app/checkout/page.tsx)                                                                                     | **1.394** | Alur Checkout Terproteksi, Asuransi Wajib Kurir & Auto-Bundling Bonus 3-in-1 |
| 11  | [`src/app/dashboard/admin/settings/page.tsx`](file:///c:/.PROJECT/affiliate-gadget/src/app/dashboard/admin/settings/page.tsx)                                                     | **1.362** | Pengaturan Platform, Nilai Pajak PPh 23, Komisi Toko & Pengaturan Bank       |
| 12  | [`src/app/gadget/[id]/page.tsx`](file:///c:/.PROJECT/affiliate-gadget/src/app/gadget/[id]/page.tsx)                                                                               | **1.311** | Tampilan Desktop Halaman Detail Produk & Seleksi Varian Gadget               |
| 13  | [`src/app/dashboard/admin/products/[id]/edit/page.tsx`](file:///c:/.PROJECT/affiliate-gadget/src/app/dashboard/admin/products/[id]/edit/page.tsx)                                 | **1.253** | Formulir Edit Produk, Varian RAM/Storage, Harga Modal & Gambar               |
| 14  | [`src/app/dashboard/admin/vouchers/page.tsx`](file:///c:/.PROJECT/affiliate-gadget/src/app/dashboard/admin/vouchers/page.tsx)                                                     | **1.181** | Pembuatan & Manajemen Kupon Diskon, Cashback & Batas Penggunaan              |
| 15  | [`src/app/register/page.tsx`](file:///c:/.PROJECT/affiliate-gadget/src/app/register/page.tsx)                                                                                     | **1.136** | Registrasi Akun Customer/Mitra, Verifikasi OTP Email/WA & Step HP            |
| 16  | [`src/app/dashboard/admin/products/new/page.tsx`](file:///c:/.PROJECT/affiliate-gadget/src/app/dashboard/admin/products/new/page.tsx)                                             | **1.123** | Formulir Pembuatan Unit Produk Baru & Multi-Varian Spesifikasi               |
| 17  | [`src/app/dashboard/admin/mitras/[id]/page.tsx`](file:///c:/.PROJECT/affiliate-gadget/src/app/dashboard/admin/mitras/[id]/page.tsx)                                               | **1.067** | Detail Lengkap Cabang Toko Fisik / Profil Pendaftar Mitra                    |
| 18  | [`src/app/dashboard/admin/page.tsx`](file:///c:/.PROJECT/affiliate-gadget/src/app/dashboard/admin/page.tsx)                                                                       | **1.062** | Dashboard Ringkasan Eksekutif, Grafik Transaksi & Aktivitas Terkini          |
| 19  | [`src/app/rekomendasi/[id]/mitra-detail-client.tsx`](file:///c:/.PROJECT/affiliate-gadget/src/app/rekomendasi/[id]/mitra-detail-client.tsx)                                       | **1.044** | Profil Publik Mitra Servis Rekomendasi, Portofolio & Ulasan                  |
| 20  | [`src/app/dashboard/mitra/profile/edit/page.tsx`](file:///c:/.PROJECT/affiliate-gadget/src/app/dashboard/mitra/profile/edit/page.tsx)                                             | **1.015** | Pengaturan Profil Bengkel Teknisi & Tarif Servis                             |

---

### 2. Komponen Antarmuka Pengguna (`src/components/`) — 5 File

| No  | File Path                                                                                                                                               |   Baris   | Modul / Fungsi                                                               |
| :-: | ------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------: | ---------------------------------------------------------------------------- |
| 21  | [`src/components/chat/floating-chat-button.tsx`](file:///c:/.PROJECT/affiliate-gadget/src/components/chat/floating-chat-button.tsx)                     | **1.796** | Widget Chat Melayang Global (Floating Mini Window & Notifikasi Bel)          |
| 22  | [`src/components/live/live-stream-broadcaster.tsx`](file:///c:/.PROJECT/affiliate-gadget/src/components/live/live-stream-broadcaster.tsx)               | **1.744** | Broadcaster Studio Host Toko (LiveKit WebRTC, Kamera, Pin Deals & Chat)      |
| 23  | [`src/components/live/live-stream-viewer.tsx`](file:///c:/.PROJECT/affiliate-gadget/src/components/live/live-stream-viewer.tsx)                         | **1.339** | Player Penonton Live Stream (Instagram Mobile Mode & YouTube Desktop View)   |
| 24  | [`src/components/gadget/shopee-mobile-product-detail.tsx`](file:///c:/.PROJECT/affiliate-gadget/src/components/gadget/shopee-mobile-product-detail.tsx) | **1.205** | Detail Produk Seluler Immersive (Sticky Bottom Bar, Sheet Varian & Wishlist) |
| 25  | [`src/components/chat/chat-window-new.tsx`](file:///c:/.PROJECT/affiliate-gadget/src/components/chat/chat-window-new.tsx)                               | **1.131** | Core Jendela Obrolan (Daftar Pesan, Input Lampiran & Bubble Status)          |

---

### 3. Backend Route Handlers (`src/app/api/`) — 2 File

| No  | File Path                                                                                                                                   |   Baris   | Modul / Fungsi                                                               |
| :-: | ------------------------------------------------------------------------------------------------------------------------------------------- | :-------: | ---------------------------------------------------------------------------- |
| 26  | [`src/app/api/admin/reports/export/route.ts`](file:///c:/.PROJECT/affiliate-gadget/src/app/api/admin/reports/export/route.ts)               | **1.143** | Engine Generator Excel Finansial, Multi-Sheet Akuntansi & Rekap Pajak PPh 23 |
| 27  | [`src/app/api/admin/products/import-excel/route.ts`](file:///c:/.PROJECT/affiliate-gadget/src/app/api/admin/products/import-excel/route.ts) | **1.088** | Parser & Validator Unggah Massal Excel Produk Cabang Toko                    |

---

### 4. Database Seeding & Testing — 5 File

| No  | File Path                                                                                                                       |   Baris   | Modul / Fungsi                                              |
| :-: | ------------------------------------------------------------------------------------------------------------------------------- | :-------: | ----------------------------------------------------------- |
| 28  | [`tests/e2e/finance-income-outcome.spec.ts`](file:///c:/.PROJECT/affiliate-gadget/tests/e2e/finance-income-outcome.spec.ts)     | **1.736** | Pengujian Browser Otomatis Playwright E2E Keuangan Multi-PT |
| 29  | [`prisma/seed.ts`](file:///c:/.PROJECT/affiliate-gadget/prisma/seed.ts)                                                         | **1.278** | Script Seeder Database Utama Lokal                          |
| 30  | [`tests/unit/bulk-price-update-excel.test.ts`](file:///c:/.PROJECT/affiliate-gadget/tests/unit/bulk-price-update-excel.test.ts) | **1.209** | Pengujian Unit Parser Excel Update Harga                    |
| 31  | [`prisma/seed-all-tables-massive.ts`](file:///c:/.PROJECT/affiliate-gadget/prisma/seed-all-tables-massive.ts)                   | **1.132** | Script Seeder Dummy Skala Penuh Seluruh Tabel               |
| 32  | [`prisma/seed-comprehensive.ts`](file:///c:/.PROJECT/affiliate-gadget/prisma/seed-comprehensive.ts)                             | **1.034** | Script Seeder Data Skenario Komprehensif                    |

---

## 🎯 Panduan & Pola Refactoring Modular (Best Practice)

Mengikuti keberhasilan modularisasi [`src/app/dashboard/admin/mitras/page.tsx`](file:///c:/.PROJECT/affiliate-gadget/src/app/dashboard/admin/mitras/page.tsx) (yang berhasil turun dari **2.097 baris menjadi ~445 baris** tanpa mengubah sedikitpun tampilan UI/UX maupun fungsi):

### Pola Pemisahan:

1. **`types.ts`**: Ekstraksi seluruh interface TypeScript dan enum.
2. **Komponen Header / KPI Cards**: Memisahkan kartu metrik Bento Grid.
3. **Komponen Toolbar / Filter**: Memisahkan tab status, dropdown select, dan search input.
4. **Komponen Tabel / List Content**: Memisahkan rendering data row, status badge, dan tombol aksi.
5. **Komponen Modals**: Mengelompokkan formulir dialog modal ke komponen tersendiri.
6. **`page.tsx`**: Bertindak murni sebagai **State Orchestrator & API Data Fetcher**.

---

### Rekomendasi Prioritas Eksekusi Selanjutnya:

1. **Prioritas P0 (> 3.000 baris):**
   - [`src/app/dashboard/admin/ads/page.tsx`](file:///c:/.PROJECT/affiliate-gadget/src/app/dashboard/admin/ads/page.tsx) (3.619 baris)
   - [`src/app/dashboard/admin/finance/page.tsx`](file:///c:/.PROJECT/affiliate-gadget/src/app/dashboard/admin/finance/page.tsx) (3.028 baris)

2. **Prioritas P1 (2.000 - 3.000 baris):**
   - [`src/app/dashboard/customer/chat/page.tsx`](file:///c:/.PROJECT/affiliate-gadget/src/app/dashboard/customer/chat/page.tsx) (2.838 baris)
   - [`src/app/dashboard/customer/orders/[orderId]/order-detail-client.tsx`](file:///c:/.PROJECT/affiliate-gadget/src/app/dashboard/customer/orders/[orderId]/order-detail-client.tsx) (2.440 baris)
   - [`src/app/dashboard/admin/chat/page.tsx`](file:///c:/.PROJECT/affiliate-gadget/src/app/dashboard/admin/chat/page.tsx) (2.236 baris)
   - [`src/app/dashboard/admin/returns/page.tsx`](file:///c:/.PROJECT/affiliate-gadget/src/app/dashboard/admin/returns/page.tsx) (2.090 baris)
