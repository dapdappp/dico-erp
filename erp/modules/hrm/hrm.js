/* ============================================================
   DICO ERP - HRM Module
   Halaman dikonversi dari file PHP ke template literals:
     dashboard.php  -> pageHrmDashboard()
     karyawan.php   -> pageHrmEmployees()   (kini: pengelola data karyawan, terhubung API)
     cuti.php       -> pageHrmLeaves()
     event.php      -> pageHrmEvents()
     registrasi.php -> pageHrmRegistrations()
   ============================================================ */

// Penanda diagnostik: muncul di Console (F12) jika hrm.js berhasil dimuat & dijalankan.
if (window.console) console.info('[HRM] hrm.js dimuat');

// Lokasi API HRM, relatif terhadap erp/index.html (ubah jika folder berbeda).
var HRM_API_BASE = 'modules/hrm/api/';

// Register routes
registerRoute('#hrm/dashboard', pageHrmDashboard);
registerRoute('#hrm/employees', pageHrmEmployees);
registerRoute('#hrm/leaves', pageHrmLeaves);
registerRoute('#hrm/events', pageHrmEvents);
registerRoute('#hrm/registrations', pageHrmRegistrations);

// Menu "Dashboard" di sidebar mengarah ke #dashboard. Selama modul Dashboard utama
// belum mendaftarkan route itu, alias ini menampilkan Dashboard HRM. Jika modul
// Dashboard sudah punya handler (dimuat lebih dulu), alias TIDAK menimpanya.
var HRM_REGISTER_DASHBOARD_ALIAS = true;
if (HRM_REGISTER_DASHBOARD_ALIAS && typeof ROUTES !== 'undefined' && !ROUTES['#dashboard']) {
  registerRoute('#dashboard', pageHrmDashboard);
}

// ---- PAGE: Dashboard (dari dashboard.php) ----
function pageHrmDashboard() {
  return `
    <div class="page-heading">
      <div>
        <h1>Dashboard HRM</h1>
        <p>Ringkasan sederhana untuk mengelola informasi SDM.</p>
      </div>
      <span class="status-pill">Mode percobaan</span>
    </div>

    <div class="stats-grid">
      <article class="stat-card">
        <div class="stat-icon blue">K</div>
        <p>Total Karyawan</p>
        <h2>12</h2>
        <small>Data contoh</small>
      </article>
      <article class="stat-card">
        <div class="stat-icon orange">C</div>
        <p>Pengajuan Cuti</p>
        <h2>3</h2>
        <small>Data contoh</small>
      </article>
      <article class="stat-card">
        <div class="stat-icon purple">E</div>
        <p>Event Aktif</p>
        <h2>2</h2>
        <small>Data contoh</small>
      </article>
      <article class="stat-card">
        <div class="stat-icon green">R</div>
        <p>Registrasi Peserta</p>
        <h2>8</h2>
        <small>Data contoh</small>
      </article>
    </div>

    <div class="panel welcome-panel">
      <div>
        <span class="eyebrow">SELAMAT DATANG</span>
        <h2>Modul HRM DICO</h2>
        <p>Gunakan menu di sebelah kiri untuk mencoba halaman karyawan, cuti, event, dan registrasi.</p>
      </div>
      <div class="welcome-illustration" aria-hidden="true">HR</div>
    </div>
  `;
}

// ---- PAGE: Data Karyawan (pengelola data karyawan, lihat HrmEmployees di bawah) ----
function pageHrmEmployees() {
  var id = 'hre-root-' + (++HrmEmployees.seq);
  HrmEmployees.whenReady(id);
  return `<div id="${id}" class="hre"><p style="padding:24px;color:#6b7280">Memuat data karyawan…</p></div>`;
}

/* ============================================================
   Pengelola Data Karyawan
   Sumber data : HRM_API_BASE + 'get_employees.php'  (GET)
   Tambah data : HRM_API_BASE + 'add_employee.php'   (POST, JSON)
   Ubah        : HRM_API_BASE + 'update_employee.php'  (PATCH, JSON)
   Hapus       : HRM_API_BASE + 'delete_employee.php?id=N' (DELETE)
   Tampilan hanya berubah setelah server menjawab sukses (tidak ada perubahan palsu).
   Semua nama diawali "hre" / "Hre" agar tidak bentrok dengan modul lain.
   ============================================================ */
