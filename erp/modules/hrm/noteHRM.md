# PANDUAN REVISI MODUL HRM - DICO ERP

Halo! Hasil pengerjaan modul HRM sudah kami cek. Tampilannya sudah bagus dan rapi, namun **arsitektur teknisnya perlu disesuaikan** agar bisa terintegrasi dengan sistem ERP utama.

Sistem DICO ERP menggunakan arsitektur **Single Page Application (SPA)** modular. Artinya, sistem utama hanya memiliki satu file `index.html`, dan setiap modul tidak boleh berjalan sendiri dengan `index.php` atau file `pages/*.php`.

Berikut langkah-langkah yang perlu kamu sesuaikan:

---

## 1. File & Folder yang Harus Dihapus
Hapus file-file berikut karena tidak digunakan dalam sistem SPA modular:
- ❌ `index.php`
- ❌ Folder `pages/` beserta isinya (`dashboard.php`, `karyawan.php`, `cuti.php`, `event.php`, `registrasi.php`)
- ❌ `README.txt` (bila sudah tidak diperlukan)

---

## 2. Pindahkan Tampilan HTML ke dalam `hrm.js`
Semua struktur tampilan HTML yang sebelumnya kamu tulis di file `.php` dipindahkan ke dalam file **`hrm.js`** menjadi fungsi JavaScript dengan format *template literals* (menggunakan tanda backtick `` ` ``).

### Contoh Template `hrm.js`:

```javascript
/* ============================================================
   DICO ERP - HRM Module
   ============================================================ */

// 1. Daftarkan rute halaman ke Router ERP
registerRoute('#hrm/employees', pageHrmEmployees);
registerRoute('#hrm/leaves', pageHrmLeaves);

// 2. Fungsi render halaman Data Karyawan (pindahan dari karyawan.php)
function pageHrmEmployees() {
  return `
    <div class="flex-between mb-lg">
      <div>
        <h1>Data Karyawan</h1>
        <p class="text-muted">Kelola semua data karyawan DICO Community</p>
      </div>
      <button class="btn btn-primary" onclick="openAddEmployeeModal()">
        ${icon('plus')} Tambah Karyawan
      </button>
    </div>
    
    <div class="card">
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>NIK</th>
              <th>Nama Lengkap</th>
              <th>Departemen</th>
              <th>Jabatan</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody id="hrmEmployeesTableBody">
            <!-- Data tabel karyawan bisa dimasukkan ke sini -->
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 3. Fungsi render halaman Pengajuan Cuti (pindahan dari cuti.php)
function pageHrmLeaves() {
  return `
    <div class="flex-between mb-lg">
      <div>
        <h1>Pengajuan Cuti</h1>
        <p class="text-muted">Kelola pengajuan dan approval cuti karyawan</p>
      </div>
    </div>
    
    <div class="card">
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Karyawan</th>
              <th>Tipe Cuti</th>
              <th>Tanggal</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody id="hrmLeavesTableBody">
            <!-- Data tabel cuti dimasukkan ke sini -->
          </tbody>
        </table>
      </div>
    </div>
  `;
}
```

---

## 3. Konfigurasi Menu Sidebar (`manifest.json`)
File `manifest.json` dibaca secara otomatis oleh sidebar sistem ERP untuk menentukan hak akses dan menu yang muncul:

```json
{
  "id": "hrm",
  "name": "HRM",
  "icon": "users",
  "route": "#hrm",
  "allowed_roles": ["Superadmin", "HRM"],
  "menu": [
    { "label": "Data Karyawan", "route": "#hrm/employees" },
    { "label": "Pengajuan Cuti", "route": "#hrm/leaves" }
  ]
}
```

---

## 4. Backend & Database Query (Folder `api/`)
Kode PHP murni hanya digunakan untuk menangani query database (CRUD) dan mengembalikan respon berupa format JSON (bukan HTML).

Letakkan file-file ini di dalam folder **`api/`**:
- `api/get_employees.php` — Mengambil data dari tabel database `hrm_employees`
- `api/add_employee.php` — Menyimpan data karyawan baru
- `api/manage_leaves.php` — Mengambil dan memperbarui status cuti di tabel `hrm_leaves`

### Standar Format Respon API (Wajib):

**Jika Berhasil:**
```json
{
  "success": true,
  "message": "Data berhasil disimpan",
  "data": { ... }
}
```

**Jika Gagal:**
```json
{
  "success": false,
  "message": "Validasi gagal: NIK sudah terdaftar"
}
```

---

## 5. CSS / Styling
- Letakkan styling khusus HRM di file **`hrm.css`**.
- Gunakan class ber-prefix `.hrm-*` agar styling tidak bertabrakan dengan modul lain.
- Gunakan class bawaan dari sistem (`global.css`):
  - Tombol: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`
  - Kontainer: `.card`
  - Tabel: `.table`, `.table-wrapper`
  - Status: `.badge`, `.badge-success`, `.badge-warning`, `.badge-error`

---

## 6. Struktur Akhir Modul HRM yang Diharapkan
Saat kamu selesai dan mengirimkan modul HRM kembali, susunan foldernya cukup seperti ini:

```text
hrm/
├── manifest.json
├── hrm.js
├── hrm.css
├── noteHRM.md
└── api/
    ├── get_employees.php
    ├── add_employee.php
    └── manage_leaves.php
```

Dengan struktur di atas, modulmu akan langsung otomatis tampil dan berjalan di sistem ERP saat user login sebagai **HRM Staff** (`hrm@dico.local`) maupun **Superadmin** (`admin@dico.local`).

Terima kasih atas kerja samanya!
