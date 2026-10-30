# API Taman Teras Cafe

Base URL pengembangan: `http://127.0.0.1:3001/api`. Browser memakai `/api` di origin frontend. Semua payload dan respons berupa JSON. Kesalahan berbentuk `{ "message": "..." }`, dengan status 400/401/403/404/409/429/503 sesuai kasus. Session cookie `teras_session` adalah HttpOnly, SameSite Strict, dan Secure pada produksi.

| Metode | Endpoint | Akses | Fungsi |
| --- | --- | --- | --- |
| GET | /health | Publik | Status dan mode penyimpanan |
| GET | /config | Publik | Profil cafe dan instruksi pembayaran nonsecret |
| GET | /menu | Publik | Katalog aktif |
| POST | /orders | Publik, rate limit | Checkout dengan nama, WA, tipe, meja, metode, items, request_key UUID, tracking_token acak 64 hex |
| GET | /orders/:code | Token privat | Header `X-Tracking-Token` wajib |
| POST | /orders/lookup | Publik, rate limit | Body code + whatsapp |
| POST | /auth/login | Publik, rate limit | Email + password, menghasilkan session cookie |
| GET | /auth/me | Staf | Profil/peran aktif |
| POST | /auth/logout | Pemilik cookie | Hapus sesi |
| GET | /admin/orders | Staf | Semua pesanan, tanpa token pelacakan |
| PATCH | /admin/orders/:id | Staf | version + status berikutnya dan/atau payment_status=paid |
| POST | /admin/menu | Owner | Tambah menu |
| PUT | /admin/menu/:id | Owner | Ubah seluruh metadata menu |
| DELETE | /admin/menu/:id | Owner | Hapus logis menu |
| PATCH | /admin/menu/:id/availability | Staf | available boolean |
| GET | /admin/ingredients | Staf | Daftar stok, peringatan di atas |
| POST | /admin/ingredients | Owner | name, unit, stock awal, minimum; membuat log |
| PUT | /admin/ingredients/:id | Owner | name, unit, minimum; jumlah stok tidak dapat diubah dari endpoint ini |
| DELETE | /admin/ingredients/:id | Owner | Hapus logis bahan; audit tetap tersimpan |
| POST | /admin/ingredients/:id/stock | Staf | operation=set/add/subtract, quantity, reason |
| GET | /admin/stock-movements | Staf | Seluruh riwayat perubahan |
| GET | /admin/reports?from=YYYY-MM-DD&to=YYYY-MM-DD | Owner | Agregat penjualan dan data grafik |

Harga/total dari klien diabaikan. Backend mengambil harga dan ketersediaan menu dari database. Setiap item menyertakan `menu_id`, `quantity` 1–50, dan `note` maksimal 200 karakter. Tipe pesanan `dine_in` atau `takeaway`; metode pembayaran `qris` atau `transfer`; status `received`, `processing`, `ready`, `completed`; status pembayaran `unpaid` atau `paid`.

Kasir perlu mengonfirmasi lunas sebelum status pesanan dapat diteruskan. Status tidak dapat dilompati atau dimundurkan. Semua endpoint `/admin` memverifikasi sesi; menyembunyikan tombol di frontend bukan satu-satunya pembatasan akses.
