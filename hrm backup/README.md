# Modul HRM – DICO ERP

Seluruh kode berada di `erp/modules/hrm/`. Tidak ada file di luar folder ini yang diubah.
`manifest.json` dan folder `api/` **tidak disentuh**.

## Cara menghubungkan ke backend

1. Buka `js/hrm-config.js`.
2. Isi endpoint di `C.endpoints` (saat ini semuanya `null`).
3. Jika nama kolom database berbeda, ubah `key` di `js/hrm-schema.js`.
4. Jika request butuh token dari `core/api.js`, isi `C.requestAdapter(spec, payload)`.
5. Set `C.demoAvailable = false` untuk produksi (menyembunyikan tombol data demo).

## Kontrak respons

| Aksi | Method (saran) | Respons yang diterima |
|---|---|---|
| list | GET | `[...]`, `{data:[...]}`, `{data:{items:[...]}}`, atau `{items:[...]}` |
| create / update / remove | POST / PUT / DELETE | `{success:true}`; gagal: `{success:false, message:"..."}` atau HTTP ≥ 400 |
| updateStatus (cuti) | POST | body `{id, status}`; `status` mengikuti `C.leaveStatusValues` |

Placeholder `{id}` pada `url` diganti otomatis. Payload GET dikirim sebagai query string, selain itu JSON body.

## Field yang dipakai (dari `hrm-schema.js`)

- **employees**: `id, nik, name, department, position, status` + (asumsi) `email, phone, join_date`
- **leaves**: `id, employee_name, leave_type, start_date, end_date, reason, status` + (asumsi) `created_at`
- **events**: `id, title, date, time, location, category, status, description`
- **registrations**: `id, participant_name, email, event_id, event_name, registered_at, status`

Field berlabel "asumsi" tidak ada di template awal; hapus dari skema jika tidak ada di database.

## Rute

`#hrm`, `#hrm/dashboard`, `#hrm/employees`, `#hrm/leaves`, `#hrm/events`, `#hrm/registrations`,
alias `#hrm/event`, `#hrm/registration`, `#hrm/registrasi`, dan `#dashboard`
(matikan lewat `HRM_REGISTER_DASHBOARD_ALIAS = false` di `hrm.js` jika bentrok dengan modul Dashboard utama).

## Catatan

- Pagination, pencarian, dan filter berjalan di sisi klien dari hasil `list`. Untuk data sangat besar, tambahkan paginasi di server.
- Mode data demo hanya di memori browser (`sessionStorage` hanya menyimpan status on/off) dan selalu diberi banner.
