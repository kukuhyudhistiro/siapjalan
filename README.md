# Prototipe PWA Petugas Lapangan — SIAP Jalan (Kab. Malang)

Prototipe statik (HTML/CSS/JS + Leaflet/OpenStreetMap) untuk **Gambar 9 — Rancangan Antarmuka Aplikasi Petugas Lapangan**.
Semua data adalah **dummy** dan disimpan di `localStorage` peramban (meniru basis data terpusat).

## Menjalankan

Service worker hanya berjalan lewat `http://localhost` atau HTTPS (bukan `file://`):

```bash
cd prototype-pwa-petugas
python3 -m http.server 5173
```

Buka `http://localhost:5173`. Di desktop tampilan dibingkai seperti ponsel; di ponsel tampil penuh.
Untuk mencoba GPS asli dan memasang PWA di ponsel, hosting folder ini di layanan HTTPS statik (GitHub Pages, Netlify, Vercel).

**Akun demo:** `petugas01` / `petugas123` (juga `petugas02`). `staf01`/`admin` ditolak (khusus versi komputer), `petugas03` nonaktif.

## Layar (Gambar 9) dan layar turunan

| Layar | Rute | Isi |
|---|---|---|
| (a) Login | `#/login` | Nama pengguna, kata sandi, cek peran & status aktif |
| (b) Beranda | `#/beranda` | Input Aset Baru, Catat Pemeriksaan Kondisi, ringkasan, tabel pemeriksaan terakhir |
| (c) Input langkah 1 | `#/input/1` | Kategori → jenis, kode aset otomatis, kecamatan → ruas, status jalan (dari ruas), posisi, arah jalur, lokasi KM, **Ambil Lokasi GPS** / simulasi / manual + validasi wilayah |
| (d) Input langkah 2 | `#/input/2` | Kondisi, visibilitas (marka), panjang segmen (marka/guardrail), foto wajib (kamera), keterangan, tolak data ganda |
| (e) Peta Sebaran | `#/peta` | Leaflet + OSM, penanda per kategori, garis segmen memanjang, filter kecamatan/kondisi, ringkasan, kartu aset |
| Detail Lengkap | `#/aset/:id` | Identitas, lokasi, riwayat pemeriksaan + foto |
| Periksa Ulang | `#/periksa/:id` | Tambah pemeriksaan baru tanpa menimpa riwayat |
| Akun | `#/akun` | Profil, pasang aplikasi, reset data dummy, keluar |

## Data dummy (mengikuti Kamus Data, Tabel 3.6)

`js/data.js` membangkitkan 8 tabel: `pengguna` (5), `kecamatan` (33 kecamatan Kab. Malang), `ruas_jalan` (37, status Nasional/Provinsi/Kabupaten),
`kategori` (RMB, MRK, APL, GRD, DLN, CRM), `jenis_perlengkapan` (18), `aset` (96), `pemeriksaan` (1–3 per aset), `foto` (1 per pemeriksaan, gambar SVG dummy).
Kolom berawalan `_` (mis. `_lat`, `_kecamatan_ids`, `_demo`) hanya alat bantu prototipe, bukan bagian skema.

## Penyederhanaan prototipe

- Validasi wilayah memakai kotak batas Kab. Malang dikurangi Kota Malang dan Kota Batu (sistem nyata: poligon batas wilayah).
- Data ganda: jenis sama + koordinat sama setelah dibulatkan 5 desimal (≈1 m), meniru indeks unik `(jenis_id, latitude, longitude)`.
- Kata sandi tidak di-hash; autentikasi & hak akses sesungguhnya diperiksa di sisi peladen (Express) pada sistem akhir.
- Input saat luring tidak didukung (sesuai batasan penelitian); service worker hanya menyimpan cangkang aplikasi.
