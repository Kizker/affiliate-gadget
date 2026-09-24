# ANALISIS MENDALAM: STRUKTUR PAJAK & PPN (MULTI-PT E-COMMERCE)

**Platform:** Affiliate Gadget Marketplace Indonesia  
**Arsitektur:** Multi-PT / Multi-Toko Offline Desentralisasi  
**Tanggal:** 23 September 2026  
**Status:** Dokumen Analisis Teknis & Panduan Implementasi

---

## DAFTAR ISI

1. [Eksekutif & Latar Belakang Arsitektur Multi-PT](#1-eksekutif--latar-belakang-arsitektur-multi-pt)
2. [Dasar Hukum Perpajakan E-Commerce & Multi-Entity Indonesia](#2-dasar-hukum-perpajakan-e-commerce--multi-entity-indonesia)
3. [Entitas Perpajakan & Alur Bisnis Transaksi](#3-entitas-perpajakan--alur-bisnis-transaksi)
4. [Komponen 1: Pengaturan Tarif PPN (11% / Dinamis) & Skema Inklusif vs Eksklusif](#4-komponen-1-pengaturan-tarif-ppn-11--dinamis--skema-inklusif-vs-eksklusif)
5. [Komponen 2: Potongan Pajak Penghasilan (PPh Pasal 22 & PPh Pasal 23)](#5-komponen-2-potongan-pajak-penghasilan-pph-pasal-22--pph-pasal-23)
6. [Komponen 3: Generasi Faktur Pajak Otomatis (e-Faktur DJP & Legal Accounting Draft)](#6-komponen-3-generasi-faktur-pajak-otomatis-e-faktur-djp--legal-accounting-draft)
7. [Dampak & Kebutuhan Perubahan pada Codebase Existing](#7-dampak--kebutuhan-perubahan-pada-codebase-existing)
8. [Simulasi Numerik Transaksi Riil End-to-End](#8-simulasi-numerik-transaksi-riil-end-to-end)
9. [Manajemen Risiko, Validasi Data, & Kepatuhan DJP](#9-manajemen-risiko-validasi-data--kepatuhan-djp)
10. [Rencana Aksi & Roadmap Implementasi Bertahap](#10-rencana-aksi--roadmap-implementasi-bertahap)

---

## 1. Eksekutif & Latar Belakang Arsitektur Multi-PT

Platform **Affiliate Gadget** dibangun dengan arsitektur mendasar **Multi-PT / Multi-Toko Offline** di mana setiap cabang toko fisik di Indonesia (misal: PT Gadget Jaya Sentosa - Roxy Mas Pusat, PT Sinar Gadget Nusantara - WTC Surabaya, PT Digital Niaga Prima - BEC Bandung, dll.) berstatus sebagai badan usaha mandiri yang terpisah secara legal.

### Tujuan Strategis Perpajakan Multi-PT:

1. **Desentralisasi Omzet Per Badan Hukum:** Menghindari penumpukan omzet puluhan atau ratusan miliar pada satu PT tunggal yang dapat memicu risiko audit ekstrim dan beban administratif terpusat.
2. **Kemandirian PKP & KPP Wilayah:** Setiap PT cabang toko terdaftar di Kantor Pelayanan Pajak (KPP) masing-masing wilayah, mengelola Faktur Pajak Keluaran/Masukan sendiri, dan bertanggung jawab atas SPT Masa PPN 1111 serta SPT Tahunan Badan.
3. **Pemisahan Jelas Penjualan Barang (BKP) vs Jasa Platform (JKP):**
   - **Toko PT Cabang:** Menjual unit fisik gadget (Barang Kena Pajak / BKP) ke customer pembeli.
   - **Platform Holding PT (`PT Affiliate Gadget Nusantara`):** Hanya membukukan pendapatan jasa perantara/komisi platform 1%–3% (`commissionAmount`) dan jasa iklan internal (`InternalAd`), bukan seluruh nilai transaksi barang (GMV).

Implementasi modul perpajakan ini akan melengkapi platform dengan kemampuan akuntansi legal otomatis, kepatuhan perpajakan modern (standar Coretax / NPWP 16 digit), dan ekspor data siap lapor ke DJP (Direktorat Jenderal Pajak).

---

## 2. Dasar Hukum Perpajakan E-Commerce & Multi-Entity Indonesia

Analisis dan implementasi sistem ini mengacu secara ketat pada regulasi perpajakan Republik Indonesia yang berlaku:

| Regulasi                                                                             | Pokok Aturan & Implikasi pada Platform                                                                                                                                                                                      |
| :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UU No. 7 Tahun 2021 (UU HPP)**                                                     | Menetapkan tarif umum PPN sebesar 11% (dengan klausul penyesuaian dinamis hingga 12% sesuai kebijakan pemerintah). Sistem wajib mendukung tarif dinamis tanpa hardcode.                                                     |
| **PMK No. 112/PMK.03/2022 & PMK 136/2023**                                           | Standardisasi format NPWP 16 digit: Wajib Pajak Orang Pribadi (WPOP) menggunakan NIK 16 digit, sedangkan Wajib Pajak Badan menggunakan NPWP 16 digit (penambahan angka 0 di depan NPWP 15 digit lama).                      |
| **PER-03/PJ/2022 & PER-11/PJ/2022**                                                  | Ketentuan faktur pajak elektronik (e-Faktur). Mengatur format penomoran Nomor Seri Faktur Pajak (NSFP) 16 digit, Faktur Pajak Digunggung untuk transaksi e-commerce ritel B2C, dan faktur pajak lengkap untuk B2B.          |
| **UU PPh Pasal 23**                                                                  | Pengenaan pemotongan Pajak Penghasilan atas imbalan jasa manajemen, teknik, atau perantara sebesar **2%** (bagi pemilik NPWP/NIK) atau **4%** (tanpa NPWP). Relevan pada penagihan komisi jasa platform kepada toko cabang. |
| **PMK Terkait PPMSE (Penyelenggara Perdagangan Melalui Sistem Elektronik) & PPh 22** | Penunjukan marketplace sebagai pemungut/pelapor pajak merchant e-commerce, atau perlakuan pemotongan PPh 22 jika bertransaksi dengan instansi pemerintah/BUMN (PMK 58).                                                     |
| **PP No. 55 Tahun 2022**                                                             | Perlakuan PPh Final 0,5% bagi merchant UMKM dengan omzet di bawah Rp 4,8 miliar per tahun.                                                                                                                                  |

---

## 3. Entitas Perpajakan & Alur Bisnis Transaksi

Dalam arsitektur Multi-PT Affiliate Gadget, terdapat 3 hubungan transaksi perpajakan utama:

```
                  +----------------------------------------------+
                  |   CUSTOMER (Pembeli B2C Retail atau B2B)    |
                  +----------------------------------------------+
                                         ▲
                                         │  (1) Pembayaran Gadget + PPN (Inklusif/Eksklusif)
                                         │  (2) Penerbitan Invoice & Faktur Pajak BKP
                                         ▼
+--------------------------------------------------------------------------------+
|                       TOKO CABANG / PT FISIK (SELLER)                         |
|  - Contoh: PT Gadget Jaya Sentosa (Cabang Roxy) - PKP Terdaftar                |
|  - NPWP 16-Digit Cabang, Mengelola NSFP Mandiri                               |
+--------------------------------------------------------------------------------+
             ▲                                                    ▲
             │                                                    │
             │ (3) Komisi Platform 1-3%                          │ (4) Escrow Payout Bersih
             │     + PPN Jasa Komisi 11%                          │     (Subtotal - Komisi
             │     - Pemotongan PPh 23 (2%)                       │      - PPh 23 + PPN Jasa)
             ▼                                                    ▼
+--------------------------------------------------------------------------------+
|             PLATFORM OPERATOR / HOLDING (PT Affiliate Gadget Nusantara)        |
|  - Penyelenggara Marketplace / PPMSE                                           |
|  - Menerbitkan Invoice & Faktur Pajak Jasa Komisi ke Toko PT                   |
|  - Menerima Bukti Potong PPh 23 dari Toko PT                                   |
+--------------------------------------------------------------------------------+
```

### Rincian Alur Hubungan Bisnis:

### A. Transaksi Toko PT vs Customer (Penjualan Gadget - BKP)

1. **Customer B2C:** Membeli smartphone untuk pemakaian pribadi. Harga di katalog sudah mencakup PPN (skema **Inklusif**). Di struk/invoice tercetak rincian: Dasar Pengenaan Pajak (DPP) dan PPN 11%. Pembeli B2C tidak memerlukan faktur pajak masukan terpisah, toko mencatatnya sebagai transaksi digunggung atau faktur e-Faktur menggunakan NIK.
2. **Customer B2B / Institusi:** Membeli inventori kantor. Customer mencentang opsi _"Perlu Faktur Pajak Perusahaan (B2B)"_ saat checkout, memasukkan NPWP PT 16-digit, nama perusahaan, dan alamat domisili pajak. Toko menerbitkan e-Faktur Pajak resmi menggunakan kuota NSFP toko sehingga customer B2B dapat mengkreditkan PPN Masukannya.

### B. Transaksi Toko PT vs Platform Holding PT (Jasa Perantara - JKP)

1. Platform memungut komisi jasa perantara sebesar 1% s/d 3% dari nilai penjualan (`commissionAmount`).
2. Jasa komisi ini adalah Jasa Kena Pajak (JKP). Platform Holding PT menerbitkan tagihan jasa komisi ke Toko PT:
   - **DPP Jasa Komisi:** `commissionAmount`
   - **PPN Keluaran Platform (11%):** `11% x commissionAmount` (Toko PT mencatat ini sebagai PPN Masukan Jasa).
   - **PPh Pasal 23 (2%):** Toko PT memotong PPh 23 sebesar 2% atas jasa perantara platform, menyetor Rp tersebut ke kas negara melalui e-Billing, dan menyerahkan Bukti Potong Unifikasi ke Platform Holding.

---

## 4. Komponen 1: Pengaturan Tarif PPN (11% / Dinamis) & Skema Inklusif vs Eksklusif

### A. Perbandingan Formula Matematis: Inklusif vs Eksklusif

| Parameter                               | Skema PPN Inklusif (Default B2C)                                                                                                                                        | Skema PPN Eksklusif (B2B / Custom)                                            |
| :-------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------- |
| **Definisi Harga Etalase**              | Harga yang ditampilkan (`Product.price`) **sudah termasuk PPN 11%**.                                                                                                    | Harga yang ditampilkan (`Product.price`) **adalah harga bersih sebelum PPN**. |
| **Kenyamanan Customer**                 | Sangat disukai pembeli retail karena tidak ada biaya tersembunyi saat checkout.                                                                                         | Standar dunia B2B/korporasi yang menghitung budget belanja sebelum PPN.       |
| **Formula Dasar Pengenaan Pajak (DPP)** | $$\text{DPP} = \text{Round}\left(\frac{\text{Harga}}{1 + \text{Tarif PPN}}\right)$$ Contoh tarif 11%: $\text{DPP} = \text{Round}\left(\frac{\text{Harga}}{1.11}\right)$ | $$\text{DPP} = \text{Harga}$$                                                 |
| **Formula Nilai PPN**                   | $$\text{PPN} = \text{Harga} - \text{DPP}$$                                                                                                                              | $$\text{PPN} = \text{Round}(\text{DPP} \times \text{Tarif PPN})$$             |
| **Total Bayar Customer**                | $$\text{Total} = \text{Harga}$$                                                                                                                                         | $$\text{Total} = \text{DPP} + \text{PPN}$$                                    |

### B. Perlakuan Diskon Voucher Promo terhadap PPN

Sesuai aturan perpajakan, diskon langsung yang tertera dalam faktur penjualan **mengurangi Dasar Pengenaan Pajak (DPP)**:

- **Pada PPN Inklusif:**
  $$\text{Nilai Kotor Setelah Diskon} = \text{Subtotal Produk} - \text{Diskon Voucher}$$
  $$\text{DPP Bersih} = \text{Round}\left(\frac{\text{Nilai Kotor Setelah Diskon}}{1 + \text{Tarif PPN}}\right)$$
  $$\text{PPN} = \text{Nilai Kotor Setelah Diskon} - \text{DPP Bersih}$$
- **Pada PPN Eksklusif:**
  $$\text{DPP Bersih} = \text{Subtotal Produk} - \text{Diskon Voucher}$$
  $$\text{PPN} = \text{Round}(\text{DPP Bersih} \times \text{Tarif PPN})$$
  $$\text{Total Transaksi} = \text{DPP Bersih} + \text{PPN}$$

### C. Perlakuan Komponen Ongkos Kirim & Asuransi

- **Ongkos Kirim (`shippingCost`):** Merupakan jasa pengiriman oleh pihak ketiga (JNE / Gojek). Di marketplace, ongkir merupakan biaya _pass-through_ (reimbursement). Toko tidak memungut PPN atas ongkir barang; PPN atas jasa kurir menjadi tanggung jawab ekspedisi kurir yang bersangkutan.
- **Asuransi Pengiriman (`insuranceFee`):** Merupakan premi asuransi perlindungan logistik (jasa keuangan non-BKP atau dipungut oleh perusahaan pialang asuransi). Tidak dikenakan PPN oleh toko fisik.

### D. Hierarki Konfigurasi Fleksibel (Multi-Level Inheritance)

Sistem menerapkan 3 tingkatan konfigurasi:

1. **Level Platform (Global Config):** Default tarif PPN nasional (saat ini 11%, siap beralih ke 12% melalui 1 baris konfigurasi environment/database tanpa compile ulang).
2. **Level Toko (`Store.taxConfig`):**
   - Status Pengusaha Kena Pajak: `isPkp: Boolean` (Jika `false`, maka tarif PPN = 0%).
   - Tipe Default Toko: `taxType: 'INCLUSIVE' | 'EXCLUSIVE'`.
   - NPWP Toko: 16 Digit terverifikasi.
3. **Level Produk (`Product.taxOverride`):**
   - `isTaxable: Boolean` (Default `true`). Dapat diset `false` untuk komoditas bebas PPN jika suatu saat toko menjual produk yang dikecualikan.
   - `taxTypeOverride`: Opsi override jika ada item B2B khusus yang wajib eksklusif.

---

## 5. Komponen 2: Potongan Pajak Penghasilan (PPh Pasal 22 & PPh Pasal 23)

### A. PPh Pasal 23 atas Jasa Perantara / Komisi Platform

- **Objek Pajak:** Biaya jasa komisi marketplace (1% s/d 3%) yang dipotong platform dari toko PT.
- **Pemberi Penghasilan Jasa:** Toko PT Cabang (membayar jasa).
- **Penerima Penghasilan Jasa:** Platform Holding PT (menerima imbalan komisi).
- **Tarif:** **2%** dari jumlah bruto imbalan jasa komisi.
- **Mekanisme Akuntansi & Settlement Otomatis:**
  Platform memfasilitasi pencatatan pemotongan ini secara transparan pada mutasi buku kas (`StoreWithdrawal` / Finance API).

  $$\text{Komisi Bruto} = \text{Subtotal} \times \text{Tarif Komisi (1–3\%)}$$
  $$\text{PPN Jasa Komisi (11\%)} = \text{Komisi Bruto} \times 11\%$$
  $$\text{PPh 23 Dipotong Toko (2\%)} = \text{Komisi Bruto} \times 2\%$$
  $$\text{Beban Komisi Bersih Toko} = \text{Komisi Bruto} + \text{PPN Jasa Komisi} - \text{PPh 23}$$

> **Hasil:** Toko memiliki dasar pencatatan riil untuk menerbitkan Bukti Potong PPh 23 (Bupot Unifikasi DJP) ke Platform Holding, dan Platform tidak mengalami sengketa pencatatan pajak ganda.

### B. Potongan PPh Pasal 22 / PPh Final PP 55 (Penjualan Merchant)

- **Kondisi Penerapan:**
  1. Jika platform ditunjuk oleh Kementerian Keuangan sebagai Pemungut PPh Pasal 22 atas transaksi perdagangan melalui sistem elektronik (PPMSE).
  2. Atau toko memanfaatkan skema **PPh Final UMKM PP 55/2022** dengan tarif **0,5%** dari omzet kotor (DPP).
- **Kalkulasi di Sistem:**
  $$\text{Potongan PPh 22 / Final} = \text{DPP Penjualan} \times \text{Tarif PPh 22 (0,5\% atau 0\%)}$$
- **Opsi Konfigurasi di Toko:** Toko dapat mengaktifkan fitur _"Otomatis Alokasikan Cadangan PPh 22/Final (0.5%)"_. Saldo cadangan ini otomatis disisihkan di dashboard keuangan toko agar saat jatuh tempo masa pajak tanggal 15 bulan berikutnya, dana setoran kas negara sudah teralokasi rapi.

---

## 6. Komponen 3: Generasi Faktur Pajak Otomatis (e-Faktur DJP & Legal Accounting Draft)

### A. Pemisahan Dua Jenis Dokumen Faktur

Sistem menghasilkan dua output faktur dengan peruntukan yang berbeda:

1. **Commercial Invoice / Faktur Penjualan:** Dokumen komersial untuk pembeli yang memuat nomor pesanan, rincian produk, metode pembayaran, garansi 30 hari, bonus 3-in-1, dan ringkasan PPN.
2. **Draf e-Faktur Pajak Standar DJP:** Dokumen resmi perpajakan yang mencantumkan Nomor Seri Faktur Pajak (NSFP), data PKP Penjual, identitas NPWP/NIK Pembeli, dan perincian BKP.

### B. Arsitektur Nomor Seri Faktur Pajak (NSFP) 16-Digit

Format resmi DJP:
$$\underbrace{\text{XXX}}_{\text{Kode Transaksi}} . \underbrace{\text{X}}_{\text{Status}} \underbrace{\text{XX}}_{\text{Tahun}} - \underbrace{\text{XXXXXXXX}}_{\text{Nomor Urut (8 digit)}}$$

- **Contoh:** `010.024-26.00000001`
  - `01`: Kode Transaksi Penyerahan kepada selain pemungut PPN.
  - `0`: Faktur Pajak Normal (bukan pengganti).
  - `26`: Tahun penerbitan (2026).
  - `00000001`: Nomor urut urut berurutan.

**Mekanisme Kuota NSFP per Toko PT (`StoreTaxQuota`):**
Toko memasukkan rentang nomor yang disetujui DJP (dari surat e-Nofa DJP), misalnya dari `010.024-26.00000001` sampai `010.024-26.00000500`. Setiap kali pesanan B2B berstatus `COMPLETED`, sistem mengambil satu nomor secara atomic (database lock) untuk mencegah duplikasi nomor.

### C. Format Ekspor CSV Impor Resmi e-Faktur DJP

Untuk pelaporan SPT Masa PPN 1111 di aplikasi e-Faktur Desktop atau Coretax DJP, staf pajak toko tidak perlu mengetik manual. Sistem menyediakan tombol **"Ekspor CSV e-Faktur (DJP)"** yang menghasilkan file CSV dengan struktur baku DJP:

#### 1. Header Baris Faktur Keluaran (`FK`):

```csv
FK,KD_JENIS_TRANSAKSI,FG_PENGGANTI,NOMOR_FAKTUR,MASA_PAJAK,TAHUN_PAJAK,TANGGAL_FAKTUR,NPWP,NAMA,ALAMAT_LENGKAP,JUMLAH_DPP,JUMLAH_PPN,JUMLAH_PPNBM,ID_KETERANGAN_TAMBAHAN,FG_UANG_MUKA,UANG_MUKA_DPP,UANG_MUKA_PPN,UANG_MUKA_PPNBM,REFERENSI
```

#### 2. Baris Objek Faktur (`OF`):

```csv
OF,KODE_OBJEK,NAMA,HARGA_SATUAN,JUMLAH_BARANG,HARGA_TOTAL,DISKON,DPP,PPN,TARIF_PPNBM,PPNBM
```

---

## 7. Dampak & Kebutuhan Perubahan pada Codebase Existing

### A. Modifikasi Skema Database (`prisma/schema.prisma`)

```prisma
// 1. Penambahan konfigurasi pajak pada model Store
model Store {
  // ... field existing
  isPkp             Boolean   @default(false)  // Apakah PT Toko sudah PKP
  taxType           TaxType   @default(INCLUSIVE) // INCLUSIVE atau EXCLUSIVE
  vatRate           Float     @default(11.0)   // Tarif PPN toko (%)
  pph22Rate         Float     @default(0.0)    // Tarif PPh 22/Final (misal 0.5%)
  pph23Enabled      Boolean   @default(true)   // Pemotongan PPh 23 atas komisi platform
  kppName           String?                    // Nama KPP Pratama terdaftar
  nsfpPrefix        String?                    // Misal "010.001-26"
  nsfpStartNumber   Int?                       // Nomor awal NSFP e-Nofa
  nsfpEndNumber     Int?                       // Nomor akhir NSFP e-Nofa
  nsfpCurrentNumber Int?                       // Nomor urut aktif saat ini
  taxQuotas         StoreTaxQuota[]
  taxInvoices       TaxInvoice[]
}

enum TaxType {
  INCLUSIVE
  EXCLUSIVE
}

// 2. Penambahan field pajak pada model Product
model Product {
  // ... field existing
  isTaxable       Boolean   @default(true)     // Apakah barang kena pajak
  taxTypeOverride TaxType?                     // Override khusus produk (opsional)
}

// 3. Penambahan field pencatatan pajak pada model Order
model Order {
  // ... field existing
  // Field `tax` (Float @default(0)) yang sudah ada difungsikan sebagai `vatAmount`
  dppAmount        Float     @default(0)       // Dasar Pengenaan Pajak barang
  vatRate          Float     @default(11.0)    // Snapshot tarif PPN transaksi (%)
  vatAmount        Float     @default(0)       // Nilai Rupiah PPN yang dipungut
  taxTypeApplied   TaxType   @default(INCLUSIVE)
  pph22Amount      Float     @default(0)       // Potongan PPh 22 jika ada
  pph23Amount      Float     @default(0)       // Potongan PPh 23 komisi platform

  // Data Pembeli untuk Faktur Pajak B2B
  isB2B            Boolean   @default(false)
  customerTaxId    String?                     // NPWP 16 Digit atau NIK 16 Digit
  customerTaxName  String?                     // Nama PT / Nama WP sesuai NPWP
  customerTaxAddress String?                   // Alamat terdaftar NPWP

  taxInvoice       TaxInvoice?
}

// 4. Model Baru: TaxInvoice (Faktur Pajak Elektronik & Draf)
model TaxInvoice {
  id              String           @id @default(cuid())
  orderId         String           @unique
  storeId         String
  nsfpNumber      String           @unique     // Format: 010.001-26.00000001
  taxInvoiceDate  DateTime         @default(now())
  sellerCompanyName String
  sellerTaxId     String                       // NPWP PT Toko
  sellerAddress   String
  buyerName       String
  buyerTaxId      String                       // NPWP / NIK Pembeli
  buyerAddress    String
  dppTotal        Float
  ppnTotal        Float
  status          TaxInvoiceStatus @default(DRAFT)
  pdfUrl          String?
  djpExportedAt   DateTime?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  order           Order            @relation(fields: [orderId], references: [id], onDelete: Cascade)
  store           Store            @relation(fields: [storeId], references: [id], onDelete: Cascade)

  @@index([storeId])
  @@index([nsfpNumber])
  @@index([status])
  @@map("tax_invoices")
}

enum TaxInvoiceStatus {
  DRAFT
  GENERATED
  REPORTED
  CANCELLED
}

// 5. Model Baru: StoreTaxQuota (Manajemen Kuota NSFP e-Nofa Toko)
model StoreTaxQuota {
  id          String   @id @default(cuid())
  storeId     String
  year        Int      // Misal: 2026
  prefix      String   // Misal: "010.024-26"
  startNumber Int      // 1
  endNumber   Int      // 1000
  lastUsed    Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  store       Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)

  @@index([storeId, year])
  @@map("store_tax_quotas")
}
```

---

### B. Modifikasi Modul Bisnis & Lib Engine

1. **`src/lib/tax/tax-engine.ts` (Engine Baru):**
   - Fungsi `calculateOrderTax(items, discount, storeTaxConfig)`:
     - Menghitung DPP kotor, alokasi diskon voucher proporsional per item, DPP bersih, PPN 11%, dan PPh 23 jasa platform.
     - Pembulatan matematis akuntansi standar Rupiah (`Math.round`).
2. **`src/lib/tax/efaktur-generator.ts` (Generator Baru):**
   - Format builder file CSV DJP (baris FK & OF) sesuai PER-03/PJ/2022.
   - Validasi ketat format NPWP 16 digit dan NIK 16 digit.
3. **`src/lib/tax/nsfp-manager.ts` (Pengelola NSFP Baru):**
   - Mengambil dan mengalokasikan NSFP secara atomik di dalam prisma transaction (`$transaction`).
4. **`src/app/api/checkout/route.ts`:**
   - Membaca konfigurasi `taxType` dari toko asal produk.
   - Menerima payload opsional pembeli B2B (`customerTaxId`, `customerTaxName`, `customerTaxAddress`).
   - Menyimpan snapshot `dppAmount`, `vatRate`, `vatAmount`, `taxTypeApplied`, dan `pph23Amount`.
5. **`src/app/api/admin/finance/route.ts`:**
   - Memperbarui kalkulasi `netStoreAmount` agar memperhitungkan PPh 23 komisi platform.
   - Menambahkan ringkasan `totalVatOutput` (PPN Keluaran Toko) dan `totalPlatformVat` (PPN Jasa).
6. **`src/app/api/admin/reports/export/route.ts`:**
   - Menambahkan kolom `DPP (Rp)`, `PPN 11% (Rp)`, dan `PPh 23 Komisi (Rp)` pada sheet `LAPORAN_KEUANGAN`.

---

### C. Modifikasi Antarmuka Pengguna (UI / UX)

1. **Halaman Checkout (`src/app/checkout/page.tsx` & Mobile Checkout):**
   - Komponen rincian biaya: Tampilkan **"Termasuk PPN 11% (Rp xxx)"** untuk skema Inklusif, atau baris terpisah **"PPN 11%: Rp xxx"** untuk skema Eksklusif.
   - Accordion Pembeli B2B: _"Perlu Faktur Pajak Perusahaan? Masukkan NPWP 16-Digit"_.
2. **Pengaturan Toko Admin (`src/app/dashboard/admin/settings/page.tsx`):**
   - Section baru: **"Konfigurasi Perpajakan & Legalitas PT"**.
   - Input: Status PKP (Toggle On/Off), NPWP 16 Digit, Skema Harga (Inklusif / Eksklusif), Kuota NSFP e-Nofa.
3. **Menu Baru: Draf & Ekspor e-Faktur (`src/app/dashboard/admin/tax`):**
   - Halaman khusus bagi Staf Pajak / Admin Toko untuk melihat daftar faktur pajak yang terbit, tombol unduh draf PDF, dan tombol sekali-klik **"Export CSV e-Faktur DJP"** berdasarkan filter bulan/tahun.

---

## 8. Simulasi Numerik Transaksi Riil End-to-End

Berikut simulasi riil satu transaksi pembelian gadget pada toko cabang **PT Gadget Jaya Sentosa (Cabang Roxy)**:

### Data Skenario:

- **Produk:** iPhone 15 Pro 256GB Natural Titanium
- **Harga Retail di Web:** Rp 22.200.000 (Harga Inklusif PPN 11%)
- **HPP Modal Unit (`costPrice`):** Rp 18.500.000
- **Diskon Voucher Toko:** Rp 200.000
- **Ongkos Kirim JNE:** Rp 35.000
- **Asuransi Pengiriman (0,2%):** Rp 44.000
- **Komisi Platform:** 2,0% dari nilai barang
- **Customer:** PT Sinergi Solusi Digital (Transaksi B2B dengan NPWP 16-Digit)

---

### Perhitungan Langkah demi Langkah:

#### 1. Perhitungan Sisi Customer (Checkout):

| Komponen Transaksi          | Nilai Transaksi (Rp) | Keterangan                                |
| :-------------------------- | :------------------- | :---------------------------------------- |
| Nilai Barang Kotor          | Rp 22.200.000        | Termasuk PPN                              |
| Diskon Voucher              | - Rp 200.000         | Mengurangi harga barang                   |
| **Nilai Barang Netto**      | **Rp 22.000.000**    | **Total Barang Dibayar**                  |
| Ongkos Kirim JNE            | Rp 35.000            | Pass-through kurir                        |
| Asuransi Wajib Pengiriman   | Rp 44.000            | Pass-through asuransi                     |
| **Total Transfer Customer** | **Rp 22.079.000**    | **Masuk ke Escrow Rekening Bank Mandiri** |

#### 2. Dekomposisi Pajak Penjualan Toko PT (e-Faktur BKP):

$$\text{DPP Penjualan} = \text{Round}\left(\frac{\text{Rp 22.000.000}}{1,11}\right) = \text{Rp 19.819.820}$$
$$\text{PPN Keluaran 11\% Toko} = \text{Rp 22.000.000} - \text{Rp 19.819.820} = \text{Rp 2.180.180}$$

> _Hasil:_ Faktur Pajak B2B diterbitkan dengan DPP Rp 19.819.820 dan PPN Rp 2.180.180 atas nama PT Sinergi Solusi Digital.

#### 3. Perhitungan Jasa Komisi & Pajak Platform Holding PT:

$$\text{Komisi Platform (2\% dari Rp 22.000.000)} = \text{Rp 440.000}$$
$$\text{PPN Jasa Komisi (11\% x Rp 440.000)} = \text{Rp 48.400}$$
$$\text{Potongan PPh 23 oleh Toko (2\% x Rp 440.000)} = \text{Rp 8.800}$$
$$\text{Beban Komisi Platform Bersih} = \text{Rp 440.000} + \text{Rp 48.400} - \text{Rp 8.800} = \text{Rp 479.600}$$

#### 4. Pencairan Dana Bersih ke Rekening Toko PT (Settlement):

| Rincian Pembagian Dana Escrow                                   | Nilai (Rp)                                                                  |
| :-------------------------------------------------------------- | :-------------------------------------------------------------------------- |
| Dana Penjualan Barang Bersih                                    | Rp 22.000.000                                                               |
| Biaya Packing Toko                                              | + Rp 5.000                                                                  |
| Beban Komisi Platform & Pajak                                   | - Rp 479.600                                                                |
| **Hak Transfer Bersih ke Rekening PT Toko**                     | **Rp 21.525.400**                                                           |
| _Dari Rp 21.525.400 tersebut, kewajiban setor PPN Toko adalah:_ | _Rp 2.180.180 (PPN Keluaran) - Rp 48.400 (PPN Masukan Jasa) = Rp 2.131.780_ |
| _Kewajiban setor PPh 23 Toko atas jasa platform:_               | _Rp 8.800 (disetor Toko ke kas negara via NTPN)_                            |

---

## 9. Manajemen Risiko, Validasi Data, & Kepatuhan DJP

### A. Validasi Format NPWP & NIK 16 Digit

DJP menolak impor file e-Faktur jika nomor identitas tidak valid. Sistem menerapkan algoritma validasi:

1. **NPWP 16 Digit Badan:** Harus berupa 16 digit angka numerik. Untuk NPWP format lama (15 digit), sistem otomatis menambahkan angka `0` di posisi paling awal.
2. **NIK 16 Digit Perorangan:** Validasi format 16 digit numerik sesuai standar Dukcapil.
3. **NPWP 00.000.000.0-000.000:** Fallback aman untuk transaksi retail B2C yang tidak melampirkan identitas pajak terpisah (Faktur Digunggung).

### B. Pencegahan Nomor Seri Ganda (NSFP Collision)

Jika dua transaksi selesai bersamaan, sistem mencegah duplikasi NSFP dengan memanfaatkan **Row-Level Atomic Increment** pada tabel `StoreTaxQuota` di dalam PostgreSQL transaction:

```typescript
const updatedQuota = await tx.storeTaxQuota.update({
  where: { id: quota.id },
  data: { lastUsed: { increment: 1 } },
})
const assignedNumber = `${updatedQuota.prefix}.${String(updatedQuota.lastUsed).padStart(8, '0')}`
```

### C. Penanganan Retur Produk (Nota Retur / Pembatalan Faktur)

Jika customer mengajukan retur unit dan disetujui toko:

- Status `TaxInvoice` berubah menjadi `CANCELLED`.
- Sistem membuat catatan **Draf Nota Retur Pajak** yang secara otomatis mengurangi PPN Keluaran pada laporan masa pajak berjalan.

---

## 10. Rencana Aksi & Roadmap Implementasi Bertahap

Untuk menjaga stabilitas aplikasi yang sedang aktif (0 error TypeScript & 100% unit tests pass), implementasi dibagi ke dalam 4 tahap terukur:

```
[FASE 1: Fondasi Skema & Engine]
  ├── Update Prisma Schema (Store, Order, TaxInvoice, StoreTaxQuota)
  ├── Migration database PostgreSQL
  └── Pembuatan `src/lib/tax/tax-engine.ts` & Unit Test 100%
             │
             ▼
[FASE 2: Integrasi Checkout & Pencatatan Transaksi]
  ├── Update `src/app/api/checkout/route.ts` (DPP, PPN, PPh 23, B2B fields)
  ├── Update UI Checkout (Rincian PPN & Form NPWP 16-Digit)
  └── Validasi integritas kalkulasi order
             │
             ▼
[FASE 3: Settlement Keuangan & Rekonsiliasi Multi-PT]
  ├── Update `src/app/api/admin/finance/route.ts` (Alokasi PPh 23 & PPN Jasa)
  ├── Penambahan metrik pajak di `src/app/dashboard/admin/finance/page.tsx`
  └── Update Laporan Ekspor Excel (`reports/export/route.ts`)
             │
             ▼
[FASE 4: Modul e-Faktur DJP & Generator Draf PDF]
  ├── Pembuatan generator CSV Impor e-Faktur DJP (`efaktur-generator.ts`)
  ├── Pembuatan API download CSV & draf PDF faktur pajak
  └── Tab Manajemen Pajak di Dashboard Admin Toko & Superadmin
```

---

## Ringkasan Keputusan Teknis

1. **Pilihan Default PPN:** Menggunakan skema **Inklusif 11%** untuk etalase publik (sesuai ekspektasi pasar e-commerce retail Indonesia) dengan opsi **Eksklusif** untuk segmen B2B.
2. **Kemandirian Pajak:** Setiap PT Toko Cabang memiliki kuota NSFP dan identitas NPWP 16-digit sendiri, menjaga kemurnian desentralisasi omzet Multi-PT.
3. **Keamanan Ekspor DJP:** Format CSV ekspor diselaraskan 100% dengan spesifikasi PER-03/PJ/2022 e-Faktur DJP agar akuntan toko dapat langsung mengimpor tanpa manipulasi manual.
