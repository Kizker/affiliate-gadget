# 📱 HaloTekno Platform - Dokumentasi Fitur Lengkap

> **Panduan Testing**: Gunakan checklist `[ ]` di bawah ini untuk menandai fitur yang sudah ditest.
> Ubah `[✅]` menjadi `[❌]` setelah testing fitur tersebut.

---

## 👥 Fitur Berdasarkan Role

### 1. Customer

#### 1.1 Authentication &amp; Profile

**Login &amp; Register**

- [✅] Login dengan Email + Password
- [❌] Login dengan Google OAuth
- [✅] Register akun baru
- [❌] Email verification
- [✅] Session management
- [✅] Protected routes
- [✅] Logout functionality

**Profile Management**

- [✅] Edit profil (nama, email, phone, foto)
- [✅] Upload foto profil
- [✅] Ubah password

#### 1.2 Browsing &amp; Discovery

**Katalog Teknisi**

- [✅] Browse semua teknisi internal HaloTekno
- [✅] Filter berdasarkan spesialisasi (LCD, Mesin, Software, Kamera)
- [✅] Urutkan berdasarkan rating
- [✅] Lihat detail profil teknisi
- [✅] Lihat rating dan review teknisi
- [✅] Lihat layanan yang ditawarkan
- [✅] Lihat harga per layanan
- [✅] Lihat bio teknisi
- [✅] Lihat tahun pengalaman
- [✅] Lihat status availability
- [✅] Chat langsung dengan teknisi
- [✅] Booking jasa cek/bongkar HP
- [✅] Booking jasa konsultasi
- [✅] Booking jasa servis lengkap

**Katalog Sparepart**

- [✅] Browse semua produk sparepart
- [✅] Filter berdasarkan kategori (LCD, Baterai, Kamera, Flexible, Casing, Charger, Kabel)
- [✅] Filter berdasarkan brand HP (Apple, Samsung, Xiaomi, Oppo, Vivo, dll)
- [✅] Search produk by nama
- [✅] Lihat detail produk dengan galeri foto
- [✅] Lihat stok tersedia
- [✅] Lihat rating dan review produk
- [✅] Lihat deskripsi lengkap produk
- [✅] Lihat harga produk
- [✅] Beli langsung (Buy Now)
- [✅] Tambah ke keranjang
- [✅] Lihat produk terkait/similar

**Katalog Sewa Alat**

- [✅] Browse semua alat yang bisa disewa
- [✅] Lihat detail alat sewa
- [✅] Lihat harga sewa per hari
- [✅] Lihat stok tersedia
- [✅] Lihat deskripsi alat
- [✅] Lihat foto alat
- [✅] Pilih durasi sewa
- [✅] Hitung total harga sewa
- [✅] Checkout langsung

**Direktori Mitra**

- [✅] Browse semua mitra bengkel se-Indonesia
- [✅] Filter berdasarkan kota
- [❌] Tampilan peta interaktif (Google Maps)
- [✅] Tampilan list view
- [❌] Toggle antara map view dan list view
- [✅] Lihat detail profil mitra
- [✅] Lihat jam operasional
- [✅] Lihat layanan yang ditawarkan
- [✅] Lihat galeri foto bengkel
- [✅] Lihat rating dan review
- [✅] Lihat alamat lengkap
- [✅] Lihat kontak (phone, WhatsApp, email, website)
- [✅] Lihat fasilitas bengkel
- [✅] Chat dengan mitra

**Blog &amp; Artikel**

- [✅] Browse artikel tips &amp; trik servis HP
- [✅] Filter berdasarkan kategori
- [✅] Search artikel
- [✅] Baca artikel lengkap
- [✅] Share artikel ke social media

#### 1.3 Shopping &amp; Checkout

**Keranjang Belanja**

- [✅] Tambah item ke keranjang (sparepart)
- [✅] Lihat semua item di keranjang
- [✅] Lihat gambar produk di keranjang
- [✅] Ubah quantity item
- [✅] Hapus item dari keranjang
- [✅] Lihat subtotal per item
- [✅] Lihat total keseluruhan
- [✅] Validasi stok sebelum checkout
- [✅] Notifikasi jika stok tidak cukup
- [✅] Checkout semua item sekaligus
- [✅] Empty cart state

**Checkout Process**

