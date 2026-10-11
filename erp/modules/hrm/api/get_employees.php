<?php
/**
 * GET /api/get_employees.php
 *
 * Mengambil daftar karyawan.
 * Sumber data SAAT INI : penyimpanan sementara (mock) - bukan MySQL.
 * Sumber data TAHAP B  : tabel hrm_employees (ganti HrmMockStore::all('employees')
 *                        dengan SELECT prepared statement sesuai skema yang sudah dibuat).
 *
 * Metode : GET
 * Respons: data = { items: [ {id, nik, name, department, position, email, phone, join_date, status, created_at} ], total }
 */
require __DIR__ . '/db.php';

hrm_require_method(array('GET'));
hrm_guard_data_mode();

$rows = HrmMockStore::all('employees');

usort($rows, function ($a, $b) {
    return strcasecmp($a['name'], $b['name']);
});

hrm_ok(
    $rows ? 'Data karyawan (mock) berhasil diambil.' : 'Belum ada data karyawan (mock).',
    array('items' => array_values($rows), 'total' => count($rows))
);
