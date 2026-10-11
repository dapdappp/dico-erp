/* ============================================================
   DICO ERP - HRM: Helper UI (mandiri, tidak bergantung core/ui.js)
   ============================================================ */
(function (w) {
  'use strict';
  var HRM = (w.HRM = w.HRM || { pages: {}, state: {} });
  var ui = (HRM.ui = {});

  /* ---------- Ikon (SVG inline) ---------- */
  var ICONS = {
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    userplus: '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    clipboard: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    xcircle: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    arrow: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    left: '<polyline points="15 18 9 12 15 6"/>',
    right: '<polyline points="9 18 15 12 9 6"/>',
    refresh: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>',
    plug: '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8z"/>'
  };

  ui.icon = function (name, size) {
    var s = size || 18;
    return '<svg class="hrm-ic" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (ICONS[name] || '') + '</svg>';
  };

  /* ---------- Util ---------- */
  var ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  ui.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESC_MAP[c]; });
  };

  ui.debounce = function (fn, ms) {
    var t;
    return function () {
      var a = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, a); }, ms);
    };
  };

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  // Parse 'YYYY-MM-DD' sebagai tanggal lokal (menghindari geser zona waktu)
  ui.parseDate = function (v) {
    if (!v) return null;
    if (v instanceof Date) return isNaN(v) ? null : v;
    var s = String(v).trim();
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    var d = new Date(s.replace(' ', 'T'));
    return isNaN(d) ? null : d;
  };

  ui.dayKey = function (d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  };

  ui.fmtDate = function (v) {
    var d = ui.parseDate(v);
    return d ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  };

  ui.fmtDateTime = function (v) {
    var d = ui.parseDate(v);
    if (!d) return '—';
    var hasTime = /[T\s]\d{2}:\d{2}/.test(String(v));
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) +
      (hasTime ? ', ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) : '');
  };

  ui.fmtTime = function (v) {
    if (!v) return '—';
    var m = /^(\d{2}):(\d{2})/.exec(String(v));
    return m ? m[1] + ':' + m[2] : String(v);
  };

  ui.period = function (start, end) {
    if (!start && !end) return '—';
    if (!end || String(start) === String(end)) return ui.fmtDate(start);
    return ui.fmtDate(start) + ' – ' + ui.fmtDate(end);
  };

  /* ---------- Status ---------- */
  var TONES = {
    success: ['approved', 'disetujui', 'setuju', 'diterima', 'aktif', 'active', 'published', 'terdaftar', 'registered', 'hadir', 'confirmed', 'dikonfirmasi', 'berlangsung'],
    warn: ['pending', 'menunggu', 'diajukan', 'submitted', 'waiting', 'draft'],
    danger: ['rejected', 'ditolak', 'tolak', 'nonaktif', 'inactive', 'dibatalkan', 'cancelled', 'canceled']
  };

  ui.statusTone = function (s) {
    var k = String(s == null ? '' : s).trim().toLowerCase();
    if (!k) return 'neutral';
    for (var tone in TONES) {
      if (TONES[tone].indexOf(k) > -1) return tone;
    }
    return 'neutral';
  };

  // Untuk logika cuti: 'pending' | 'approved' | 'rejected' | 'other'
  ui.statusKind = function (s) {
    var k = String(s == null ? '' : s).trim().toLowerCase();
    if (['pending', 'menunggu', 'diajukan', 'submitted', 'waiting'].indexOf(k) > -1) return 'pending';
    if (['approved', 'disetujui', 'setuju', 'diterima'].indexOf(k) > -1) return 'approved';
    if (['rejected', 'ditolak', 'tolak'].indexOf(k) > -1) return 'rejected';
    return 'other';
  };

  ui.badge = function (s) {
    if (s == null || s === '') return '<span class="hrm-dash">—</span>';
    return '<span class="hrm-badge hrm-badge-' + ui.statusTone(s) + '">' + ui.esc(s) + '</span>';
  };

  /* ---------- Toast ---------- */
  ui.toast = function (msg, type) {
    var box = document.getElementById('hrm-toasts');
    if (!box) {
      box = document.createElement('div');
      box.id = 'hrm-toasts';
      box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    var t = document.createElement('div');
    var kind = type || 'info';
    t.className = 'hrm-toast hrm-toast-' + kind;
    t.innerHTML = ui.icon(kind === 'success' ? 'check' : kind === 'error' ? 'alert' : 'info', 18) + '<span>' + ui.esc(msg) + '</span>';
    box.appendChild(t);
    setTimeout(function () {
      t.classList.add('is-out');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 250);
    }, kind === 'error' ? 6500 : 4200);
  };

  /* ---------- Modal (dirender ke #modal-root) ---------- */
  var escHandler = null;
  var onCloseCb = null;

  ui.closeModal = function () {
    var m = document.getElementById('hrm-modal');
    if (m && m.parentNode) m.parentNode.removeChild(m);
    if (escHandler) { document.removeEventListener('keydown', escHandler); escHandler = null; }
    if (onCloseCb) { var f = onCloseCb; onCloseCb = null; f(); }
  };

  ui.openModal = function (o) {
    ui.closeModal();
    var root = document.getElementById('modal-root') || document.body;
    var wrap = document.createElement('div');
    wrap.id = 'hrm-modal';
    wrap.className = 'hrm-modal-backdrop';
    wrap.innerHTML =
      '<div class="hrm-modal' + (o.size ? ' hrm-modal-' + o.size : '') + '" role="dialog" aria-modal="true" aria-labelledby="hrm-modal-title">' +
      '<div class="hrm-modal-head"><h2 id="hrm-modal-title">' + ui.esc(o.title || '') + '</h2>' +
      '<button type="button" class="hrm-icon-btn" data-close aria-label="Tutup">' + ui.icon('x', 18) + '</button></div>' +
      '<div class="hrm-modal-body">' + (o.body || '') + '</div>' +
      (o.footer ? '<div class="hrm-modal-foot">' + o.footer + '</div>' : '') +
      '</div>';
    root.appendChild(wrap);
    onCloseCb = o.onClose || null;

    wrap.addEventListener('mousedown', function (e) {
      if (e.target === wrap) ui.closeModal();
    });
    wrap.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('[data-close]')) ui.closeModal();
    });
    escHandler = function (e) { if (e.key === 'Escape') ui.closeModal(); };
    document.addEventListener('keydown', escHandler);

    var first = wrap.querySelector('input:not([type=hidden]),select,textarea,[data-ok]');
    if (first && first.focus) setTimeout(function () { first.focus(); }, 30);
    return { el: wrap, body: wrap.querySelector('.hrm-modal-body') };
  };

  ui.confirm = function (o) {
    return new Promise(function (resolve) {
      var done = false;
      function fin(v) {
        if (done) return;
        done = true;
        ui.closeModal();
        resolve(v);
      }
      var m = ui.openModal({
        title: o.title || 'Konfirmasi',
        size: 'sm',
        body: '<p class="hrm-confirm-msg">' + ui.esc(o.message || '') + '</p>',
        footer: '<button type="button" class="hrm-btn hrm-btn-ghost" data-close>Batal</button>' +
          '<button type="button" class="hrm-btn ' + (o.danger ? 'hrm-btn-danger' : 'hrm-btn-primary') + '" data-ok>' + ui.esc(o.confirmText || 'Ya, lanjutkan') + '</button>',
        onClose: function () { fin(false); }
      });
      m.el.querySelector('[data-ok]').addEventListener('click', function () { fin(true); });
    });
  };

  /* ---------- Banner status koneksi ---------- */
  // items: [{ label, mode }]  mode = 'live' | 'demo' | 'off'
  ui.banner = function (items) {
    var demos = [], offs = [];
    items.forEach(function (i) {
      if (i.mode === 'demo') demos.push(i.label);
      else if (i.mode === 'off') offs.push(i.label);
    });
    if (demos.length) {
      return '<div class="hrm-banner hrm-banner-demo" role="status">' + ui.icon('info', 20) +
        '<div><strong>Data demo aktif.</strong> ' + ui.esc(demos.join(', ')) + ' memakai contoh data, bukan data produksi. ' +
        'Perubahan hanya tersimpan di memori browser dan hilang saat halaman dimuat ulang. ' +
        '<button type="button" class="hrm-link" data-hrm-demo="off">Matikan data demo</button></div></div>';
    }
    if (offs.length) {
      return '<div class="hrm-banner hrm-banner-warn" role="status">' + ui.icon('plug', 20) +
        '<div><strong>Backend belum terhubung.</strong> Endpoint untuk ' + ui.esc(offs.join(', ')) +
        ' belum diisi di <code>js/hrm-config.js</code>, sehingga data tidak ditampilkan dan tidak bisa disimpan. ' +
        (w.HRM_CONFIG.demoAvailable ? '<button type="button" class="hrm-link" data-hrm-demo="on">Tampilkan data demo</button>' : '') +
        '</div></div>';
    }
    return '';
  };

  ui.empty = function (icon, title, text, extra) {
    return '<div class="hrm-empty"><div class="hrm-empty-ic">' + ui.icon(icon, 26) + '</div><h3>' + ui.esc(title) + '</h3>' +
      (text ? '<p>' + ui.esc(text) + '</p>' : '') + (extra || '') + '</div>';
  };

  /* ---------- Mount halaman ---------- */
  HRM.mountPage = function (page, el) {
    ui.closeModal();
    HRM.current = { page: page, el: el };
    var p = HRM.pages[page];
    if (!p) {
      el.innerHTML = ui.empty('alert', 'Halaman tidak ditemukan', 'Halaman HRM "' + page + '" belum dimuat.');
      return;
    }
    try {
      return p.mount(el);
    } catch (err) {
      if (w.console) console.error('[HRM]', err);
      el.innerHTML = ui.empty('alert', 'Halaman gagal ditampilkan', err && err.message ? err.message : 'Terjadi kesalahan.');
    }
  };

  HRM.remount = function () {
    var c = HRM.current;
    if (c && c.el && c.el.isConnected !== false) HRM.mountPage(c.page, c.el);
  };

  /* ---------- Event global (sekali saja) ---------- */
  if (!HRM._bound) {
    HRM._bound = true;
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-hrm-demo]');
      if (t) {
        e.preventDefault();
        HRM.data.setDemo(t.getAttribute('data-hrm-demo') === 'on');
        HRM.remount();
        return;
      }
      var p = e.target.closest && e.target.closest('[data-hrm-pending]');
      if (p) HRM.state.pendingAction = p.getAttribute('data-hrm-pending');
    });
  }
})(window);
