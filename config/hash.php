<?php
// === [ SECTION: SECURITY & HASHING HELPER ] ===

// ? [ EXPLANATION ] : Script untuk menghasilkan hash password yang aman menggunakan BCRYPT bawaan PHP
// ! [ UPDATE POINT ] : Ubah teks password string di bawah ini untuk meng-generate hash password baru
echo password_hash("dico123", PASSWORD_DEFAULT);