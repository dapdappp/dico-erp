<?php
/**
 * DICO ERP - HRM API: bootstrap bersama (di-require oleh semua endpoint).
 *
 * STATUS SAAT INI (Tahap A): database MySQL BELUM tersedia.
 *   - Mode default "mock": data disimpan SEMENTARA di file JSON pada folder
 *     temp server (lihat HrmMockStore). Ini hanya untuk pengembangan lokal,
 *     BUKAN database dan BUKAN untuk produksi.
 *   - Mode "mysql" sengaja belum mengeksekusi query apa pun karena skema tabel
 *     belum ada. Endpoint menjawab HTTP 501 bila mode ini dipilih.
 *   - hrm_get_pdo() hanya menyiapkan koneksi PDO untuk Tahap B. Ia tidak
 *     dipanggil oleh endpoint mana pun saat ini.
 *
 * KONFIGURASI (urutan prioritas, yang belakang menimpa yang depan):
 *   1. Nilai bawaan di bawah (tanpa kredensial apa pun).
 *   2. File opsional api/db.local.php (JANGAN di-commit) yang me-return array.
 *   3. Environment variable.
 *
 *   Environment variable:
 *     HRM_DATA_MODE   mock | mysql        (bawaan: mock)
 *     HRM_TIMEZONE    mis. Asia/Jakarta    (bawaan: Asia/Jakarta)
 *     HRM_MOCK_DIR    folder data mock     (bawaan: <temp>/dico_hrm_mock)
 *     HRM_DB_HOST, HRM_DB_PORT, HRM_DB_NAME, HRM_DB_USER, HRM_DB_PASS, HRM_DB_CHARSET
 *
 *   Contoh api/db.local.php:
 *     <?php return ['mode' => 'mock', 'mysql' => ['host' => '...', 'name' => '...', 'user' => '...', 'pass' => '...']];
 *
 * Kompatibel PHP 7.4+. Memerlukan ekstensi json; pdo_mysql hanya untuk Tahap B.
 */

// Akses langsung ke file ini tidak diizinkan.
if (PHP_SAPI !== 'cli' && isset($_SERVER['SCRIPT_FILENAME']) && @realpath($_SERVER['SCRIPT_FILENAME']) === __FILE__) {
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(array('success' => false, 'message' => 'Akses langsung ke file ini tidak diizinkan.'));
    exit;
}

/* ------------------------------------------------------------------
 * Exception terkontrol: pesan aman ditampilkan ke klien.
 * ------------------------------------------------------------------ */
class HrmApiException extends RuntimeException
{
    /** @var int */
    private $status;
    /** @var array */
    private $errors;

    public function __construct($status, $message, array $errors = array())
    {
        parent::__construct($message);
        $this->status = (int) $status;
        $this->errors = $errors;
    }

    public function getStatus()
    {
        return $this->status;
    }

    public function getErrors()
    {
        return $this->errors;
    }
}

/* ------------------------------------------------------------------
 * Konfigurasi
 * ------------------------------------------------------------------ */
function hrm_config()
{
    static $cfg = null;
    if ($cfg !== null) {
        return $cfg;
    }

    $cfg = array(
        'mode'     => 'mock',
        'timezone' => 'Asia/Jakarta',
        'mock_dir' => rtrim(sys_get_temp_dir(), '/\\') . DIRECTORY_SEPARATOR . 'dico_hrm_mock',
        'mysql'    => array('host' => '', 'port' => 3306, 'name' => '', 'user' => '', 'pass' => '', 'charset' => 'utf8mb4'),
    );

    $local = __DIR__ . '/db.local.php';
    if (is_file($local)) {
        $over = require $local;
        if (is_array($over)) {
            $cfg = array_replace_recursive($cfg, $over);
        }
    }

    $top = array('HRM_DATA_MODE' => 'mode', 'HRM_TIMEZONE' => 'timezone', 'HRM_MOCK_DIR' => 'mock_dir');
    foreach ($top as $env => $key) {
        $v = getenv($env);
        if ($v !== false && $v !== '') {
            $cfg[$key] = $v;
        }
    }
    $db = array(
        'HRM_DB_HOST' => 'host', 'HRM_DB_PORT' => 'port', 'HRM_DB_NAME' => 'name',
        'HRM_DB_USER' => 'user', 'HRM_DB_PASS' => 'pass', 'HRM_DB_CHARSET' => 'charset',
    );
    foreach ($db as $env => $key) {
        $v = getenv($env);
        if ($v !== false && $v !== '') {
            $cfg['mysql'][$key] = $v;
        }
    }

    $cfg['mode'] = strtolower(trim((string) $cfg['mode']));
    return $cfg;
}

