const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

async function generatePDFs() {
  console.log('🚀 Starting PDF generation...');
  const browser = await chromium.launch({ channel: 'chrome' });

  // 1. GENERATE DOKUMEN RANCANGAN PENGEMBANGAN WEBSITE AFFILIATE GADGET.pdf
  console.log('📄 Generating: DOKUMEN RANCANGAN PENGEMBANGAN WEBSITE AFFILIATE GADGET.pdf');
  const page1 = await browser.newPage();

  const docHtml = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>DOKUMEN RANCANGAN PENGEMBANGAN WEBSITE AFFILIATE GADGET</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 11px;
      line-height: 1.6;
      color: #1e293b;
      background-color: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      padding: 38px 45px;
      page-break-after: always;
      position: relative;
      min-height: 100vh;
    }
    .page:last-child {
      page-break-after: avoid;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 10px;
      margin-bottom: 22px;
    }
    .header-logo {
      font-size: 13px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #0f172a;
    }
    .header-logo span {
      color: #ea580c;
    }
    .header-meta {
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
    }
    .footer-bar {
      position: absolute;
      bottom: 25px;
      left: 45px;
      right: 45px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      font-size: 9px;
      color: #94a3b8;
      font-weight: 500;
    }
    h1.doc-title {
      font-size: 24px;
      font-weight: 900;
      letter-spacing: -0.8px;
      line-height: 1.2;
      color: #0f172a;
      margin-bottom: 12px;
    }
    .doc-subtitle {
      font-size: 12px;
      font-weight: 500;
      color: #475569;
      line-height: 1.5;
      margin-bottom: 22px;
    }
    .meta-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 16px 20px;
      margin-bottom: 24px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .meta-item {
      font-size: 10px;
    }
    .meta-item strong {
      display: block;
      color: #64748b;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .meta-item span {
      color: #0f172a;
      font-weight: 700;
    }
    h2.section-title {
      font-size: 14px;
      font-weight: 800;
      letter-spacing: -0.4px;
      color: #0f172a;
      margin-top: 18px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    h3.subsection-title {
      font-size: 11.5px;
      font-weight: 700;
      color: #1e293b;
      margin-top: 14px;
      margin-bottom: 6px;
    }
    p {
      margin-bottom: 10px;
      color: #334155;
      text-align: justify;
    }
    ul, ol {
      margin-left: 18px;
      margin-bottom: 12px;
    }
    li {
      margin-bottom: 5px;
      color: #334155;
    }
    li strong {
      color: #0f172a;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .badge-purple { background: #f3e8ff; color: #7e22ce; }
    .badge-blue { background: #dbeafe; color: #1d4ed8; }
    .badge-indigo { background: #e0e7ff; color: #4338ca; }
    .badge-emerald { background: #d1fae5; color: #047857; }
    .badge-orange { background: #ffedd5; color: #c2410c; }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 16px 0;
      font-size: 9.5px;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 7px 10px;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    th:first-child { border-top-left-radius: 8px; }
    th:last-child { border-top-right-radius: 8px; }
    td {
      padding: 7px 10px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    .role-box {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 14px;
      margin-bottom: 10px;
      background: #ffffff;
    }
    .role-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .role-name {
      font-size: 11px;
      font-weight: 800;
      color: #0f172a;
    }
    .role-desc {
      font-size: 10px;
      color: #475569;
      line-height: 1.45;
    }
    .highlight-box {
      background: #eff6ff;
      border-left: 3.5px solid #2563eb;
      border-radius: 0 10px 10px 0;
      padding: 10px 14px;
      margin: 12px 0;
      font-size: 10px;
      color: #1e3a8a;
    }
    .warning-box {
      background: #fff7ed;
      border-left: 3.5px solid #ea580c;
      border-radius: 0 10px 10px 0;
      padding: 10px 14px;
      margin: 12px 0;
      font-size: 10px;
      color: #9a3412;
    }
    .code-font {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      background: #f1f5f9;
      padding: 1px 4px;
      border-radius: 4px;
      color: #0f172a;
    }
  </style>
</head>
<body>

  <!-- PAGE 1: COVER & PENDAHULUAN -->
  <div class="page">
    <div class="header-bar">
      <div class="header-logo">AFFILIATE<span>GADGET</span></div>
      <div class="header-meta">Software Design & Architecture Blueprint • Versi 2.0 (2026)</div>
    </div>

    <h1 class="doc-title">DOKUMEN RANCANGAN PENGEMBANGAN WEBSITE AFFILIATE GADGET</h1>
    <div class="doc-subtitle">
      Dokumen Spesifikasi Teknis, Desain UI/UX Modern Bento, Kebutuhan Fitur Inti, Arsitektur Afiliasi Multi-PT, Desentralisasi Operasional Akun Toko, dan Hak Akses 4 Role Utama.
    </div>

    <div class="meta-card">
      <div class="meta-item">
        <strong>Status Dokumen</strong>
        <span>Versi 2.0 (Spesifikasi Resmi & Penyelarasan 4 Role)</span>
      </div>
      <div class="meta-item">
        <strong>Pemilik Proyek (Owner)</strong>
        <span>Mubdi Pandaki</span>
      </div>
      <div class="meta-item">
        <strong>Arsitek / Lead Developer</strong>
        <span>Andricha Dea Mitra</span>
      </div>
      <div class="meta-item">
        <strong>Framework & Tech Stack</strong>
        <span>Next.js 15 (App Router, React 19), Tailwind CSS, Prisma v6 (PostgreSQL), NextAuth v5</span>
      </div>
      <div class="meta-item" style="grid-column: span 2;">
        <strong>Fokus Utama Arsitektur</strong>
        <span>Multi-PT Multi-Store Desentralisasi, Garansi 30 Hari Ganti Baru, Asuransi Wajib Kurir JNE & Gojek, Live Streaming Hub, Servis LCD Kilat 2 Jam, dan Akun Toko Mandiri.</span>
      </div>
    </div>

    <h2 class="section-title">Pendahuluan & Latar Belakang</h2>
    <p>
      Dokumen ini disusun sebagai panduan komprehensif implementasi platform web <strong>Affiliate Gadget</strong> di Indonesia. Platform ini dirancang untuk mendesentralisasikan omzet penjualan gadget per badan hukum PT guna mengoptimalkan kepatuhan administrasi perpajakan, memberikan kepastian garansi 30 hari bagi pembeli, mengintegrasikan pengiriman kurir berasuransi 100%, serta memfasilitasi siaran penjualan langsung (Live Streaming) dan kalkulator servis LCD kilat.
    </p>
    <p>
      Pembaruan versi 2.0 berfokus pada <strong>penyederhanaan arsitektur peran pengguna menjadi 4 Role Utama</strong>: Superadmin, Admin Platform, Admin Toko (Akun Toko Mandiri), dan Customer Pembeli, dengan aturan pengalihan rute otomatis non-customer langsung ke panel CMS manajemen.
    </p>

    <div class="highlight-box">
      <strong>🎯 Prinsip Arsitektur Akun Toko:</strong> Setiap cabang toko fisik resmi (PT cabang) beroperasi menggunakan 1 Akun Toko tunggal (<span class="code-font">STORE_ADMIN</span>). Seluruh manajemen inventori unit ready stock, pemrosesan pesanan kurir, klaim garansi cabang, live streaming, dan profil toko dikelola langsung secara mandiri oleh akun toko tersebut.
    </div>

    <div class="footer-bar">
      <span>Affiliate Gadget • Blueprint Rancangan Sistem</span>
      <span>Halaman 1</span>
    </div>
  </div>

  <!-- PAGE 2: ARSITEKTUR INFORMASI & SPESIFIKASI UI/UX -->
  <div class="page">
    <div class="header-bar">
      <div class="header-logo">AFFILIATE<span>GADGET</span></div>
      <div class="header-meta">Arsitektur & Spesifikasi Desain UI/UX</div>
    </div>

    <h2 class="section-title">1. Arsitektur Informasi & Sitemap</h2>
    <p>
      Hierarki navigasi Affiliate Gadget dirancang untuk memberikan kenyamanan belanja instan bagi konsumen, transparansi badan hukum toko offline, serta alur kerja yang efisien bagi pengelola toko:
    </p>
    <ul>
      <li><strong>Sistem Afiliasi Multi-Toko:</strong> Mengakomodasi banyak cabang toko fisik dengan nama ruko dan badan hukum PT terpisah di berbagai kota besar di Indonesia.</li>
      <li><strong>Katalog Gadget Ready Stock:</strong> Showcase produk dengan filter merek, asal cabang toko pengirim, varian kapasitas/warna, dan paket bonus 3-in-1.</li>
      <li><strong>Modul Servis LCD Kilat:</strong> Kalkulator estimasi biaya penggantian layar LCD per merek/model dengan opsi antar langsung ke ruko atau kirim Gojek instant.</li>
      <li><strong>Payment Gateway & Asuransi Kurir:</strong> Pembayaran otomatis dengan proteksi asuransi pengiriman wajib JNE & Gojek 100%.</li>
      <li><strong>Skema Garansi 30 Hari:</strong> Insentif ganti unit baru bagi pembeli langsung di website yang jauh melampaui standar e-commerce umum (7 hari).</li>
      <li><strong>Live Streaming Hub:</strong> Siaran langsung interaktif penjualan gadget oleh toko cabang dengan pinned product dan checkout seketika.</li>
      <li><strong>Profil Khusus Toko:</strong> Halaman mandiri cabang toko menampilkan NPWP PT, Google Maps ruko, kontak WhatsApp sales, dan stok unit cabang.</li>
    </ul>

    <h2 class="section-title">2. Spesifikasi UI/UX (Modern Bento & Mobile-First)</h2>
    <p>
      Antarmuka pengguna mengadopsi standar <em>Senior UI/UX Design System</em> dengan prinsip Luxury, Clean, dan Conversion-Focused:
    </p>
    <ul>
      <li><strong>Palet Warna Triple E-Commerce:</strong>
        <ul>
          <li><em>Trust Blue (#1E3A8A / #2563EB):</em> Mewakili keamanan transaksi, legalitas PT, dan keandalan garansi.</li>
          <li><em>Action Orange (#F97316 / #EA580C):</em> Warna aksen pemicu tindakan (CTA 'Beli Sekarang', badge diskon, Live Stream).</li>
          <li><em>Slate-50 Clean Canvas (#F8FAFC):</em> Latar belakang tenang yang menonjolkan visual kartu produk dan kartu toko.</li>
        </ul>
      </li>
      <li><strong>Tipografi:</strong> Google Fonts <em>Poppins</em> untuk heading tegas dan modern, dipadukan dengan <em>Inter</em> untuk keterbacaan deskripsi spesifikasi unit di layar mobile.</li>
      <li><strong>Tata Letak Bento Grid:</strong> Pengelompokan informasi ke dalam kontainer squircle (<span class="code-font">rounded-3xl border border-slate-200/80 bg-white shadow-xs</span>) dengan efek hover mikro-interaksi yang halus.</li>
      <li><strong>Unified Control Panel:</strong> Penyatuan filter segmen, pencarian instan, dan dropdown sortir ke dalam satu kartu kendali terpadu tanpa elemen bertumpuk.</li>
    </ul>

    <div class="footer-bar">
      <span>Affiliate Gadget • Blueprint Rancangan Sistem</span>
      <span>Halaman 2</span>
    </div>
  </div>

  <!-- PAGE 3: KEBUTUHAN FUNGSIONAL INTI -->
  <div class="page">
    <div class="header-bar">
      <div class="header-logo">AFFILIATE<span>GADGET</span></div>
      <div class="header-meta">Kebutuhan Fungsional & Model Bisnis Multi-PT</div>
    </div>

    <h2 class="section-title">3. Kebutuhan Fungsional (Fitur Inti)</h2>

    <h3 class="subsection-title">3.1 Arsitektur Afiliasi Multi-Toko (Multi-PT)</h3>
    <p>
      Sistem mendesentralisasikan penerimaan transaksi ke masing-masing rekening badan usaha PT per cabang toko fisik. Setiap toko beroperasi secara independen dalam hal penerbitan faktur dan laporan omzet, mencegah pemusatan omzet pada satu badan hukum yang dapat memicu tarif pajak progresif berlebih.
    </p>

    <h3 class="subsection-title">3.2 Skema Bagi Hasil & Komisi Platform (1% – 3%)</h3>
    <p>
      Transaksi penjualan gadget di platform dikenakan potongan komisi platform otomatis sebesar 1% hingga 3% (maksimal 3%). Komisi ini dialokasikan untuk biaya operasional server, pemeliharaan sistem, dan perlindungan keamanan jaringan Cloudflare WAF Shield.
    </p>

    <h3 class="subsection-title">3.3 Insentif Garansi 30 Hari & Paket Bonus 3-in-1</h3>
    <p>
      Untuk menarik pembeli bertransaksi langsung di website resmi (menghindari potongan marketplace 10% + PPN 11%):
    </p>
    <ul>
      <li><strong>Garansi 30 Hari Ganti Baru:</strong> Jaminan unit pengganti jika terjadi kerusakan pabrik dalam 30 hari kalender.</li>
      <li><strong>Auto-Bundling Bonus 3-in-1:</strong> Setiap pembelian gadget otomatis menyertakan Adaptor Charger Cepat, Tempered Glass Antigores, dan Pelindung Case senilai Rp 0 di keranjang.</li>
    </ul>

    <h3 class="subsection-title">3.4 Logistik Terproteksi (Asuransi Wajib Kurir 100%)</h3>
    <p>
      Pengiriman terintegrasi dengan JNE (Reguler/YES) dan Gojek Instant. Seluruh pesanan diwajibkan menyertakan premi asuransi pengiriman (0.25% nilai barang) untuk mencegah kerugian akibat paket hilang atau rusak dalam perjalanan.
    </p>

    <h3 class="subsection-title">3.5 Live Streaming Hub & Iklan Internal (Internal Ads)</h3>
    <p>
      Modul siaran langsung penjualan terintegrasi dengan chat interaktif, etalase pinned product diskon flash sale, serta slot iklan internal (Hero Slider Promoted & Top Search Ads).
    </p>

    <h3 class="subsection-title">3.6 Modul Servis LCD Kilat 2 Jam</h3>
    <p>
      Kalkulator instan biaya perbaikan layar LCD berdasarkan grade komponen (Original OLED vs OEM), pemilihan cabang ruko teknisi, dan opsi antar langsung atau pengiriman via kurir ojek online.
    </p>

    <div class="footer-bar">
      <span>Affiliate Gadget • Blueprint Rancangan Sistem</span>
      <span>Halaman 3</span>
    </div>
  </div>

  <!-- PAGE 4: HIERARKI 4 ROLE UTAMA SISTEM -->
  <div class="page">
    <div class="header-bar">
      <div class="header-logo">AFFILIATE<span>GADGET</span></div>
      <div class="header-meta">Struktur Hak Akses & Pembagian 4 Role Utama</div>
    </div>

    <h2 class="section-title">4. Struktur Hak Akses & 4 Role Utama Sistem</h2>
    <p>
      Sistem difokuskan pada <strong>4 Role Utama</strong> dengan pemisahan hak akses (RBAC) dan batasan data yang sangat tegas:
    </p>

    <!-- ROLE 1 -->
    <div class="role-box">
      <div class="role-header">
        <span class="role-name">1. SUPER_ADMIN (Superadmin Platform)</span>
        <span class="badge badge-purple">Akses Penuh Seluruh Sistem</span>
      </div>
      <div class="role-desc">
        <strong>Tanggung Jawab:</strong> Pemegang otoritas tertinggi sistem.<br>
        <strong>Hak Akses:</strong> Melihat dan mengawasi seluruh aktivitas platform, konsolidasi total omzet Multi-PT seluruh cabang, komisi platform, distribusi performa per toko, audit log keamanan, kelola pengguna & admin, verifikasi toko, dan pengaturan platform global.
      </div>
    </div>

    <!-- ROLE 2 -->
    <div class="role-box">
      <div class="role-header">
        <span class="role-name">2. ADMIN (Admin Platform)</span>
        <span class="badge badge-blue">Pengelola Operasional Platform</span>
      </div>
      <div class="role-desc">
        <strong>Tanggung Jawab:</strong> Mengelola kelancaran operasional platform umum.<br>
        <strong>Hak Akses:</strong> Mengelola master katalog gadget (spesifikasi model & brand), verifikasi toko/mitra baru, pusat resolusi garansi/komplain pembeli, dan banner promosi.<br>
        <span style="color: #c2410c; font-weight: 700;">⚠️ Batasan Otoritas:</span> <em>Tidak memiliki akses untuk melihat aktivitas transaksi privat, detail omzet internal, laporan penjualan, maupun arus kas rekening bank masing-masing cabang toko.</em>
      </div>
    </div>

    <!-- ROLE 3 -->
    <div class="role-box">
      <div class="role-header">
        <span class="role-name">3. STORE_ADMIN (Admin Toko / Akun Toko Mandiri)</span>
        <span class="badge badge-indigo">Pengelola Cabang Toko PT</span>
      </div>
      <div class="role-desc">
        <strong>Tanggung Jawab:</strong> Akun resmi milik cabang toko fisik / PT.<br>
        <strong>Hak Akses:</strong> Mengelola inventori ready stock unit fisik tokonya sendiri, memproses pesanan kurir JNE/Gojek cabang, melayani klaim garansi toko, memulai siaran Live Streaming penjualan toko, serta mengatur profil ruko, NPWP, jam operasional, dan nomor rekening bank PT tokonya.
      </div>
    </div>

    <!-- ROLE 4 -->
    <div class="role-box">
      <div class="role-header">
        <span class="role-name">4. CUSTOMER (Customer / Pembeli)</span>
        <span class="badge badge-emerald">Antarmuka Pembeli Publik</span>
      </div>
      <div class="role-desc">
        <strong>Tanggung Jawab:</strong> Pembeli di platform publik.<br>
        <strong>Hak Akses:</strong> Menjelajahi katalog gadget, melakukan checkout berproteksi asuransi, melacak status pesanan resi JNE/Gojek, mengajukan klaim garansi 30 hari, dan menghitung estimasi servis LCD.
      </div>
    </div>

    <div class="warning-box">
      <strong>🔒 Aturan Pengalihan Rute Otomatis (Middleware):</strong> Akun dengan role non-customer (<span class="code-font">SUPER_ADMIN</span>, <span class="code-font">ADMIN</span>, <span class="code-font">STORE_ADMIN</span>) yang berhasil login otomatis dialihkan langsung ke panel CMS (<span class="code-font">/dashboard/admin</span>) sesuai peran masing-masing, dan tidak berada di antarmuka publik.
    </div>

    <div class="footer-bar">
      <span>Affiliate Gadget • Blueprint Rancangan Sistem</span>
      <span>Halaman 4</span>
    </div>
  </div>

  <!-- PAGE 5: STRUKTUR HALAMAN WEB & CMS PANEL -->
  <div class="page">
    <div class="header-bar">
      <div class="header-logo">AFFILIATE<span>GADGET</span></div>
      <div class="header-meta">Peta Komponen Halaman Publik & Panel CMS</div>
    </div>

    <h2 class="section-title">5. Struktur Halaman Web (Publik & CMS Panel)</h2>

    <h3 class="subsection-title">5.1 Antarmuka Publik</h3>
    <ul>
      <li><span class="code-font">/</span> — <strong>Homepage Multi-PT:</strong> 9 Section Lengkap (Hero Slider, 4 Shortcut, Statistik Dinamis, Edukasi Garansi 30 Hari, Live Streaming Hub, Etalase Gadget, Iklan Internal, Widget Servis LCD, CTA Mitra Toko).</li>
      <li><span class="code-font">/gadget</span> — <strong>Katalog Gadget:</strong> Filter merek, toko cabang asal pengirim, pencarian instan, dan urutan harga.</li>
      <li><span class="code-font">/gadget/[id]</span> — <strong>Detail Gadget:</strong> Varian memori/warna, rincian bonus 3-in-1 Rp 0, konsultasi WhatsApp sales toko, dan beli langsung.</li>
      <li><span class="code-font">/toko</span> — <strong>Direktori Toko:</strong> Daftar cabang ruko fisik se-Indonesia, filter kota, peta ruko, dan jam operasional.</li>
      <li><span class="code-font">/toko/[slug]</span> — <strong>Profil Toko Cabang:</strong> Badan hukum PT, NPWP, jam operasional, Google Maps presisi, dan stok unit cabang.</li>
      <li><span class="code-font">/servis-lcd</span> — <strong>Modul Servis LCD:</strong> Kalkulator estimasi harga OLED vs OEM, pilihan ruko teknisi terdekat, dan pemesanan servis.</li>
      <li><span class="code-font">/live</span> — <strong>Live Streaming Hub:</strong> Siaran langsung toko, chat interaktif real-time, dan checkout produk diskon live.</li>
      <li><span class="code-font">/garansi</span> — <strong>Klaim Garansi 30 Hari:</strong> Pengecekan nomor pesanan, syarat klaim ganti unit baru, dan trigger WhatsApp cepat.</li>
      <li><span class="code-font">/cart & /checkout</span> — <strong>Checkout Terproteksi:</strong> Pilihan kurir JNE/Gojek, premi asuransi wajib 0.25%, dan rincian bonus 3-in-1.</li>
    </ul>

    <h3 class="subsection-title">5.2 Panel CMS Manajemen (/dashboard/admin)</h3>
    <ul>
      <li><strong>Dashboard Ringkasan:</strong>
        <ul>
          <li><em>Superadmin View:</em> Total omzet Multi-PT, komisi platform 2.5%, distribusi omzet 5 cabang ruko, dan stream transaksi real-time.</li>
          <li><em>Admin Platform View:</em> Master katalog produk, daftar toko terverifikasi, total customer aktif, dan ringkasan tiket komplain.</li>
          <li><em>Store Admin View:</em> Stok unit ready stock cabang, pesanan masuk cabang, dan status operasional toko.</li>
        </ul>
      </li>
      <li><strong>Katalog & Inventori Gadget (<span class="code-font">/products</span>):</strong> Pengelolaan model gadget, spesifikasi RAM/Storage, dan stok unit per cabang ruko.</li>
      <li><strong>Pesanan & Logistik (<span class="code-font">/orders</span>):</strong> Pemrosesan nomor resi kurir JNE/Gojek dan validasi asuransi pengiriman.</li>
      <li><strong>Direktori Toko & PT (<span class="code-font">/mitras</span>):</strong> Manajemen legalitas PT cabang, NPWP, alamat ruko, dan koordinat Google Maps.</li>
      <li><strong>Laporan Finansial Multi-PT (<span class="code-font">/reports</span>):</strong> Rekonsiliasi omzet per badan hukum PT dan penarikan saldo komisi platform (Khusus Superadmin).</li>
      <li><strong>Kelola Pengguna (<span class="code-font">/users</span>):</strong> Manajemen akun sistem (Superadmin, Admin Platform, Admin Toko, dan Customer).</li>
      <li><strong>Pengaturan Platform & Toko (<span class="code-font">/settings</span>):</strong> Konfigurasi profil toko, rekening bank mandiri PT, dan jam buka.</li>
    </ul>

    <div class="footer-bar">
      <span>Affiliate Gadget • Blueprint Rancangan Sistem</span>
      <span>Halaman 5</span>
    </div>
  </div>

  <!-- PAGE 6: LAMPIRAN KREDENSIAL TESTING & TOKO RESMI -->
  <div class="page">
    <div class="header-bar">
      <div class="header-logo">AFFILIATE<span>GADGET</span></div>
      <div class="header-meta">Lampiran Data Master & Kredensial Pengujian</div>
    </div>

    <h2 class="section-title">6. Lampiran Kredensial Akun Pengujian Sistem</h2>
    <p>
      Seluruh akun pengujian telah terdaftar aktif di database lokal PostgreSQL dan dapat langsung digunakan untuk proses simulasi alur kerja sistem:
    </p>

    <table>
      <thead>
        <tr>
          <th>Kategori Role</th>
          <th>Role Code</th>
          <th>Email Login</th>
          <th>Password</th>
          <th>Cakupan Akses & Operasional</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Superadmin</strong></td>
          <td><span class="badge badge-purple">SUPER_ADMIN</span></td>
          <td><span class="code-font">superadmin@affiliategadget.com</span></td>
          <td><span class="code-font">admin123</span></td>
          <td>Akses Penuh: Omzet seluruh toko, komisi, pesanan, dan laporan Multi-PT</td>
        </tr>
        <tr>
          <td><strong>Admin (Platform)</strong></td>
          <td><span class="badge badge-blue">ADMIN</span></td>
          <td><span class="code-font">admin@affiliategadget.com</span></td>
          <td><span class="code-font">admin123</span></td>
          <td>Pengelola Platform: Master katalog, verifikasi toko, tanpa omzet toko</td>
        </tr>
        <tr>
          <td><strong>Admin Toko (Jakarta)</strong></td>
          <td><span class="badge badge-indigo">STORE_ADMIN</span></td>
          <td><span class="code-font">admin.roxy@affiliategadget.com</span></td>
          <td><span class="code-font">admin123</span></td>
          <td>Akun Toko: PT Gadget Jaya Sentosa (ITC Roxy Mas Pusat)</td>
        </tr>
        <tr>
          <td><strong>Admin Toko (Surabaya)</strong></td>
          <td><span class="badge badge-indigo">STORE_ADMIN</span></td>
          <td><span class="code-font">admin.surabaya@affiliategadget.com</span></td>
          <td><span class="code-font">admin123</span></td>
          <td>Akun Toko: PT Sinar Gadget Nusantara (WTC Surabaya)</td>
        </tr>
        <tr>
          <td><strong>Admin Toko (Bandung)</strong></td>
          <td><span class="badge badge-indigo">STORE_ADMIN</span></td>
          <td><span class="code-font">admin.bandung@affiliategadget.com</span></td>
          <td><span class="code-font">admin123</span></td>
          <td>Akun Toko: PT Digital Niaga Prima (BEC Bandung)</td>
        </tr>
        <tr>
          <td><strong>Admin Toko (Medan)</strong></td>
          <td><span class="badge badge-indigo">STORE_ADMIN</span></td>
          <td><span class="code-font">admin.medan@affiliategadget.com</span></td>
          <td><span class="code-font">admin123</span></td>
          <td>Akun Toko: PT Surya Makmur Gadget (Plaza Medan Fair)</td>
        </tr>
        <tr>
          <td><strong>Admin Toko (Jogja)</strong></td>
          <td><span class="badge badge-indigo">STORE_ADMIN</span></td>
          <td><span class="code-font">admin.jogja@affiliategadget.com</span></td>
          <td><span class="code-font">admin123</span></td>
          <td>Akun Toko: PT Mega Ponsel Nusantara (Jogjatronik Mall)</td>
        </tr>
        <tr>
          <td><strong>Customer (Pembeli)</strong></td>
          <td><span class="badge badge-emerald">CUSTOMER</span></td>
          <td><span class="code-font">customer@test.com</span></td>
          <td><span class="code-font">customer123</span></td>
          <td>Pembeli Publik: Rian Pratama (Jakarta Selatan)</td>
        </tr>
      </tbody>
    </table>

    <h2 class="section-title">7. Jaringan 5 Cabang Ruko Fisik & Badan Hukum PT</h2>
    <table>
      <thead>
        <tr>
          <th>Cabang Ruko</th>
          <th>Badan Hukum PT & NPWP</th>
          <th>Alamat Lengkap Ruko</th>
          <th>Rekening Bank Mandiri PT</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Roxy Mas Pusat</strong><br>Jakarta Pusat</td>
          <td>PT Gadget Jaya Sentosa<br><span class="code-font">01.428.910.4-015.000</span></td>
          <td>ITC Roxy Mas Lt. 2 No. 45-47, Jl. KH. Hasyim Ashari No. 125</td>
          <td>Mandiri: 1180019283741<br>BCA: 5270918234</td>
        </tr>
        <tr>
          <td><strong>WTC Surabaya</strong><br>Surabaya</td>
          <td>PT Sinar Gadget Nusantara<br><span class="code-font">02.582.119.8-609.000</span></td>
          <td>WTC Surabaya Galeria Lt. 3 No. 312-315, Jl. Pemuda No. 27-31</td>
          <td>BCA: 0882319485</td>
        </tr>
        <tr>
          <td><strong>BEC Bandung</strong><br>Bandung</td>
          <td>PT Digital Niaga Prima<br><span class="code-font">03.194.882.1-428.000</span></td>
          <td>Bandung Electronic Center (BEC) Lt. 1 Blok B-08, Jl. Purnawarman</td>
          <td>Mandiri: 1310088271629</td>
        </tr>
        <tr>
          <td><strong>Plaza Medan Fair</strong><br>Medan</td>
          <td>PT Surya Makmur Gadget<br><span class="code-font">04.812.339.7-112.000</span></td>
          <td>Plaza Medan Fair Lt. 4 No. 42-44, Jl. Gatot Subroto No. 30</td>
          <td>BRI: 005301002938301</td>
        </tr>
        <tr>
          <td><strong>Jogjatronik Mall</strong><br>Yogyakarta</td>
          <td>PT Mega Ponsel Nusantara<br><span class="code-font">05.671.229.4-541.000</span></td>
          <td>Jogjatronik Mall Lt. UG No. 18-20, Jl. Brigjen Katamso No. 75-77</td>
          <td>BCA: 1690882711</td>
        </tr>
      </tbody>
    </table>

    <div class="footer-bar">
      <span>Affiliate Gadget • Blueprint Rancangan Sistem</span>
      <span>Halaman 6</span>
    </div>
  </div>

</body>
</html>
`;

  await page1.setContent(docHtml, { waitUntil: 'networkidle' });
  await page1.pdf({
    path: path.join(__dirname, '../DOKUMEN RANCANGAN PENGEMBANGAN WEBSITE AFFILIATE GADGET.pdf'),
    format: 'A4',
    printBackground: true,
    margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' },
  });
  console.log('✅ DOKUMEN RANCANGAN PENGEMBANGAN WEBSITE AFFILIATE GADGET.pdf generated successfully!');

  // 2. GENERATE Daftar_Akun_Dummy_Affiliate_Gadget.pdf
  console.log('📄 Generating: Daftar_Akun_Dummy_Affiliate_Gadget.pdf');
  const page2 = await browser.newPage();

  const dummyHtml = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Daftar Akun Dummy & Kredensial Testing Affiliate Gadget</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 10px;
      line-height: 1.5;
      color: #1e293b;
      background-color: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      padding: 30px 38px;
      page-break-after: always;
      position: relative;
      min-height: 100vh;
    }
    .page:last-child {
      page-break-after: avoid;
    }
    .header-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
      color: #ffffff;
      border-radius: 14px;
      padding: 16px 20px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .banner-title {
      font-size: 16px;
      font-weight: 900;
      letter-spacing: -0.5px;
    }
    .banner-title span {
      color: #fb923c;
    }
    .banner-subtitle {
      font-size: 9px;
      color: #cbd5e1;
      margin-top: 2px;
    }
    .banner-badge {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      padding: 6px 12px;
      text-align: right;
      font-size: 8.5px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .sys-info-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 16px;
    }
    .sys-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 8px 12px;
    }
    .sys-box strong {
      display: block;
      font-size: 8px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 2px;
    }
    .sys-box span {
      font-size: 10px;
      font-weight: 700;
      color: #0f172a;
    }
    h2.table-title {
      font-size: 11.5px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 14px;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 9px;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 6px 9px;
      font-size: 8.5px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    th:first-child { border-top-left-radius: 6px; }
    th:last-child { border-top-right-radius: 6px; }
    td {
      padding: 6px 9px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 9999px;
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-purple { background: #f3e8ff; color: #7e22ce; }
    .badge-blue { background: #dbeafe; color: #1d4ed8; }
    .badge-indigo { background: #e0e7ff; color: #4338ca; }
    .badge-emerald { background: #d1fae5; color: #047857; }
    .code-font {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8.5px;
      background: #f1f5f9;
      padding: 1px 3px;
      border-radius: 3px;
      color: #0f172a;
    }
    .note-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 8px 12px;
      margin-top: 10px;
      font-size: 8.5px;
      color: #166534;
      line-height: 1.4;
    }
    .footer-bar {
      position: absolute;
      bottom: 18px;
      left: 38px;
      right: 38px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      font-size: 8px;
      color: #94a3b8;
    }
  </style>
</head>
<body>

  <!-- PAGE 1: KREDENSIAL 4 ROLE UTAMA & AKUN TESTING -->
  <div class="page">
    <div class="header-banner">
      <div>
        <div class="banner-title">AFFILIATE<span>GADGET</span></div>
        <div class="banner-subtitle">Platform Marketplace Gadget Afiliasi Multi-PT Indonesia</div>
      </div>
      <div class="banner-badge">
        DOKUMEN KREDENSIAL TESTING<br>
        VERSI 2.0 • 2026
      </div>
    </div>

    <div class="sys-info-grid">
      <div class="sys-box">
        <strong>URL Server Lokal</strong>
        <span>http://localhost:3002</span>
      </div>
      <div class="sys-box">
        <strong>Autentikasi</strong>
        <span>NextAuth.js v5 (RBAC)</span>
      </div>
      <div class="sys-box">
        <strong>Database Backend</strong>
        <span>PostgreSQL (Prisma v6)</span>
      </div>
      <div class="sys-box">
        <strong>Enkripsi Sandi</strong>
        <span>Bcrypt (Salt Rounds: 12)</span>
      </div>
    </div>

    <h2 class="table-title">1. Akun Manajemen Platform (Superadmin & Admin Platform)</h2>
    <table>
      <thead>
        <tr>
          <th>Kategori Role</th>
          <th>Role Code</th>
          <th>Email Login</th>
          <th>Password</th>
          <th>Hak Akses & Batasan Otoritas</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Superadmin</strong></td>
          <td><span class="badge badge-purple">SUPER_ADMIN</span></td>
          <td><span class="code-font">superadmin@affiliategadget.com</span></td>
          <td><span class="code-font">admin123</span></td>
          <td>Akses Penuh: Monitoring seluruh omzet Multi-PT, audit log, transaksi & semua toko cabang</td>
        </tr>
        <tr>
          <td><strong>Admin Platform</strong></td>
          <td><span class="badge badge-blue">ADMIN</span></td>
          <td><span class="code-font">admin@affiliategadget.com</span></td>
          <td><span class="code-font">admin123</span></td>
          <td>Pengelola Platform: Master katalog, verifikasi toko, garansi (Tanpa omzet/transaksi toko)</td>
        </tr>
      </tbody>
    </table>

    <h2 class="table-title">2. Akun Toko Resmi (1 Admin Toko Mandiri per Cabang Ruko PT)</h2>
    <table>
      <thead>
        <tr>
          <th>Cabang Ruko & Badan Usaha PT</th>
          <th>Role Code</th>
          <th>Email Login Akun Toko</th>
          <th>Password</th>
          <th>Penanggung Jawab Cabang</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Roxy Mas Pusat (Jakarta)</strong><br>PT Gadget Jaya Sentosa</td>
          <td><span class="badge badge-indigo">STORE_ADMIN</span></td>
          <td><span class="code-font">admin.roxy@affiliategadget.com</span></td>
          <td><span class="code-font">admin123</span></td>
          <td>Bambang S. (Kelola stok ready & pesanan ruko Roxy)</td>
        </tr>
        <tr>
          <td><strong>WTC Surabaya</strong><br>PT Sinar Gadget Nusantara</td>
          <td><span class="badge badge-indigo">STORE_ADMIN</span></td>
          <td><span class="code-font">admin.surabaya@affiliategadget.com</span></td>
          <td><span class="code-font">admin123</span></td>
          <td>Kevin Santoso (Kelola stok ready & pesanan ruko WTC)</td>
        </tr>
        <tr>
          <td><strong>BEC Bandung</strong><br>PT Digital Niaga Prima</td>
          <td><span class="badge badge-indigo">STORE_ADMIN</span></td>
          <td><span class="code-font">admin.bandung@affiliategadget.com</span></td>
          <td><span class="code-font">admin123</span></td>
          <td>Reza Pratama (Kelola stok ready & pesanan ruko BEC)</td>
        </tr>
        <tr>
          <td><strong>Plaza Medan Fair</strong><br>PT Surya Makmur Gadget</td>
          <td><span class="badge badge-indigo">STORE_ADMIN</span></td>
          <td><span class="code-font">admin.medan@affiliategadget.com</span></td>
          <td><span class="code-font">admin123</span></td>
          <td>Rian Siregar (Kelola stok ready & pesanan ruko Medan)</td>
        </tr>
        <tr>
          <td><strong>Jogjatronik Mall</strong><br>PT Mega Ponsel Nusantara</td>
          <td><span class="badge badge-indigo">STORE_ADMIN</span></td>
          <td><span class="code-font">admin.jogja@affiliategadget.com</span></td>
          <td><span class="code-font">admin123</span></td>
          <td>Anisa Putri (Kelola stok ready & pesanan ruko Jogja)</td>
        </tr>
      </tbody>
    </table>

    <h2 class="table-title">3. Akun Customer / Pembeli Publik</h2>
    <table>
      <thead>
        <tr>
          <th>Nama Pembeli</th>
          <th>Role</th>
          <th>Email Login</th>
          <th>Password</th>
          <th>Kota Domisili & Alamat Kirim</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Rian Pratama</strong></td>
          <td><span class="badge badge-emerald">CUSTOMER</span></td>
          <td><span class="code-font">customer@test.com</span></td>
          <td><span class="code-font">customer123</span></td>
          <td>Jakarta Selatan (Jl. Senopati No. 42, Kebayoran Baru)</td>
        </tr>
        <tr>
          <td><strong>Siti Aminah</strong></td>
          <td><span class="badge badge-emerald">CUSTOMER</span></td>
          <td><span class="code-font">siti.aminah@gmail.com</span></td>
          <td><span class="code-font">customer123</span></td>
          <td>Surabaya (Jl. Dharmahusada Indah Timur No. 15)</td>
        </tr>
        <tr>
          <td><strong>Dimas Setiawan</strong></td>
          <td><span class="badge badge-emerald">CUSTOMER</span></td>
          <td><span class="code-font">dimas.setiawan@gmail.com</span></td>
          <td><span class="code-font">customer123</span></td>
          <td>Bandung (Jl. Ir. H. Juanda No. 128, Dago)</td>
        </tr>
        <tr>
          <td><strong>Maya Kartika</strong></td>
          <td><span class="badge badge-emerald">CUSTOMER</span></td>
          <td><span class="code-font">maya.kartika@gmail.com</span></td>
          <td><span class="code-font">customer123</span></td>
          <td>Medan (Jl. S. Parman No. 56, Petisah Tengah)</td>
        </tr>
        <tr>
          <td><strong>Fajar Nugroho</strong></td>
          <td><span class="badge badge-emerald">CUSTOMER</span></td>
          <td><span class="code-font">fajar.nugroho@gmail.com</span></td>
          <td><span class="code-font">customer123</span></td>
          <td>Yogyakarta (Jl. Kaliurang KM 5.2 No. 24, Caturtunggal)</td>
        </tr>
      </tbody>
    </table>

    <div class="note-box">
      <strong>💡 Catatan Operasional:</strong> Admin Toko adalah akun resmi cabang toko. Semua tindakan operasional unit ready stock, pemrosesan pesanan kurir JNE/Gojek, live streaming, dan profil ruko dikelola langsung secara mandiri oleh akun toko tersebut.
    </div>

    <div class="footer-bar">
      <span>Affiliate Gadget • Daftar Akun Kredensial Testing</span>
      <span>Halaman 1 dari 2</span>
    </div>
  </div>

  <!-- PAGE 2: LEGALITAS RUKO & GADGET FLAGSHIP -->
  <div class="page">
    <div class="header-banner">
      <div>
        <div class="banner-title">JARINGAN TOKO & <span>DATA MASTER</span></div>
        <div class="banner-subtitle">Legalitas Multi-PT & Inventori Gadget Database</div>
      </div>
      <div class="banner-badge">
        DATABASE SEED DATA<br>
        5 TOKO • 12 GADGET
      </div>
    </div>

    <h2 class="table-title">4. Jaringan Ruko Fisik Resmi & Legalitas Multi-PT Indonesia</h2>
    <table>
      <thead>
        <tr>
          <th>Nama Cabang Ruko</th>
          <th>Badan Hukum PT & NPWP</th>
          <th>Alamat Lengkap Ruko Fisik</th>
          <th>Rekening Bank Mandiri PT</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Cabang Roxy Mas</strong><br>Jakarta Pusat</td>
          <td>PT Gadget Jaya Sentosa<br><span class="code-font">01.428.910.4-015.000</span></td>
          <td>ITC Roxy Mas Lt. 2 No. 45-47, Jl. KH. Hasyim Ashari No. 125, Cideng</td>
          <td>Mandiri: 1180019283741<br>BCA: 5270918234</td>
        </tr>
        <tr>
          <td><strong>Cabang WTC Surabaya</strong><br>Surabaya</td>
          <td>PT Sinar Gadget Nusantara<br><span class="code-font">02.582.119.8-609.000</span></td>
          <td>WTC Surabaya Galeria Lt. 3 No. 312-315, Jl. Pemuda No. 27-31</td>
          <td>BCA: 0882319485</td>
        </tr>
        <tr>
          <td><strong>Cabang BEC Bandung</strong><br>Bandung</td>
          <td>PT Digital Niaga Prima<br><span class="code-font">03.194.882.1-428.000</span></td>
          <td>Bandung Electronic Center (BEC) Lt. 1 Blok B-08, Jl. Purnawarman</td>
          <td>Mandiri: 1310088271629</td>
        </tr>
        <tr>
          <td><strong>Plaza Medan Fair</strong><br>Medan</td>
          <td>PT Surya Makmur Gadget<br><span class="code-font">04.812.339.7-112.000</span></td>
          <td>Plaza Medan Fair Lt. 4 No. 42-44, Jl. Gatot Subroto No. 30</td>
          <td>BRI: 005301002938301</td>
        </tr>
        <tr>
          <td><strong>Jogja Tronik Mall</strong><br>Yogyakarta</td>
          <td>PT Mega Ponsel Nusantara<br><span class="code-font">05.671.229.4-541.000</span></td>
          <td>Jogjatronik Mall Lt. UG No. 18-20, Jl. Brigjen Katamso No. 75-77</td>
          <td>BCA: 1690882711</td>
        </tr>
      </tbody>
    </table>

    <h2 class="table-title">5. Ringkasan 12 Smartphone Flagship Realistis di Database</h2>
    <table>
      <thead>
        <tr>
          <th>Nama Gadget & Varian</th>
          <th>Brand</th>
          <th>Harga Resmi</th>
          <th>Cabang Toko PT Pemilik</th>
          <th>Proteksi Garansi</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>iPhone 15 Pro Max 256GB</strong></td>
          <td>Apple</td>
          <td>Rp 22.999.000</td>
          <td>Roxy Mas (PT Gadget Jaya Sentosa)</td>
          <td>30 Hari Ganti Baru</td>
        </tr>
        <tr>
          <td><strong>iPhone 15 Pro 128GB Titanium</strong></td>
          <td>Apple</td>
          <td>Rp 18.999.000</td>
          <td>Roxy Mas (PT Gadget Jaya Sentosa)</td>
          <td>30 Hari Ganti Baru</td>
        </tr>
        <tr>
          <td><strong>Samsung Galaxy S24 Ultra 5G</strong></td>
          <td>Samsung</td>
          <td>Rp 21.999.000</td>
          <td>WTC Surabaya (PT Sinar Gadget Nusantara)</td>
          <td>30 Hari Ganti Baru</td>
        </tr>
        <tr>
          <td><strong>Samsung Galaxy Z Fold 6 5G</strong></td>
          <td>Samsung</td>
          <td>Rp 26.499.000</td>
          <td>Roxy Mas (PT Gadget Jaya Sentosa)</td>
          <td>30 Hari Ganti Baru</td>
        </tr>
        <tr>
          <td><strong>ASUS ROG Phone 8 Pro 16/512GB</strong></td>
          <td>ASUS</td>
          <td>Rp 15.499.000</td>
          <td>BEC Bandung (PT Digital Niaga Prima)</td>
          <td>30 Hari Ganti Baru</td>
        </tr>
        <tr>
          <td><strong>Xiaomi 14 Leica Summilux</strong></td>
          <td>Xiaomi</td>
          <td>Rp 11.999.000</td>
          <td>BEC Bandung (PT Digital Niaga Prima)</td>
          <td>30 Hari Ganti Baru</td>
        </tr>
        <tr>
          <td><strong>Vivo X100 Pro 5G ZEISS APO</strong></td>
          <td>Vivo</td>
          <td>Rp 16.999.000</td>
          <td>Medan Fair (PT Surya Makmur Gadget)</td>
          <td>30 Hari Ganti Baru</td>
        </tr>
        <tr>
          <td><strong>Oppo Find N3 Flip 5G</strong></td>
          <td>Oppo</td>
          <td>Rp 14.999.000</td>
          <td>WTC Surabaya (PT Sinar Gadget Nusantara)</td>
          <td>30 Hari Ganti Baru</td>
        </tr>
      </tbody>
    </table>

    <div class="note-box">
      <strong>📌 Petunjuk Akses Cepat:</strong> Pengguna dapat langsung membuka <span class="code-font">/login</span> untuk masuk dengan akun di atas. Akun staf/admin toko akan otomatis langsung diarahkan ke panel CMS manajemen <span class="code-font">/dashboard/admin</span>.
    </div>

    <div class="footer-bar">
      <span>Affiliate Gadget • Daftar Akun Kredensial Testing</span>
      <span>Halaman 2 dari 2</span>
    </div>
  </div>

</body>
</html>
`;

  await page2.setContent(dummyHtml, { waitUntil: 'networkidle' });
  await page2.pdf({
    path: path.join(__dirname, '../Daftar_Akun_Dummy_Affiliate_Gadget.pdf'),
    format: 'A4',
    printBackground: true,
    margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' },
  });
  console.log('✅ Daftar_Akun_Dummy_Affiliate_Gadget.pdf generated successfully!');

  await browser.close();
  console.log('🎉 All PDFs have been generated and updated successfully!');
}

generatePDFs().catch((err) => {
  console.error('❌ Error generating PDFs:', err);
  process.exit(1);
});
