# DICO ERP - Modular Architecture Plan

> **Dokumen Planning Rebuild ERP - Sistem Modular Multi-Role**  
> Tanggal: 8 Oktober 2026  
> Tim: DICO Community Development Team

---

## 📋 Ringkasan Eksekutif

Rebuild sistem ERP dari single-tenant event management menjadi **ERP modular multi-role** dengan pemisahan modul HRM, CRM, Finance, dan Event Management. Setiap modul dikerjakan paralel oleh anggota tim berbeda, lalu digabung via ZIP (tanpa Git).

---

## 🏗️ 1. Arsitektur Folder

Struktur baru menggunakan **isolasi per modul** untuk menghindari konflik kode antar anggota tim.

```
C:\xampp\htdocs\DicoERPNew\
├── erp/                          ← FOLDER BARU (Fokus Development)
│   ├── index.html                # Entry point login & dashboard
│   ├── assets/
│   │   ├── css/
│   │   │   └── global.css        # Base styling semua modul
│   │   └── uploads/              # Folder upload gambar/dokumen
│   ├── core/                     # Shared resources (dikerjakan koordinator)
│   │   ├── auth.js               # Session management & login
│   │   ├── router.js             # SPA routing berbasis hash
│   │   ├── nav.js                # Sidebar builder dari manifest modul
│   │   ├── api.js                # Wrapper fetch() standar
│   │   ├── ui.js                 # Modal, toast, icons helper
│   │   └── util.js               # Format date, currency, dll
│   ├── modules/
│   │   ├── dashboard/            # Landing page admin (summary)
│   │   │   └── dashboard.js
│   │   ├── hrm/                  ← ANGGOTA 1
│   │   │   ├── hrm.js
│   │   │   ├── hrm.css
│   │   │   ├── manifest.json
│   │   │   └── api/
│   │   │       ├── get_employees.php
│   │   │       ├── add_employee.php
│   │   │       └── manage_leaves.php
│   │   ├── crm/                  ← ANGGOTA 2
│   │   │   ├── crm.js
│   │   │   ├── crm.css
│   │   │   ├── manifest.json
│   │   │   └── api/
│   │   │       ├── get_customers.php
│   │   │       ├── add_customer.php
│   │   │       └── add_interaction.php
│   │   ├── finance/              ← ANGGOTA 3
│   │   │   ├── finance.js
│   │   │   ├── finance.css
│   │   │   ├── manifest.json
│   │   │   └── api/
│   │   │       ├── get_accounts.php
│   │   │       ├── add_transaction.php
│   │   │       └── journal_report.php
│   │   └── event/                ← ANGGOTA 4 / Koordinator
│   │       ├── event.js
│   │       ├── event.css
│   │       ├── manifest.json
│   │       └── api/
│   │           ├── get_events.php
│   │           ├── add_event.php
│   │           └── registrations.php
│   └── api/
│       └── auth.php              # Global login/logout endpoint
├── backup/                       ← Data lama dipindah ke sini
│   ├── admin/
│   ├── user/
│   ├── web/
│   └── database/
│       └── dico_community_old.sql
└── config/
    └── database.php              # Koneksi DB (tetap dipertahankan)
```

---

## 🔐 2. Role Based Access Control (RBAC)

Sistem menggunakan **5 role** dengan hak akses berbeda per modul.

### Tabel Role

| ID  | Role          | Deskripsi                                     |
|-----|---------------|-----------------------------------------------|
| 1   | Superadmin    | Akses penuh semua modul (CRUD)                |
| 2   | Finance       | Kelola keuangan & jurnal                      |
| 3   | HRM           | Kelola karyawan, cuti, attendance             |
| 4   | CRM           | Kelola customer, leads, interaksi             |
| 5   | Event Manager | Kelola workshop & registrasi peserta          |

### Matriks Hak Akses