/* ------------------------------------------------------------------
 * Respons JSON
 * ------------------------------------------------------------------ */
function hrm_send($status, array $payload)
{
    while (ob_get_level() > 0) {
        ob_end_clean(); // buang output liar (warning/notice/spasi) agar JSON tetap valid
    }
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PARTIAL_OUTPUT_ON_ERROR);
    if ($json === false) {
        $status = 500;
        $json = '{"success":false,"message":"Gagal menyusun respons."}';
    }
    if (!headers_sent()) {
        http_response_code((int) $status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        header('X-Content-Type-Options: nosniff');
    }
    echo $json;
    exit;
}

/** Keterangan sumber data: selalu menandai bahwa data ini sementara. */
function hrm_meta()
{
    return array(
        'source'  => 'mock',
        'storage' => 'file JSON sementara di server pengembangan (bukan MySQL)',
        'note'    => 'Data sementara untuk pengembangan frontend; bukan data produksi dan dapat hilang kapan saja.',
    );
}

function hrm_ok($message, $data = null, $status = 200)
{
    $payload = array('success' => true, 'message' => (string) $message);
    if ($data !== null) {
        $payload['data'] = $data;
    }
    $payload['meta'] = hrm_meta();
    hrm_send($status, $payload);
}

function hrm_fail($status, $message, array $errors = array())
{
    $payload = array('success' => false, 'message' => (string) $message);
    if ($errors) {
        $payload['errors'] = $errors;
    }
    hrm_send($status, $payload);
}

/** Pesan untuk validasi gagal: "Validasi gagal: ...; ...". */
function hrm_validation_fail($status, array $errors)
{
    hrm_fail($status, 'Validasi gagal: ' . implode(' ', array_values($errors)), $errors);
}

/* ------------------------------------------------------------------
 * Bootstrap: error handling aman, timezone, header
 * ------------------------------------------------------------------ */
function hrm_bootstrap()
{
    ob_start();
    ini_set('display_errors', '0');
    ini_set('html_errors', '0');
    error_reporting(E_ALL);

    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
    }

    set_error_handler(function ($no, $str, $file, $line) {
        error_log('[HRM API] PHP error ' . $no . ': ' . $str . ' in ' . basename($file) . ':' . $line);
        return true; // jangan tampilkan ke klien
    });

    set_exception_handler(function ($e) {
        if ($e instanceof HrmApiException) {
            hrm_fail($e->getStatus(), $e->getMessage(), $e->getErrors());
        }
        error_log('[HRM API] Unhandled ' . get_class($e) . ': ' . $e->getMessage() . ' in ' . basename($e->getFile()) . ':' . $e->getLine());
        hrm_fail(500, 'Terjadi kesalahan pada server.');
    });

    register_shutdown_function(function () {
        $err = error_get_last();
        if ($err && in_array($err['type'], array(E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR), true)) {
            error_log('[HRM API] Fatal: ' . $err['message'] . ' in ' . basename($err['file']) . ':' . $err['line']);
            if (!headers_sent()) {
                hrm_fail(500, 'Terjadi kesalahan pada server.');
            }
        }
    });

    $tz = hrm_config()['timezone'];
    if (!@date_default_timezone_set($tz)) {
        date_default_timezone_set('Asia/Jakarta');
    }
}

/* ------------------------------------------------------------------
 * Request helpers
 * ------------------------------------------------------------------ */
