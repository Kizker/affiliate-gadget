# 🔧 HaloTekno - Enterprise Service Ecosystem

> Platform digital enterprise-grade untuk layanan servis HP, sewa alat, penjualan sparepart, dan direktori mitra servis se-Indonesia.

---

## 📋 Daftar Isi

- [Tentang Project](#-tentang-project)
- [Tech Stack](#-tech-stack)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Fitur Utama](#-fitur-utama)
- [Database Schema](#-database-schema)
- [Struktur Folder](#-struktur-folder)
- [Setup Development](#-setup-development)
- [Environment Variables](#-environment-variables)
- [Git Workflow](#-git-workflow)
- [Deployment](#-deployment)
- [Roadmap & Task Breakdown](#-roadmap--task-breakdown)

---

## 🎯 Tentang Project

**HaloTekno** adalah platform digital komprehensif yang menghubungkan customer dengan layanan servis HP profesional. Platform ini menyediakan:

1. **Layanan Servis HP**
   - Konsultasi servis
   - Jasa cek/bongkar
   - Jasa servis lengkap
2. **Sewa Alat** - Penyewaan peralatan servis di tempat
3. **Penjualan Sparepart** - Marketplace sparepart HP
4. **Direktori Mitra** - Rekomendasi tempat servis se-Indonesia (seperti Google Business)

### Target User

| Role                  | Deskripsi                                                 |
| --------------------- | --------------------------------------------------------- |
| **Customer**          | Pengguna yang booking servis, sewa alat, beli sparepart   |
| **Super Admin**       | Owner HaloTekno, akses penuh ke semua fitur               |
| **Admin Operasional** | Teknisi internal, balas chat, update stok, kelola katalog |
| **Mitra**             | Partner eksternal yang mempromosikan bengkelnya           |

---

## 🛠 Tech Stack

### Frontend

| Technology              | Purpose                        |
| ----------------------- | ------------------------------ |
| Next.js 15 (App Router) | Framework React dengan SSR/SSG |
| TypeScript (Strict)     | Type-safe development          |
| TailwindCSS             | Utility-first CSS              |
| shadcn/ui               | Component library modern       |
| Framer Motion           | Animasi smooth                 |
| React Hook Form + Zod   | Form handling & validation     |
| Zustand                 | State management ringan        |
| TanStack Query          | Data fetching & caching        |
| Socket.io Client        | Real-time chat                 |

### Backend

| Technology           | Purpose                       |
| -------------------- | ----------------------------- |
| Next.js API Routes   | RESTful API endpoints         |
| Server Actions       | Server-side mutations         |
| Prisma ORM           | Database ORM type-safe        |
| PostgreSQL + PostGIS | Database dengan geolocation   |
| Redis                | Caching & session             |
| Socket.io            | WebSocket server untuk chat   |
| NextAuth.js          | Authentication multi-provider |

### Infrastructure (Development)

| Service     | Purpose              | Free Tier   |
| ----------- | -------------------- | ----------- |
| Vercel      | Hosting & Serverless | Unlimited   |
| Neon.tech   | PostgreSQL managed   | 0.5GB       |
| Upstash     | Redis serverless     | 10K cmd/day |
| Uploadthing | File storage         | 2GB         |
| Resend      | Email service        | 3K/month    |

### Infrastructure (Production - Self-Hosted)

| Service        | Purpose                         |
| -------------- | ------------------------------- |
| VPS Hostinger  | Server hosting                  |
| PostgreSQL     | Database self-hosted            |
| Redis          | Cache self-hosted               |
| MinIO/Local FS | File storage                    |
| Nginx + PM2    | Reverse proxy & process manager |

### Code Quality

| Tool        | Purpose              |
| ----------- | -------------------- |
| ESLint      | Linting              |
| Prettier    | Code formatting      |
| Husky       | Git hooks            |
| Lint-staged | Pre-commit checks    |
| Commitlint  | Conventional commits |

---

## 🏗 Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  Browser/PWA  │  Mobile Web  │  Desktop Web                    │
└───────────────┬─────────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  Next.js 15 (App Router)                                       │
│  ├── Server Components (RSC)                                   │
│  ├── Server Actions                                            │
│  ├── API Routes                                                │
│  └── Middleware (Auth, Rate Limiting)                          │
└───────────────┬─────────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SERVICE LAYER                             │
├─────────────────────────────┬───────────────────────────────────┤
│  Auth Service (NextAuth)    │  Chat Service (Socket.io)        │
│  Payment Service (Midtrans) │  Notification Service            │
│  File Service (Uploadthing) │  Email Service (Resend)          │
└───────────────┬─────────────┴───────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                               │
├─────────────────────────────┬───────────────────────────────────┤
│  PostgreSQL + PostGIS       │  Redis Cache                     │
│  (Primary Database)         │  (Session, Cache, Rate Limit)    │
└─────────────────────────────┴───────────────────────────────────┘
```

---

## ✨ Fitur Utama

### 1. Landing Page & Halaman Publik

- [x] **Hero section full-screen**
      → Tampilan pembuka website dengan gambar/video full layar seperti Porsche atau GitHub. Menampilkan tagline minimalis dan CTA (tombol aksi) yang jelas.

- [x] **Katalog teknisi dengan filter**
      → Halaman daftar teknisi internal HaloTekno. Menampilkan foto, nama, pengalaman kerja, spesialisasi, rating, dan kisaran harga. Customer bisa filter berdasarkan kategori keahlian.

- [x] **Katalog sparepart**
      → Halaman seperti toko online yang menampilkan daftar sparepart HP. Ada foto produk, nama, harga, stok tersedia, dan tombol untuk menambahkan ke keranjang.

- [x] **Katalog sewa alat**
      → Daftar peralatan servis yang bisa disewa. Menampilkan nama alat, foto, harga sewa per hari, dan deskripsi singkat. Customer checkout langsung dan mendapat resi otomatis.

- [x] **Direktori mitra**
      → Halaman rekomendasi bengkel servis HP se-Indonesia (seperti Google Business). Ada tampilan peta dan list view. Customer bisa filter berdasarkan kota, rating, atau jarak terdekat.

- [x] **Blog/artikel SEO**
      → Halaman blog berisi artikel tips & trik seputar servis HP. Dioptimasi untuk ranking Google dengan meta tags dan structured data.

- [x] **Halaman about perusahaan**
      → Halaman profil perusahaan HaloTekno. Berisi visi misi, sejarah, tim, dan informasi kontak.

---

### 2. Authentication & Authorization

- [x] **Login Email + Password**
      → Customer, admin, dan mitra bisa login menggunakan email dan password yang didaftarkan.

- [x] **Login Google OAuth**
      → Opsi login cepat menggunakan akun Google tanpa perlu membuat password baru.

- [x] **Multi-role system**
      → Sistem membedakan 4 peran: Super Admin (owner), Admin Operasional (teknisi), Mitra (partner bengkel), dan Customer (pengguna).

- [x] **Protected routes per role**
      → Setiap halaman dilindungi sesuai peran. Customer tidak bisa akses dashboard admin, mitra tidak bisa akses fitur super admin, dst.

- [x] **Session management**
      → Sistem mengelola sesi login dengan aman. Otomatis logout jika tidak aktif dalam waktu tertentu.

---

### 3. Fitur Customer

- [x] **Browse & filter katalog teknisi**
      → Customer bisa melihat semua teknisi, filter berdasarkan keahlian (LCD, mesin, software), dan urutkan berdasarkan rating atau pengalaman.

- [x] **Live chat dengan teknisi**
      → Sebelum booking, customer bisa chat langsung dengan teknisi untuk konsultasi kebutuhan servis.

- [x] **Booking jadwal servis**
      → Setelah diskusi via chat, customer bisa booking jadwal servis. Pilih tanggal dan waktu yang tersedia, lalu konfirmasi.

- [x] **Keranjang belanja**
      → Customer bisa menambahkan beberapa item (sparepart, jasa, sewa alat) ke keranjang dan checkout sekaligus.

- [x] **Checkout per-item**
      → Selain checkout keranjang, customer juga bisa langsung checkout satu item tanpa memasukkan ke keranjang.

- [x] **Upload bukti transfer**
      → Setelah checkout, customer upload bukti transfer via chat. Admin akan memverifikasi pembayaran.

- [x] **Track status order**
      → Customer bisa memantau status pesanan: Menunggu Pembayaran → Dibayar → Dalam Proses → Selesai.

- [x] **Riwayat transaksi**
      → Semua transaksi tersimpan di halaman riwayat. Customer bisa lihat detail order lama dan download invoice.

- [x] **Sistem garansi & tiket komplain**
      → Jika ada garansi dari admin, customer bisa mengajukan komplain selama masa garansi aktif. Sistem otomatis menolak jika sudah lewat masa garansi.

- [x] **Rating & review**
      → Setelah servis selesai, customer bisa memberikan rating bintang dan ulasan untuk teknisi, mitra, atau produk.

---

### 4. Fitur Teknisi/Admin Operasional

- [x] **Dashboard order management**
      → Halaman khusus untuk melihat semua order yang masuk. Ada filter berdasarkan status dan pencarian.

- [x] **Live chat dengan customer**
      → Admin/teknisi bisa membalas chat dari customer secara real-time.

- [x] **Update status order**
      → Teknisi bisa mengubah status order sesuai progress pengerjaan (Diagnosa → Pengerjaan → Selesai).

- [x] **Kelola katalog**
      → Admin bisa menambah, edit, atau hapus item di katalog jasa servis, sparepart, dan alat sewa.

- [x] **Kelola stok sparepart**
      → Stok otomatis berkurang saat ada pembelian. Admin bisa update stok manual dan melihat riwayat keluar-masuk.

- [x] **Approve/reject komplain garansi**
      → Ketika customer mengajukan komplain, teknisi yang bersangkutan harus approve/reject terlebih dahulu.

---

### 5. Fitur Mitra

- [x] **Dashboard mitra**
      → Halaman khusus untuk mitra melihat statistik profil mereka: jumlah view, inquiry masuk, dan rating.

- [x] **Kelola profil bengkel**
      → Mitra bisa upload banner, foto-foto bengkel, deskripsi layanan, alamat, dan informasi kontak.

- [x] **Set jam operasional**
      → Mitra bisa mengatur jam buka-tutup untuk setiap hari dalam seminggu.

- [x] **Kelola layanan**
      → Mitra bisa menambahkan daftar layanan yang mereka tawarkan (ganti LCD, servis mesin, dll).

- [x] **Terima inquiry dari customer**
      → Customer bisa mengirim inquiry/pertanyaan ke mitra. Notifikasi masuk ke dashboard mitra.

- [x] **Live chat dengan customer**
      → Mitra bisa chat langsung dengan customer yang tertarik dengan bengkel mereka.

---

### 6. Fitur Super Admin

- [x] **Dashboard analytics lengkap**
      → Tampilan grafik dan statistik: total revenue, jumlah order, top teknisi, pending approval, dan trend penjualan.

- [x] **User management**
      → Super admin bisa membuat akun admin/teknisi baru, edit, atau nonaktifkan akun.

- [x] **Approve mitra baru**
      → Ketika ada pendaftaran mitra baru, super admin harus approve sebelum profil mitra tayang di website.

- [x] **Verifikasi pembayaran manual**
      → Super admin memeriksa bukti transfer yang diupload customer dan mengkonfirmasi pembayaran.

- [x] **Kelola rekening per kategori**
      → Super admin bisa mengatur nomor rekening berbeda untuk setiap kategori: Jasa, Sewa, dan Sparepart.

- [x] **Kelola garansi**
      → Super admin menentukan apakah suatu servis memiliki garansi dan berapa lama durasinya.

- [x] **Export data**
      → Super admin bisa download laporan dalam format CSV/Excel untuk analisis di spreadsheet, atau PDF untuk arsip.

- [x] **CMS blog/artikel**
      → Super admin bisa membuat, edit, dan publish artikel blog melalui editor WYSIWYG (What You See Is What You Get).

---

### 7. Fitur Real-time

- [x] **Live chat**
      → Komunikasi real-time antara customer dengan teknisi, mitra, atau customer service. Pesan terkirim instan tanpa perlu refresh.

- [x] **Typing indicator**
      → Indikator "sedang mengetik..." muncul saat lawan bicara sedang mengetik pesan.

- [x] **Read receipts**
      → Tanda centang untuk menunjukkan pesan sudah terkirim dan sudah dibaca.

- [x] **Image & file attachment**
      → Pengguna bisa mengirim foto (bukti transfer, foto kerusakan) dan file (PDF, dokumen) di chat. Max 2MB per file.

- [x] **Chat history 90 hari**
      → Riwayat chat tersimpan selama 90 hari. Setelah itu otomatis terhapus untuk menghemat storage.

- [x] **In-app notifications**
      → Notifikasi muncul di dalam aplikasi untuk: order baru, chat baru, pembayaran dikonfirmasi, status berubah, dll.

---

### 8. Payment & Transaksi

- [x] **Manual payment**
      → Pembayaran dilakukan dengan transfer bank manual. Customer upload bukti transfer, admin verifikasi.

- [x] **Multi-rekening**
      → Nomor rekening berbeda untuk setiap kategori layanan. Sistem otomatis menampilkan rekening yang sesuai saat checkout.

- [x] **Invoice PDF generator**
      → Sistem otomatis generate invoice PDF profesional dengan kop surat, detail transaksi, dan QR code validasi.

- [x] **Midtrans integration (future)**
      → Integrasi payment gateway Midtrans untuk pembayaran otomatis (kartu kredit, e-wallet, QRIS). Akan diimplementasi di fase production.

---

### 9. SEO & Performance

- [x] **SSR/SSG optimization**
      → Halaman dirender di server untuk loading cepat dan SEO optimal. Konten statis di-generate saat build time.

- [x] **Image auto-compress**
      → Semua gambar yang diupload otomatis dikompresi dan dikonversi ke format WebP untuk ukuran lebih kecil tanpa kehilangan kualitas.

- [x] **Lazy loading**
      → Gambar dan komponen berat hanya dimuat saat masuk viewport (area layar yang terlihat). Menghemat bandwidth dan mempercepat loading.

- [x] **Skeleton loading**
      → Saat data sedang dimuat, tampil placeholder animasi (skeleton) sebagai pengganti loading spinner. UX lebih smooth.

- [x] **Meta tags dinamis**
      → Setiap halaman memiliki title, description, dan Open Graph tags yang unik untuk SEO dan sharing ke social media.

- [x] **Sitemap & robots.txt**
      → File sitemap.xml dan robots.txt otomatis di-generate untuk membantu Google mengindex website.

- [x] **PWA support**
      → Website bisa di-install ke home screen HP seperti aplikasi native. Support offline mode dan push notifications.

---

## 🗄 Database Schema

### Entity Relationship Overview

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│   User   │────<│  Order   │>────│  Service │
└──────────┘     └──────────┘     └──────────┘
     │                │
     │           ┌────┴────┐
     │           │         │
     ▼           ▼         ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│  Mitra   │ │OrderItem │ │ Payment  │
└──────────┘ └──────────┘ └──────────┘
     │
     ▼
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Review  │     │  Chat    │     │  Ticket  │
└──────────┘     └──────────┘     └──────────┘
```

### Tables

| Table             | Description                              |
| ----------------- | ---------------------------------------- |
| `users`           | Data user (customer, admin, teknisi)     |
| `accounts`        | OAuth accounts (NextAuth)                |
| `sessions`        | User sessions                            |
| `mitras`          | Data mitra/bengkel partner               |
| `mitra_services`  | Layanan yang ditawarkan mitra            |
| `mitra_images`    | Galeri foto mitra                        |
| `mitra_schedules` | Jam operasional mitra                    |
| `technicians`     | Profil teknisi dengan experience, rating |
| `services`        | Katalog jasa servis                      |
| `products`        | Katalog sparepart                        |
| `rental_items`    | Katalog alat sewa                        |
| `carts`           | Keranjang belanja                        |
| `cart_items`      | Item dalam keranjang                     |
| `orders`          | Data pesanan                             |
| `order_items`     | Item dalam pesanan                       |
| `payments`        | Data pembayaran                          |
| `bank_accounts`   | Rekening per kategori                    |
| `invoices`        | Invoice generated                        |
| `warranties`      | Data garansi                             |
| `tickets`         | Tiket komplain                           |
| `chats`           | Room chat                                |
| `messages`        | Pesan dalam chat                         |
| `reviews`         | Rating & review                          |
| `articles`        | Blog/artikel                             |
| `notifications`   | In-app notifications                     |

---

## 📁 Struktur Folder

```
halotekno/
├── .husky/                    # Git hooks
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   └── seed.ts                # Seed data
├── public/
│   ├── images/                # Static images
│   └── manifest.json          # PWA manifest
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Auth routes (login, register)
│   │   ├── (customer)/        # Customer protected routes
│   │   ├── (admin)/           # Admin protected routes
│   │   ├── (mitra)/           # Mitra protected routes
│   │   ├── api/               # API routes
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── forms/             # Form components
│   │   ├── layouts/           # Layout components
│   │   └── shared/            # Shared components
│   ├── lib/
│   │   ├── auth.ts            # NextAuth config
│   │   ├── db.ts              # Prisma client
│   │   ├── redis.ts           # Redis client
│   │   ├── socket.ts          # Socket.io config
│   │   ├── utils.ts           # Utility functions
│   │   └── validations/       # Zod schemas
│   ├── hooks/                 # Custom React hooks
│   ├── stores/                # Zustand stores
│   ├── services/              # API service functions
│   ├── types/                 # TypeScript types
│   └── styles/
│       └── globals.css        # Global styles
├── .env.example               # Environment variables template
├── .eslintrc.json             # ESLint config
├── .prettierrc                # Prettier config
├── commitlint.config.js       # Commitlint config
├── docker-compose.yml         # Docker for local dev
├── next.config.js             # Next.js config
├── tailwind.config.ts         # Tailwind config
├── tsconfig.json              # TypeScript config
└── package.json
```

---

## 🚀 Setup Development

### Prerequisites

- Node.js 20+
- pnpm 8+ (recommended) atau npm
- Docker Desktop (untuk PostgreSQL & Redis local)
- Git

### 1. Clone & Install

```bash
# Clone repository
git clone https://github.com/[username]/halotekno.git
cd halotekno
# Install dependencies
pnpm install
```

### 2. Setup Environment

```bash
# Copy environment template
cp .env.example .env.local
# Edit .env.local dengan credentials Anda
```

### 3. Start Database (Docker)

```bash
# Start PostgreSQL & Redis
docker-compose up -d
# Verify containers running
docker ps
```

### 4. Setup Database

```bash
# Generate Prisma client
pnpm prisma generate
# Run migrations
pnpm prisma migrate dev
# Seed initial data
pnpm prisma db seed
```

### 5. Start Development Server

```bash
pnpm dev
```

## Buka [http://localhost:3000](http://localhost:3000)

## 🔐 Environment Variables

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=HaloTekno
# Database (Development - Neon)
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
# Database (Local Docker)
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/halotekno
# Redis (Development - Upstash)
REDIS_URL=redis://default:xxx@xxx.upstash.io:6379
# Redis (Local Docker)
# REDIS_URL=redis://localhost:6379
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-min-32-chars
# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
# File Upload (Uploadthing)
UPLOADTHING_SECRET=sk_live_xxx
UPLOADTHING_APP_ID=xxx
# Email (Resend)
RESEND_API_KEY=re_xxx
# Midtrans (Payment)
MIDTRANS_SERVER_KEY=xxx
MIDTRANS_CLIENT_KEY=xxx
MIDTRANS_IS_PRODUCTION=false
# WhatsApp CS
NEXT_PUBLIC_WHATSAPP_CS=6281234567890
```

---

## 🌿 Git Workflow

### Branch Strategy

```
main (production-ready)
├── staging (testing/preview)
└── develop (development aktif)
    ├── feature/nama-fitur
    └── fix/nama-bug
```

### Workflow

1. **Buat branch baru dari `develop`**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/nama-fitur
   ```
2. **Commit dengan conventional commits**
   ```bash
   git commit -m "feat: add technician catalog page"
   git commit -m "fix: resolve chat connection issue"
   git commit -m "docs: update README"
   ```
3. **Push & merge ke develop**
   ```bash
   git push origin feature/nama-fitur
   # Merge langsung ke develop (trust-based)
   ```

### Commit Types

| Type       | Description                 |
| ---------- | --------------------------- |
| `feat`     | Fitur baru                  |
| `fix`      | Bug fix                     |
| `docs`     | Dokumentasi                 |
| `style`    | Formatting (no code change) |
| `refactor` | Code refactoring            |
| `test`     | Tests                       |
| `chore`    | Maintenance                 |

---

## 📦 Deployment

### Development → Vercel (Staging)

1. Connect repository ke Vercel
2. Set environment variables di Vercel Dashboard
3. Auto-deploy setiap push ke `develop` atau `staging`

### Production → VPS Hostinger

> Panduan lengkap migrasi ke self-hosted akan ditambahkan saat sudah siap production.
> **Summary:**

1. Setup VPS dengan Ubuntu LTS
2. Install Docker, Nginx, PM2
3. Setup PostgreSQL & Redis
4. Configure Nginx reverse proxy
5. Setup SSL dengan Let's Encrypt
6. Deploy dengan PM2 ecosystem

---

## 📅 Roadmap & Task Breakdown

> **Keterangan Prioritas:**
>
> - **P0** = Harus selesai pertama, fitur inti yang wajib ada
> - **P1** = Penting, dikerjakan setelah P0 selesai
> - **P2** = Nice to have, dikerjakan terakhir atau bisa ditunda

---

### Phase 1: Foundation (Priority: P0)

> Fondasi project - wajib selesai sebelum mulai development fitur apapun.

- [ ] **Project setup**
      → Inisialisasi project Next.js 15 dengan TypeScript strict mode. Setup ESLint untuk linting, Prettier untuk formatting, dan Husky untuk git hooks (auto-lint sebelum commit).

- [ ] **Database schema & Prisma setup**
      → Membuat skema database lengkap di Prisma. Definisikan semua tabel, relasi, dan index. Setup koneksi ke PostgreSQL (Docker untuk local, Neon untuk staging).

- [ ] **Authentication system**
      → Implementasi NextAuth.js dengan provider Email/Password dan Google OAuth. Setup session management, protected routes, dan middleware auth.

- [ ] **Base UI components**
      → Install dan konfigurasi shadcn/ui. Setup komponen dasar: Button, Input, Card, Dialog, Toast, dll. Customisasi sesuai design system nanti.

- [ ] **Layout system**
      → Buat layout responsive untuk: Public pages, Customer dashboard, Admin dashboard, Mitra dashboard. Termasuk Navbar, Sidebar, dan Footer.

---

### Phase 2: Public Pages (Priority: P0)

> Halaman-halaman yang bisa diakses tanpa login.

- [ ] **Landing page**
      → Halaman utama dengan hero section full-screen (style Porsche/GitHub). Tampilkan tagline, fitur unggulan, testimoni, dan CTA untuk daftar/login.

- [ ] **Katalog teknisi**
      → Halaman list semua teknisi dengan foto, nama, rating, dan spesialisasi. Ada filter dan search. Klik untuk masuk ke detail teknisi.

- [ ] **Katalog sparepart**
      → Halaman seperti toko online. List produk dengan gambar, nama, harga, stok. Filter berdasarkan kategori HP. Tombol add to cart.

- [ ] **Katalog sewa alat**
      → Daftar alat yang bisa disewa. Tampilkan nama, foto, harga per hari, deskripsi. Tombol untuk checkout langsung.

- [ ] **Halaman about**
      → Profil perusahaan HaloTekno. Visi misi, sejarah, tim inti, alamat kantor, dan kontak.

- [ ] **Blog/artikel**
      → Halaman list artikel dengan thumbnail, judul, tanggal, excerpt. Klik untuk baca artikel lengkap. SEO-friendly dengan meta tags.

---

### Phase 3: Customer Features (Priority: P0)

> Fitur-fitur khusus untuk customer yang sudah login.

- [ ] **Customer dashboard**
      → Halaman utama customer setelah login. Tampilkan ringkasan: order aktif, notifikasi baru, riwayat singkat.

- [ ] **Keranjang belanja**
      → Halaman cart untuk review item sebelum checkout. Bisa ubah quantity, hapus item, lihat subtotal per item dan total keseluruhan.

- [ ] **Checkout flow**
      → Proses checkout: pilih metode bayar → tampilkan rekening tujuan → konfirmasi order. Validasi stok sebelum checkout berhasil.

- [ ] **Payment manual**
      → Halaman instruksi transfer. Tampilkan nomor rekening sesuai kategori (Jasa/Sewa/Sparepart). Customer upload bukti transfer via chat.

- [ ] **Order tracking**
      → Halaman untuk pantau status pesanan. Timeline visual: Menunggu Bayar → Dibayar → Proses → Selesai. Detail setiap tahap dengan timestamp.

- [ ] **Review & rating**
      → Form rating bintang (1-5) dan ulasan text setelah order selesai. Bisa review teknisi, produk, atau mitra.

---

### Phase 4: Admin Features (Priority: P1)

> Dashboard dan fitur untuk Super Admin dan Admin Operasional.

- [ ] **Admin dashboard**
      → Halaman utama admin dengan grafik: revenue hari ini, order masuk, pending verification. Quick stats dan shortcuts ke fitur penting.

- [ ] **User management**
      → CRUD untuk admin dan teknisi (hanya Super Admin). Buat akun baru, edit role, nonaktifkan akun. List semua user dengan filter.

- [ ] **Katalog management**
      → CRUD untuk jasa servis, sparepart, dan alat sewa. Form dengan upload gambar, set harga, kategori, deskripsi, stok.

- [ ] **Order management**
      → List semua order dengan filter status. Detail order: item, customer, payment status, timeline. Aksi: verifikasi bayar, update status.

- [ ] **Payment verification**
      → Queue pembayaran yang perlu diverifikasi. Lihat bukti transfer, konfirmasi atau reject dengan catatan.

- [ ] **Stok management**
      → Dashboard stok sparepart. Alert untuk stok menipis. History keluar-masuk barang. Fitur update stok manual.

---

### Phase 5: Mitra Features (Priority: P1)

> Fitur khusus untuk mitra/partner bengkel.

- [ ] **Mitra registration**
      → Form pendaftaran mitra: data bisnis, alamat, dokumen pendukung. Masuk ke queue approval Super Admin.

- [ ] **Mitra dashboard**
      → Halaman utama mitra: statistik view profil, inquiry masuk, rating rata-rata. Notifikasi dan quick actions.

- [ ] **Profile management**
      → Form edit profil bengkel: upload banner & foto, deskripsi, alamat lengkap, kontak yang bisa dihubungi.

- [ ] **Jam operasional**
      → Form untuk set jam buka-tutup setiap hari dalam seminggu. Support hari libur dan jam khusus.

---

### Phase 6: Real-time Features (Priority: P1)

> Fitur yang membutuhkan komunikasi real-time.

- [ ] **Live chat system**
      → Implementasi Socket.io untuk chat real-time. Room terpisah per conversation. Support customer ↔ teknisi, customer ↔ mitra, customer ↔ CS.

- [ ] **In-app notifications**
      → Sistem notifikasi di dalam app. Bell icon dengan badge counter. List notifikasi dengan link ke halaman terkait. Mark as read.

- [ ] **Typing indicator & read receipts**
      → Indikator "sedang mengetik" saat user mengetik pesan. Centang untuk pesan terkirim dan dibaca.

---

### Phase 7: Advanced Features (Priority: P2)

> Fitur tambahan yang meningkatkan value platform.

- [ ] **Geolocation mitra**
      → Implementasi PostGIS untuk query jarak. Tampilkan mitra berdasarkan jarak dari lokasi user. Peta interaktif dengan marker.

- [ ] **Garansi & tiket komplain**
      → Sistem garansi per servis (durasi ditentukan admin). Form tiket komplain dengan validasi masa garansi. Workflow approval teknisi.

- [ ] **Invoice PDF generator**
      → Service untuk generate invoice PDF. Template profesional dengan kop surat, detail transaksi, QR code validasi, watermark LUNAS.

- [ ] **Export data**
      → Fitur export untuk Super Admin. Download laporan dalam format CSV/Excel atau PDF. Filter by date range dan kategori.

- [ ] **PWA optimization**
      → Konfigurasi Progressive Web App. Service worker untuk offline mode. Push notifications. Install prompt.

---

### Phase 8: Production Ready (Priority: P2)

> Persiapan akhir sebelum go-live ke production.

- [ ] **Midtrans integration**
      → Integrasi payment gateway Midtrans. Support transfer bank, e-wallet, QRIS. Webhook untuk auto-verifikasi pembayaran.

- [ ] **Performance optimization**
      → Audit Core Web Vitals. Optimasi gambar, lazy loading, code splitting. Target LCP < 1.2s. Caching strategy dengan Redis.

- [ ] **Security hardening**
      → Review keamanan: rate limiting, CSRF/XSS protection, input validation. Setup Fail2Ban dan firewall di VPS.

- [ ] **Migration to self-hosted**
      → Dokumentasi dan eksekusi migrasi dari Vercel/Neon ke VPS Hostinger. Setup PostgreSQL, Redis, Nginx, PM2 di VPS.

- [ ] **Documentation finalization**
      → Lengkapi semua dokumentasi: API docs, deployment guide, user manual. Training untuk admin client.

---

## 👥 Tim Pengembang

| Nama                     | NIM             | Role                 | Institusi             |
| ------------------------ | --------------- | -------------------- | --------------------- |
| Hafiyan Al Muqaffi Umary | 225150207111117 | Full Stack Developer | Universitas Brawijaya |
| Fauzan Amirudin Basith   | 2213025041      | Full Stack Developer | Universitas Lampung   |

## **Supervisor:** Bayu Priyambadha, S.Kom., M.Kom., Ph.D.

## 📄 Lisensi

## Proyek ini adalah milik penuh PT. HaloTekno. Seluruh source code, database schema, dan aset digital menjadi hak kekayaan intelektual perusahaan.

<p align="center">
  <strong>HaloTekno</strong> - Enterprise Service Ecosystem<br>
  Built with ❤️ by Satu Harmony Agency
</p>
