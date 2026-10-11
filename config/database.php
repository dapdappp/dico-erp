<?php
// === [ SECTION: DATABASE CONFIGURATION - REWRITE STABIL v4 ] ===
// DB: dico_community | Host: localhost | Port: 3306/3307 fallback
// NON-FATAL: jangan exit - agar login hardcoded admin/admin123 tetap jalan saat MySQL mati.
// Error detail di-log ke error_log, tidak bikin server crash.

mysqli_report(MYSQLI_REPORT_OFF);

$host = "localhost";
$user = "root";
$pass = "";
$db   = "dico_community";
$port = 3306;

$koneksi = null;
$lastDbError = null;

function dico_try_connect($host, $user, $pass, $db, $port) {
    ini_set('mysqli.connect_timeout', 3);
    ini_set('default_socket_timeout', 3);
    $c = @mysqli_connect($host, $user, $pass, $db, (int)$port);
    if ($c) {
        @mysqli_set_charset($c, "utf8mb4");
        if (!@mysqli_ping($c)) {
            @mysqli_close($c);
            return null;
        }
    }
    return $c;
}

try {
    $koneksi = dico_try_connect($host, $user, $pass, $db, 3306);
    if (!$koneksi) {
        // fallback 3307 - XAMPP sering pakai 3307 jika 3306 bentrok
        $koneksi = dico_try_connect($host, $user, $pass, $db, 3307);
        if ($koneksi) $port = 3307;
    }
    if (!$koneksi) {
        $lastDbError = mysqli_connect_error() ?: 'Koneksi ditolak - MySQL belum Start';
        throw new Exception($lastDbError, mysqli_connect_errno() ?: 500);
    }
} catch (Throwable $e) {
    $lastDbError = $e->getMessage();
    $code = $e->getCode() ?: 500;
    error_log("================================================");
    error_log("[DB CONNECTION FAILED] dico_community");
    error_log(" Host: {$host}:{$port} | User: {$user} | DB: {$db}");
    error_log(" Error: " . $lastDbError);
    error_log(" Hint: Buka XAMPP Control Panel > Start MySQL (hijau), Import database/dico_community_new.sql via phpMyAdmin");
    error_log("================================================");
    // PENTING: jangan exit/die - biarkan $koneksi = null agar jalur admin hardcoded tetap bisa
    $koneksi = null;
}

if (!function_exists('ensure_db_connection')) {
    function ensure_db_connection($conn) {
        global $lastDbError;
        if (!$conn || !@mysqli_ping($conn)) {
            $msg = $lastDbError ?: (($conn ? mysqli_error($conn) : mysqli_connect_error()) ?: 'Koneksi database tidak tersedia');
            error_log("[DB ENSURE FAILED] " . $msg);
            if (!headers_sent()) {
                http_response_code(500);
                header('Content-Type: application/json');
            }
            echo json_encode([
                "success" => false,
                "message" => "Gagal terhubung ke server database. Pastikan MySQL di XAMPP sudah Start (hijau) dan database 'dico_community' sudah di-import.",
                "error_code" => "DB_CONNECTION_FAILED",
                "hint" => "Buka XAMPP Control Panel > klik Start pada MySQL, lalu phpMyAdmin > Import > pilih database/dico_community_new.sql",
                "detail" => $msg
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }
}