function hrm_require_method(array $allowed)
{
    $m = strtoupper(preg_replace('/[^A-Za-z]/', '', isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET'));
    if (!in_array($m, $allowed, true)) {
        header('Allow: ' . implode(', ', $allowed));
        hrm_fail(405, 'Metode HTTP ' . $m . ' tidak didukung. Gunakan: ' . implode(', ', $allowed) . '.');
    }
    return $m;
}

/** Mode data harus "mock" saat ini. Mode "mysql" belum diimplementasikan (skema belum ada). */
function hrm_guard_data_mode()
{
    $mode = hrm_config()['mode'];
    if ($mode === 'mock') {
        return;
    }
    if ($mode === 'mysql') {
        hrm_fail(501, 'Mode MySQL dipilih, tetapi query belum diimplementasikan karena skema tabel belum tersedia. Gunakan HRM_DATA_MODE=mock sampai Tahap B selesai.');
    }
    hrm_fail(500, 'Konfigurasi HRM_DATA_MODE tidak valid.');
}

function hrm_json_body()
{
    $raw = file_get_contents('php://input', false, null, 0, 65537);
    if ($raw === false || trim($raw) === '') {
        hrm_fail(400, 'Body request kosong. Kirim JSON dengan header Content-Type: application/json.');
    }
    if (strlen($raw) > 65536) {
        hrm_fail(413, 'Body request terlalu besar.');
    }
    $data = json_decode($raw, true);
    if (!is_array($data) || ($data !== array() && array_values($data) === $data)) {
        hrm_fail(400, 'Body harus berupa objek JSON yang valid.');
    }
    return $data;
}

/** ID positif dari int atau string digit; selain itu null. */
function hrm_id($v)
{
    if (is_int($v) && $v > 0) {
        return $v;
    }
    if (is_string($v) && ctype_digit($v) && strlen($v) <= 15 && (int) $v > 0) {
        return (int) $v;
    }
    return null;
}

/* ------------------------------------------------------------------
 * Validasi bersama
 * ------------------------------------------------------------------ */
function hrm_len($s)
{
    return function_exists('mb_strlen') ? mb_strlen($s, 'UTF-8') : strlen($s);
}

function hrm_text(array $in, $key, array &$errors, $label, $required, $min = 0, $max = 255, $multiline = false)
{
    $v = array_key_exists($key, $in) ? $in[$key] : null;
    if ($v !== null && !is_string($v) && !is_int($v) && !is_float($v)) {
        $errors[$key] = $label . ' harus berupa teks.';
        return '';
    }
    $v = $v === null ? '' : trim((string) $v);
    if ($v === '') {
        if ($required) {
            $errors[$key] = $label . ' wajib diisi.';
        }
        return '';
    }
    $bad = $multiline ? '/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/' : '/[\x00-\x1F\x7F]/';
    if (preg_match($bad, $v)) {
        $errors[$key] = $label . ' mengandung karakter yang tidak valid.';
        return '';
    }
    $len = hrm_len($v);
    if ($len < $min) {
        $errors[$key] = $label . ' minimal ' . $min . ' karakter.';
    } elseif ($len > $max) {
        $errors[$key] = $label . ' maksimal ' . $max . ' karakter.';
    }
    return $v;
}

function hrm_valid_date($s)
{
    if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $s, $m)) {
        return false;
    }
    return checkdate((int) $m[2], (int) $m[3], (int) $m[1]);
}

function hrm_valid_time($s)
{
    return (bool) preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $s);
}

/** Cocokkan nilai (tanpa membedakan huruf besar/kecil) ke daftar nilai kanonik; null bila tidak ada. */
function hrm_canonical($value, array $allowed, array $aliases = array())
{
    if (!is_string($value)) {
        return null;
    }
    $k = strtolower(trim($value));
    foreach ($allowed as $a) {
        if (strtolower($a) === $k) {
            return $a;
        }
    }
    return isset($aliases[$k]) ? $aliases[$k] : null;
}

/**
 * Validasi + normalisasi satu record karyawan utuh (dipakai add_employee.php dan update_employee.php).
 * $in = data lengkap (untuk update: data lama digabung input baru). Error dikumpulkan di $errors.
 */
function hrm_employee_clean(array $in, array &$errors)
{
    $nik        = hrm_text($in, 'nik', $errors, 'NIK', true, 3, 32);
    $name       = hrm_text($in, 'name', $errors, 'Nama lengkap', true, 2, 100);
    $position   = hrm_text($in, 'position', $errors, 'Jabatan', true, 2, 100);
    $email      = hrm_text($in, 'email', $errors, 'Email', true, 5, 150);
    $department = hrm_text($in, 'department', $errors, 'Departemen', false, 0, 100);
    $phone      = hrm_text($in, 'phone', $errors, 'No. telepon', false, 0, 20);
    $joinDate   = hrm_text($in, 'join_date', $errors, 'Tanggal bergabung', false, 0, 10);

    if ($nik !== '' && !isset($errors['nik']) && !preg_match('/^[A-Za-z0-9][A-Za-z0-9.\-]*$/', $nik)) {
        $errors['nik'] = 'NIK hanya boleh berisi huruf, angka, titik, dan strip.';
    }
    if ($email !== '' && !isset($errors['email']) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Format email tidak valid.';
    }
    if ($phone !== '' && !isset($errors['phone']) && !preg_match('/^[0-9+\-\s()]{6,20}$/', $phone)) {
        $errors['phone'] = 'Format nomor telepon tidak valid.';
    }
    if ($joinDate !== '' && !isset($errors['join_date']) && !hrm_valid_date($joinDate)) {
        $errors['join_date'] = 'Tanggal bergabung harus berformat YYYY-MM-DD dan valid.';
    }

    $status = 'Aktif';
    if (array_key_exists('status', $in) && $in['status'] !== null && $in['status'] !== '') {
        $status = hrm_canonical($in['status'], array('Aktif', 'Cuti', 'Nonaktif'));
        if ($status === null) {
            $errors['status'] = 'Status harus salah satu dari: Aktif, Cuti, Nonaktif.';
        }
    }

    return array(
        'nik' => $nik, 'name' => $name, 'department' => $department, 'position' => $position,
        'email' => $email, 'phone' => $phone, 'join_date' => $joinDate, 'status' => $status,
    );
}

