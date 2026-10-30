<<<<<<< HEAD
# Taman Teras Cafe

Website self-ordering sesuai proposal tugas akhir, wawancara owner, dan draft rancangan. Frontend menggunakan **Vue.js 3**, backend **Node.js + Express**, dan integrasi database **Supabase PostgreSQL + Supabase Auth**. Bahasa antarmuka Indonesia.

Versi awal berjalan dengan data demo lokal. Sesuai permintaan, proyek Supabase akan disambungkan kemudian. Tidak ada script automation, Playwright, polling, WebSocket, SSE, payment gateway, atau pemotongan stok otomatis.

## Menjalankan di komputer ini

Gunakan Node.js 22.12+ atau Node.js 24. Dependency sudah terpasang; pada komputer lain jalankan `npm ci` terlebih dahulu.

```powershell
Copy-Item .env.example .env
npm run dev
```

Website: **http://localhost:5173**. Backend: **http://127.0.0.1:3001/api/health**. Frontend meneruskan `/api` ke backend melalui Vite, sehingga tidak perlu mengatur CORS.

Untuk menjalankan hasil build lokal:

```powershell
npm run build
npm start
```

Buka **http://localhost:3001**. Dalam mode development, login mendukung `localhost`, `127.0.0.1`, dan `[::1]` pada port frontend 5173 serta port backend (`PORT`, bawaan 3001). Isi `PUBLIC_APP_URL=http://localhost:3001` bila QR meja juga akan memakai alamat ini. Tetap gunakan `NODE_ENV=development` untuk demo. Mode `production` sengaja mensyaratkan Supabase dan cookie HTTPS, serta hanya menerima origin yang dikonfigurasi.

Jika login menampilkan “Asal permintaan tidak diizinkan”, restart backend setelah perubahan konfigurasi. Untuk akses lewat IP jaringan atau domain sendiri, isi `APP_ORIGIN` dengan alamat persis yang terlihat di browser (termasuk protokol dan port), lalu restart backend. Email atau kata sandi belum diperiksa ketika kesalahan origin terjadi.

## Akun demo

| Peran | Email | Kata sandi bawaan |
| --- | --- | --- |
| Owner | owner@tamanteras.local | TerasOwner2026! |
| Kasir | kasir@tamanteras.local | TerasKasir2026! |

Masuk lewat **Area staf** di footer atau `/login`. Kata sandi demo mengikuti `.env` dan dapat diubah lalu restart backend. Sesi tersimpan di memori backend, memiliki batas waktu, dan berakhir jika backend restart. Data operasional demo tersimpan di `.data/demo.json`; restart tidak menghapus pesanan. File data ini hanya untuk pengembangan satu proses, bukan database produksi.

## Fitur yang tersedia

- Beranda dan katalog kategori, foto, harga, kalori opsional, label favorit/pedas/habis. Menu habis tetap terlihat dan tidak dapat dipesan.
- Keranjang tersimpan di browser, jumlah dan catatan per menu, checkout tanpa akun dengan nama dan nomor WhatsApp.
- Dine-in dengan nomor meja atau takeaway. QR meja dapat diunduh dari dashboard, dan mengisi nomor meja melalui `/?meja=3`.
- QRIS statis dan transfer bank, diverifikasi manual oleh kasir. Tidak ada tombol pelanggan yang dapat menandai pembayaran lunas.
- Pelacakan dengan tautan privat setelah checkout, atau nomor pesanan + WhatsApp. Pembaruan dilakukan melalui tombol **Perbarui status**.
- Owner dan kasir: daftar/detail pesanan, konfirmasi lunas, status Diterima → Diproses → Siap → Selesai, riwayat selesai dengan filter tanggal, cetak struk browser.
- Owner: CRUD menu, CRUD daftar bahan, laporan penjualan. Kasir: mengubah ketersediaan menu dan memperbarui stok, tanpa akses laporan atau CRUD master.
- Stok manual: tambah/kurangi/tetapkan jumlah, alasan, batas minimum, peringatan, riwayat sebelum/sesudah/selisih/staf/waktu. Pesanan tidak memotong stok.
- Laporan rentang tanggal, 7 hari terakhir atau bulan berjalan; omzet harian, jam ramai, dan menu terlaris. Hanya pesanan **Selesai dan Lunas** dihitung. Periode penjualan berdasarkan tanggal selesai, jam ramai berdasarkan jam masuk pesanan; seluruhnya WIB.
- Tentang kami berupa teks; kontak/lokasi mengikuti konfigurasi asli cafe.

## Menyambungkan Supabase

1. Buat proyek Supabase khusus Taman Teras Cafe atau gunakan proyek kosong yang Anda pilih. Tidak ada proyek cloud yang dibuat atau diubah dalam pengerjaan awal ini.
2. Jalankan isi `supabase/schema.sql` sekali di **SQL Editor** proyek baru. File ini membuat tabel, indeks, RLS, dan fungsi transaksi atomik. Ini SQL inisialisasi database, bukan script automation pengujian.
3. Opsional: jalankan `supabase/seed.sql` untuk data menu dan bahan contoh. Jangan perlakukan data contoh sebagai data resmi cafe.
4. Di **Authentication → Users**, buat akun staf dengan email/password, konfirmasikan email, dan salin UUID masing-masing pengguna. Tidak ada pendaftaran staf publik.
5. Tambahkan peran staf di SQL Editor dengan UUID akun sebenarnya:

