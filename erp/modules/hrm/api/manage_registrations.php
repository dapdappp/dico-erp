<?php
/**
 * /api/manage_registrations.php
 *
 * GET  : daftar registrasi peserta (opsional ?event_id=N untuk satu event).
 * POST : catat satu registrasi peserta (sesuai tombol "+ Registrasi Peserta" pada halaman HRM).
 *        Tidak ada alur registrasi publik, sinkronisasi Google Forms, ubah status, atau hapus.
 *
 * Struktur data sementara (mock) - bukan skema database:
 *   id (int), participant_name*, email*, event_id (int, harus ada di data event),
 *   event_name (diturunkan dari event saat dibaca), status (Terdaftar|Hadir|Dibatalkan,
 *   bawaan Terdaftar), registered_at (diisi server)
 *
 * POST body JSON: participant_name*, email*, serta salah satu dari event_id ATAU event_name*
 *                 (nama dicocokkan persis dengan judul event, tanpa membedakan huruf besar/kecil);
 *                 opsional status.
 * Respons POST: 201 | 400 validasi | 404 event tidak ditemukan | 409 peserta sudah terdaftar di event itu.
 *
 * Penyimpanan SAAT INI : file JSON sementara (mock), bukan MySQL.
 * TAHAP B : skema tabel registrasi dan relasinya ke event belum ditetapkan; tentukan dulu,
 *           lalu ganti HrmMockStore dengan query prepared statement (JOIN ke tabel event).
 */
require __DIR__ . '/db.php';

$method = hrm_require_method(array('GET', 'POST'));
hrm_guard_data_mode();

/** Peta id event -> judul, untuk menurunkan event_name. */
function registrations_event_titles(array $events)
{
    $map = array();
    foreach ($events as $e) {
        $map[(int) $e['id']] = $e['title'];
    }
    return $map;
}

if ($method === 'GET') {
    $eventId = null;
    if (isset($_GET['event_id']) && $_GET['event_id'] !== '') {
        $eventId = hrm_id($_GET['event_id']);
        if ($eventId === null) {
            hrm_validation_fail(400, array('event_id' => 'event_id harus berupa bilangan bulat positif.'));
        }
    }

    $titles = registrations_event_titles(HrmMockStore::all('events'));
    $rows = array();
    foreach (HrmMockStore::all('registrations') as $r) {
        if ($eventId !== null && (int) $r['event_id'] !== $eventId) {
            continue;
        }
        $r['event_name'] = isset($titles[(int) $r['event_id']]) ? $titles[(int) $r['event_id']] : '';
        $rows[] = $r;
    }
    usort($rows, function ($a, $b) {
        $c = strcmp($b['registered_at'], $a['registered_at']);
        return $c !== 0 ? $c : $b['id'] - $a['id'];
    });

    hrm_ok(
        $rows ? 'Data registrasi (mock) berhasil diambil.' : 'Belum ada data registrasi (mock).',
        array('items' => $rows, 'total' => count($rows))
    );
}

// --- POST: catat registrasi ---
$in = hrm_json_body();
$errors = array();

$name  = hrm_text($in, 'participant_name', $errors, 'Nama peserta', true, 2, 100);
$email = hrm_text($in, 'email', $errors, 'Email', true, 5, 150);
if ($email !== '' && !isset($errors['email']) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Format email tidak valid.';
}

$eventId = null;
$eventName = '';
if (isset($in['event_id']) && $in['event_id'] !== '' && $in['event_id'] !== null) {
    $eventId = hrm_id($in['event_id']);
    if ($eventId === null) {
        $errors['event_id'] = 'event_id harus berupa bilangan bulat positif.';
    }
} else {
    $eventName = hrm_text($in, 'event_name', $errors, 'Event', false, 0, 150);
    if ($eventName === '' && !isset($errors['event_name'])) {
        $errors['event_id'] = 'Event wajib diisi (kirim event_id atau event_name).';
    }
}

$status = 'Terdaftar';
if (array_key_exists('status', $in) && $in['status'] !== null && $in['status'] !== '') {
    $status = hrm_canonical($in['status'], array('Terdaftar', 'Hadir', 'Dibatalkan'));
    if ($status === null) {
        $errors['status'] = 'Status harus salah satu dari: Terdaftar, Hadir, Dibatalkan.';
    }
}

if ($errors) {
    hrm_validation_fail(400, $errors);
}

// Cari event pada data event sementara.
$event = null;
foreach (HrmMockStore::all('events') as $e) {
    if (($eventId !== null && (int) $e['id'] === $eventId) || ($eventId === null && strcasecmp($e['title'], $eventName) === 0)) {
        $event = $e;
        break;
    }
}
if ($event === null) {
    hrm_fail(404, 'Event tidak ditemukan.', array('event_id' => 'Event yang dipilih tidak ada di data event.'));
}
$eventIdFinal = (int) $event['id'];

$created = HrmMockStore::transact('registrations', function (array &$doc) use ($name, $email, $eventIdFinal, $status) {
    foreach ($doc['rows'] as $r) {
        if ((int) $r['event_id'] === $eventIdFinal && strcasecmp($r['email'], $email) === 0) {
            throw new HrmApiException(409, 'Validasi gagal: peserta dengan email ini sudah terdaftar pada event tersebut.', array('email' => 'Email sudah terdaftar pada event ini.'));
        }
    }
    return HrmMockStore::insert($doc, array(
        'participant_name' => $name,
        'email'            => $email,
        'event_id'         => $eventIdFinal,
        'status'           => $status,
        'registered_at'    => date('Y-m-d H:i:s'),
    ));
});
$created['event_name'] = $event['title'];

hrm_ok('Registrasi dicatat di penyimpanan sementara (mock). Data belum permanen dan tidak masuk MySQL.', $created, 201);
