<?php
/**
 * POST /api/add_employee.php
 *
 * Menambah karyawan baru. Validasi dilakukan di backend; NIK tidak boleh duplikat.
 * Penyimpanan SAAT INI : file JSON sementara (mock). Data TIDAK tersimpan permanen
 *                        dan TIDAK masuk MySQL.
 * Penyimpanan TAHAP B  : INSERT ke hrm_employees (prepared statement) dengan
 *                        UNIQUE index pada kolom NIK; tangkap error duplikat -> HTTP 409.
 *
 * Metode : POST (body JSON)
 * Field  : nik*, name*, position*, email* ; opsional: department, phone, join_date (YYYY-MM-DD),
 *          status (Aktif|Cuti|Nonaktif, bawaan Aktif)
 * Respons: 201 data = karyawan yang dibuat | 400 validasi | 409 NIK duplikat
 */
require __DIR__ . '/db.php';

hrm_require_method(array('POST'));
hrm_guard_data_mode();

$in = hrm_json_body();
$errors = array();
$clean = hrm_employee_clean($in, $errors); // aturan validasi dipakai bersama update_employee.php

if ($errors) {
    hrm_validation_fail(400, $errors);
}

$created = HrmMockStore::transact('employees', function (array &$doc) use ($clean) {
    // Pemeriksaan duplikasi NIK di dalam kunci yang sama dengan penulisan (tanpa celah balapan).
    foreach ($doc['rows'] as $r) {
        if (strcasecmp($r['nik'], $clean['nik']) === 0) {
            throw new HrmApiException(409, 'Validasi gagal: NIK sudah terdaftar.', array('nik' => 'NIK sudah terdaftar.'));
        }
    }
    return HrmMockStore::insert($doc, $clean + array('created_at' => date('Y-m-d H:i:s')));
});

hrm_ok('Karyawan ditambahkan ke penyimpanan sementara (mock). Data belum tersimpan permanen dan tidak masuk MySQL.', $created, 201);
