<?php
/**
 * DELETE /api/delete_employee.php?id=N   (atau body JSON {"id": N}; POST diterima sebagai alias)
 *
 * Menghapus satu karyawan. Penghapusan TIDAK bisa dibatalkan.
 * Catatan data: pengajuan cuti (mock) hanya menyimpan NAMA karyawan, bukan referensi id, jadi
 * penghapusan di sini tidak mengubah data cuti. Atur perilaku ini saat skema MySQL dirancang
 * (mis. foreign key / soft delete).
 *
 * Penyimpanan SAAT INI : file JSON sementara (mock). Penghapusan TIDAK permanen/terpusat dan bukan di MySQL.
 * TAHAP B : DELETE FROM hrm_employees WHERE id = ? (prepared statement); rowCount 0 -> HTTP 404;
 *           pertimbangkan soft delete bila tabel lain mereferensikan karyawan.
 *
 * Respons: 200 data = {id, nik, name} | 400 id tidak valid | 404 id tidak ada
 */
require __DIR__ . '/db.php';

hrm_require_method(array('DELETE', 'POST'));
hrm_guard_data_mode();

if (isset($_GET['id'])) {
    $id = hrm_id($_GET['id']);
} else {
    $in = hrm_json_body();
    $id = hrm_id(isset($in['id']) ? $in['id'] : null);
}
if ($id === null) {
    hrm_validation_fail(400, array('id' => 'ID karyawan wajib berupa bilangan bulat positif.'));
}

$removed = HrmMockStore::transact('employees', function (array &$doc) use ($id) {
    foreach ($doc['rows'] as $i => $r) {
        if ((int) $r['id'] === $id) {
            array_splice($doc['rows'], $i, 1);
            return array('id' => (int) $r['id'], 'nik' => $r['nik'], 'name' => $r['name']);
        }
    }
    throw new HrmApiException(404, 'Karyawan dengan ID tersebut tidak ditemukan.');
});

hrm_ok('Karyawan dihapus dari penyimpanan sementara (mock). Perubahan belum permanen dan tidak terjadi di MySQL.', $removed);