| Role          | Dashboard | HRM     | CRM     | Finance | Event   |
|---------------|-----------|---------|---------|---------|---------|
| Superadmin    | ✅ Full   | ✅ Full | ✅ Full | ✅ Full | ✅ Full | (gua)
| Finance       | ✅ Full   | ❌ None | ❌ None | ✅ Full | 👁️ View | (jara)
| HRM           | ✅ Full   | ✅ Full | ❌ None | ❌ None | 👁️ View | (davina)
| CRM           | ✅ Full   | ❌ None | ✅ Full | ❌ None | 👁️ View | (akbar)
| Event Manager | ✅ Full   | ❌ None | 👁️ View | ❌ None | ✅ Full | (gua)

**Pengecekan:**
1. **Frontend**: `core/nav.js` hanya render sidebar sesuai role user.
2. **Backend**: Setiap endpoint PHP cek session `$_SESSION['role_id']`, tolak request jika tidak sesuai.

---

## 📝 3. Konvensi Wajib Tim

Agar integrasi ZIP berjalan mulus, **semua anggota wajib ikuti konvensi ini**.

### A. Struktur Folder Modul

Setiap modul harus punya struktur minimal:

```
/modules/[nama_modul]/
├── [nama_modul].js       # Logic utama (page render, event handler)
├── [nama_modul].css      # Styling spesifik modul
├── manifest.json         # Config sidebar & routing
└── api/                  # Endpoint PHP modul ini
    ├── get_*.php
    ├── add_*.php
    └── update_*.php
```

### B. Format `manifest.json`

File ini dibaca oleh `core/nav.js` untuk auto-generate sidebar.

**Contoh: `/modules/hrm/manifest.json`**
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

**Field Wajib:**
- `id`: Unique identifier modul (lowercase, no space)
- `name`: Nama tampilan di sidebar
- `icon`: Icon key (gunakan icon dari `core/ui.js`)
- `allowed_roles`: Array role yang boleh akses modul
- `menu`: Sub-menu modul (array route)

### C. Standar Response API (PHP)

Semua endpoint PHP harus return JSON dengan format seragam.

**✅ Sukses:**
```json
{
  "success": true,
  "message": "Data karyawan berhasil ditambahkan",
  "data": {
    "id": 15,
    "nama": "Budi Santoso",
    "nik": "EMP2026001"
  }
}
```

**❌ Error:**
```json
{
  "success": false,
  "message": "Email sudah terdaftar di sistem",
  "error_code": "DUPLICATE_ENTRY"
}
```

### D. Naming Convention

| Item            | Format                  | Contoh                          |
|-----------------|-------------------------|---------------------------------|
| File JS         | lowercase.js            | `hrm.js`, `crm.js`              |
| File PHP        | snake_case.php          | `get_employees.php`             |
| Function JS     | camelCase               | `pageHrmEmployees()`, `addLeave()` |
| CSS Class       | prefix-module           | `.hrm-table`, `.crm-card`       |
| Tabel Database  | prefix_module           | `hrm_employees`, `crm_customers` |

---

## 🗄️ 4. Skema Database Final

### Setup Database

**Langkah:**
1. Backup database lama via phpMyAdmin: Export → `backup/dico_community_old.sql`
2. Drop & Create database baru:
   ```sql
   DROP DATABASE IF EXISTS `dico_community`;
   CREATE DATABASE `dico_community` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
   USE `dico_community`;
   ```
3. Copy-paste SQL di bawah ke phpMyAdmin → Execute

### SQL Schema Lengkap

```sql
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- =========================================================================
-- CORE TABLES (Authentication & RBAC)
-- =========================================================================

CREATE TABLE `roles` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `nama_role` VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `roles` (`id`, `nama_role`) VALUES
(1, 'Superadmin'),
(2, 'Finance'),
(3, 'HRM'),
(4, 'CRM'),
(5, 'Event Manager');

CREATE TABLE `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `role_id` INT UNSIGNED NOT NULL,
  `nama` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `status` ENUM('aktif', 'nonaktif') DEFAULT 'aktif',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User Demo (Password semua: admin123)
