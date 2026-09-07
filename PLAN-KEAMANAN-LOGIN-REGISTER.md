# 🔐 Plan Keamanan: Login & Register — Affiliate Gadget

> Dokumen ini adalah breakdown task-task kecil untuk membangun fondasi keamanan autentikasi (Login & Register) sebelum fitur lain dikembangkan. Disusun berdasarkan tech stack di README (Next.js 15, NextAuth.js, Prisma, PostgreSQL, Redis) dan sistem 4 role (Super Admin, Admin Operasional, Mitra, Customer).

**Prinsip yang dipakai:** Defense in Depth — keamanan tidak boleh hanya di satu lapisan (misal cuma validasi di frontend), tapi berlapis di frontend, backend, database, dan infrastruktur.

---

## 📌 Daftar Isi

1. [Backend — Register](#1-backend--register)
2. [Backend — Login](#2-backend--login)
3. [Backend — Session &amp; Token Management](#3-backend--session--token-management)
4. [Backend — Rate Limiting &amp; Anti-Abuse](#4-backend--rate-limiting--anti-abuse)
5. [Backend — Database &amp; Data Protection](#5-backend--database--data-protection)
6. [Frontend — Form Register](#6-frontend--form-register)
7. [Frontend — Form Login](#7-frontend--form-login)
8. [Frontend — UX Keamanan Umum](#8-frontend--ux-keamanan-umum)
9. [Infrastruktur &amp; HTTP Security Headers](#9-infrastruktur--http-security-headers)
10. [Monitoring, Logging &amp; Audit](#10-monitoring-logging--audit)
11. [Testing &amp; QA Keamanan](#11-testing--qa-keamanan)
12. [Checklist Prioritas (Urutan Pengerjaan)](#12-checklist-prioritas-urutan-pengerjaan)

---

## 1. Backend — Register

- [x] **Validasi input server-side (Zod schema)**
      → Semua field (nama, email, password, no HP, role) divalidasi ulang di server menggunakan Zod, meskipun sudah divalidasi di frontend. Jangan pernah percaya data dari client.
- [x] **Normalisasi & sanitasi email**
      → Email di-lowercase dan di-trim sebelum disimpan/dicek, supaya `User@Mail.com` dan `user@mail.com` dianggap akun yang sama.
- [x] **Cek duplikasi email/nomor HP**
      → Sebelum insert ke database, cek apakah email atau nomor HP sudah terdaftar. Gunakan unique constraint di Prisma schema sebagai lapisan kedua (bukan hanya cek query).
- [x] **Password hashing dengan Argon2id (atau bcrypt sebagai alternatif)**
      → Password tidak pernah disimpan plaintext. Gunakan algoritma hashing yang lambat secara sengaja (bcrypt dengan cost factor 12 aktif).
- [x] **Kebijakan kekuatan password (password policy)**
      → Tentukan aturan: minimal 8 karakter, kombinasi huruf besar/kecil, angka, dan simbol.
- [x] **Verifikasi email wajib sebelum akun aktif**
      → Setelah register, kirim link/token verifikasi via email (Resend). Akun berstatus "unverified/isActive: false" tidak bisa login penuh sampai email diverifikasi.
- [x] **Token verifikasi email yang aman**
      → Token dibuat random (crypto 32-bytes hex), disimpan hash SHA-256 di database (bukan token asli), dan punya masa berlaku (expired) 24 jam.
- [x] **Rate limit endpoint register per IP & per email**
      → Batasi jumlah percobaan register dari satu IP (5x/jam) dan satu email (3x/jam) via Redis/sliding window untuk mencegah spam akun/bot.
- [x] **Assign role default aman**
      → Role saat register publik dibatasi via whitelist server-side hanya `CUSTOMER` dan `MITRA` (Mitra berstatus `PENDING`). Role Admin/Superadmin tidak bisa dipilih.
- [x] **Response API tidak membocorkan detail internal**
      → Pesan error generik tanpa membocorkan stack trace, query SQL, atau struktur database ke client.
- [x] **Honeypot field anti-bot**
      → Tambahkan field tersembunyi di form yang seharusnya kosong; jika terisi (oleh bot), request otomatis digugurkan dengan respons fake 201.

---

## 2. Backend — Login

- [x] **Validasi credential via NextAuth Credentials Provider**
      → Konfigurasi provider Email/Password di NextAuth dengan validasi input yang ketat sebelum proses autentikasi berjalan.
- [x] **Pesan error generik untuk gagal login (anti user enumeration)**
      → Gunakan pesan sama seperti "Email atau password salah" baik saat email tidak terdaftar maupun password salah — jangan bedakan, supaya penyerang tidak bisa menebak email mana yang terdaftar. Ditambah mitigasi timing attack via bcrypt dummy compare.
- [x] **Cek status email verified sebelum izinkan login**
      → Jika akun belum verifikasi email, login ditolak (`EMAIL_NOT_VERIFIED`) dengan instruksi untuk verifikasi ulang, bukan pesan yang membingungkan.
- [x] **Account lockout / cooldown setelah gagal berulang**
      → Setelah 5x percobaan gagal, akun dikunci sementara (15 menit). Counter percobaan gagal disimpan di Redis (dengan in-memory fallback).
- [x] **Rate limit login per IP dan per akun**
      → Cegah brute force dengan membatasi jumlah request login dari IP (10x/15m) maupun ke email yang sama (5x/15m).
- [x] **Delay/backoff progresif pada percobaan gagal**
      → Setiap percobaan gagal berturut-turut menambah progressive delay respons (hingga 5 detik) untuk memperlambat automated attack.
- [ ] **Setup Google OAuth dengan scope minimal**
      → Konfigurasi NextAuth Google Provider hanya meminta scope `email` dan `profile`, tidak lebih dari yang dibutuhkan.
- [ ] **Linking akun OAuth & email/password yang aman**
      → Jika user register manual lalu login pakai Google dengan email sama, pastikan proses linking akun divalidasi (bukan otomatis merge tanpa verifikasi) untuk mencegah account takeover.
- [x] **Cek status akun aktif/nonaktif/banned**
      → Sebelum sesi dibuat, cek flag status akun (`user.isActive`). Akun nonaktif/banned ditolak (`ACCOUNT_DISABLED`).

---

## 3. Backend — Session & Token Management

- [ ] **Gunakan strategi session JWT dengan httpOnly cookie**
      → Konfigurasi NextAuth agar session token disimpan sebagai httpOnly, secure, sameSite cookie — bukan di localStorage/sessionStorage yang rentan XSS.
- [ ] **Set expiry & refresh token yang wajar**
      → Access token berumur pendek (misal 15-60 menit), dengan refresh token terpisah untuk perpanjangan sesi tanpa login ulang terus-menerus.
- [ ] **Auto logout karena idle timeout**
      → Sesuai fitur di README ("otomatis logout jika tidak aktif"), implementasikan idle timeout yang menghapus sesi setelah periode tidak aktif tertentu.
- [ ] **Rotasi session ID setelah login berhasil**
      → Setelah autentikasi sukses, generate session ID baru (session regeneration) untuk mencegah session fixation attack.
- [ ] **Invalidasi semua sesi saat ganti password**
      → Ketika user mengubah password, semua sesi aktif di device lain otomatis di-invalidate, memaksa login ulang.
- [ ] **Simpan metadata sesi (device/IP) untuk deteksi anomali**
      → Simpan info device & IP saat login untuk keperluan audit dan opsional fitur "logout dari perangkat lain".
- [ ] **Middleware proteksi route per role**
      → Middleware Next.js memvalidasi session & role sebelum request sampai ke halaman/dashboard yang di-protect, sesuai 4 role di README.

---

## 4. Backend — Rate Limiting & Anti-Abuse

- [ ] **Setup Redis sebagai rate limiter store**
      → Gunakan Redis (Upstash di development, self-hosted di production) untuk menyimpan counter rate limit secara terpusat dan cepat.
- [ ] **Rate limit granular per endpoint**
      → Tentukan limit berbeda untuk: register, login, forgot-password, resend-verification-email — masing-masing dengan threshold sendiri.
- [ ] **Rate limit berbasis kombinasi IP + fingerprint**
      → Selain IP, pertimbangkan fingerprint browser sederhana agar penyerang yang gonta-ganti IP tetap terdeteksi.
- [ ] **Blok sementara (temporary ban) untuk IP mencurigakan**
      → IP yang melewati threshold pelanggaran berat (misal 50 percobaan gagal dalam 10 menit) diblokir sementara di level middleware/Nginx.
- [ ] **Proteksi endpoint forgot-password dari abuse**
      → Rate limit permintaan reset password per email dan per IP agar tidak dipakai untuk spam email ke korban (email bombing).

---

## 5. Backend — Database & Data Protection

- [ ] **Unique constraint pada kolom email & nomor HP**
      → Definisikan constraint unik di Prisma schema sebagai jaminan integritas data di level database, bukan hanya di level aplikasi.
- [ ] **Enkripsi data sensitif tambahan (jika ada)**
      → Jika menyimpan data sensitif lain (misal nomor identitas mitra), enkripsi at-rest atau minimal masking saat ditampilkan.
- [ ] **Least privilege database user**
      → User database yang dipakai aplikasi hanya punya izin sesuai kebutuhan (tidak superuser), untuk membatasi dampak jika terjadi kebocoran credential.
- [ ] **Gunakan Prisma parameterized query (hindari raw query rawan injection)**
      → Pastikan tidak ada raw SQL query yang menggabungkan input user secara langsung (mencegah SQL Injection).
- [ ] **Backup & recovery plan untuk data akun**
      → Setup backup rutin database (terutama tabel user/auth) dengan rencana recovery jika terjadi insiden.
- [ ] **Audit trail untuk aksi sensitif**
      → Catat log perubahan penting seperti reset password, perubahan role, penonaktifan akun — siapa yang melakukan dan kapan.

---

## 6. Frontend — Form Register

- [ ] **Validasi form dengan React Hook Form + Zod (client-side)**
      → Validasi real-time untuk UX yang baik, tapi tetap dianggap "hint" saja — validasi final tetap di backend.
- [ ] **Indikator kekuatan password (password strength meter)**
      → Tampilkan visual (lemah/sedang/kuat) saat user mengetik password, mendorong password yang lebih aman.
- [ ] **Toggle show/hide password**
      → Tombol mata untuk menampilkan/menyembunyikan password, dengan `autocomplete="new-password"` yang benar.
- [ ] **Konfirmasi password (re-type password)**
      → Field kedua untuk memastikan user tidak salah ketik password saat register.
- [ ] **Integrasi CAPTCHA widget di form**
      → Render widget Cloudflare Turnstile/reCAPTCHA sebelum submit form register.
- [ ] **Debounce & disable submit ganda**
      → Cegah user klik submit berkali-kali (double submit) yang bisa memicu race condition atau spam request.
- [ ] **Checkbox persetujuan Syarat & Ketentuan / Privacy Policy**
      → Wajib dicentang sebelum submit, sebagai bagian dari compliance data pengguna.
- [ ] **Pesan error field-level yang jelas tapi tidak membocorkan info sensitif**
      → Misal error "Email sudah terdaftar" boleh ditampilkan di form register (karena user memang sedang mendaftar), tapi tetap dikombinasikan dengan rate limiting agar tidak disalahgunakan untuk enumerasi masif.

---

## 7. Frontend — Form Login

- [ ] **Validasi format email & password tidak kosong (client-side)**
      → Validasi dasar sebelum request dikirim ke server, mengurangi request yang pasti gagal.
- [ ] **Pesan error generik ditampilkan ke user**
      → Tampilkan pesan sama untuk email tidak ditemukan/password salah, konsisten dengan kebijakan backend anti-enumeration.
- [ ] **Tombol "Lupa Password" dengan flow terpisah**
      → Arahkan ke halaman forgot-password yang punya validasi & rate limit sendiri.
- [ ] **Loading state & disable tombol saat proses login**
      → Cegah multiple submit saat request sedang diproses.
- [ ] **Tampilkan notifikasi jika akun terkunci sementara**
      → Jika backend merespons "akun terkunci karena percobaan gagal berulang", tampilkan pesan dengan estimasi waktu tunggu.
- [ ] **Tombol Login Google terintegrasi NextAuth signIn**
      → Gunakan NextAuth client SDK, hindari implementasi OAuth manual di frontend yang rawan kesalahan.
- [ ] **Remember me (opsional, dengan durasi terbatas)**
      → Jika ada, pastikan hanya memperpanjang masa berlaku token, bukan membuat token tanpa expiry sama sekali.

---

## 8. Frontend — UX Keamanan Umum

- [ ] **Autocomplete atribut yang benar di semua field**
      → `autocomplete="email"`, `autocomplete="current-password"` / `"new-password"` sesuai konteks, membantu password manager bekerja dengan aman.
- [ ] **Jangan simpan token/session di localStorage/sessionStorage**
      → Semua token sensitif ditangani via httpOnly cookie oleh NextAuth, JS di client tidak boleh punya akses langsung ke token.
- [ ] **Sanitasi output untuk mencegah XSS**
      → Semua data yang berasal dari user (nama, dsb) di-escape dengan benar saat ditampilkan ulang di UI (React sudah escape by default, tapi hati-hati dengan `dangerouslySetInnerHTML`).
- [ ] **Proteksi terhadap clickjacking di halaman auth**
      → Pastikan halaman login/register tidak bisa di-embed via iframe dari domain lain (dikonfigurasi lewat header, lihat bagian Infrastruktur).
- [ ] **Validasi redirect URL setelah login (open redirect protection)**
      → Jika ada parameter `callbackUrl`, validasi hanya boleh redirect ke domain sendiri, bukan URL eksternal sembarangan.
- [ ] **Indikator koneksi HTTPS**
      → Pastikan seluruh form auth hanya bisa diakses via HTTPS, redirect otomatis dari HTTP.

---

## 9. Infrastruktur & HTTP Security Headers

- [ ] **Content-Security-Policy (CSP)**
      → Batasi sumber script/style/font yang boleh dimuat, mengurangi risiko XSS.
- [ ] **Strict-Transport-Security (HSTS)**
      → Paksa browser selalu pakai HTTPS untuk domain ini.
- [ ] **X-Frame-Options / frame-ancestors**
      → Cegah halaman auth di-embed di iframe domain lain (anti clickjacking).
- [ ] **X-Content-Type-Options: nosniff**
      → Cegah browser menebak-nebak MIME type yang bisa dieksploitasi.
- [ ] **Referrer-Policy yang ketat**
      → Batasi informasi referrer yang dikirim ke domain lain saat user navigasi keluar.
- [ ] **CSRF protection untuk semua mutasi (Server Actions/API Routes)**
      → Pastikan NextAuth CSRF token aktif, dan setiap Server Action yang mengubah data auth punya proteksi CSRF bawaan Next.js.
- [ ] **CORS policy ketat di API routes**
      → Hanya izinkan origin domain resmi yang boleh memanggil endpoint auth, tolak origin lain.
- [ ] **Environment variables & secrets management**
      → Semua secret (DB URL, NextAuth secret, Google OAuth client secret, Resend API key) disimpan di `.env` yang tidak ter-commit, dan di production pakai secret manager/Vercel env yang terenkripsi.
- [ ] **Firewall & Fail2Ban di VPS (untuk production self-hosted)**
      → Sesuai roadmap Phase 8, setup Fail2Ban untuk auto-block IP yang mencoba brute force di level server.

---

## 10. Monitoring, Logging & Audit

- [ ] **Log semua percobaan login gagal**
      → Simpan log (timestamp, IP, email yang dicoba) tanpa menyimpan password, untuk analisis pola serangan.
- [ ] **Alert otomatis untuk aktivitas mencurigakan**
      → Notifikasi (email/Slack/dsb) ke tim jika terdeteksi lonjakan percobaan login gagal atau register massal.
- [ ] **Dashboard monitoring khusus Super Admin**
      → Halaman untuk melihat statistik login gagal, akun terkunci, dan aktivitas mencurigakan lainnya.
- [ ] **Retention policy untuk log**
      → Tentukan berapa lama log disimpan dan kapan dihapus/diarsipkan, sesuai kebutuhan audit dan privasi.

---

## 11. Testing & QA Keamanan

- [x] **Unit test untuk validasi schema Zod & logic security (register & login)**
      → Pastikan semua edge case validasi (email invalid, password lemah, DoS max(128), lockout, rate-limit, delay, dummy hash, dll) tertangani dengan benar di Vitest.
- [ ] **Integration test untuk flow register → verifikasi email → login**
      → Test end-to-end memastikan seluruh alur berjalan sesuai desain keamanan.
- [ ] **Test manual: brute force simulation**
      → Coba login gagal berulang untuk memastikan rate limit dan account lockout benar-benar aktif.
- [ ] **Test manual: SQL Injection & XSS payload di setiap field**
      → Masukkan payload umum (`' OR '1'='1`, `<script>alert(1)</script>`) di semua field form untuk memastikan tersanitasi.
- [ ] **Test session expiry & idle timeout**
      → Pastikan sesi benar-benar invalid setelah waktu yang ditentukan, baik dari sisi cookie maupun validasi server.
- [ ] **Dependency vulnerability scan**
      → Jalankan `npm audit` / Snyk secara berkala untuk mendeteksi package dengan celah keamanan diketahui.
- [ ] **Review checklist OWASP ASVS / OWASP Top 10 untuk Authentication**
      → Gunakan sebagai referensi final checklist sebelum fitur auth dianggap production-ready.

---

## 12. Checklist Prioritas (Urutan Pengerjaan)

Urutan disarankan agar development tidak bolak-balik:

1. **Database & schema** → constraint unique, hashing plan
2. **Backend Register** → validasi, hashing password, verifikasi email
3. **Backend Login** → autentikasi, error generik, lockout
4. **Session & Token (NextAuth config)** → httpOnly cookie, expiry, middleware
5. **Rate limiting (Redis)** → login, register, forgot-password
6. **Frontend Register & Login form** → validasi, UX, CAPTCHA
7. **Security headers & CORS/CSRF**
8. **Google OAuth integration**
9. **Logging & monitoring dasar**
10. **Testing menyeluruh (unit, integration, manual security test)**

---

> 💡 **Catatan:** Dokumen ini fokus pada fondasi Login & Register. Fitur lanjutan seperti 2FA penuh, device management, dan advanced fraud detection bisa ditambahkan di iterasi berikutnya setelah fondasi ini solid dan stabil.
