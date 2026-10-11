SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- =========================================================================
-- DICO COMMUNITY ERP - MODULAR DATABASE SCHEMA v2.0
-- =========================================================================

-- Hapus tabel lama jika ada
DROP TABLE IF EXISTS `audit_logs`, `event_registrations`, `workshops`, `workshop_categories`, `fin_journal_entries`, `fin_transactions`, `fin_chart_of_accounts`, `crm_interactions`, `crm_customers`, `hrm_leaves`, `hrm_employees`, `users`, `roles`;

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

-- User Demo (Password semua: admin123 = $2y$10$gbsrsc4UrVEjAIQ5y55./e7RfcUpMOo.trEft05JNIRVaDHiYmFeC)
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
-- MODUL CRM (Customer Relationship Management & User Portal Public)
-- =========================================================================

CREATE TABLE `crm_customers` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `nama` VARCHAR(150) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `no_hp` VARCHAR(30) NOT NULL,
  `instansi` VARCHAR(150) DEFAULT NULL,
  `minat_produk` VARCHAR(255) DEFAULT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `foto_profil` VARCHAR(255) DEFAULT NULL,
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
