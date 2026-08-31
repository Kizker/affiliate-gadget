# Database Backup & Seed Instructions

## Untuk Teman yang Ingin Menggunakan Database Ini

### Langkah-langkah:

1. **Clone repository dan install dependencies**

   ```bash
   git clone https://github.com/habstrakT808/affiliate-gadget-platform.git
   cd affiliate-gadget-platform
   pnpm install
   ```

2. **Setup environment variables**
   - Copy `.env.example` ke `.env`
   - Sesuaikan `DATABASE_URL` dengan database PostgreSQL Anda

3. **Run migrations**

   ```bash
   npx prisma migrate dev
   ```

4. **Seed database dari backup**
   File `prisma/seed-data.json` sudah berisi data dari database production.

   ```bash
   npx tsx prisma/seed-from-backup.ts
   ```

### Login Credentials

Semua user menggunakan password default: **`password123`**

| Email               | Role        | Keterangan                               |
| ------------------- | ----------- | ---------------------------------------- |
| super@affiliategadget.com | SUPER_ADMIN | Super Admin (bisa konfirmasi pembayaran) |
| customer@test.com   | CUSTOMER    | Customer untuk testing                   |
| teknisi@test.com    | MITRA       | Teknisi untuk testing                    |

### Data yang Tersedia

Backup ini berisi:

- 3 Users (dengan berbagai role)
- 1 Technician
- 1 Product (Sparepart)
- 3 Services
- 3 Orders (dengan items)
- 3 Reviews
- 2 Chat Rooms (dengan messages)

### Catatan Penting

1. **Password tidak di-export** untuk keamanan. Semua user akan menggunakan password default `password123`.

2. **Gambar/Media** masih menggunakan URL Cloudinary yang sama. Jika ingin menggunakan Cloudinary sendiri, ubah URL di file JSON.

3. **Database harus kosong** sebelum menjalankan seed. Script akan menghapus semua data existing.

### Troubleshooting

**Error: prisma/seed-data.json not found**

- Pastikan file `seed-data.json` ada di folder `prisma/`

**Error: Foreign key constraint**

- Pastikan menjalankan `npx prisma migrate dev` terlebih dahulu
- Pastikan database kosong atau jalankan `npx prisma migrate reset`

**Error: Duplicate key**

- Database masih ada data. Jalankan `npx prisma migrate reset` untuk reset database.

---

## Untuk Developer: Export Database Baru

Jika ingin membuat backup baru dari database saat ini:

```bash
npx tsx scripts/export-database.ts
```

File akan disimpan di `prisma/seed-data.json`.
