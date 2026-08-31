# Panduan Setup untuk Developer Baru (Clone Environment)

Panduan ini akan membantu Anda menjalankan proyek `Affiliate Gadget` dengan environment yang **sama persis** (termasuk data user, mitra, dll) menggunakan Docker.

## Prasyarat

1.  **Node.js** (Versi 20+)
2.  **Docker Desktop** (Pastikan sudah terinstall dan running)
3.  **Git**
4.  **Google Maps API Key** (Minta ke Developer sebelumnya)

## Langkah-langkah Setup

### 1. Clone Repository & Install Dependencies

```bash
git clone https://github.com/habstrakT808/affiliate-gadget-platform.git
cd affiliate-gadget-platform
pnpm install
# atau
npm install
```

### 2. Setup Environment Variables

Copy file `.env.example` ke `.env`:

```bash
cp .env.example .env
```

Lalu edit file `.env`. Pastikan setting berikut sesuai untuk Docker:

```env
# Database (Local Docker)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/affiliate_gadget

# Redis (Local Docker)
REDIS_URL=redis://localhost:6379

# Google Maps API (Isi dengan Key yang diberikan)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza....
```

### 3. Jalankan Docker (Database & Redis)

Jalankan perintah ini untuk menyalakan database PostgreSQL dan Redis:

```bash
docker-compose up -d
```

Tunggu beberapa saat sampai database statusnya `healthy`.

### 4. Push Schema Database

Buat tabel di database PostgreSQL:

```bash
npx prisma db push
```

### 5. Restore Data (PENTING!)

Langkah ini akan mengisi database Anda dengan data clone yang persis sama:

```bash
npx prisma db seed
```

_Script ini akan membaca file `prisma/seeds/backup-data.json` dan memasukkannya ke database lokal Anda._

### 6. Jalankan Aplikasi

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

---

## Troubleshooting

- **Error koneksi database?**
  Pastikan docker container running (`docker ps`). Jika port 5432 conflict, matikan postgres lokal services.

- **Data tidak muncul?**
  Pastikan file `prisma/seeds/backup-data.json` ada. File ini digenerate dari developer sebelumnya.

Selamat coding! 🚀
