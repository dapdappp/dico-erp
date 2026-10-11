/* ============================================================
   DICO ERP - HRM: Konfigurasi koneksi backend
   ------------------------------------------------------------
   SEMUA endpoint di bawah sengaja bernilai null karena isi
   folder `api/` dan skema database belum diverifikasi.
   Selama null, halaman menampilkan status "belum terhubung"
   (bukan data palsu). Isi endpoint yang sebenarnya di sini.

   Format endpoint:  { method: 'GET', url: 'modules/hrm/api/xxx.php' }
   - Boleh memakai placeholder {id} pada url.
   - GET  -> payload dikirim sebagai query string.
   - Lainnya -> payload dikirim sebagai JSON body.

   Kontrak respons yang diharapkan (lihat README.md):
   - list   : array, atau { data: [...] }, atau { items: [...] }
   - lainnya: { success: true } atau { success: false, message: '...' }
   ============================================================ */
(function (w) {
  'use strict';

  w.HRM = w.HRM || { pages: {}, state: {} };
  var C = (w.HRM_CONFIG = w.HRM_CONFIG || {});

  // Jumlah baris per halaman pada tabel (pagination sisi klien)
  C.pageSize = C.pageSize || 10;

  // Tombol "Tampilkan data demo" pada banner. Set false untuk produksi.
  C.demoAvailable = C.demoAvailable !== false;

  // Opsional: fungsi pembungkus request (mis. helper dari core/api.js
  // agar token/autentikasi ikut terkirim).
  //   C.requestAdapter = function (spec, payload) { return Promise<json>; };
  C.requestAdapter = C.requestAdapter || null;

  // Nilai status yang DIKIRIM ke backend saat approve/tolak cuti.
  // (Asumsi - sesuaikan dengan nilai yang dipakai database.)
  C.leaveStatusValues = C.leaveStatusValues || {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected'
  };

  C.endpoints = C.endpoints || {
    employees: {
      list: null,    // contoh: { method: 'GET',  url: 'modules/hrm/api/employees.php' }
      create: null,  // contoh: { method: 'POST', url: 'modules/hrm/api/employees.php' }
      update: null,  // contoh: { method: 'PUT',  url: 'modules/hrm/api/employees.php?id={id}' }
      remove: null   // contoh: { method: 'DELETE', url: 'modules/hrm/api/employees.php?id={id}' }
    },
    leaves: {
      list: null,
      updateStatus: null // body: { id, status }
    },
    events: {
      list: null,
      create: null,
      update: null,
      remove: null
    },
    registrations: {
      list: null
    },
    activity: {
      list: null // riwayat aktivitas; tanpa endpoint, bagian ini tidak ditampilkan
    }
  };
})(window);