- [✅] Review order sebelum konfirmasi
- [✅] Lihat ringkasan produk
- [✅] Lihat total harga
- [✅] Tambah catatan untuk teknisi/admin
- [ ] Pilih metode pembayaran
- [ ] Lihat rekening tujuan transfer (berbeda per kategori)
- [✅] Generate order number otomatis
- [✅] Redirect ke halaman konfirmasi order

**Direct Purchase (Sparepart)**

- [✅] Beli langsung tanpa keranjang
- [✅] Pilih quantity
- [✅] Tambah notes opsional
- [✅] Real-time total price calculation
- [✅] Validasi stok
- [✅] Instant checkout

**Booking Service**

- [✅] Pilih teknisi
- [✅] Pilih layanan
- [✅] Lihat harga layanan
- [✅] Tambah catatan kerusakan
- [✅] Pilih tanggal booking
- [✅] Konfirmasi booking
- [ ] Lihat rekening pembayaran

#### 1.4 Payment &amp; Orders

**Payment Management**

- [ ] Manual transfer bank
- [ ] Multi-rekening berdasarkan kategori:
  - [ ] Rekening untuk Jasa Servis
  - [ ] Rekening untuk Sewa Alat
  - [ ] Rekening untuk Sparepart
- [ ] Upload bukti transfer via chat
- [ ] Lihat status verifikasi pembayaran
- [ ] Notifikasi pembayaran dikonfirmasi

**Order Tracking**

- [ ] Lihat semua order (service &amp; sparepart)
- [ ] Lihat detail order
- [ ] Track status order real-time:
  - [ ] `PENDING_PAYMENT` - Menunggu Pembayaran
  - [ ] `PAID` - Dibayar (dikonfirmasi admin)
  - [ ] `IN_PROGRESS` - Sedang Dikerjakan
  - [ ] `COMPLETED` - Selesai
  - [ ] `CANCELLED` - Dibatalkan
- [ ] Lihat timeline order
- [ ] Lihat detail teknisi (untuk service order)
- [ ] Lihat detail produk (untuk sparepart order)
- [ ] Download invoice PDF
- [ ] Cancel order (jika masih PENDING_PAYMENT)

**Order Confirmation Page**

- [ ] Success UI dengan checkmark
- [ ] Display order number
- [ ] Display order status
- [ ] Product/service details dengan gambar
- [ ] Total price breakdown
- [ ] Payment instructions
- [ ] Link ke order tracking
- [ ] Link continue shopping

#### 1.5 Communication

**Live Chat**

- [✅] Chat real-time dengan teknisi
- [✅] Chat real-time dengan mitra
- [✅] Chat real-time dengan customer service
- [✅] Upload gambar (bukti transfer, foto kerusakan)
- [✅] Chat history 90 hari
- [✅] Notifikasi chat baru
- [✅] Lihat daftar chat rooms
- [✅] Search chat history

**Notifications**

- [ ] In-app notifications
- [ ] Notifikasi order baru
- [ ] Notifikasi pembayaran dikonfirmasi
- [ ] Notifikasi status order berubah
- [ ] Notifikasi chat baru
- [ ] Bell icon dengan badge counter
- [ ] Mark as read
- [ ] Mark all as read
- [ ] Link ke halaman terkait
- [ ] Clear all notifications

#### 1.6 Reviews &amp; Ratings

**Product Reviews**

- [✅] Lihat review produk di halaman detail
- [✅] Lihat average rating dengan bintang
- [✅] Lihat total review count
- [✅] Lihat detail review:
  - [✅] User avatar/initial
  - [✅] Customer name
  - [✅] Review date
  - [✅] Star rating (1-5)
  - [✅] Comment text
- [✅] Beri review setelah order selesai
- [✅] Edit review
- [✅] Delete review

**Technician Reviews**

- [✅] Rating bintang (1-5)
- [✅] Komentar ulasan
- [✅] Review setelah servis selesai
- [✅] Lihat semua review teknisi

**Mitra Reviews**

- [✅] Rating bintang (1-5)
- [✅] Komentar ulasan
- [✅] Review setelah interaksi dengan mitra
- [✅] Lihat semua review mitra

#### 1.7 Support &amp; Warranty

**Garansi System**