/* ------------------------------------------------------------------
 * Koneksi MySQL untuk TAHAP B (belum dipakai endpoint mana pun).
 * Tidak ada kredensial bawaan; konfigurasi harus diisi lewat db.local.php/env.
 * ------------------------------------------------------------------ */
function hrm_get_pdo()
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }
    $c = hrm_config()['mysql'];
    if ($c['host'] === '' || $c['name'] === '' || $c['user'] === '') {
        throw new HrmApiException(503, 'Koneksi database belum dikonfigurasi.');
    }
    if (!extension_loaded('pdo_mysql')) {
        throw new HrmApiException(503, 'Ekstensi pdo_mysql tidak tersedia di server.');
    }
    $dsn = 'mysql:host=' . $c['host'] . ';port=' . (int) $c['port'] . ';dbname=' . $c['name'] . ';charset=' . $c['charset'];
    try {
        $pdo = new PDO($dsn, $c['user'], $c['pass'], array(
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ));
    } catch (PDOException $e) {
        error_log('[HRM API] Koneksi MySQL gagal (kode ' . $e->getCode() . ')'); // detail tidak dikirim ke klien
        throw new HrmApiException(503, 'Koneksi database gagal.');
    }
    return $pdo;
}

/* ------------------------------------------------------------------
 * PENYIMPANAN SEMENTARA (mock) - HANYA UNTUK PENGEMBANGAN LOKAL
 *
 * Setiap koleksi = satu file JSON di HRM_MOCK_DIR dengan struktur
 *   { "next_id": N, "rows": [ ... ] }
 * Akses dikunci (flock) agar request bersamaan tidak saling menimpa.
 *
 * KETERBATASAN:
 *   - Bukan database: tanpa relasi, indeks, transaksi lintas koleksi, atau backup.
 *   - Folder temp dapat dibersihkan OS/hosting kapan saja; data ikut hilang.
 *   - Di hosting bersama, folder temp dapat terbaca pengguna lain: jangan simpan
 *     data nyata/sensitif.
 *   - Hapus folder HRM_MOCK_DIR untuk mengembalikan data awal (seed).
 *
 * TAHAP B: ganti semua pemanggilan HrmMockStore::all()/transact()/insert()
 * dengan query PDO prepared statement ke tabel yang sudah ada.
 * ------------------------------------------------------------------ */