var HrmEmployees = (function () {
  var seq = 0;
  var STATUSES = ['Aktif', 'Cuti', 'Nonaktif'];
  var PAGE_SIZE = 10;

  var FIELDS = [
    { key: 'nik', label: 'NIK', type: 'text', required: true, ph: 'Contoh: EMP-004' },
    { key: 'name', label: 'Nama lengkap', type: 'text', required: true, ph: 'Contoh: Siti Aminah' },
    { key: 'position', label: 'Jabatan', type: 'text', required: true, ph: 'Contoh: Staf HR' },
    { key: 'department', label: 'Departemen', type: 'text', ph: 'Contoh: Teknologi' },
    { key: 'email', label: 'Email', type: 'email', required: true, ph: 'nama@email.com' },
    { key: 'phone', label: 'No. telepon', type: 'tel', ph: '0812xxxxxxx' },
    { key: 'join_date', label: 'Tanggal bergabung', type: 'date' },
    { key: 'status', label: 'Status', type: 'select', options: STATUSES }
  ];

  var ICONS = {
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    left: '<polyline points="15 18 9 12 15 6"/>',
    right: '<polyline points="9 18 15 12 9 6"/>',
    alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    refresh: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>'
  };

  function ic(name, size) {
    var s = size || 16;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none">' + (ICONS[name] || '') + '</svg>';
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function fmtDate(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || ''));
    if (!m) return '';
    return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function tone(status) {
    return status === 'Aktif' ? 'success' : status === 'Cuti' ? 'warn' : status === 'Nonaktif' ? 'danger' : 'neutral';
  }

  function badge(status) {
    return status ? '<span class="hre-badge hre-badge-' + tone(status) + '">' + esc(status) + '</span>' : '<span class="hre-dash">—</span>';
  }

  function initials(name) {
    var p = String(name || '?').trim().split(/\s+/);
    return esc(((p[0] || '?')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase());
  }

  /* ---------- Gaya (disisipkan sekali) ---------- */
  function injectStyle() {
    if (document.getElementById('hre-style')) return;
    var st = document.createElement('style');
    st.id = 'hre-style';
    st.textContent = `
.hre{--navy:#0b1a3a;--blue:#2f8fff;--blue-d:#1c6fee;--line:#e6ebf2;--muted:#6b7280;--text:#1c2434;--danger:#e9475a;max-width:1280px;margin:0 auto;display:flex;flex-direction:column;gap:20px;color:var(--text)}
.hre *,.hre *::before,.hre *::after,.hre-modal *{box-sizing:border-box}
.hre-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap}
.hre-title{margin:0;font-size:24px;line-height:1.25;color:var(--navy)}
.hre-sub{margin:4px 0 0;color:var(--muted);font-size:14px}
.hre-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 16px;border-radius:10px;border:1px solid transparent;font:inherit;font-size:14px;font-weight:600;line-height:1.2;cursor:pointer;transition:background 150ms,box-shadow 150ms}
.hre-btn:focus-visible,.hre-icon-btn:focus-visible,.hre-page-btn:focus-visible,.hre-th:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
.hre-btn:disabled{opacity:.6;cursor:not-allowed}
.hre-btn-primary{background:#2f8fff;color:#fff}
.hre-btn-primary:hover:not(:disabled){background:#1c6fee;box-shadow:0 4px 12px rgba(47,143,255,.35)}
.hre-btn-ghost{background:#fff;color:#1c2434;border-color:#e6ebf2}
.hre-btn-ghost:hover:not(:disabled){background:#f6f9fe;border-color:#cfd9ea}
.hre-btn-sm{padding:8px 12px;font-size:13px}
.hre-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px}
.hre-stat{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px 18px}
.hre-stat span{display:block;font-size:13px;color:var(--muted)}
.hre-stat strong{font-size:26px;color:var(--navy);line-height:1.3}
.hre-card{background:#fff;border:1px solid var(--line);border-radius:14px;box-shadow:0 1px 2px rgba(11,26,58,.04);min-width:0}
.hre-banner{display:flex;gap:12px;align-items:flex-start;padding:12px 16px;border-radius:12px;font-size:13.5px;line-height:1.55;border:1px solid}
.hre-banner svg{margin-top:2px}
.hre-banner-demo{background:#eaf3ff;border-color:#b9d8ff;color:#0b2a5c}
.hre-banner-warn{background:#fff8e6;border-color:#f2dc9b;color:#6b4a06}
.hre-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:16px 20px;border-bottom:1px solid var(--line)}
.hre-search{position:relative;flex:1 1 260px;max-width:380px;display:block}
.hre-search svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#8a94a8;pointer-events:none}
.hre-search .hre-input{padding-left:38px}
.hre-input,.hre-select{width:100%;height:40px;padding:0 12px;border:1px solid #d9e0ec;border-radius:10px;background:#fff;font:inherit;font-size:14px;color:var(--text)}
.hre-select{width:auto;max-width:210px}
.hre-select-full{width:100%;max-width:none}
.hre-input:focus,.hre-select:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 3px rgba(47,143,255,.14)}
.hre-input[aria-invalid="true"]{border-color:var(--danger)}
.hre-count{margin-left:auto;font-size:13px;color:var(--muted)}
.hre-table-wrap{overflow-x:auto;max-width:100%}
.hre-table{width:100%;border-collapse:collapse;font-size:14px}
.hre-table th{padding:11px 16px;text-align:left;font-size:12.5px;font-weight:600;color:#5b6780;background:#f8fafd;border-bottom:1px solid var(--line);white-space:nowrap}
.hre-table td{padding:12px 16px;border-bottom:1px solid var(--line);vertical-align:middle}
.hre-table tbody tr:last-child td{border-bottom:0}
.hre-table tbody tr:hover td{background:#f8fbff}
.hre-th{background:none;border:0;padding:0;font:inherit;font-weight:600;color:inherit;cursor:pointer}
.hre-th:hover{color:var(--navy)}
.hre-arrow{color:var(--blue-d)}
.hre-name{display:flex;align-items:center;gap:12px;min-width:200px}
.hre-avatar{width:36px;height:36px;border-radius:50%;background:#e8f2ff;color:#1c6fee;display:grid;place-items:center;font-size:13px;font-weight:700;flex:none}
.hre-name strong{display:block;color:var(--navy)}
.hre-name small{color:var(--muted)}
.hre-td-actions{text-align:right;white-space:nowrap}
.hre-icon-btn{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;border:0;background:transparent;color:#4b5873;cursor:pointer}
.hre-icon-btn:hover{background:#eef3fb;color:var(--navy)}
.hre-icon-btn.hre-tone-danger{color:#c2263a}
.hre-icon-btn.hre-tone-danger:hover{background:#fde8eb;color:#c2263a}
.hre-btn-danger{background:#e9475a;color:#fff}
.hre-btn-danger:hover:not(:disabled){background:#d1364a}
.hre-btn-danger-soft{background:#fde8eb;color:#c2263a}
.hre-btn-danger-soft:hover{background:#fbd5db}
.hre-confirm{margin:0;line-height:1.6;font-size:14.5px}
.hre-dash{color:#a5adbb}
.hre-badge{display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600;white-space:nowrap}
.hre-badge-success{background:#e6f6ec;color:#15803d}
.hre-badge-warn{background:#fff1d6;color:#a15c07}
.hre-badge-danger{background:#fde8eb;color:#c2263a}
.hre-badge-neutral{background:#eaeef5;color:#4b5873}
.hre-pager{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:14px 20px;border-top:1px solid var(--line)}
.hre-pager-info{font-size:13px;color:var(--muted)}
.hre-pager-btns{display:flex;gap:4px}
.hre-page-btn{min-width:34px;height:34px;padding:0 8px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line);background:#fff;border-radius:8px;font:inherit;font-size:13px;font-weight:600;color:#4b5873;cursor:pointer}
.hre-page-btn:hover:not(:disabled){background:#f2f7ff;border-color:#b9d8ff}
.hre-page-btn.is-active{background:var(--blue);border-color:var(--blue);color:#fff}
.hre-page-btn:disabled{opacity:.4;cursor:not-allowed}
.hre-empty{text-align:center;padding:40px 20px;display:flex;flex-direction:column;align-items:center;gap:8px}
.hre-empty-ic{width:56px;height:56px;border-radius:16px;display:grid;place-items:center;background:#eef3fb;color:#5b78a8;margin-bottom:4px}
.hre-empty h3{margin:0;font-size:16px;color:var(--navy)}
.hre-empty p{margin:0;max-width:460px;font-size:14px;color:var(--muted);line-height:1.55}
.hre-empty .hre-btn{margin-top:10px}
.hre-skel-wrap{padding:12px 20px}
.hre-skel-row{display:grid;grid-template-columns:1fr 2fr 1fr 1fr;gap:16px;padding:12px 0}
.hre-skel{display:block;height:14px;border-radius:6px;background:linear-gradient(90deg,#eef2f8 25%,#f7f9fc 50%,#eef2f8 75%);background-size:200% 100%;animation:hre-shimmer 1.4s infinite linear}
@keyframes hre-shimmer{from{background-position:200% 0}to{background-position:-200% 0}}
.hre-modal-backdrop{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(11,26,58,.55)}
.hre-modal{width:min(680px,100%);max-height:calc(100vh - 32px);display:flex;flex-direction:column;background:#fff;border-radius:16px;box-shadow:0 24px 60px rgba(11,26,58,.3);color:#1c2434;font-size:14px}
.hre-modal-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 22px;border-bottom:1px solid #e6ebf2}
.hre-modal-head h2{margin:0;font-size:18px;color:#0b1a3a}
.hre-modal-body{padding:20px 22px;overflow-y:auto}
.hre-modal-foot{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:10px;padding:14px 22px;border-top:1px solid #e6ebf2}
.hre-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.hre-field{display:flex;flex-direction:column;gap:6px;min-width:0}
.hre-field label{font-size:13px;font-weight:600;color:#34405a}
.hre-req{color:#e9475a}
.hre-err{font-size:12.5px;color:#e9475a}
.hre-form-error{margin-bottom:14px;padding:10px 14px;border-radius:10px;background:#fde8eb;color:#a31f31;font-size:13.5px}
.hre-form-error[hidden]{display:none}
.hre-dl{margin:0;display:flex;flex-direction:column}
.hre-dl-row{display:grid;grid-template-columns:160px minmax(0,1fr);gap:12px;padding:11px 0;border-bottom:1px solid #e6ebf2}
.hre-dl-row:last-child{border-bottom:0}
.hre-dl dt{color:#6b7280}
.hre-dl dd{margin:0;overflow-wrap:anywhere}
#hre-toasts{position:fixed;right:20px;bottom:20px;z-index:1100;display:flex;flex-direction:column;gap:10px;max-width:min(440px,calc(100vw - 40px))}
.hre-toast{display:flex;align-items:flex-start;gap:10px;padding:12px 16px;border-radius:12px;color:#fff;font-size:14px;line-height:1.45;background:#0b1a3a;box-shadow:0 10px 30px rgba(11,26,58,.3);transition:opacity 250ms}
.hre-toast svg{margin-top:2px}
.hre-toast-success{background:#15803d}
.hre-toast-error{background:#c2263a}
.hre-toast.is-out{opacity:0}
@media (max-width:760px){
.hre-head>.hre-btn{width:100%}
.hre-title{font-size:21px}
.hre-toolbar{padding:14px}
.hre-search{max-width:none;flex-basis:100%}
.hre-select{flex:1 1 140px;max-width:none}
.hre-count{margin-left:0;width:100%}
.hre-form-grid{grid-template-columns:minmax(0,1fr)}
.hre-dl-row{grid-template-columns:minmax(0,1fr);gap:2px}
.hre-modal-foot .hre-btn{flex:1 1 auto}
.hre-pager{justify-content:center}
#hre-toasts{left:16px;right:16px;bottom:16px;max-width:none}
}
@media (prefers-reduced-motion:reduce){.hre-skel{animation:none}}
`;
    document.head.appendChild(st);
  }

  /* ---------- Komponen kecil: toast & modal ---------- */
  function toast(msg, type) {
    var box = document.getElementById('hre-toasts');
    if (!box) {
      box = document.createElement('div');
      box.id = 'hre-toasts';
      box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    var t = document.createElement('div');
    var kind = type || 'info';
    t.className = 'hre-toast hre-toast-' + kind;
    t.innerHTML = ic(kind === 'success' ? 'check' : kind === 'error' ? 'alert' : 'info', 18) + '<span>' + esc(msg) + '</span>';
    box.appendChild(t);
    setTimeout(function () {
      t.classList.add('is-out');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 250);
    }, kind === 'error' ? 6500 : 4500);
  }

  var escHandler = null;
  function closeModal() {
    var m = document.getElementById('hre-modal');
    if (m && m.parentNode) m.parentNode.removeChild(m);
    if (escHandler) { document.removeEventListener('keydown', escHandler); escHandler = null; }
  }

  function openModal(title, body, footer) {
    closeModal();
    var root = document.getElementById('modal-root') || document.body;
    var wrap = document.createElement('div');
    wrap.id = 'hre-modal';
    wrap.className = 'hre-modal-backdrop';
    wrap.innerHTML = '<div class="hre-modal" role="dialog" aria-modal="true" aria-labelledby="hre-modal-title">' +
      '<div class="hre-modal-head"><h2 id="hre-modal-title">' + esc(title) + '</h2>' +
      '<button type="button" class="hre-icon-btn" data-close aria-label="Tutup">' + ic('x', 18) + '</button></div>' +
      '<div class="hre-modal-body">' + body + '</div>' +
      (footer ? '<div class="hre-modal-foot">' + footer + '</div>' : '') + '</div>';
    root.appendChild(wrap);
    wrap.addEventListener('mousedown', function (e) { if (e.target === wrap) closeModal(); });
    wrap.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-close]')) closeModal(); });
    escHandler = function (e) { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', escHandler);
    var first = wrap.querySelector('input,select,textarea');
    if (first) setTimeout(function () { first.focus(); }, 30);
    return wrap;
  }

  /* ---------- API ---------- */
  function api(path, opts) {
    var o = opts || {};
    return fetch(HRM_API_BASE + path, {
      method: o.method || 'GET',
      headers: Object.assign({ Accept: 'application/json' }, o.headers || {}),
      body: o.body,
      credentials: 'same-origin'
    }).then(function (res) {
      return res.text().then(function (txt) {
        var json = null;
        try { json = txt ? JSON.parse(txt) : null; } catch (e) { /* bukan JSON */ }
        if (!json || typeof json.success !== 'boolean') {
          var bad = new Error('Respons server tidak valid (HTTP ' + res.status + '). Pastikan Apache/PHP aktif dan file ' + path + ' ada di folder ' + HRM_API_BASE + '.');
          bad.status = res.status;
          throw bad;
        }
        if (!json.success) {
          var err = new Error(json.message || 'Permintaan gagal.');
          err.status = res.status;
          err.errors = json.errors || {};
          throw err;
        }
        return json;
      });
    }, function () {
      throw new Error('Tidak dapat menghubungi server. Periksa koneksi dan pastikan Apache (XAMPP) berjalan.');
    });
  }

  /* ---------- Validasi form (cermin validasi backend) ---------- */
  function validate(v) {
    var e = {};
    FIELDS.forEach(function (f) { if (f.required && !v[f.key]) e[f.key] = f.label + ' wajib diisi.'; });
    if (v.nik && !e.nik) {
      if (v.nik.length < 3 || v.nik.length > 32) e.nik = 'NIK harus 3–32 karakter.';
      else if (!/^[A-Za-z0-9][A-Za-z0-9.\-]*$/.test(v.nik)) e.nik = 'NIK hanya boleh berisi huruf, angka, titik, dan strip.';
    }
    if (v.name && !e.name && (v.name.length < 2 || v.name.length > 100)) e.name = 'Nama harus 2–100 karakter.';
    if (v.position && !e.position && (v.position.length < 2 || v.position.length > 100)) e.position = 'Jabatan harus 2–100 karakter.';
    if (v.department && v.department.length > 100) e.department = 'Departemen maksimal 100 karakter.';
    if (v.email && !e.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = 'Format email tidak valid.';
    if (v.phone && !/^[0-9+\-\s()]{6,20}$/.test(v.phone)) e.phone = 'Format nomor telepon tidak valid.';
    return e;
  }

  /* ---------- Halaman ---------- */
  function mount(el) {
    injectStyle();
    closeModal();

    var S = { rows: [], meta: null, loading: true, error: null, q: '', status: '', dept: '', page: 1, sort: { key: 'name', dir: 'asc' } };

    el.innerHTML =
      '<header class="hre-head"><div><h1 class="hre-title">Data Karyawan</h1>' +
      '<p class="hre-sub">Kelola semua data karyawan DICO Community</p></div>' +
      '<button type="button" class="hre-btn hre-btn-primary" data-act="add">' + ic('plus') + 'Tambah Karyawan</button></header>' +
      '<div data-slot="banner"></div><div class="hre-stats" data-slot="stats"></div>' +
      '<section class="hre-card"><div data-slot="toolbar"></div><div data-slot="table"></div></section>';

    var slot = function (n) { return el.querySelector('[data-slot="' + n + '"]'); };

    /* --- muat data --- */
    function load() {
      S.loading = true;
      S.error = null;
      renderTable();
      return api('get_employees.php').then(function (json) {
        S.rows = (json.data && json.data.items) || [];
        S.meta = json.meta || null;
      }).catch(function (err) {
        S.rows = [];
        S.error = err;
      }).then(function () {
        S.loading = false;
        renderBanner();
        renderStats();
        renderToolbar();
        renderTable();
      });
    }

    function renderBanner() {
      var b = slot('banner');
      if (S.error) { b.innerHTML = ''; return; }
      b.innerHTML = S.meta && S.meta.source === 'mock'
        ? '<div class="hre-banner hre-banner-demo" role="status">' + ic('info', 20) + '<div><strong>Data sementara (mock).</strong> ' +
          'Daftar ini berasal dari penyimpanan sementara di server pengembangan, bukan database MySQL. Data dapat hilang sewaktu-waktu.</div></div>'
        : '';
    }

    function renderStats() {
      var c = function (s) { return S.rows.filter(function (r) { return r.status === s; }).length; };
      slot('stats').innerHTML = S.error ? '' :
        [['Total karyawan', S.rows.length], ['Aktif', c('Aktif')], ['Cuti', c('Cuti')], ['Nonaktif', c('Nonaktif')]]
          .map(function (x) { return '<div class="hre-stat"><span>' + x[0] + '</span><strong>' + x[1] + '</strong></div>'; }).join('');
    }

    function distinct(key) {
      var seen = {}, out = [];
      S.rows.forEach(function (r) {
        var v = String(r[key] == null ? '' : r[key]).trim();
        if (v && !seen[v]) { seen[v] = 1; out.push(v); }
      });
      return out.sort(function (a, b) { return a.localeCompare(b, 'id'); });
    }

    function renderToolbar() {
      if (S.error) { slot('toolbar').innerHTML = ''; return; }
      var opt = function (list, cur) {
        return list.map(function (v) { return '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(v) + '</option>'; }).join('');
      };
      var depts = distinct('department');
      if (depts.indexOf(S.dept) < 0) S.dept = '';
      slot('toolbar').innerHTML =
        '<div class="hre-toolbar"><label class="hre-search">' + ic('search') +
        '<input type="search" class="hre-input" data-q value="' + esc(S.q) + '" placeholder="Cari NIK, nama, jabatan, atau email…" aria-label="Cari karyawan"></label>' +
        '<select class="hre-select" data-f="status" aria-label="Filter status"><option value="">Semua status</option>' + opt(distinct('status'), S.status) + '</select>' +
        (depts.length ? '<select class="hre-select" data-f="dept" aria-label="Filter departemen"><option value="">Semua departemen</option>' + opt(depts, S.dept) + '</select>' : '') +
        '<button type="button" class="hre-btn hre-btn-ghost hre-btn-sm" data-act="reset">Atur ulang</button>' +
        '<span class="hre-count" data-slot="count" aria-live="polite"></span></div>';
    }

    /* --- filter + urut --- */
    function filtered() {
      var q = S.q.trim().toLowerCase();
      var list = S.rows.filter(function (r) {
        if (S.status && r.status !== S.status) return false;
        if (S.dept && r.department !== S.dept) return false;
        if (!q) return true;
        return ['nik', 'name', 'position', 'department', 'email'].some(function (k) {
          return String(r[k] == null ? '' : r[k]).toLowerCase().indexOf(q) > -1;
        });
      });
      var k = S.sort.key, d = S.sort.dir === 'desc' ? -1 : 1;
      return list.slice().sort(function (a, b) {
        var x = String(a[k] == null ? '' : a[k]), y = String(b[k] == null ? '' : b[k]);
        if (!x && y) return 1;
        if (x && !y) return -1;
        return x.localeCompare(y, 'id', { numeric: true }) * d;
      });
    }

    function empty(icon, title, text, extra) {
      return '<div class="hre-empty"><div class="hre-empty-ic">' + ic(icon, 26) + '</div><h3>' + esc(title) + '</h3>' +
        (text ? '<p>' + esc(text) + '</p>' : '') + (extra || '') + '</div>';
    }

    /* --- tabel --- */
    function renderTable() {
      var box = slot('table');
      var cnt = el.querySelector('[data-slot="count"]');
      if (!box) return;

      if (S.loading) {
        var sk = '';
        for (var i = 0; i < 5; i++) sk += '<div class="hre-skel-row"><span class="hre-skel"></span><span class="hre-skel"></span><span class="hre-skel"></span><span class="hre-skel"></span></div>';
        box.innerHTML = '<div class="hre-skel-wrap" aria-busy="true">' + sk + '</div>';
        return;
      }
      if (S.error) {
        box.innerHTML = empty('alert', 'Data karyawan gagal dimuat', S.error.message,
          '<button type="button" class="hre-btn hre-btn-primary" data-act="reload">' + ic('refresh') + 'Coba lagi</button>');
        return;
      }
      if (!S.rows.length) {
        if (cnt) cnt.textContent = '0 data';
        box.innerHTML = empty('users', 'Belum ada data karyawan', 'Klik "Tambah Karyawan" untuk menambahkan data pertama.');
        return;
      }

      var list = filtered();
      var total = list.length;
      if (cnt) cnt.textContent = total === S.rows.length ? total + ' data' : total + ' dari ' + S.rows.length + ' data';
      if (!total) {
        box.innerHTML = empty('search', 'Tidak ada hasil', 'Tidak ada karyawan yang cocok dengan pencarian atau filter.',
          '<button type="button" class="hre-btn hre-btn-ghost" data-act="reset">Atur ulang pencarian</button>');
        return;
      }

      var pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      if (S.page > pages) S.page = pages;
      var start = (S.page - 1) * PAGE_SIZE;
      var slice = list.slice(start, start + PAGE_SIZE);

      var cols = [['nik', 'NIK'], ['name', 'Nama'], ['department', 'Departemen'], ['position', 'Jabatan'], ['status', 'Status']];
      var th = cols.map(function (c) {
        var on = S.sort.key === c[0];
        return '<th scope="col" aria-sort="' + (on ? (S.sort.dir === 'asc' ? 'ascending' : 'descending') : 'none') + '">' +
          '<button type="button" class="hre-th" data-act="sort" data-key="' + c[0] + '">' + c[1] +
          '<span class="hre-arrow">' + (on ? (S.sort.dir === 'asc' ? ' ↑' : ' ↓') : '') + '</span></button></th>';
      }).join('');

      var tr = slice.map(function (r) {
        var id = esc(r.id);
        return '<tr><td>' + esc(r.nik) + '</td>' +
          '<td><div class="hre-name"><span class="hre-avatar">' + initials(r.name) + '</span><div><strong>' + esc(r.name) + '</strong><small>' + esc(r.email || '') + '</small></div></div></td>' +
          '<td>' + (r.department ? esc(r.department) : '<span class="hre-dash">—</span>') + '</td>' +
          '<td>' + esc(r.position) + '</td><td>' + badge(r.status) + '</td>' +
          '<td class="hre-td-actions">' +
          '<button type="button" class="hre-icon-btn" data-act="detail" data-id="' + id + '" title="Detail" aria-label="Lihat detail ' + esc(r.name) + '">' + ic('eye') + '</button>' +
          '<button type="button" class="hre-icon-btn" data-act="edit" data-id="' + id + '" title="Ubah" aria-label="Ubah ' + esc(r.name) + '">' + ic('edit') + '</button>' +
          '<button type="button" class="hre-icon-btn hre-tone-danger" data-act="delete" data-id="' + id + '" title="Hapus" aria-label="Hapus ' + esc(r.name) + '">' + ic('trash') + '</button>' +
          '</td></tr>';
      }).join('');

      var a = Math.max(1, S.page - 2), b = Math.min(pages, a + 4);
      a = Math.max(1, b - 4);
      var pg = '<button type="button" class="hre-page-btn" data-act="page" data-page="' + (S.page - 1) + '"' + (S.page <= 1 ? ' disabled' : '') + ' aria-label="Halaman sebelumnya">' + ic('left') + '</button>';
      for (var n = a; n <= b; n++) {
        pg += '<button type="button" class="hre-page-btn' + (n === S.page ? ' is-active' : '') + '" data-act="page" data-page="' + n + '"' + (n === S.page ? ' aria-current="page"' : '') + '>' + n + '</button>';
      }
      pg += '<button type="button" class="hre-page-btn" data-act="page" data-page="' + (S.page + 1) + '"' + (S.page >= pages ? ' disabled' : '') + ' aria-label="Halaman berikutnya">' + ic('right') + '</button>';

      box.innerHTML = '<div class="hre-table-wrap"><table class="hre-table"><thead><tr>' + th + '<th scope="col" style="text-align:right">Aksi</th></tr></thead><tbody>' + tr + '</tbody></table></div>' +
        '<div class="hre-pager"><span class="hre-pager-info">Menampilkan ' + (start + 1) + '–' + Math.min(start + PAGE_SIZE, total) + ' dari ' + total + ' data</span><div class="hre-pager-btns">' + pg + '</div></div>';
    }

    /* --- detail --- */
    function showDetail(r) {
      var rows = [
        ['NIK', esc(r.nik)], ['Nama lengkap', esc(r.name)], ['Jabatan', esc(r.position)],
        ['Departemen', r.department ? esc(r.department) : '<span class="hre-dash">—</span>'],
        ['Email', esc(r.email)], ['No. telepon', r.phone ? esc(r.phone) : '<span class="hre-dash">—</span>'],
        ['Tanggal bergabung', fmtDate(r.join_date) ? esc(fmtDate(r.join_date)) : '<span class="hre-dash">—</span>'],
        ['Status', badge(r.status)],
        ['Dibuat pada', r.created_at ? esc(r.created_at) : '<span class="hre-dash">—</span>']
      ].map(function (x) { return '<div class="hre-dl-row"><dt>' + x[0] + '</dt><dd>' + x[1] + '</dd></div>'; }).join('');
      var m = openModal('Detail karyawan', '<dl class="hre-dl">' + rows + '</dl>',
        '<button type="button" class="hre-btn hre-btn-ghost" data-close>Tutup</button>' +
        '<button type="button" class="hre-btn hre-btn-danger-soft" data-act="delete">' + ic('trash') + 'Hapus</button>' +
        '<button type="button" class="hre-btn hre-btn-primary" data-act="edit">' + ic('edit') + 'Ubah</button>');
      m.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('[data-act]');
        if (!b) return;
        var act = b.getAttribute('data-act');
        closeModal();
        if (act === 'edit') showForm(r); else if (act === 'delete') showDelete(r);
      });
    }

    /* --- tambah / ubah --- */
    function showForm(row) {
      var editing = !!row;
      var body = '<form id="hre-form" novalidate><div class="hre-form-error" data-form-error role="alert" hidden></div><div class="hre-form-grid">' +
        FIELDS.map(function (f) {
          var id = 'hre-f-' + f.key, ph = f.ph ? ' placeholder="' + esc(f.ph) + '"' : '', input;
          var val = editing && row[f.key] != null ? String(row[f.key]) : '';
          if (f.type === 'select') {
            var opts = f.options.slice();
            if (val && opts.indexOf(val) < 0) opts.unshift(val);
            input = '<select class="hre-select hre-select-full" id="' + id + '" name="' + f.key + '">' +
              opts.map(function (o) { return '<option value="' + esc(o) + '"' + (o === val ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>';
          } else {
            input = '<input class="hre-input" id="' + id + '" name="' + f.key + '" type="' + f.type + '"' + ph + ' value="' + esc(f.type === 'date' ? val.slice(0, 10) : val) + '">';
          }
          return '<div class="hre-field"><label for="' + id + '">' + esc(f.label) + (f.required ? ' <span class="hre-req" aria-hidden="true">*</span>' : '') + '</label>' +
            input + '<div class="hre-err" data-err="' + f.key + '"></div></div>';
        }).join('') + '</div></form>';

      var label = editing ? 'Simpan perubahan' : 'Simpan';
      var m = openModal(editing ? 'Ubah karyawan' : 'Tambah karyawan', body,
        '<button type="button" class="hre-btn hre-btn-ghost" data-close>Batal</button>' +
        '<button type="submit" form="hre-form" class="hre-btn hre-btn-primary" data-submit>' + label + '</button>');

      var form = m.querySelector('#hre-form'), submit = m.querySelector('[data-submit]'), formErr = m.querySelector('[data-form-error]');

      function showErrors(errs) {
        FIELDS.forEach(function (f) {
          var box = form.querySelector('[data-err="' + f.key + '"]'), inp = form.querySelector('[name="' + f.key + '"]');
          box.textContent = errs[f.key] || '';
          if (errs[f.key]) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid');
        });
      }

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var values = {};
        FIELDS.forEach(function (f) { values[f.key] = form.querySelector('[name="' + f.key + '"]').value.trim(); });
        var errs = validate(values), keys = Object.keys(errs);
        formErr.hidden = true;
        showErrors(errs);
        if (keys.length) { form.querySelector('[name="' + keys[0] + '"]').focus(); return; }

        submit.disabled = true;
        submit.textContent = 'Menyimpan…';
        var req = editing
          ? api('update_employee.php', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ id: row.id }, values)) })
          : api('add_employee.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
        req.then(function (json) {
          closeModal();
          toast(json.message || (editing ? 'Data karyawan berhasil diperbarui.' : 'Karyawan berhasil ditambahkan.'), 'success');
          if (!editing) S.page = 1;
          return load();
        }).catch(function (err) {
          submit.disabled = false;
          submit.textContent = label;
          showErrors(err.errors || {});
          formErr.hidden = false;
          formErr.textContent = 'Data tidak tersimpan: ' + err.message;
        });
      });
    }

    /* --- hapus (dengan konfirmasi) --- */
    function showDelete(r) {
      var m = openModal('Hapus karyawan',
        '<p class="hre-confirm">Hapus <strong>' + esc(r.name) + '</strong> (NIK ' + esc(r.nik) + ')? Tindakan ini tidak dapat dibatalkan.</p>' +
        '<div class="hre-form-error" data-form-error role="alert" hidden style="margin:14px 0 0"></div>',
        '<button type="button" class="hre-btn hre-btn-ghost" data-close>Batal</button>' +
        '<button type="button" class="hre-btn hre-btn-danger" data-ok>Ya, hapus</button>');
      var ok = m.querySelector('[data-ok]'), err = m.querySelector('[data-form-error]');
      ok.addEventListener('click', function () {
        ok.disabled = true;
        ok.textContent = 'Menghapus…';
        api('delete_employee.php?id=' + encodeURIComponent(r.id), { method: 'DELETE' })
          .then(function (json) {
            closeModal();
            toast(json.message || 'Karyawan berhasil dihapus.', 'success');
            return load();
          })
          .catch(function (e) {
            ok.disabled = false;
            ok.textContent = 'Ya, hapus';
            err.hidden = false;
            err.textContent = 'Data tidak dihapus: ' + e.message;
          });
      });
    }

    /* --- event --- */
    el.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-act]');
      if (!b || !el.contains(b)) return;
      var act = b.getAttribute('data-act');
      if (act === 'add') return showForm(null);
      if (act === 'reload') return load();
      if (act === 'reset') { S.q = ''; S.status = ''; S.dept = ''; S.page = 1; renderToolbar(); return renderTable(); }
      if (act === 'sort') {
        var k = b.getAttribute('data-key');
        S.sort = S.sort.key === k ? { key: k, dir: S.sort.dir === 'asc' ? 'desc' : 'asc' } : { key: k, dir: 'asc' };
        return renderTable();
      }
      if (act === 'page') { var n = parseInt(b.getAttribute('data-page'), 10); if (n >= 1) { S.page = n; renderTable(); } return; }
      var id = b.getAttribute('data-id');
      var row = S.rows.filter(function (r) { return String(r.id) === id; })[0];
      if (!row) return;
      if (act === 'detail') showDetail(row);
      else if (act === 'edit') showForm(row);
      else if (act === 'delete') showDelete(row);
    });

    var timer;
    el.addEventListener('input', function (e) {
      if (!e.target.hasAttribute || !e.target.hasAttribute('data-q')) return;
      var v = e.target.value;
      clearTimeout(timer);
      timer = setTimeout(function () { S.q = v; S.page = 1; renderTable(); }, 180);
    });
    el.addEventListener('change', function (e) {
      var f = e.target.getAttribute && e.target.getAttribute('data-f');
      if (!f) return;
      S[f] = e.target.value;
      S.page = 1;
      renderTable();
    });

    load();
  }

  /* Router hanya mengembalikan string HTML; halaman diisi setelah elemennya ada di DOM. */
  function whenReady(id) {
    var tries = 0;
    (function poll() {
      var el = document.getElementById(id);
      if (el) return mount(el);
      if (++tries < 200) setTimeout(poll, 25);
    })();
  }

  return { seq: 0, whenReady: whenReady };
})();

