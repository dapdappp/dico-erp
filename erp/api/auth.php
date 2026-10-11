<?php
// ============================================================
// DICO ERP - Authentication API
// ============================================================

header('Content-Type: application/json');
require_once __DIR__ . '/../../config/database.php';

session_start();

$action = $_POST['action'] ?? '';

// ---- LOGIN ----
if ($action === 'login') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($email === '' || $password === '') {
        echo json_encode(['success' => false, 'message' => 'Email dan password wajib diisi']);
        exit;
    }

    if (!$koneksi) {
        echo json_encode(['success' => false, 'message' => 'Koneksi database gagal. Pastikan MySQL XAMPP ON.']);
        exit;
    }

    $sql = "SELECT u.id, u.role_id, u.nama, u.email, u.password_hash, u.status, r.nama_role 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.email = ? AND u.status = 'aktif' 
            LIMIT 1";
    
    $stmt = mysqli_prepare($koneksi, $sql);
    mysqli_stmt_bind_param($stmt, "s", $email);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $user = mysqli_fetch_assoc($result);
    mysqli_stmt_close($stmt);

    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'Email atau password salah']);
        exit;
    }

    if (!password_verify($password, $user['password_hash'])) {
        echo json_encode(['success' => false, 'message' => 'Email atau password salah']);
        exit;
    }

    // Set Session
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['role_id'] = $user['role_id'];
    $_SESSION['role_name'] = $user['nama_role'];
    $_SESSION['nama'] = $user['nama'];
    $_SESSION['email'] = $user['email'];

    echo json_encode([
        'success' => true,
        'message' => 'Login berhasil',
        'user' => [
            'id' => $user['id'],
            'nama' => $user['nama'],
            'email' => $user['email'],
            'role_id' => $user['role_id'],
            'role_name' => $user['nama_role']
        ]
    ]);
    exit;
}

// ---- LOGOUT ----
if ($action === 'logout') {
    session_destroy();
    echo json_encode(['success' => true, 'message' => 'Logout berhasil']);
    exit;
}

// ---- GET CURRENT USER SESSION ----
if ($action === 'me') {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'message' => 'Belum login']);
        exit;
    }

    echo json_encode([
        'success' => true,
        'user' => [
            'id' => $_SESSION['user_id'],
            'nama' => $_SESSION['nama'],
            'email' => $_SESSION['email'],
            'role_id' => $_SESSION['role_id'],
            'role_name' => $_SESSION['role_name']
        ]
    ]);
    exit;
}

echo json_encode(['success' => false, 'message' => 'Action tidak valid']);