- [ ] Lihat status garansi order
- [ ] Lihat masa berlaku garansi
- [ ] Ajukan komplain dalam masa garansi
- [ ] Validasi otomatis masa garansi
- [ ] Sistem otomatis tolak jika garansi expired
- [ ] Lihat syarat dan ketentuan garansi

**Tiket Komplain**

- [ ] Buat tiket komplain
- [ ] Upload bukti (foto/dokumen)
- [ ] Track status tiket:
  - [ ] `OPEN` - Baru dibuat
  - [ ] `PENDING_APPROVAL` - Menunggu approve teknisi
  - [ ] `APPROVED` - Disetujui
  - [ ] `REJECTED` - Ditolak
  - [ ] `RESOLVED` - Selesai
  - [ ] `CLOSED` - Ditutup
- [ ] Lihat riwayat tiket
- [ ] Reply pada tiket
- [ ] Close tiket

---

### 2. Teknisi/Admin Operasional

#### 2.1 Dashboard

**Overview Dashboard**

- [✅] Total order hari ini
- [✅] Order pending
- [✅] Order in progress
- [✅] Order completed
- [✅] Total revenue hari ini
- [✅] Quick stats
- [✅] Recent orders
- [✅] Shortcuts ke fitur penting
- [✅] Grafik performa

#### 2.2 Order Management

**Service Orders**

- [✅] Lihat semua service order yang assigned
- [✅] Filter berdasarkan status
- [✅] Lihat detail order:
  - [✅] Customer info
  - [✅] Service details
  - [✅] Payment status
  - [✅] Timeline
- [ ] Update status order (setelah PAID):
  - [ ] `IN_PROGRESS` - Mulai kerjakan
  - [ ] `COMPLETED` - Selesaikan
  - [ ] `CANCELLED` - Batalkan
- [ ] **TIDAK BISA** konfirmasi pembayaran (hanya SUPER_ADMIN)
- [ ] Badge "Menunggu Konfirmasi Pembayaran" untuk status PENDING_PAYMENT
- [ ] Tambah catatan pada order
- [ ] Lihat history order

**Consultations**

- [✅] Lihat semua konsultasi masuk
- [✅] Chat dengan customer
- [✅] Buat booking dari konsultasi
- [] Mark konsultasi as completed

#### 2.3 Communication

**Live Chat**

- [✅] Lihat semua chat room
- [✅] Reply chat customer real-time
- [✅] Upload gambar/file
- [✅] Search chat

#### 2.4 Profile &amp; Settings

**Technician Profile**

- [✅] Edit bio
- [✅] Set pengalaman (tahun)
- [✅] Set spesialisasi (multiple)
- [✅] Upload foto profil
- [✅] Set availability status
- [✅] Lihat rating dan review
- [✅] Lihat total completed orders
- [✅] Lihat total revenue

**Service Management**

- [✅] Tambah layanan baru
- [✅] Edit layanan existing
- [✅] Set harga per layanan
- [✅] Set kategori (Konsultasi/Cek Bongkar/Servis Lengkap)
- [✅] Set deskripsi layanan
- [✅] Aktifkan/nonaktifkan layanan
- [✅] Delete layanan

#### 2.5 Warranty &amp; Tickets

**Komplain Garansi**

- [ ] Lihat tiket komplain untuk order teknisi
- [ ] Approve/reject komplain
- [ ] Tambah catatan untuk reject
- [ ] Update status tiket
- [ ] Lihat bukti komplain
- [ ] Reply pada tiket

---

### 3. Super Admin

#### 3.1 Dashboard Analytics

**Overview Dashboard**

- [✅] Total revenue (hari ini, minggu ini, bulan ini)
- [✅] Total orders
- [✅] Grafik trend penjualan
- [✅] Top teknisi (by revenue/rating)
- [✅] Top products
- [✅] Top services
- [✅] Total customers
- [✅] Total technicians
- [✅] Total mitra

#### 3.2 User Management

**Admin &amp; Technician Management**

- [✅] Lihat semua users
- [✅] Filter by role (Customer/Admin/Super Admin/Mitra)
- [✅] Search user
- [✅] Buat akun admin baru
- [✅] Buat akun teknisi baru
- [✅] Ubah role user
- [✅] Aktifkan/nonaktifkan akun
- [✅] Reset password user
- [✅] Delete user

#### 3.3 Catalog Management

**Technician Management**