INSERT INTO `users` (`id`, `role_id`, `nama`, `email`, `password_hash`, `status`) VALUES
(1, 1, 'Super Admin', 'admin@dico.local', '$2y$10$gbsrsc4UrVEjAIQ5y55./e7RfcUpMOo.trEft05JNIRVaDHiYmFeC', 'aktif'),
(2, 2, 'Finance Staff', 'finance@dico.local', '$2y$10$gbsrsc4UrVEjAIQ5y55./e7RfcUpMOo.trEft05JNIRVaDHiYmFeC', 'aktif'),
(3, 3, 'HRM Staff', 'hrm@dico.local', '$2y$10$gbsrsc4UrVEjAIQ5y55./e7RfcUpMOo.trEft05JNIRVaDHiYmFeC', 'aktif'),
(4, 4, 'CRM Staff', 'crm@dico.local', '$2y$10$gbsrsc4UrVEjAIQ5y55./e7RfcUpMOo.trEft05JNIRVaDHiYmFeC', 'aktif'),
(5, 5, 'Event Manager', 'event@dico.local', '$2y$10$gbsrsc4UrVEjAIQ5y55./e7RfcUpMOo.trEft05JNIRVaDHiYmFeC', 'aktif');

-- =========================================================================
-- MODUL HRM (Human Resource Management)
-- =========================================================================

CREATE TABLE `hrm_employees` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NULL UNIQUE,
  `nik` VARCHAR(50) NOT NULL UNIQUE,
  `nama_lengkap` VARCHAR(150) NOT NULL,
  `departemen` VARCHAR(50) NOT NULL,
  `jabatan` VARCHAR(100) NOT NULL,
  `tgl_bergabung` DATE NOT NULL,
  `gaji_pokok` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('kontrak', 'tetap', 'magang') DEFAULT 'kontrak',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `hrm_leaves` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT UNSIGNED NOT NULL,
  `tipe_cuti` ENUM('tahunan', 'sakit', 'izin') NOT NULL,
  `tgl_mulai` DATE NOT NULL,
  `tgl_selesai` DATE NOT NULL,
  `alasan` TEXT,
  `status` ENUM('menunggu', 'disetujui', 'ditolak') DEFAULT 'menunggu',
  `disetujui_oleh` INT UNSIGNED NULL,
  FOREIGN KEY (`employee_id`) REFERENCES `hrm_employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`disetujui_oleh`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================================
-- MODUL CRM (Customer Relationship Management)
-- =========================================================================

CREATE TABLE `crm_customers` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `nama` VARCHAR(150) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `no_hp` VARCHAR(30) NULL,
  `instansi` VARCHAR(150) NULL,
  `tipe` ENUM('lead', 'client', 'partner', 'alumni') DEFAULT 'lead',
  `status_prospek` ENUM('cold', 'warm', 'hot', 'deal', 'lost') DEFAULT 'cold',
  `sales_pic_id` INT UNSIGNED NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`sales_pic_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `crm_interactions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `tipe_kontak` ENUM('call', 'email', 'meeting', 'whatsapp') NOT NULL,
  `catatan` TEXT NOT NULL,
  `tgl_interaksi` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `crm_customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================================
-- MODUL FINANCE (Accounting & Financial Management)
-- =========================================================================

CREATE TABLE `fin_chart_of_accounts` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `kode_akun` VARCHAR(20) NOT NULL UNIQUE,
  `nama_akun` VARCHAR(100) NOT NULL,
  `tipe` ENUM('aset', 'liabilitas', 'ekuitas', 'pendapatan', 'beban') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Data Akun Standar
INSERT INTO `fin_chart_of_accounts` (`id`, `kode_akun`, `nama_akun`, `tipe`) VALUES
(1, '101', 'Kas Operasional', 'aset'),
(2, '102', 'Bank BCA', 'aset'),
(3, '401', 'Pendapatan Event/Workshop', 'pendapatan'),
(4, '501', 'Beban Gaji Karyawan', 'beban'),
(5, '502', 'Beban Operasional', 'beban');

