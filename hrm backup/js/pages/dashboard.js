/* DICO ERP - HRM: Halaman Dashboard */
(function (w) {
  'use strict';
  var HRM = (w.HRM = w.HRM || { pages: {}, state: {} });
  var ui = HRM.ui;
  var esc = ui.esc;

  var COLORS = ['#2f8fff', '#0b1a3a', '#5eb0ff', '#1c6fee', '#8ec9ff', '#3b4d7a', '#c3dcff'];
  var CHART_KEYS = [
    { key: 'department', label: 'Departemen' },
    { key: 'status', label: 'Status' },
    { key: 'position', label: 'Jabatan' }
  ];
  var DONE_RE = /^(selesai|done|completed|dibatalkan|cancel)/i;

  function userName() {
    var n = document.getElementById('userName');
    var t = n && n.textContent ? n.textContent.trim() : '';
    return t || 'Admin';
  }

  function greeting() {
    var h = new Date().getHours();
    return h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam';
  }

  function fetchList(entity) {
    return HRM.data.list(entity).then(
      function (rows) { return { ok: true, rows: rows }; },
      function (err) { return { ok: false, err: err, rows: [] }; }
    );
  }

  function failHtml(res, label) {
    if (res.err && res.err.code === 'NOT_CONNECTED') {
      return ui.empty('plug', 'Belum terhubung', 'Sumber data ' + label + ' belum dikonfigurasi di js/hrm-config.js.');
    }
    return ui.empty('alert', 'Data gagal dimuat', (res.err && res.err.message) || 'Terjadi kesalahan.');
  }

  function cmpDesc(a, b) { return String(b || '').localeCompare(String(a || '')); }

  /* ---------- Kartu statistik ---------- */
  function statCard(o) {
    return '<article class="hrm-stat">' +
      '<div class="hrm-stat-ic hrm-stat-ic-' + o.tone + '">' + ui.icon(o.icon, 22) + '</div>' +
      '<div class="hrm-stat-body"><div class="hrm-stat-label">' + esc(o.label) + '</div>' +
      '<div class="hrm-stat-value">' + (o.value == null ? '—' : esc(o.value)) + '</div>' +
      '<div class="hrm-stat-sub">' + esc(o.sub) + '</div></div></article>';
  }

  /* ---------- Grafik karyawan ---------- */
  function chartBody(rows, key) {
    var map = {}, total = rows.length;
    rows.forEach(function (r) {
      var v = r[key] == null || String(r[key]).trim() === '' ? 'Tidak diisi' : String(r[key]).trim();
      map[v] = (map[v] || 0) + 1;
    });
    var items = Object.keys(map).map(function (k) { return { label: k, n: map[k] }; })
      .sort(function (a, b) { return b.n - a.n; });
    if (items.length > 6) {
      var rest = items.slice(6).reduce(function (s, i) { return s + i.n; }, 0);
      items = items.slice(0, 6).concat([{ label: 'Lainnya', n: rest }]);
    }
    var acc = 0, stops = [];
    items.forEach(function (it, i) {
      var p = it.n / total * 100;
      it.pct = p;
      it.color = COLORS[i % COLORS.length];
      stops.push(it.color + ' ' + acc.toFixed(2) + '% ' + (acc + p).toFixed(2) + '%');
      acc += p;
    });
    var legend = items.map(function (it) {
      return '<li><span class="hrm-dot" style="background:' + it.color + '"></span>' +
        '<span class="hrm-legend-label">' + esc(it.label) + '</span>' +
        '<span class="hrm-legend-n">' + it.n + ' <small>(' + Math.round(it.pct) + '%)</small></span>' +
        '<span class="hrm-legend-bar"><i style="width:' + it.pct.toFixed(1) + '%;background:' + it.color + '"></i></span></li>';
    }).join('');
    return '<div class="hrm-chart"><div class="hrm-donut" style="background:conic-gradient(' + stops.join(',') + ')" role="img" aria-label="Diagram lingkaran jumlah karyawan">' +
      '<div class="hrm-donut-hole"><strong>' + total + '</strong><span>karyawan</span></div></div>' +
      '<ul class="hrm-legend">' + legend + '</ul></div>';
  }

  function chartSection(res, state) {
    if (!res.ok) return failHtml(res, 'karyawan');
    if (!res.rows.length) return ui.empty('users', 'Belum ada data karyawan', 'Grafik akan muncul setelah data karyawan tersedia.');
    var avail = CHART_KEYS.filter(function (c) {
      return res.rows.some(function (r) { return r[c.key] != null && String(r[c.key]).trim() !== ''; });
    });
    if (!avail.length) return ui.empty('alert', 'Tidak ada kategori terisi', 'Kolom departemen, status, dan jabatan belum terisi pada data karyawan.');
    if (!avail.some(function (c) { return c.key === state.chartKey; })) state.chartKey = avail[0].key;
    var tabs = avail.map(function (c) {
      return '<button type="button" class="hrm-tab' + (c.key === state.chartKey ? ' is-active' : '') + '" role="tab" aria-selected="' + (c.key === state.chartKey) + '" data-chart="' + c.key + '">' + esc(c.label) + '</button>';
    }).join('');
    return '<div class="hrm-tabs" role="tablist" aria-label="Kategori grafik">' + tabs + '</div><div data-slot="chart">' + chartBody(res.rows, state.chartKey) + '</div>';
  }

  /* ---------- Daftar ---------- */
  function recentLeaves(res) {
    if (!res.ok) return failHtml(res, 'pengajuan cuti');
    if (!res.rows.length) return ui.empty('clipboard', 'Belum ada pengajuan cuti', 'Pengajuan terbaru akan tampil di sini.');
    var rows = res.rows.slice().sort(function (a, b) {
      return cmpDesc(a.created_at || a.start_date, b.created_at || b.start_date);
    }).slice(0, 5);
    return '<div class="hrm-table-wrap"><table class="hrm-table"><thead><tr><th scope="col">Karyawan</th><th scope="col">Jenis cuti</th><th scope="col">Periode</th><th scope="col">Status</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr><td>' + esc(r.employee_name || '—') + '</td><td>' + esc(r.leave_type || '—') + '</td><td>' + esc(ui.period(r.start_date, r.end_date)) + '</td><td>' + ui.badge(r.status) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function upcomingEvents(res) {
    if (!res.ok) return failHtml(res, 'event');
    var today = ui.dayKey(new Date());
    var rows = res.rows.filter(function (e) {
      var d = ui.parseDate(e.date);
      if (!d || ui.dayKey(d) < today) return false;
      return !DONE_RE.test(String(e.status || '').trim());
    }).sort(function (a, b) {
      return (ui.dayKey(ui.parseDate(a.date)) + ' ' + (a.time || '')).localeCompare(ui.dayKey(ui.parseDate(b.date)) + ' ' + (b.time || ''));
    }).slice(0, 5);
    if (!rows.length) return ui.empty('calendar', 'Tidak ada event mendatang', res.rows.length ? 'Semua event yang tercatat sudah lewat atau selesai.' : 'Belum ada event yang tercatat.');
    return '<ul class="hrm-events">' + rows.map(function (e) {
      var d = ui.parseDate(e.date);
      var meta = [];
      if (e.time) meta.push(ui.icon('clock', 13) + esc(ui.fmtTime(e.time)));
      if (e.location) meta.push(ui.icon('pin', 13) + esc(e.location));
      return '<li><div class="hrm-datebox"><strong>' + d.getDate() + '</strong><span>' + esc(d.toLocaleDateString('id-ID', { month: 'short' })) + '</span></div>' +
        '<div class="hrm-event-main"><div class="hrm-event-title">' + esc(e.title || '—') + '</div>' +
        '<div class="hrm-event-meta">' + meta.map(function (m) { return '<span>' + m + '</span>'; }).join('') + '</div></div>' +
        (e.status ? ui.badge(e.status) : '') + '</li>';
    }).join('') + '</ul>';
  }

  function recentRegistrations(res) {
    if (!res.ok) return failHtml(res, 'registrasi');
    if (!res.rows.length) return ui.empty('file', 'Belum ada registrasi', 'Pendaftar terbaru akan tampil di sini.');
    var rows = res.rows.slice().sort(function (a, b) { return cmpDesc(a.registered_at, b.registered_at); }).slice(0, 5);
    return '<div class="hrm-table-wrap"><table class="hrm-table"><thead><tr><th scope="col">Peserta</th><th scope="col">Event</th><th scope="col">Tanggal</th><th scope="col">Status</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr><td>' + esc(r.participant_name || '—') + '</td><td>' + esc(r.event_name || '—') + '</td><td>' + esc(ui.fmtDate(r.registered_at)) + '</td><td>' + ui.badge(r.status) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function activitySection(res) {
    if (!res.ok) {
      if (res.err && res.err.code === 'NOT_CONNECTED') {
        return ui.empty('activity', 'Riwayat aktivitas belum tersedia', 'Belum ada sumber data aktivitas yang terhubung, jadi bagian ini sengaja dikosongkan.');
      }
      return failHtml(res, 'aktivitas');
    }
    if (!res.rows.length) return ui.empty('activity', 'Belum ada aktivitas', 'Aktivitas terbaru akan tampil di sini.');
    return '<ul class="hrm-activity">' + res.rows.slice(0, 6).map(function (a) {
      var text = a.message || a.title || a.description || '—';
      var when = a.created_at || a.time || a.date;
      var who = a.user || a.actor || a.user_name;
      return '<li><span class="hrm-dot"></span><div><div>' + esc(text) + '</div><small>' + (who ? esc(who) + ' · ' : '') + esc(ui.fmtDateTime(when)) + '</small></div></li>';
    }).join('') + '</ul>';
  }

  function quickActions() {
    var items = [
      { href: '#hrm/employees', icon: 'userplus', label: 'Tambah Karyawan', pending: 'add' },
      { href: '#hrm/leaves', icon: 'clipboard', label: 'Pengajuan Cuti' },
      { href: '#hrm/events', icon: 'calendar', label: 'Data Event' },
      { href: '#hrm/registrations', icon: 'file', label: 'Registrasi' }
    ];
    return '<div class="hrm-quick">' + items.map(function (i) {
      return '<a class="hrm-quick-item" href="' + i.href + '"' + (i.pending ? ' data-hrm-pending="' + i.pending + '"' : '') + '>' +
        '<span class="hrm-quick-ic">' + ui.icon(i.icon, 20) + '</span><span>' + esc(i.label) + '</span></a>';
    }).join('') + '</div>';
  }

  function card(title, body, link) {
    return '<section class="hrm-card"><div class="hrm-card-head"><h2>' + esc(title) + '</h2>' +
      (link ? '<a class="hrm-card-link" href="' + link.href + '">' + esc(link.text) + ui.icon('arrow', 14) + '</a>' : '') +
      '</div><div class="hrm-card-body">' + body + '</div></section>';
  }

  /* ---------- Mount ---------- */
  HRM.pages.dashboard = {
    mount: function (el) {
      var state = { chartKey: 'department' };
      var today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

      var hero =
        '<header class="hrm-hero"><div><p class="hrm-hero-hi">' + esc(greeting()) + ', ' + esc(userName()) + '</p>' +
        '<h1 class="hrm-hero-title">Dashboard HRM DICO Community</h1></div>' +
        '<div class="hrm-hero-side"><span class="hrm-date">' + ui.icon('calendar', 16) + esc(today) + '</span>' +
        '<button type="button" class="hrm-btn hrm-btn-onDark" data-act="refresh">' + ui.icon('refresh', 16) + 'Muat ulang</button></div></header>';

      el.innerHTML = '<div class="hrm-page">' + hero +
        '<div class="hrm-stats">' + '<div class="hrm-skel hrm-skel-card"></div>'.repeat(4) + '</div></div>';

      el.onclick = function (e) {
        var b = e.target.closest && e.target.closest('[data-act="refresh"]');
        if (b) HRM.remount();
        var t = e.target.closest && e.target.closest('[data-chart]');
        if (t && state.employees && state.employees.ok) {
          state.chartKey = t.getAttribute('data-chart');
          var host = el.querySelector('[data-slot="chart-host"]');
          if (host) host.innerHTML = chartSection(state.employees, state);
        }
      };

      return Promise.all([
        fetchList('employees'), fetchList('leaves'), fetchList('events'), fetchList('registrations'),
        HRM.data.activity().then(
          function (rows) { return { ok: true, rows: rows }; },
          function (err) { return { ok: false, err: err, rows: [] }; }
        )
      ]).then(function (r) {
        var emp = r[0], lv = r[1], ev = r[2], rg = r[3], ac = r[4];
        state.employees = emp;

        var activeN = emp.ok ? emp.rows.filter(function (x) { return ui.statusTone(x.status) === 'success'; }).length : 0;
        var pendingN = lv.ok ? lv.rows.filter(function (x) { return ui.statusKind(x.status) === 'pending'; }).length : 0;
        var off = function (res) { return res.ok ? null : (res.err && res.err.code === 'NOT_CONNECTED' ? 'Belum terhubung' : 'Gagal dimuat'); };

        var stats = [
          statCard({ label: 'Total Karyawan', icon: 'users', tone: 'blue', value: emp.ok ? emp.rows.length : null,
            sub: off(emp) || (activeN ? activeN + ' berstatus aktif · saat ini' : 'Jumlah saat ini') }),
          statCard({ label: 'Pengajuan Cuti', icon: 'clipboard', tone: 'navy', value: lv.ok ? lv.rows.length : null,
            sub: off(lv) || (pendingN + ' menunggu persetujuan · semua periode') }),
          statCard({ label: 'Total Event', icon: 'calendar', tone: 'sky', value: ev.ok ? ev.rows.length : null,
            sub: off(ev) || 'Semua periode' }),
          statCard({ label: 'Total Registrasi', icon: 'file', tone: 'indigo', value: rg.ok ? rg.rows.length : null,
            sub: off(rg) || 'Semua periode' })
        ].join('');

        var banner = ui.banner([
          { label: 'Karyawan', mode: HRM.data.mode('employees', 'list') },
          { label: 'Cuti', mode: HRM.data.mode('leaves', 'list') },
          { label: 'Event', mode: HRM.data.mode('events', 'list') },
          { label: 'Registrasi', mode: HRM.data.mode('registrations', 'list') }
        ]);

        el.innerHTML = '<div class="hrm-page">' + hero + banner +
          '<div class="hrm-stats">' + stats + '</div>' +
          '<div class="hrm-grid-main">' +
          card('Statistik karyawan', '<div data-slot="chart-host">' + chartSection(emp, state) + '</div>', { href: '#hrm/employees', text: 'Data karyawan' }) +
          card('Event mendatang', upcomingEvents(ev), { href: '#hrm/events', text: 'Semua event' }) +
          '</div><div class="hrm-grid-main">' +
          card('Pengajuan cuti terbaru', recentLeaves(lv), { href: '#hrm/leaves', text: 'Lihat semua pengajuan' }) +
          card('Registrasi terbaru', recentRegistrations(rg), { href: '#hrm/registrations', text: 'Semua registrasi' }) +
          '</div><div class="hrm-grid-main hrm-grid-even">' +
          card('Aktivitas terbaru', activitySection(ac)) +
          card('Aksi cepat', quickActions()) +
          '</div></div>';
      });
    }
  };
})(window);
