<?php
/**
 * /api/manage_leaves.php
 *
 * GET   : daftar pengajuan cuti (opsional ?status=Pending|Approved|Rejected).
 * PATCH / PUT / POST : ubah status satu pengajuan. Body JSON: { "id": 1, "status": "Approved" }
 *                      (POST disediakan sebagai alias untuk klien/hosting yang memblokir PATCH/PUT).
 *
 * Status kanonik: Pending, Approved, Rejected. Alias Indonesia diterima:
 *   menunggu -> Pending, disetujui -> Approved, ditolak -> Rejected.
 * Tidak ada aturan transisi status tambahan (belum ada aturan cuti yang ditetapkan).
 *
 * Sumber/penyimpanan SAAT INI : file JSON sementara (mock), bukan MySQL.
 * TAHAP B : tabel hrm_leaves -> SELECT untuk GET, UPDATE ... WHERE id = ? (prepared statement)
 *           untuk perubahan status; jika rowCount = 0 dan id tidak ada -> HTTP 404.
 */
require __DIR__ . '/db.php';

$method = hrm_require_method(array('GET', 'PATCH', 'PUT', 'POST'));
hrm_guard_data_mode();

$statuses = array('Pending', 'Approved', 'Rejected');
$aliases  = array('menunggu' => 'Pending', 'disetujui' => 'Approved', 'ditolak' => 'Rejected');

if ($method === 'GET') {
    $filter = null;
    if (isset($_GET['status']) && $_GET['status'] !== '') {
        $filter = hrm_canonical($_GET['status'], $statuses, $aliases);
        if ($filter === null) {
            hrm_validation_fail(400, array('status' => 'Status harus salah satu dari: Pending, Approved, Rejected.'));
        }
    }

    $rows = HrmMockStore::all('leaves');
    if ($filter !== null) {
        $rows = array_filter($rows, function ($r) use ($filter) {
            return $r['status'] === $filter;
        });
    }
    $rows = array_values($rows);
    usort($rows, function ($a, $b) {
        $c = strcmp($b['created_at'], $a['created_at']);
        return $c !== 0 ? $c : $b['id'] - $a['id'];
    });

    hrm_ok(
        $rows ? 'Data pengajuan cuti (mock) berhasil diambil.' : 'Belum ada pengajuan cuti (mock).',
        array('items' => $rows, 'total' => count($rows))
    );
}

// --- Ubah status ---
$in = hrm_json_body();
$errors = array();

$id = hrm_id(isset($in['id']) ? $in['id'] : null);
if ($id === null) {
    $errors['id'] = 'ID pengajuan wajib berupa bilangan bulat positif.';
}

$status = hrm_canonical(isset($in['status']) ? $in['status'] : null, $statuses, $aliases);
if ($status === null) {
    $errors['status'] = 'Status harus salah satu dari: Pending, Approved, Rejected.';
}

if ($errors) {
    hrm_validation_fail(400, $errors);
}

$updated = HrmMockStore::transact('leaves', function (array &$doc) use ($id, $status) {
    foreach ($doc['rows'] as $i => $r) {
        if ((int) $r['id'] === $id) {
            $doc['rows'][$i]['status'] = $status;
            $doc['rows'][$i]['updated_at'] = date('Y-m-d H:i:s');
            return $doc['rows'][$i];
        }
    }
    throw new HrmApiException(404, 'Pengajuan cuti dengan ID tersebut tidak ditemukan.');
});

hrm_ok('Status pengajuan cuti diperbarui di penyimpanan sementara (mock). Perubahan belum permanen dan tidak masuk MySQL.', $updated);