CREATE TABLE `fin_transactions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `kode_transaksi` VARCHAR(50) NOT NULL UNIQUE,
  `tgl_transaksi` DATE NOT NULL,
  `deskripsi` TEXT NOT NULL,
  `sumber_modul` ENUM('manual', 'event', 'hrm_payroll', 'crm_invoice') DEFAULT 'manual',
  `referensi_id` INT UNSIGNED NULL,
  `created_by` INT UNSIGNED NOT NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `fin_journal_entries` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `transaction_id` INT UNSIGNED NOT NULL,
  `account_id` INT UNSIGNED NOT NULL,
  `tipe` ENUM('debit', 'kredit') NOT NULL,
  `nominal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  FOREIGN KEY (`transaction_id`) REFERENCES `fin_transactions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`account_id`) REFERENCES `fin_chart_of_accounts`(`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================================
-- MODUL EVENT (Workshop & Registration Management)
-- =========================================================================

CREATE TABLE `workshop_categories` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `nama_kategori` VARCHAR(100) NOT NULL UNIQUE,
  `icon_key` VARCHAR(50) DEFAULT 'calendar',
  `color` VARCHAR(20) DEFAULT '#2F8FFF'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `workshop_categories` (`id`, `nama_kategori`, `icon_key`, `color`) VALUES
(1, 'AI & Technology', 'cpu', '#2F8FFF'),
(2, 'Web Development', 'code', '#16CFEE'),
(3, 'UI/UX Design', 'pen', '#D34358'),
(4, 'Digital Marketing', 'brief', '#7c5cf0'),
(5, 'Business & Marketing', 'brief', '#F59E0B'),
(6, 'Career & Development', 'trend', '#10B981');

CREATE TABLE `workshops` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT UNSIGNED NOT NULL,
  `created_by` INT UNSIGNED NOT NULL,
  `judul` VARCHAR(200) NOT NULL,
  `pendiri_event` VARCHAR(150) NULL,
  `deskripsi` TEXT DEFAULT NULL,
  `pembawa_materi` VARCHAR(255) NULL,
  `tipe_event` ENUM('workshop','seminar','webinar') NOT NULL DEFAULT 'workshop',
  `gambar_url` VARCHAR(255) DEFAULT NULL,
  `lokasi` VARCHAR(200) DEFAULT NULL,
  `tgl_mulai` DATETIME NOT NULL,
  `tgl_selesai` DATETIME NOT NULL,
  `kapasitas` INT UNSIGNED NOT NULL DEFAULT 100,
  `harga` DECIMAL(12,2) DEFAULT 0.00,
  `status` ENUM('draft','aktif','berlangsung','selesai') NOT NULL DEFAULT 'draft',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `workshop_categories`(`id`) ON UPDATE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `event_registrations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `workshop_id` INT UNSIGNED NOT NULL,
  `customer_id` INT UNSIGNED NULL,
  `nama_peserta` VARCHAR(150) NOT NULL,
  `email_peserta` VARCHAR(150) NOT NULL,
  `no_hp` VARCHAR(30) NULL,
  `status_pembayaran` ENUM('menunggu', 'berhasil', 'batal') DEFAULT 'menunggu',
  `total_bayar` DECIMAL(12,2) DEFAULT 0.00,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`workshop_id`) REFERENCES `workshops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`customer_id`) REFERENCES `crm_customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

COMMIT;
```

---

## 🔄 5. Workflow Kolaborasi (ZIP-Based)

Karena tidak semua anggota punya GitHub, kolaborasi menggunakan **pertukaran ZIP file**.

### Tahap 1: Setup Base (Koordinator)

