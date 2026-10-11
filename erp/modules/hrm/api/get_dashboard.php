<?php
/**
 * GET /api/get_dashboard.php
 *
 * Ringkasan untuk Dashboard HRM. Semua angka dihitung dari data SEMENTARA (mock) yang sama
 * dengan endpoint lain, sehingga konsisten satu sama lain. Angka ini BUKAN statistik dari
 * database MySQL (database belum tersedia); respons selalu membawa penanda meta.source = "mock".
 *
 * Metode : GET
 * Respons: data = {
 *   period: "all_time", generated_at,
 *   stats: { total_employees, active_employees, total_leaves, pending_leaves,
 *            total_events, upcoming_events, total_registrations },
 *   employees_by_department: [ {label, count} ], employees_by_status: [ {label, count} ],
 *   recent_leaves[], upcoming_events[], recent_registrations[]   (maks. 5 item)
 * }
 * Riwayat aktivitas TIDAK disediakan karena belum ada sumber datanya.
 *
 * TAHAP B: ganti tiap HrmMockStore::all() dengan query agregat (COUNT/GROUP BY) prepared statement.
 */
require __DIR__ . '/db.php';

hrm_require_method(array('GET'));
hrm_guard_data_mode();

$employees     = HrmMockStore::all('employees');
$leaves        = HrmMockStore::all('leaves');
$events        = HrmMockStore::all('events');
$registrations = HrmMockStore::all('registrations');

function dashboard_group(array $rows, $key)
{
    $counts = array();
    foreach ($rows as $r) {
        $label = isset($r[$key]) && trim((string) $r[$key]) !== '' ? (string) $r[$key] : 'Tidak diisi';
        $counts[$label] = (isset($counts[$label]) ? $counts[$label] : 0) + 1;
    }
    arsort($counts);
    $out = array();
    foreach ($counts as $label => $count) {
        $out[] = array('label' => (string) $label, 'count' => $count);
    }
    return $out;
}

$today = date('Y-m-d');

$activeEmployees = count(array_filter($employees, function ($e) {
    return $e['status'] === 'Aktif';
}));
$pendingLeaves = count(array_filter($leaves, function ($l) {
    return $l['status'] === 'Pending';
}));

$upcoming = array_values(array_filter($events, function ($e) use ($today) {
    return $e['date'] >= $today && $e['status'] === 'Aktif';
}));
usort($upcoming, function ($a, $b) {
    $c = strcmp($a['date'] . ' ' . $a['time'], $b['date'] . ' ' . $b['time']);
    return $c !== 0 ? $c : $a['id'] - $b['id'];
});

usort($leaves, function ($a, $b) {
    return strcmp($b['created_at'], $a['created_at']);
});

$titles = array();
foreach ($events as $e) {
    $titles[(int) $e['id']] = $e['title'];
}
usort($registrations, function ($a, $b) {
    return strcmp($b['registered_at'], $a['registered_at']);
});
$recentRegs = array();
foreach (array_slice($registrations, 0, 5) as $r) {
    $r['event_name'] = isset($titles[(int) $r['event_id']]) ? $titles[(int) $r['event_id']] : '';
    $recentRegs[] = $r;
}

hrm_ok('Ringkasan dashboard (mock) berhasil diambil.', array(
    'period'       => 'all_time',
    'generated_at' => date('Y-m-d H:i:s'),
    'stats' => array(
        'total_employees'     => count($employees),
        'active_employees'    => $activeEmployees,
        'total_leaves'        => count($leaves),
        'pending_leaves'      => $pendingLeaves,
        'total_events'        => count($events),
        'upcoming_events'     => count($upcoming),
        'total_registrations' => count($registrations),
    ),
    'employees_by_department' => dashboard_group($employees, 'department'),
    'employees_by_status'     => dashboard_group($employees, 'status'),
    'recent_leaves'           => array_slice($leaves, 0, 5),
    'upcoming_events'         => array_slice($upcoming, 0, 5),
    'recent_registrations'    => $recentRegs,
));
