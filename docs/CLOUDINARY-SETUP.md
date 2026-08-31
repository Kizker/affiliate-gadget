# Cloudinary Image Upload Setup

## ✅ Setup Complete!

Cloudinary image upload telah berhasil diintegrasikan ke halaman Mitra Profile Edit.

---

## 📋 **Credentials yang Dibutuhkan**

Pastikan `.env.local` Anda sudah berisi:

```env
# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dzwuekdyv
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=affiliate-gadget-uploads
CLOUDINARY_API_KEY=196366734638336
CLOUDINARY_API_SECRET=06GjvR0H-TaN4iC30Rv-pt1Rrik
```

---

## 🎨 **Komponen yang Dibuat**

### 1. **ImageUpload** (`src/components/upload/image-upload.tsx`)

Komponen untuk upload single image (banner).

**Features:**

- ✅ Drag & drop upload
- ✅ Preview image
- ✅ Replace button (on hover)
- ✅ Remove button (on hover)
- ✅ Loading state
- ✅ Automatic upload to Cloudinary
- ✅ Returns secure URL

**Usage:**

```tsx
<ImageUpload
  label="Banner Toko"
  value={bannerUrl}
  onChange={(url) => setBannerUrl(url)}
  onRemove={() => setBannerUrl('')}
  folder="affiliate-gadget/banners"
/>
```

### 2. **MultiImageUpload** (`src/components/upload/multi-image-upload.tsx`)

Komponen untuk upload multiple images (gallery).

**Features:**

- ✅ Upload multiple images (max 8)
- ✅ Grid preview
- ✅ Remove individual images
- ✅ Image counter (e.g., "3 / 8 images")
- ✅ Max limit enforcement
- ✅ Empty state

**Usage:**

```tsx
<MultiImageUpload
  label="Galeri Foto Toko"
  value={galleryUrls}
  onChange={(urls) => setGalleryUrls(urls)}
  maxImages={8}
  folder="affiliate-gadget/gallery"
/>
```

---

## 📁 **File Structure**

```
src/
├── components/
│   └── upload/
│       ├── image-upload.tsx (NEW)
│       └── multi-image-upload.tsx (NEW)
└── app/
    └── dashboard/
        └── mitra/
            └── profile/
                └── edit/
                    └── page.tsx (UPDATED)
```

---

## 🚀 **Cara Menggunakan**

### **Di Halaman Mitra Profile Edit:**

1. **Buka halaman:** `http://localhost:3000/dashboard/mitra/profile/edit`
2. **Tab "Informasi Dasar":**
   - Klik area upload banner
   - Pilih gambar dari komputer
   - Gambar otomatis ter-upload ke Cloudinary
   - URL tersimpan di state
3. **Tab "Galeri":**
   - Klik tombol "Add Image"
   - Pilih gambar (max 8)
   - Hover untuk hapus gambar

---

## 🔧 **Technical Details**

### **Upload Flow:**

1. User clicks upload button
2. Cloudinary widget opens
3. User selects image
4. Image uploads to Cloudinary
5. Cloudinary returns secure URL
6. URL saved to component state
7. Preview displayed

### **Cloudinary Configuration:**

- **Cloud Name:** `dzwuekdyv`
- **Upload Preset:** `affiliate-gadget-uploads` (unsigned)
- **Folders:**
  - Banners: `affiliate-gadget/banners`
  - Gallery: `affiliate-gadget/gallery`

### **Image Optimization:**

Cloudinary automatically:

- ✅ Compresses images
- ✅ Converts to optimal format (WebP)
- ✅ Serves via CDN
- ✅ Generates responsive sizes

---

## 📊 **Benefits**

1. **No Server Storage** - Images stored in Cloudinary cloud
2. **Fast Delivery** - Global CDN
3. **Auto Optimization** - Automatic compression & format conversion
4. **Scalable** - No server disk space concerns
5. **Secure** - HTTPS URLs
6. **Free Tier** - 25GB storage, 25GB bandwidth/month

---

## 🎯 **Next Steps**

### **Optional Enhancements:**

1. **Image Transformation:**

   ```tsx
   // Resize on-the-fly
   <img src={`${imageUrl}?w=800&h=600&c=fill`} />
   ```

2. **Validation:**
   - Add file size limit (currently unlimited)
   - Add file type validation (currently any image)

3. **Progress Bar:**
   - Show upload progress percentage

4. **Crop Tool:**
   - Add image cropping before upload

---

## 🐛 **Troubleshooting**

### **Upload tidak berfungsi:**

1. Check `.env.local` credentials
2. Verify upload preset is "unsigned"
3. Check browser console for errors

### **Image tidak muncul:**

1. Check URL is valid HTTPS
2. Verify Cloudinary account active
3. Check CORS settings

---

## 📝 **Notes**

- Upload preset harus **unsigned** untuk client-side upload
- API Key & Secret hanya untuk server-side operations
- Free tier cukup untuk development & production awal
- Images otomatis di-optimize oleh Cloudinary

---

**Created:** 26 Desember 2025  
**Status:** ✅ Ready to Use