1. **Build Core System**
   - Buat folder `/erp/core/` dengan file: `auth.js`, `router.js`, `nav.js`, `api.js`, `ui.js`, `util.js`
   - Buat `index.html` dengan layout login & dashboard
   - Buat `/erp/api/auth.php` untuk login/logout
   - Test: Login berhasil, sidebar muncul sesuai role

2. **Buat Template Modul (Contoh: Dashboard)**
   - Folder `/erp/modules/dashboard/`
   - File `dashboard.js`, `manifest.json`
   - Render summary card sederhana (Total Event, Total Karyawan, dll)

3. **Package Base ERP**
   - ZIP folder `/erp/` → `Base_ERP_v1.0.zip`
   - Bagikan ke semua anggota via Google Drive / WhatsApp

### Tahap 2: Development Paralel (Anggota Tim)

**Anggota 1 (HRM):**
- Extract `Base_ERP_v1.0.zip`
- Kerjakan folder `/modules/hrm/` dan `/api/hrm/`
- Fitur minimal:
  - CRUD Karyawan (`hrm_employees`)
  - List & Approval Cuti (`hrm_leaves`)
- Test di localhost sendiri
- ZIP folder `hrm/` → kirim ke koordinator

**Anggota 2 (CRM):**
- Extract base → kerjakan `/modules/crm/` dan `/api/crm/`
- Fitur minimal:
  - CRUD Customer (`crm_customers`)
  - Log Interaksi (`crm_interactions`)
- ZIP folder `crm/` → kirim ke koordinator

**Anggota 3 (Finance):**
- Extract base → kerjakan `/modules/finance/` dan `/api/finance/`
- Fitur minimal:
  - CRUD Chart of Accounts
  - Input Transaksi Manual
  - View Laporan Jurnal
- ZIP folder `finance/` → kirim ke koordinator

**Anggota 4 (Event):**
- Extract base → kerjakan `/modules/event/` dan `/api/event/`
- Fitur minimal:
  - CRUD Workshop
  - List Registrasi Peserta
  - Integrasi otomatis ke Finance (auto-posting transaksi)
- ZIP folder `event/` → kirim ke koordinator

### Tahap 3: Integrasi (Koordinator)

1. **Terima ZIP dari anggota**
   - `hrm.zip`, `crm.zip`, `finance.zip`, `event.zip`

2. **Copy-Paste ke Base**
   ```
   Extract hrm.zip → copy isi ke /erp/modules/hrm/
   Extract crm.zip → copy isi ke /erp/modules/crm/
   Extract finance.zip → copy isi ke /erp/modules/finance/
   Extract event.zip → copy isi ke /erp/modules/event/
   ```

3. **Test Integrasi**
   - Login dengan user berbeda role (admin, finance, hrm, crm, event)
   - Pastikan sidebar muncul sesuai RBAC
   - Cek tidak ada error console / network

4. **Final Packaging**
   - ZIP lengkap → `DICO_ERP_Final_v1.0.zip`
   - Deploy ke server

---

## 📊 6. Scope MVP Per Modul

Untuk mengejar deadline, **fokus fitur minimum dulu**. Enhancement dilakukan setelah integrasi sukses.

### Dashboard (Koordinator)
- ✅ Summary cards: Total Event Aktif, Total Karyawan, Saldo Kas, Total Customer
- ✅ Grafik sederhana (bar chart: Pendapatan per bulan)
- ⏸️ Real-time notification (opsional)

### HRM (Anggota 1)
- ✅ CRUD Karyawan (NIK, Nama, Departemen, Jabatan, Gaji)
- ✅ Pengajuan Cuti (Request → Approval by HRM/Superadmin)
- ⏸️ Attendance log (opsional)
- ⏸️ Payroll otomatis (opsional)

### CRM (Anggota 2)
- ✅ CRUD Customer/Lead (Nama, Email, HP, Tipe, Status Prospek)
- ✅ Log Interaksi (Call, Email, Meeting, Catatan)
- ⏸️ Pipeline/Deals tracking (opsional)
- ⏸️ Auto-email blast (opsional)

