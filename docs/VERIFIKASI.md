# Pemeriksaan implementasi awal

Pemeriksaan pada 30 Oktober 2026 dilakukan langsung selama pembangunan. Ini bukan paket automation E2E penelitian. Tidak ada file pengujian, dependensi Playwright, atau script automation yang ditambahkan ke aplikasi.

| Pemeriksaan | Hasil |
| --- | --- |
| Build Vue/Vite | Berhasil |
| Pemeriksaan sintaks modul backend | Berhasil |
| HTTP frontend dan health API | Merespons 200; mode demo |
| Login benar/salah dan logout | Login salah ditolak; sesi logout tidak dapat dipakai lagi |
| Hak owner/kasir pada API | Kasir ditolak dari laporan dan CRUD master; endpoint staf menolak tanpa sesi |
| Checkout dine-in, catatan, total dari database | Tersimpan Diterima + Belum Dibayar; manipulasi harga/total klien diabaikan |
| Retry checkout dengan kunci sama | Menghasilkan pesanan yang sama |
| Menu habis dan tipe delivery | Ditolak |
| Pelacakan privat dan lookup nomor + WhatsApp | Token/nomor salah ditolak; data sesuai dapat dibaca |
| Verifikasi pembayaran dan status pesanan | Status tidak dapat diproses sebelum lunas, tidak dapat dilompati; versi lama ditolak |
| Laporan penjualan | Pesanan Selesai + Lunas masuk omzet dan menu terlaris |
| Persediaan terpisah | Checkout tidak mengubah stok bahan baku |
| Update stok manual dan audit | Catatan stok awal/perubahan tersimpan; stok negatif ditolak tanpa log tambahan |
| Penghapusan bahan | Daftar berubah; riwayat tetap tersimpan |
| SQL schema + seed di PostgreSQL sementara (PGlite) | Dieksekusi tanpa kesalahan; seed dapat diulang tanpa menggandakan data |
| SQL hak anon/authenticated | Tabel privat dan RPC ditolak |
| SQL transaksi order | Total, idempotensi, menu habis, urutan status, konflik versi, dan completed_at sesuai |
| SQL transaksi bahan | Tambah bahan hanya owner; perubahan oleh kasir membuat audit; stok negatif rollback |

Pemeriksaan dilakukan pada data sementara terpisah dari `.data/demo.json`. Data demo yang diserahkan tetap tanpa pesanan buatan.

Keterbatasan verifikasi: browser/Computer Use pada sesi pengerjaan tidak tersedia, sehingga tampilan aktual desktop/ponsel, unduh QR, dan dialog cetak belum diverifikasi secara visual. Responsif dan gaya cetak sudah diimplementasikan. Supabase cloud dan login Supabase nyata belum diuji karena proyek/kredensial akan disambungkan kemudian; validasi SQL dilakukan di PostgreSQL sementara, bukan pada proyek cloud. Pengujian performa dan keamanan formal tidak termasuk tahap ini.
