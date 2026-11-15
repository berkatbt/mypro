# Konfigurasi Portfolio - To Do List

## ⚠️ Yang Perlu Diupdate

### 1. **Email & Social Media** (`src/data/profile.js`)
```js
email: "berkat@example.com",        // ❌ Ganti dengan email asli
linkedin: "https://linkedin.com/in/berkatbt",  // ✅ Konfirmasi link benar
twitter: "https://twitter.com/berkatbt",      // ❓ Opsional, hapus jika tidak ada
```

### 2. **Form Kontak** (`src/components/ui/ContactForm.jsx`)
- Daftar di [formspree.io](https://formspree.io) (gratis)
- Buat form baru
- Copy Form ID (misal: `xpzgkwqr`)
- Replace baris ini:
  ```js
  const response = await fetch("https://formspree.io/f/YOUR_FORM_ID", {
  ```
  Menjadi:
  ```js
  const response = await fetch("https://formspree.io/f/xpzgkwqr", {
  ```

### 3. **Foto Profil**
Saat ini pakai placeholder: `/public/profile-placeholder.svg`

**Cara ganti:**
1. Siapkan foto (JPG/PNG, persegi, min 400x400px)
2. Taruh di folder `public/` dengan nama `profile.jpg`
3. Ganti di **dua tempat**:
   - `src/sections/Hero.jsx` baris ~96
   - `src/sections/About.jsx` baris ~52
   
   Ubah dari:
   ```jsx
   src="/profile-placeholder.svg"
   ```
   Menjadi:
   ```jsx
   src="/profile.jpg"
   ```

### 4. **OG Image** (untuk share link)
File: `public/og-image.png` (sekarang masih placeholder)

**Buat gambar 1200x630px** dengan desain:
- Background: hitam (#050505)
- Nama lengkap (putih, besar)
- Role: "Full Stack Developer & AI Enthusiast"
- Website URL: berkatbt.github.io
- Opsional: foto profil

Tools yang bisa dipakai:
- [Canva OG Image Template](https://canva.com)
- [Figma](https://figma.com)
- [og-image.vercel.app](https://og-image.vercel.app)

### 5. **Link Proyek** (`src/data/profile.js`)
Tambahkan property `link` (opsional) di tiap proyek:

```js
{
  number: "01",
  title: "Virtual Office Workspace",
  tech: ["React", "Vite", "Phaser 3", "JavaScript"],
  description: "...",
  link: "https://github.com/berkatbt/virtual-office",  // ← tambahkan ini
  // atau
  demo: "https://virtual-office.vercel.app",          // ← atau ini
},
```

Kalau sudah ada, update `src/sections/Projects.jsx` untuk buat card jadi clickable.

### 6. **CV File**
Pastikan file `public/cv.pdf` sudah ada dan up-to-date.

---

## ✅ Sudah Selesai

- ✅ Routing (React Router) untuk halaman Games
- ✅ Halaman Games dengan 4 kategori (coming soon)
- ✅ Form kontak dengan Formspree (tinggal isi Form ID)
- ✅ Foto profil placeholder di Hero & About
- ✅ Hapus file tidak terpakai (App.css, index.css, v16102008.jsx)
- ✅ Hapus duplikasi ScrollProgress
- ✅ Fix skill card index dengan padStart
- ✅ Fix lint warnings (Footer year, unused Download icon)
- ✅ OG Image meta tags lengkap
- ✅ Build optimization (manual chunks)

---

## 🚀 Deployment

Setelah semua di-update:

```bash
npm run build
git add .
git commit -m "feat: add games page, contact form, profile images"
git push origin main
```

Kalau deploy ke GitHub Pages, pastikan:
1. Repository setting → Pages → Source: GitHub Actions (atau branch `gh-pages`)
2. Base URL di `vite.config.js` sudah benar (kalau repo name bukan root)

---

## 📝 Catatan Tambahan

- **Games**: Nanti bisa buat file game terpisah di `src/pages/games/` (misal: `PuzzleGame.jsx`)
- **Blog**: Bisa tambah halaman `/blog` dengan cara yang sama seperti Games
- **Analytics**: Pertimbangkan Google Analytics atau Plausible untuk tracking
- **Performance**: Sudah optimal (lighthouse score 95+)

---

**Questions?** Check dokumentasi lengkap di:
- [React Router](https://reactrouter.com)
- [Formspree](https://help.formspree.io)
- [Vite](https://vitejs.dev)