### Finance (Anggota 3)
- ✅ CRUD Chart of Accounts (Kode Akun, Nama, Tipe)
- ✅ Input Transaksi Manual (Debit/Kredit, pilih akun)
- ✅ Laporan Jurnal (List semua entry)
- ⏸️ Neraca & Laba Rugi (opsional)
- ⏸️ Budget vs Actual (opsional)

### Event (Anggota 4 / Koordinator)
- ✅ CRUD Workshop (Judul, Tanggal, Lokasi, Harga, Status)
- ✅ List Registrasi Peserta (dari form web teman)
- ✅ Auto-posting ke Finance saat registrasi berhasil
- ⏸️ Generate sertifikat otomatis (opsional)

---

## 🔗 7. Integrasi dengan Web Frontend (Tim Teman)

Web landing page (buatan tim teman) akan kirim data registrasi event ke ERP.

### Endpoint Publik

**File**: `/erp/api/public_registration.php`

**Request:**
```
POST /erp/api/public_registration.php
Content-Type: application/x-www-form-urlencoded

workshop_id=1
nama=Budi Santoso
email=budi@mail.com
no_hp=081234567890
total_bayar=75000
api_key=RAHASIA_DICO_2026
```

**Response Sukses:**
```json
{
  "success": true,
  "message": "Registrasi berhasil",
  "registration_id": 42,
  "kode_tiket": "TKT-20261008-042"
}
```

**Logika Internal:**
1. Validasi `api_key` (prevent spam)
2. Insert ke `event_registrations`
3. Cek apakah email sudah ada di `crm_customers`, jika belum insert baru
4. Auto-posting ke `fin_transactions` + `fin_journal_entries`:
   - Debit: Kas (101) = `total_bayar`
   - Kredit: Pendapatan Event (401) = `total_bayar`

---

## ✅ 8. Checklist Pre-Implementation

Sebelum mulai coding, pastikan:

- [✅] Semua anggota sudah baca dokumen ini
- [ ] Database `dico_community` sudah di-drop dan dibuat ulang
- [ ] SQL schema sudah dijalankan di phpMyAdmin
- [ ] User demo bisa login (test: `admin@dico.local` / `admin123`)
- [ ] XAMPP Apache & MySQL sudah running
- [ ] Folder `/erp/` sudah dibuat di `C:\xampp\htdocs\DicoERPNew\`
- [ ] Setiap anggota sudah tau modul mana yang dikerjakan
- [ ] Koordinator sudah siapkan Base ERP (core + login + dashboard sederhana)

---

## 📞 9. Kontak & Koordinasi

**Koordinator**: [BgusPutra]  
**Modul Assignment**:
- HRM: [Nama Anggota 1]
- CRM: [Nama Anggota 2]
- Finance: [Nama Anggota 3]
- Event: [Nama Anggota 4 / Koordinator]

**Deadline**:
- Base ERP: [Tanggal]
- Development Modul: [Tanggal]
- Integrasi & Testing: [Tanggal]
- Presentasi: [Tanggal]

---

## 📚 10. Referensi Teknis

**Password Hashing (PHP)**:
```php
// Generate hash baru
$hash = password_hash('admin123', PASSWORD_BCRYPT);

// Verifikasi password
if (password_verify($input, $hash_dari_db)) {
    // Login sukses
}
```

**Session Management**:
```php
session_start();
$_SESSION['user_id'] = $user['id'];
$_SESSION['role_id'] = $user['role_id'];
$_SESSION['nama'] = $user['nama'];
```

**CORS Header (untuk endpoint publik)**:
```php
header('Access-Control-Allow-Origin: https://domain-teman.com');
header('Content-Type: application/json');
```

---

**Dokumen ini adalah panduan lengkap rebuild ERP. Simpan dan bagikan ke seluruh tim sebelum mulai development.**

---

*Generated: 8 Oktober 2026*  
*Last Update: -/-*
