# Ruang lingkup implementasi awal

Permintaan pengguna adalah membuat frontend Vue.js dan backend Node.js, menyiapkan Supabase, dan menunda script automation. Dokumen dibaca sebagai sumber kebutuhan; petunjuk penulisan template proposal bukan perintah pengerjaan aplikasi.

| Sumber | Ketentuan | Implementasi |
| --- | --- | --- |
| Proposal I.4 | Hanya dine-in dan take-away | Dua tipe checkout; meja wajib untuk dine-in |
| Proposal I.4 | Stok dicatat manual tanpa resep | Modul persediaan terpisah; pesanan tidak mengubah stok |
| Proposal I.4 dan permintaan terbaru | E2E Playwright bagian penelitian; saat ini ditunda | Tidak ada dependensi, file, atau script automation Playwright |
| Draft halaman 1–3 | Tiga pengguna; pelanggan tanpa akun | Guest checkout; owner dan kasir login |
| Draft halaman 3 | Katalog kategori, foto, harga, kalori, label | Kategori dasar, data menu, favorit/pedas/habis; kalori nullable |
| Draft halaman 3–4 dan 11 | QRIS statis dan transfer, verifikasi manual | Dua pilihan pembayaran; konfirmasi hanya melalui backend staf |
| Draft halaman 4–5 | Status manual tanpa real-time | Tombol pembaruan pelanggan; tautan privat atau kode + WA |
| Draft halaman 5 | Tentang Kami teks; kontak, peta, WA, sosial | Cerita bersumber wawancara; data kontak yang belum tersedia tetap kosong |
| Draft halaman 6 | Hak owner dan kasir | UI serta endpoint membatasi CRUD master/laporan untuk owner |
| Draft halaman 7–8 | Pesanan, catatan, riwayat, cetak struk | Daftar dan detail, status berurutan, filter tanggal selesai, print browser |
| Draft halaman 8 | Laporan dari Selesai + Lunas | Omzet dan grafik, jam ramai, peringkat menu dari data valid |
| Draft halaman 9–10 | Stock manual, minimum, audit | Tambah/kurangi/set; log nama bahan, satuan, before/after, delta, alasan, staf, waktu |
| Draft halaman 11–12 | Tanpa delivery, gateway, realtime, auto WA, pencarian lanjutan, galeri, input kasir | Fitur tersebut tidak ditambahkan |
| Wawancara B | Berdiri 18 Agustus 2026; Sen–Jum 08.30–16.00 | Cerita serta jam operasional, indikator waktu WIB |

Keputusan ketika dokumen berbeda:

1. Pembayaran mengikuti uraian fitur dan batasan utama draft: QRIS dan transfer. Wawancara menyebut cash; draft skenario nomor 2 menyebut bayar di tempat, tetapi rincian fitur dan batasan tidak memasukkannya.
2. Tabel menu, harga, kalori, foto, dan bahan asli tidak dilampirkan. Seed diberi status data contoh, dengan penjelasan terlihat pada mode demo.
3. Alamat, Maps, nomor WhatsApp, Instagram, rekening dan QRIS tidak diisi dengan data rekaan. Pengelola melengkapinya lewat environment backend.
4. Jam operasional hanya informasi. Tidak ada aturan penolakan pesanan di luar jam buka dalam rancangan, sehingga tidak ditambahkan pembatasan otomatis.
5. Supabase belum diprovisikan, sesuai jawaban pengguna “Siapkan integrasinya dulu; proyek Supabase menyusul”. Mode demo lokal untuk peninjauan; adapter Supabase memakai tabel/RPC yang disediakan.
6. Pemeriksaan saat pembangunan bersifat verifikasi teknis langsung, bukan implementasi paket automation penelitian. Pengujian performa dan keamanan formal tidak dikerjakan.

Sumber lokal: `PROPOSAL TUGAS AKHIR - 2.docx`, `Transkrip Hasil Wawancara Owner.pdf` (4 halaman), dan `Draft Rancangan Pembuatan Web Cafe_Indra_Metopen.pdf` (12 halaman), semuanya berada di folder induk proyek. Dokumen asli tidak diubah.
