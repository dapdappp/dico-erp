<?php
/**
 * /api/manage_events.php
 *
 * GET         : daftar event.
 * POST        : buat event baru.
 * PUT / PATCH : ubah event. Body JSON memuat "id" + field yang diubah; field yang tidak
 *               dikirim tidak berubah (PUT dan PATCH diperlakukan sama).
 * Penghapusan event TIDAK disediakan (tidak diminta). Metode DELETE -> HTTP 405.
 *
 * Struktur data sementara (mock) - bukan skema database:
 *   id (int), title*, date* (YYYY-MM-DD), time (HH:MM), location, category,
 *   status (Aktif|Selesai|Dibatalkan, bawaan Aktif), description, created_at, updated_at
 *
 * Penyimpanan SAAT INI : file JSON sementara (mock), bukan MySQL.
 * TAHAP B : skema tabel event belum ditetapkan; tentukan dulu, lalu ganti HrmMockStore
 *           dengan query prepared statement.
 */
require __DIR__ . '/db.php';

$method = hrm_require_method(array('GET', 'POST', 'PUT', 'PATCH'));
hrm_guard_data_mode();

if ($method === 'GET') {
    $rows = HrmMockStore::all('events');
    usort($rows, function ($a, $b) {
        $c = strcmp($b['date'], $a['date']);
        return $c !== 0 ? $c : $b['id'] - $a['id'];
    });
    hrm_ok(
        $rows ? 'Data event (mock) berhasil diambil.' : 'Belum ada data event (mock).',
        array('items' => $rows, 'total' => count($rows))
    );
}

/** Validasi record event utuh (hasil gabungan data lama + input). Mengembalikan record bersih. */
function event_validate(array $merged, array &$errors)
{
    $title    = hrm_text($merged, 'title', $errors, 'Nama event', true, 3, 150);
    $date     = hrm_text($merged, 'date', $errors, 'Tanggal', true, 0, 10);
    $time     = hrm_text($merged, 'time', $errors, 'Waktu', false, 0, 5);
    $location = hrm_text($merged, 'location', $errors, 'Lokasi', false, 0, 150);
    $category = hrm_text($merged, 'category', $errors, 'Kategori', false, 0, 60);
    $desc     = hrm_text($merged, 'description', $errors, 'Deskripsi', false, 0, 2000, true);

    if ($date !== '' && !isset($errors['date']) && !hrm_valid_date($date)) {
        $errors['date'] = 'Tanggal harus berformat YYYY-MM-DD dan valid.';
    }
    if ($time !== '' && !isset($errors['time']) && !hrm_valid_time($time)) {
        $errors['time'] = 'Waktu harus berformat HH:MM (24 jam).';
    }

    $status = hrm_canonical(isset($merged['status']) && $merged['status'] !== '' ? $merged['status'] : 'Aktif', array('Aktif', 'Selesai', 'Dibatalkan'));
    if ($status === null) {
        $errors['status'] = 'Status harus salah satu dari: Aktif, Selesai, Dibatalkan.';
    }

    return array(
        'title' => $title, 'date' => $date, 'time' => $time, 'location' => $location,
        'category' => $category, 'status' => $status, 'description' => $desc,
    );
}

$in = hrm_json_body();
$fields = array('title', 'date', 'time', 'location', 'category', 'status', 'description');
$input = array_intersect_key($in, array_flip($fields));
$errors = array();

if ($method === 'POST') {
    $base = array('title' => '', 'date' => '', 'time' => '', 'location' => '', 'category' => '', 'status' => 'Aktif', 'description' => '');
    $clean = event_validate(array_merge($base, $input), $errors);
    if ($errors) {
        hrm_validation_fail(400, $errors);
    }

    $created = HrmMockStore::transact('events', function (array &$doc) use ($clean) {
        return HrmMockStore::insert($doc, $clean + array('created_at' => date('Y-m-d H:i:s')));
    });
    hrm_ok('Event ditambahkan ke penyimpanan sementara (mock). Data belum permanen dan tidak masuk MySQL.', $created, 201);
}

// PUT / PATCH
$id = hrm_id(isset($in['id']) ? $in['id'] : null);
if ($id === null) {
    hrm_validation_fail(400, array('id' => 'ID event wajib berupa bilangan bulat positif.'));
}
if (!$input) {
    hrm_validation_fail(400, array('fields' => 'Tidak ada field yang diubah.'));
}

$updated = HrmMockStore::transact('events', function (array &$doc) use ($id, $input) {
    foreach ($doc['rows'] as $i => $r) {
        if ((int) $r['id'] !== $id) {
            continue;
        }
        $errors = array();
        $clean = event_validate(array_merge($r, $input), $errors);
        if ($errors) {
            throw new HrmApiException(400, 'Validasi gagal: ' . implode(' ', array_values($errors)), $errors);
        }
        $doc['rows'][$i] = array_merge($r, $clean, array('updated_at' => date('Y-m-d H:i:s')));
        return $doc['rows'][$i];
    }
    throw new HrmApiException(404, 'Event dengan ID tersebut tidak ditemukan.');
});

hrm_ok('Event diperbarui di penyimpanan sementara (mock). Perubahan belum permanen dan tidak masuk MySQL.', $updated);