final class HrmMockStore
{
    private static function path($name)
    {
        if (!preg_match('/^[a-z_]+$/', $name)) {
            throw new InvalidArgumentException('Nama koleksi tidak valid.');
        }
        $dir = hrm_config()['mock_dir'];
        if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
            error_log('[HRM API] Tidak dapat membuat folder mock: ' . $dir);
            throw new HrmApiException(500, 'Penyimpanan sementara tidak dapat diakses.');
        }
        return $dir . DIRECTORY_SEPARATOR . $name . '.json';
    }

    /** Data awal contoh (diambil dari halaman contoh HRM). NIK berawalan MOCK- agar jelas bukan data nyata. */
    private static function seed($name)
    {
        $now = date('Y-m-d H:i:s');
        $rows = array();
        if ($name === 'employees') {
            $rows = array(
                array('id' => 1, 'nik' => 'MOCK-001', 'name' => 'Andi Pratama', 'department' => '', 'position' => 'HR Officer', 'email' => 'andi@example.com', 'phone' => '', 'join_date' => '', 'status' => 'Aktif', 'created_at' => $now),
                array('id' => 2, 'nik' => 'MOCK-002', 'name' => 'Siti Aminah', 'department' => '', 'position' => 'Administrator', 'email' => 'siti@example.com', 'phone' => '', 'join_date' => '', 'status' => 'Aktif', 'created_at' => $now),
                array('id' => 3, 'nik' => 'MOCK-003', 'name' => 'Budi Santoso', 'department' => '', 'position' => 'Finance Staff', 'email' => 'budi@example.com', 'phone' => '', 'join_date' => '', 'status' => 'Cuti', 'created_at' => $now),
            );
        } elseif ($name === 'leaves') {
            $rows = array(
                array('id' => 1, 'employee_name' => 'Andi Pratama', 'leave_type' => 'Tahunan', 'start_date' => '2026-10-12', 'end_date' => '2026-10-14', 'reason' => 'Keperluan keluarga', 'status' => 'Pending', 'created_at' => '2026-10-09 09:00:00'),
                array('id' => 2, 'employee_name' => 'Siti Aminah', 'leave_type' => 'Sakit', 'start_date' => '2026-10-08', 'end_date' => '2026-10-08', 'reason' => 'Pemulihan kesehatan', 'status' => 'Approved', 'created_at' => '2026-10-07 08:30:00'),
                array('id' => 3, 'employee_name' => 'Budi Santoso', 'leave_type' => 'Tahunan', 'start_date' => '2026-10-20', 'end_date' => '2026-10-21', 'reason' => 'Keperluan pribadi', 'status' => 'Rejected', 'created_at' => '2026-10-06 14:15:00'),
            );
        } elseif ($name === 'events') {
            $rows = array(
                array('id' => 1, 'title' => 'Pelatihan Komunikasi', 'date' => '2026-10-15', 'time' => '', 'location' => '', 'category' => '', 'status' => 'Aktif', 'description' => 'Pelatihan internal untuk meningkatkan komunikasi tim.', 'created_at' => $now),
                array('id' => 2, 'title' => 'Town Hall DICO', 'date' => '2026-10-22', 'time' => '', 'location' => '', 'category' => '', 'status' => 'Aktif', 'description' => 'Pertemuan bulanan dan pembaruan perusahaan.', 'created_at' => $now),
            );
        } elseif ($name === 'registrations') {
            $rows = array(
                array('id' => 1, 'participant_name' => 'Rina Putri', 'email' => 'rina@example.com', 'event_id' => 1, 'status' => 'Terdaftar', 'registered_at' => '2026-10-09 10:00:00'),
            );
        } else {
            throw new InvalidArgumentException('Koleksi tidak dikenal.');
        }
        return array('next_id' => count($rows) + 1, 'rows' => $rows);
    }

    /**
     * Baca-ubah-tulis dengan kunci eksklusif.
     * $fn menerima dokumen (by reference) dan mengembalikan hasil. Bila $fn melempar
     * exception, tidak ada perubahan yang ditulis.
     */
    public static function transact($name, callable $fn)
    {
        $fh = @fopen(self::path($name), 'c+');
        if (!$fh) {
            throw new HrmApiException(500, 'Penyimpanan sementara tidak dapat diakses.');
        }
        try {
            if (!flock($fh, LOCK_EX)) {
                throw new HrmApiException(500, 'Penyimpanan sementara sedang sibuk. Coba lagi.');
            }
            rewind($fh);
            $raw = stream_get_contents($fh);
            $doc = ($raw === false || trim($raw) === '') ? null : json_decode($raw, true);
            $dirty = false;
            if (!is_array($doc) || !isset($doc['rows'], $doc['next_id']) || !is_array($doc['rows'])) {
                $doc = self::seed($name);
                $dirty = true;
            }
            $before = json_encode($doc);
            $result = $fn($doc);
            if ($dirty || json_encode($doc) !== $before) {
                $out = json_encode($doc, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                if ($out === false || !ftruncate($fh, 0) || rewind($fh) === false || fwrite($fh, $out) === false || !fflush($fh)) {
                    throw new HrmApiException(500, 'Data gagal ditulis ke penyimpanan sementara.');
                }
            }
            return $result;
        } finally {
            @flock($fh, LOCK_UN);
            fclose($fh);
        }
    }

    /** Ambil semua baris (menyemai data awal bila koleksi belum ada). */
    public static function all($name)
    {
        return self::transact($name, function (array &$doc) {
            return $doc['rows'];
        });
    }

    /** Tambah baris ke dokumen (dipanggil di dalam transact); mengembalikan baris dengan id baru. */
    public static function insert(array &$doc, array $row)
    {
        $row = array('id' => (int) $doc['next_id']) + $row;
        $doc['next_id'] = (int) $doc['next_id'] + 1;
        $doc['rows'][] = $row;
        return $row;
    }
}

hrm_bootstrap();