- [✅] Lihat semua teknisi
- [✅] Tambah teknisi baru
- [✅] Edit profil teknisi
- [✅] Set spesialisasi teknisi
- [✅] Lihat rating dan review
- [✅] Aktifkan/nonaktifkan teknisi

**Product Management (Sparepart)**

- [✅] Lihat semua produk
- [✅] Tambah produk baru
- [✅] Edit produk
- [✅] Upload multiple images
- [✅] Set kategori produk
- [✅] Set brand dan model
- [✅] Set harga
- [✅] Manage stok
- [✅] Aktifkan/nonaktifkan produk
- [✅] Delete produk

**Rental Items Management**

- [✅] Lihat semua alat sewa
- [✅] Tambah alat baru
- [✅] Edit alat
- [✅] Set harga per hari
- [✅] Manage stok
- [✅] Upload images
- [✅] Aktifkan/nonaktifkan
- [✅] Delete alat

#### 3.4 Order Management

**All Orders View**

- [✅] Lihat SEMUA order (service + sparepart)
- [✅] Filter by type (Service/Sparepart/Rental/All)
- [✅] Filter by status
- [✅] Search by order number
- [✅] Search by customer name
- [✅] Modern card design
- [✅] Product/service images
- [✅] User information
- [✅] Status badges dengan warna
- [✅] Sort by date, amount, status

**Order Actions (SUPER_ADMIN ONLY)**

- [ ] **Konfirmasi Pembayaran** (PENDING_PAYMENT → PAID)
  - [ ] Hanya SUPER_ADMIN yang bisa
  - [ ] Lihat bukti transfer
  - [ ] Approve/reject payment
- [ ] Update status sparepart orders (full control):
  - [ ] Start processing
  - [ ] Complete order
  - [ ] Cancel order
- [ ] View service orders (status dikontrol teknisi)
- [ ] Assign order ke teknisi
- [ ] Reassign order
- [ ] Add notes to order
- [ ] View order timeline

**Authorization Rules**

- [ ] SUPER_ADMIN: Full control semua order
- [ ] SUPER_ADMIN: Eksklusif konfirmasi pembayaran
- [ ] Regular ADMIN: Tidak bisa konfirmasi pembayaran
- [ ] Teknisi: Hanya assigned orders, tidak bisa konfirmasi payment

#### 3.5 Payment Management

**Payment Verification**

- [ ] Queue pembayaran pending
- [ ] Lihat bukti transfer
- [ ] Zoom/preview image
- [ ] Konfirmasi pembayaran
- [ ] Reject pembayaran dengan catatan
- [ ] Riwayat verifikasi
- [ ] Filter by date
- [ ] Export payment reports

**Bank Account Management**

- [ ] Kelola rekening per kategori:
  - [ ] Rekening JASA
  - [ ] Rekening SEWA
  - [ ] Rekening SPAREPART
- [ ] Tambah rekening baru
- [ ] Edit rekening
- [ ] Set bank name, account number, account name
- [ ] Aktifkan/nonaktifkan rekening
- [ ] Multiple rekening per kategori
- [ ] Set default rekening

#### 3.6 Stock Management

**Inventory Dashboard**

- [✅] Lihat semua stok sparepart
- [✅] Alert stok menipis (&lt; 10)
- [✅] Filter low stock items
- [✅] Search produk
- [✅] Auto-reduce stok saat order
- [✅] Manual update stok

#### 3.7 Mitra Management

**Mitra Approval**

- [✅] Lihat pendaftaran mitra baru
- [✅] Review profil mitra
- [✅] Review dokumen pendukung
- [✅] Approve mitra
- [✅] Reject mitra dengan catatan
- [✅] Bulk approve/reject

**Mitra Directory**

- [✅] Lihat semua mitra
- [✅] Filter by status (Pending/Approved/Rejected)
- [✅] Filter by city
- [✅] Search mitra
- [✅] Edit profil mitra
- [✅] Suspend/unsuspend mitra
- [✅] Lihat statistik mitra:
  - [✅] Total views
  - [✅] Total inquiries
  - [✅] Rating
  - [✅] Total reviews
- [✅] Delete mitra

#### 3.8 Content Management

**Blog/Article CMS**

