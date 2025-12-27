# HaloTekno Database Import Guide

## File Export yang Tersedia

File SQL export database sudah tersedia di folder `database-exports/`:

- **File:** `halotekno_export_2025-12-27T19-50-07.sql`
- **Size:** ~9.6 MB
- **Contains:** Semua data dari database saat ini (Users, Technicians, Services, Products, Rentals, Mitras, Articles, Orders, Reviews, dll)

## Cara Import Database (Untuk Teman Anda)

### Step 1: Setup Project

```bash
# Clone repository
git clone <repository-url>
cd HaloTekno

# Install dependencies
npm install
```

### Step 2: Setup Environment

Buat file `.env` dengan isi:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/halotekno"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

**Ganti `password` dengan password PostgreSQL Anda!**

### Step 3: Create Database

```bash
# Buat database baru
createdb halotekno

# Atau via psql:
psql -U postgres
CREATE DATABASE halotekno;
\q
```

### Step 4: Run Prisma Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations untuk create tables
npx prisma migrate deploy
```

### Step 5: Import Data dari SQL File

```bash
# Import SQL dump
psql -U postgres -d halotekno -f database-exports/halotekno_export_2025-12-27T19-50-07.sql
```

**PENTING:** Pastikan file SQL ada di folder `database-exports/`

### Step 6: Verify Import

```bash
# Buka Prisma Studio untuk verify
npx prisma studio
```

Cek bahwa semua tabel terisi dengan data yang sama.

### Step 7: Run Development Server

```bash
npm run dev
```

Buka browser: http://localhost:3000

## Expected Data After Import

Database akan memiliki data yang sama persis:

| Table        | Records |
| ------------ | ------- |
| Users        | 11+     |
| Technicians  | 25+     |
| Services     | 75+     |
| Products     | 37+     |
| Rental Items | 22+     |
| Mitras       | 18+     |
| Articles     | 50+     |
| Orders       | 186+    |
| Order Items  | 240+    |
| Reviews      | 382+    |
| Payments     | 140+    |

## Troubleshooting

### Error: "relation already exists"

Database sudah ada data. Reset dulu:

```bash
# Drop dan create ulang database
dropdb halotekno
createdb halotekno

# Run migrations
npx prisma migrate deploy

# Import ulang
psql -U postgres -d halotekno -f database-exports/halotekno_export_2025-12-27T19-50-07.sql
```

### Error: "permission denied"

Pastikan user PostgreSQL punya permission:

```bash
psql -U postgres
GRANT ALL PRIVILEGES ON DATABASE halotekno TO postgres;
\q
```

### Error: "file not found"

Pastikan file SQL ada di folder yang benar:

```bash
# Check file exists
ls database-exports/

# Atau gunakan absolute path
psql -U postgres -d halotekno -f "D:/Project/HaloTekno/database-exports/halotekno_export_2025-12-27T19-50-07.sql"
```

## Re-Export Database (Jika Ada Update)

Jika Anda update database dan ingin export ulang:

```bash
npx ts-node prisma/export-database.ts
```

File baru akan dibuat dengan timestamp terbaru.

## Notes

- File SQL ini berisi **semua data** dari database saat ini
- Import akan skip data yang sudah ada (ON CONFLICT DO NOTHING)
- Aman untuk di-import berkali-kali
- File SQL sudah include semua relasi dan foreign keys

---

**Last Updated:** 2025-12-28
**Database Export:** 2025-12-27 19:50:07
