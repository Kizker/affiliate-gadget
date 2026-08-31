// Dummy article data
export interface Article {
  slug: string
  title: string
  excerpt: string
  content: string
  thumbnail: string
  featuredImage: string
  category: string
  author: {
    name: string
    avatar: string
    role: string
  }
  publishDate: string
  readTime: number
  tags: string[]
}

export const articles: Article[] = [
  {
    slug: 'tips-merawat-smartphone-agar-awet',
    title: 'Tips Merawat Smartphone Agar Awet dan Tahan Lama',
    excerpt:
      'Panduan lengkap merawat smartphone agar tetap awet dan performa optimal. Pelajari cara-cara sederhana yang bisa memperpanjang usia perangkat Anda.',
    content: `
# Tips Merawat Smartphone Agar Awet dan Tahan Lama

Smartphone adalah investasi yang tidak murah. Oleh karena itu, penting untuk merawatnya dengan baik agar tetap awet dan berfungsi optimal dalam jangka waktu yang lama.

## 1. Gunakan Pelindung Layar dan Casing

Pelindung layar (screen protector) dan casing adalah investasi kecil yang dapat melindungi smartphone Anda dari goresan dan benturan. Pilih casing yang berkualitas baik dan sesuai dengan model smartphone Anda.

## 2. Hindari Overcharging

Jangan biarkan smartphone tercharge semalaman. Cabut charger ketika baterai sudah penuh untuk menjaga kesehatan baterai jangka panjang.

## 3. Bersihkan Secara Rutin

Bersihkan layar dan body smartphone secara rutin menggunakan kain microfiber. Hindari penggunaan cairan pembersih yang keras.

## 4. Update Software Secara Berkala

Selalu update sistem operasi dan aplikasi ke versi terbaru untuk mendapatkan patch keamanan dan perbaikan bug.

## 5. Kelola Penyimpanan dengan Baik

Jangan biarkan storage penuh. Hapus file dan aplikasi yang tidak terpakai secara berkala untuk menjaga performa smartphone.

## Kesimpulan

Dengan perawatan yang tepat, smartphone Anda dapat bertahan lebih lama dan tetap berfungsi optimal. Ikuti tips di atas untuk memaksimalkan investasi Anda.
    `,
    thumbnail:
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
    featuredImage:
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1920&q=80',
    category: 'Tips & Trik',
    author: {
      name: 'Ahmad Rizki',
      avatar:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80',
      role: 'Tech Expert',
    },
    publishDate: '2025-01-15',
    readTime: 5,
    tags: ['smartphone', 'tips', 'perawatan', 'maintenance'],
  },
  {
    slug: 'mengenal-jenis-kerusakan-lcd-hp',
    title: 'Mengenal Jenis-Jenis Kerusakan LCD HP dan Solusinya',
    excerpt:
      'Berbagai jenis kerusakan LCD yang sering terjadi pada smartphone dan cara mengatasinya. Ketahui kapan harus ke service center.',
    content: `
# Mengenal Jenis-Jenis Kerusakan LCD HP dan Solusinya

LCD adalah komponen vital pada smartphone. Kerusakan pada LCD dapat mengganggu pengalaman penggunaan secara signifikan.

## Jenis-Jenis Kerusakan LCD

### 1. LCD Bergaris

Garis-garis vertikal atau horizontal pada layar biasanya disebabkan oleh kerusakan pada panel LCD atau konektor yang longgar.

**Solusi:** Periksa konektor LCD. Jika masih bergaris, kemungkinan perlu penggantian LCD.

### 2. LCD Blank/Hitam

Layar menyala tapi tidak menampilkan apa-apa. Bisa disebabkan oleh kerusakan LCD atau masalah pada motherboard.

**Solusi:** Cek backlight dan konektor. Jika tidak ada masalah, LCD perlu diganti.

### 3. Touchscreen Tidak Responsif

Layar tidak merespon sentuhan atau hanya sebagian area yang berfungsi.

**Solusi:** Kalibrasi ulang touchscreen. Jika tidak berhasil, ganti digitizer atau LCD.

### 4. Dead Pixel

Titik-titik kecil yang tidak menyala atau selalu menyala dengan warna tertentu.

**Solusi:** Dead pixel permanen memerlukan penggantian LCD.

## Kapan Harus ke Service Center?

- Kerusakan parah yang mempengaruhi seluruh layar
- Garansi masih berlaku
- Tidak yakin dengan diagnosa sendiri
- Memerlukan sparepart original

## Kesimpulan

Kenali jenis kerusakan LCD untuk menentukan langkah perbaikan yang tepat. Konsultasikan dengan teknisi profesional untuk hasil terbaik.
    `,
    thumbnail:
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80',
    featuredImage:
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=1920&q=80',
    category: 'Edukasi',
    author: {
      name: 'Budi Santoso',
      avatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
      role: 'Senior Technician',
    },
    publishDate: '2025-01-10',
    readTime: 7,
    tags: ['lcd', 'kerusakan', 'perbaikan', 'troubleshooting'],
  },
  {
    slug: 'cara-memilih-sparepart-hp-original',
    title: 'Cara Memilih Sparepart HP Original: Panduan Lengkap',
    excerpt:
      'Tips memilih sparepart original untuk smartphone Anda. Hindari produk palsu dan pastikan kualitas terbaik untuk perangkat Anda.',
    content: `
# Cara Memilih Sparepart HP Original: Panduan Lengkap

Memilih sparepart yang tepat sangat penting untuk menjaga performa dan keawetan smartphone Anda.

## Mengapa Harus Original?

Sparepart original memiliki kualitas terjamin dan kompatibilitas sempurna dengan perangkat Anda. Meskipun harganya lebih mahal, investasi ini sepadan untuk jangka panjang.

## Ciri-Ciri Sparepart Original

### 1. Kemasan Resmi

Sparepart original biasanya dikemas dengan rapi dan memiliki hologram atau segel keaslian dari manufacturer.

### 2. Harga Wajar

Jika harga terlalu murah dibanding pasaran, patut dicurigai. Original parts memiliki harga standar yang tidak jauh berbeda antar toko.

### 3. Garansi Resmi

Toko atau service center resmi selalu memberikan garansi untuk sparepart yang dijual.

### 4. Kode Produksi

Periksa kode produksi dan serial number. Sparepart original memiliki kode yang dapat diverifikasi.

## Tips Membeli Sparepart

1. **Beli dari Toko Terpercaya** - Pilih toko atau service center yang memiliki reputasi baik
2. **Minta Bukti Keaslian** - Jangan ragu meminta sertifikat atau bukti keaslian
3. **Periksa Fisik** - Cek kondisi fisik sparepart sebelum membeli
4. **Tanyakan Garansi** - Pastikan ada garansi minimal 30 hari

## Sparepart yang Sering Diganti

- Baterai
- LCD/Touchscreen
- Kamera
- Port charging
- Speaker

## Kesimpulan

Investasi pada sparepart original adalah keputusan bijak untuk menjaga kualitas smartphone Anda. Jangan tergiur harga murah yang bisa merugikan di kemudian hari.
    `,
    thumbnail:
      'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&q=80',
    featuredImage:
      'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=1920&q=80',
    category: 'Panduan',
    author: {
      name: 'Siti Nurhaliza',
      avatar:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80',
      role: 'Product Specialist',
    },
    publishDate: '2025-01-05',
    readTime: 6,
    tags: ['sparepart', 'original', 'panduan', 'tips'],
  },
  {
    slug: 'teknologi-terbaru-perbaikan-hp-2025',
    title: 'Teknologi Terbaru dalam Perbaikan HP di Tahun 2025',
    excerpt:
      'Inovasi terbaru dalam dunia reparasi smartphone di tahun 2025. Dari AI diagnostics hingga micro-soldering canggih.',
    content: `
# Teknologi Terbaru dalam Perbaikan HP di Tahun 2025

Industri reparasi smartphone terus berkembang dengan teknologi baru yang membuat proses perbaikan lebih cepat dan akurat.

## AI-Powered Diagnostics

Teknologi AI kini dapat mendiagnosa masalah smartphone dengan akurasi tinggi hanya dalam hitungan menit. Sistem ini menganalisis gejala dan memberikan rekomendasi perbaikan yang tepat.

### Keuntungan AI Diagnostics:
- Diagnosa lebih cepat dan akurat
- Mengurangi human error
- Dapat mendeteksi masalah tersembunyi
- Database masalah yang terus diupdate

## Micro-Soldering dengan Laser

Teknologi laser micro-soldering memungkinkan perbaikan komponen yang sangat kecil dengan presisi tinggi tanpa merusak komponen sekitarnya.

## 3D Printing untuk Sparepart

Beberapa komponen non-elektronik kini dapat dicetak menggunakan 3D printer, mengurangi waktu tunggu sparepart langka.

## Augmented Reality Training

Teknisi dapat menggunakan AR untuk mendapatkan panduan visual real-time saat melakukan perbaikan kompleks.

## Eco-Friendly Repair Methods

Metode perbaikan ramah lingkungan dengan penggunaan bahan kimia yang lebih aman dan proses daur ulang komponen yang lebih baik.

## Software-Based Repairs

Banyak masalah kini dapat diselesaikan melalui software tanpa perlu membuka perangkat, menghemat waktu dan biaya.

## Kesimpulan

Teknologi terus mengubah cara kita memperbaiki smartphone. Di Affiliate Gadget, kami selalu mengadopsi teknologi terbaru untuk memberikan layanan terbaik kepada pelanggan.
    `,
    thumbnail:
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
    featuredImage:
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920&q=80',
    category: 'Teknologi',
    author: {
      name: 'Diana Putri',
      avatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
      role: 'Innovation Lead',
    },
    publishDate: '2025-01-01',
    readTime: 8,
    tags: ['teknologi', 'inovasi', 'AI', 'future'],
  },
]

export function getArticles(): Article[] {
  return articles
}

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug)
}

export function getRelatedArticles(
  currentSlug: string,
  limit: number = 3
): Article[] {
  return articles
    .filter((article) => article.slug !== currentSlug)
    .slice(0, limit)
}