- [✅] Lihat semua artikel
- [✅] Buat artikel baru
- [✅] Upload cover image
- [✅] Set kategori
- [✅] Set tags (multiple)
- [✅] SEO meta tags
- [✅] Publish/unpublish
- [✅] Edit artikel
- [✅] Delete artikel
- [✅] Preview artikel

#### 3.10 Reports &amp; Analytics

**Sales Reports**

- [✅] Revenue by date range
- [✅] Revenue by category (Jasa/Sewa/Sparepart)
- [✅] Revenue by technician
- [✅] Top selling products
- [✅] Top services
- [✅] Grafik trend penjualan
- [✅] Monthly comparison

**Performance Reports**

- [✅] Technician performance
- [✅] Customer satisfaction (rating)
- [✅] Revenue by technician
- [✅] Conversion rate
- [✅] Customer retention rate

**Export Data**

- [✅] Export orders to CSV/Excel
- [✅] Export products to CSV/Excel
- [✅] Export customers to CSV/Excel
- [✅] Filter by date range
- [✅] Custom column selection

---

### 4. Mitra

#### 4.1 Dashboard

**Mitra Dashboard**

- [ ] Total profile views
- [ ] Total inquiries
- [ ] Average rating
- [ ] Total reviews
- [ ] Recent inquiries
- [ ] Quick stats
- [ ] Shortcuts
- [ ] Monthly trends

#### 4.2 Profile Management

**Business Profile**

- [ ] Edit business name
- [ ] Edit tagline
- [ ] Edit description
- [ ] Upload banner image
- [ ] Upload gallery images (multiple)
- [ ] Set address lengkap
- [ ] Set city &amp; province
- [ ] Set geolocation (latitude/longitude)
- [ ] Set phone number
- [ ] Set WhatsApp number
- [ ] Set email
- [ ] Set website URL
- [ ] Set features/fasilitas (multiple)
- [ ] Preview profile

**Operating Hours**

- [ ] Set jam operasional per hari
- [ ] Set hari libur
- [ ] Set jam khusus
- [ ] Quick templates (Senin-Jumat, Weekend, 24/7)
- [ ] Holiday mode

**Services Offered**

- [ ] Tambah layanan yang ditawarkan
- [ ] Edit layanan
- [ ] Set icon layanan
- [ ] Set harga (opsional)
- [ ] Set deskripsi
- [ ] Hapus layanan
- [ ] Reorder layanan

#### 4.3 Inquiry Management

**Customer Inquiries**

- [ ] Lihat semua inquiry masuk
- [ ] Filter by status (New/Replied/Closed)
- [ ] Reply inquiry
- [ ] Mark as closed
- [ ] Lihat customer info
- [ ] Export inquiries

**Live Chat**

- [ ] Chat dengan customer yang inquiry
- [ ] Real-time messaging
- [ ] Upload images/files
- [ ] Typing indicator
- [ ] Read receipts
- [ ] Chat history

#### 4.4 Reviews &amp; Ratings

**Review Management**

- [ ] Lihat semua review
- [ ] Filter by rating
- [ ] Reply to review (coming soon)
- [ ] Report inappropriate review
- [ ] View review analytics

#### 4.5 Registration

**Mitra Registration Flow**

- [ ] Form pendaftaran lengkap
- [ ] Upload dokumen pendukung
- [ ] Submit untuk approval
- [ ] Track status approval
- [ ] Notifikasi approved/rejected
- [ ] Pending page saat menunggu approval
- [ ] Edit submission sebelum approved

---

### Priority 1: Critical Features (Must Test First)

- [✅] Login/Register
- [✅] Browse products/services
- [✅] Add to cart
- [✅] Checkout
- [✅] Payment confirmation
- [✅] Order tracking

### Priority 2: Important Features

- [✅] User profile management
- [✅] Reviews and ratings
- [✅] Mitra directory
- [✅] Admin dashboard
- [✅] Order management

### Priority 3: Nice to Have

- [✅] Chat system
- [] Notifications
- [] Warranty system
- [✅] Reports and analytics
- [✅] Content management

---

## 📝 Notes

- Gunakan checklist ini untuk tracking progress testing
- Update checklist setelah setiap testing session
- Catat bugs/issues yang ditemukan di file terpisah
- Prioritaskan testing berdasarkan critical path user journey

---

**Last Updated:** 2025-12-29
**Version:** 2.0