// ---- PAGE: Pengajuan Cuti (dari cuti.php) ----
function pageHrmLeaves() {
  return `
    <div class="page-heading"><div><h1>Pengajuan Cuti</h1><p>Pantau permohonan cuti karyawan.</p></div></div>
    <div class="panel table-panel">
      <div class="table-heading"><h2>Daftar Pengajuan</h2><span class="muted">Data contoh</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Nama</th><th>Jenis Cuti</th><th>Tanggal</th><th>Alasan</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>Andi Pratama</td><td>Tahunan</td><td>12–14 Okt 2026</td><td>Keperluan keluarga</td><td><span class="tag tag-orange">Menunggu</span></td></tr>
            <tr><td>Siti Aminah</td><td>Sakit</td><td>8 Okt 2026</td><td>Pemulihan kesehatan</td><td><span class="tag tag-green">Disetujui</span></td></tr>
            <tr><td>Budi Santoso</td><td>Tahunan</td><td>20–21 Okt 2026</td><td>Keperluan pribadi</td><td><span class="tag tag-red">Ditolak</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ---- PAGE: Data Event (dari event.php) ----
function pageHrmEvents() {
  return `
    <div class="page-heading"><div><h1>Data Event</h1><p>Daftar kegiatan dan acara internal.</p></div><button class="primary-button" id="showEventMessage">+ Buat Event</button></div>
    <div class="event-grid">
      <article class="panel event-card"><span class="event-date">15 OKT 2026</span><h2>Pelatihan Komunikasi</h2><p>Pelatihan internal untuk meningkatkan komunikasi tim.</p><span class="tag tag-blue">Akan datang</span></article>
      <article class="panel event-card"><span class="event-date">22 OKT 2026</span><h2>Town Hall DICO</h2><p>Pertemuan bulanan dan pembaruan perusahaan.</p><span class="tag tag-blue">Akan datang</span></article>
    </div>
    <p class="help-text" id="eventMessage" role="status"></p>
  `;
}

// ---- PAGE: Registrasi (dari registrasi.php) ----
function pageHrmRegistrations() {
  return `
    <div class="page-heading"><div><h1>Registrasi Peserta</h1><p>Contoh daftar peserta event.</p></div><button class="primary-button" id="showRegistrationForm">+ Registrasi Peserta</button></div>
    <div class="panel form-panel" id="registrationFormPanel" hidden>
      <h2>Registrasi peserta (demo)</h2>
      <form id="registrationForm" class="form-grid">
        <label>Nama peserta<input name="name" required placeholder="Nama lengkap"></label>
        <label>Nama event<input name="event" required placeholder="Nama event"></label>
        <label>Email<input name="email" type="email" required placeholder="nama@email.com"></label>
        <div class="form-actions"><button class="primary-button" type="submit">Tambahkan ke tabel</button></div>
      </form>
      <p class="help-text">Data hanya ditampilkan sementara dan tidak disimpan ke database.</p>
    </div>
    <div class="panel table-panel">
      <div class="table-heading"><h2>Peserta Terdaftar</h2><span class="muted">Data contoh</span></div>
      <div class="table-wrap">
        <table id="registrationTable">
          <thead><tr><th>Nama</th><th>Event</th><th>Email</th><th>Status</th></tr></thead>
          <tbody><tr><td>Rina Putri</td><td>Pelatihan Komunikasi</td><td>rina@example.com</td><td><span class="tag tag-green">Terdaftar</span></td></tr></tbody>
        </table>
      </div>
    </div>
  `;
}