```sql
insert into public.staff_profiles (id, name, role)
values ('UUID-AKUN-OWNER', 'Nama Owner', 'owner');

insert into public.staff_profiles (id, name, role)
values ('UUID-AKUN-KASIR', 'Nama Kasir', 'cashier');
```

6. Isi `.env`:

```dotenv
DATA_MODE=supabase
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=SECRET_SERVER_ANDA
SUPABASE_PUBLISHABLE_KEY=PUBLISHABLE_KEY_ANDA
```

Gunakan secret key baru (`sb_secret_...`) atau legacy service-role key hanya di backend; publishable key atau legacy anon key untuk autentikasi staf. **Jangan pernah menambahkan awalan `VITE_` pada secret.** Browser hanya berbicara dengan Node.js. Semua tabel memakai RLS tanpa policy publik; `anon`/`authenticated` tidak diberi akses tabel atau RPC. Backend memverifikasi pengguna lewat Supabase Auth dan membaca peran dari `staff_profiles` pada setiap permintaan staf. Menonaktifkan `active` menutup akses staf.

7. Lengkapi rekening, QRIS, alamat, peta, WhatsApp cafe, dan media sosial dalam `.env`. URL QRIS harus menunjuk gambar QRIS asli cafe; QR meja bukan QR pembayaran. Dalam mode Supabase, checkout menolak metode pembayaran yang belum dikonfigurasi.
8. Restart backend. `/api/health` menampilkan `mode: "supabase"`. Bila kredensial atau database gagal, server tidak beralih diam-diam ke demo.

Sesi Supabase mengikuti masa berlaku access token. Pengguna masuk lagi setelah sesi berakhir; refresh token otomatis belum ditambahkan. Untuk hosting, pakai HTTPS, `NODE_ENV=production`, `HOST=0.0.0.0`, dan atur `APP_ORIGIN`/`PUBLIC_APP_URL` ke domain sebenarnya. Gunakan satu instance backend saat sesi masih berbasis memori.

## Data cafe yang perlu dilengkapi

Menu/harga, kalori, foto, bahan dan batas stok awal adalah contoh. Cerita berdiri pada 18 Agustus 2026 serta jam Senin–Jumat 08.30–16.00 WIB berasal dari wawancara. Alamat, koordinat/peta, nomor WhatsApp, Instagram, rekening dan QRIS asli tidak tersedia dalam dokumen, sehingga tidak dikarang. Foto berasal dari Unsplash sebagai ilustrasi; lihat `docs/ASSETS.md`. Halaman Tentang Kami tidak memuat galeri.

Rancangan utama menyebut QRIS dan transfer, sedangkan wawancara menyebut QRIS/cash dan salah satu contoh skenario rancangan menyebut bayar di tempat. Implementasi awal mengikuti bagian pembayaran dan batasan utama rancangan: **QRIS dan transfer**, tanpa cash. Jam buka ditampilkan sebagai informasi; checkout tidak dibatasi otomatis oleh jam operasional.

## Mencoba dari ponsel

Hubungkan ponsel dan komputer ke jaringan yang sama. Isi `PUBLIC_APP_URL=http://IP-KOMPUTER:5173` dan `APP_ORIGIN` dengan alamat tersebut. Restart `npm run dev`, izinkan port 5173 jika Windows Firewall memintanya, lalu buka alamat itu di ponsel. Vite meneruskan permintaan API ke backend lokal. Gunakan QR meja setelah alamat diubah. Localhost pada ponsel mengarah ke ponsel itu sendiri.

## Struktur proyek

```text
client/                  Frontend Vue, routing, komponen, dan gambar lokal
server/                  Express API, auth, validasi, adapter data, seed demo
supabase/schema.sql      Struktur database dan fungsi transaksi
supabase/seed.sql        Data contoh opsional
docs/RUANG_LINGKUP.md     Pemetaan dokumen dan keputusan implementasi
docs/API.md              Daftar endpoint dan hak akses
.env.example             Contoh konfigurasi tanpa kredensial
```

Total pesanan dihitung ulang dari harga database. Salinan nama/harga/catatan disimpan pada pesanan, sehingga perubahan atau penghapusan menu tidak mengubah riwayat. Penyimpanan checkout mendukung kunci idempotensi. Perubahan status memakai versi untuk mencegah perubahan staf saling menimpa; stok dan riwayat diperbarui dalam satu transaksi. Semua perubahan menu/bahan memakai penghapusan logis.

Rujukan teknis implementasi: [Vue](https://vuejs.org/guide/quick-start.html), [Express](https://expressjs.com/en/guide/routing/), [Supabase Auth](https://supabase.com/docs/reference/javascript/auth-getuser), dan [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
=======
# Metopen_Indra
>>>>>>> origin/main
