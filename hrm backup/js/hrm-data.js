/* ============================================================
   DICO ERP - HRM: Lapisan data
   ------------------------------------------------------------
   Semua halaman mengambil/menyimpan data lewat HRM.data.
   Urutan: endpoint di HRM_CONFIG -> (jika diaktifkan) data demo
   -> error NOT_CONNECTED. Tidak ada endpoint yang dikarang.
   ============================================================ */
(function (w) {
  'use strict';
  var HRM = (w.HRM = w.HRM || { pages: {}, state: {} });
  var C = w.HRM_CONFIG;

  var demoOn = false;
  try { demoOn = w.sessionStorage.getItem('hrm_demo') === '1'; } catch (e) { /* storage tidak tersedia */ }

  /* ---------- Util ---------- */
  function notConnected(msg) {
    var e = new Error(msg || 'Backend belum terhubung.');
    e.code = 'NOT_CONNECTED';
    return e;
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function spec(entity, action) {
    var ep = C.endpoints && C.endpoints[entity];
    var s = ep && ep[action];
    if (!s) return null;
    return typeof s === 'string' ? { method: 'GET', url: s } : s;
  }

  var DEMO_SUPPORT = {
    employees: ['list', 'create', 'update', 'remove'],
    leaves: ['list', 'updateStatus'],
    events: ['list', 'create', 'update', 'remove'],
    registrations: ['list']
  };

  function demoSupports(entity, action) {
    return demoOn && DEMO_SUPPORT[entity] && DEMO_SUPPORT[entity].indexOf(action) > -1;
  }

  // 'live' | 'demo' | 'off'
  function mode(entity, action) {
    if (spec(entity, action)) return 'live';
    if (demoSupports(entity, action)) return 'demo';
    return 'off';
  }

  /* ---------- Request ---------- */
  function request(s, payload) {
    if (C.requestAdapter) {
      return Promise.resolve(C.requestAdapter(s, payload)).then(checkJson);
    }
    var method = (s.method || 'GET').toUpperCase();
    var url = s.url;
    if (payload && payload.id != null) url = url.replace('{id}', encodeURIComponent(payload.id));
    var opts = { method: method, credentials: 'same-origin', headers: { Accept: 'application/json' } };
    if (payload) {
      if (method === 'GET') {
        var qs = Object.keys(payload).map(function (k) {
          return encodeURIComponent(k) + '=' + encodeURIComponent(payload[k] == null ? '' : payload[k]);
        }).join('&');
        if (qs) url += (url.indexOf('?') > -1 ? '&' : '?') + qs;
      } else {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(payload);
      }
    }
    return w.fetch(url, opts).then(function (res) {
      return res.text().then(function (txt) {
        var json = null;
        try { json = txt ? JSON.parse(txt) : null; } catch (e) { /* bukan JSON */ }
        if (!res.ok) {
          throw new Error((json && (json.message || json.error)) || 'Server mengembalikan HTTP ' + res.status + '.');
        }
        if (json === null && txt) throw new Error('Respons server bukan JSON yang valid.');
        return checkJson(json);
      });
    });
  }

  function checkJson(json) {
    if (json && !Array.isArray(json) && json.success === false) {
      throw new Error(json.message || json.error || 'Permintaan ditolak oleh server.');
    }
    return json;
  }

  function normalizeList(json) {
    if (Array.isArray(json)) return json;
    if (json && Array.isArray(json.data)) return json.data;
    if (json && json.data && Array.isArray(json.data.items)) return json.data.items;
    if (json && Array.isArray(json.items)) return json.items;
    return [];
  }

  /* ---------- Data demo (hanya memori browser) ---------- */
  var store = null;

  function dstr(offset, time) {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + offset);
    var p = function (n) { return n < 10 ? '0' + n : '' + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + (time ? ' ' + time : '');
  }

  function buildStore() {
    var emp = [
      ['EMP-001', 'Andi Pratama', 'Teknologi', 'Frontend Developer', 'Aktif'],
      ['EMP-002', 'Siti Rahmawati', 'HRM', 'HR Officer', 'Aktif'],
      ['EMP-003', 'Budi Santoso', 'Teknologi', 'Backend Developer', 'Aktif'],
      ['EMP-004', 'Dewi Lestari', 'Marketing', 'Content Strategist', 'Aktif'],
      ['EMP-005', 'Rizky Maulana', 'Event', 'Event Coordinator', 'Aktif'],
      ['EMP-006', 'Maya Anggraini', 'Keuangan', 'Finance Staff', 'Nonaktif'],
      ['EMP-007', 'Fajar Nugroho', 'Marketing', 'Community Manager', 'Aktif'],
      ['EMP-008', 'Putri Ayu', 'Event', 'Event Assistant', 'Aktif']
    ].map(function (r, i) {
      return {
        id: 'demo-emp-' + (i + 1), nik: r[0], name: r[1], department: r[2], position: r[3], status: r[4],
        email: r[1].toLowerCase().replace(/\s+/g, '.') + '@demo.local', phone: '0812000000' + (10 + i),
        join_date: dstr(-400 + i * 30)
      };
    });

    var events = [
      { id: 'demo-ev-1', title: 'Workshop UI/UX untuk Pemula', date: dstr(5), time: '09:00', location: 'Aula DICO', category: 'Workshop', status: 'Aktif', description: 'Pengenalan dasar riset pengguna dan prototyping bersama mentor.' },
      { id: 'demo-ev-2', title: 'Community Meetup Bulanan', date: dstr(12), time: '16:00', location: 'Ruang Komunitas', category: 'Meetup', status: 'Aktif', description: 'Pertemuan rutin anggota untuk berbagi proyek dan kabar terbaru.' },
      { id: 'demo-ev-3', title: 'Webinar Karier di Dunia IT', date: dstr(20), time: '19:30', location: 'Online (Zoom)', category: 'Webinar', status: 'Aktif', description: 'Diskusi jalur karier bersama praktisi industri.' },
      { id: 'demo-ev-4', title: 'Hackathon Internal', date: dstr(-10), time: '08:00', location: 'Lab Komputer', category: 'Kompetisi', status: 'Selesai', description: 'Kompetisi 24 jam antar tim internal.' },
      { id: 'demo-ev-5', title: 'Bootcamp Web Development', date: dstr(30), time: '09:00', location: 'Aula DICO', category: 'Bootcamp', status: 'Aktif', description: 'Bootcamp intensif tiga hari.' }
    ];

    var regs = [
      ['Nadia Putri', 1, -3, 'Terdaftar'], ['Kevin Wijaya', 1, -2, 'Terdaftar'], ['Laila Safitri', 2, -2, 'Terdaftar'],
      ['Hendra Gunawan', 3, -1, 'Terdaftar'], ['Salsa Amelia', 1, -1, 'Dibatalkan'], ['Bagas Saputra', 4, -14, 'Hadir'],
      ['Intan Permata', 4, -15, 'Hadir'], ['Yoga Pratama', 5, 0, 'Terdaftar'], ['Citra Dewi', 3, 0, 'Terdaftar']
    ].map(function (r, i) {
      return {
        id: 'demo-rg-' + (i + 1), participant_name: r[0], email: r[0].toLowerCase().replace(/\s+/g, '.') + '@demo.local',
        event_id: 'demo-ev-' + r[1], registered_at: dstr(r[2], '1' + (i % 10) + ':' + (10 + i * 3) + ':00'), status: r[3]
      };
    });

    var leaves = [
      ['Andi Pratama', 'Cuti Tahunan', 7, 9, 'Liburan keluarga', 'Pending', -2],
      ['Siti Rahmawati', 'Cuti Sakit', -3, -2, 'Demam dan istirahat dokter', 'Approved', -4],
      ['Budi Santoso', 'Cuti Penting', 14, 14, 'Urusan keluarga', 'Pending', -1],
      ['Dewi Lestari', 'Cuti Tahunan', 21, 25, 'Perjalanan pribadi', 'Rejected', -6],
      ['Rizky Maulana', 'Cuti Sakit', 2, 3, 'Pemulihan pasca perawatan gigi', 'Pending', 0]
    ].map(function (r, i) {
      return {
        id: 'demo-lv-' + (i + 1), employee_name: r[0], leave_type: r[1], start_date: dstr(r[2]), end_date: dstr(r[3]),
        reason: r[4], status: r[5], created_at: dstr(r[6], '09:00:00')
      };
    });

    return { employees: emp, events: events, registrations: regs, leaves: leaves, seq: 100 };
  }

  function S() { return store || (store = buildStore()); }

  function demoRows(entity) {
    var rows = clone(S()[entity]);
    if (entity === 'registrations') {
      var byId = {};
      S().events.forEach(function (e) { byId[e.id] = e.title; });
      rows.forEach(function (r) { r.event_name = byId[r.event_id] || r.event_name || ''; });
    }
    return rows;
  }

  function findIdx(entity, id) {
    var arr = S()[entity];
    for (var i = 0; i < arr.length; i++) if (String(arr[i].id) === String(id)) return i;
    return -1;
  }

  /* ---------- API publik ---------- */
  HRM.data = {
    mode: mode,
    isDemo: function () { return demoOn; },
    setDemo: function (on) {
      demoOn = !!on;
      try { w.sessionStorage.setItem('hrm_demo', on ? '1' : '0'); } catch (e) { /* abaikan */ }
    },

    list: function (entity) {
      var s = spec(entity, 'list');
      if (s) return request(s, null).then(normalizeList);
      if (demoSupports(entity, 'list')) return Promise.resolve(demoRows(entity));
      return Promise.reject(notConnected());
    },

    create: function (entity, values) {
      var s = spec(entity, 'create');
      if (s) return request(s, values);
      if (demoSupports(entity, 'create')) {
        var row = Object.assign({}, values, { id: 'demo-' + (++S().seq) });
        S()[entity].unshift(row);
        return Promise.resolve(row);
      }
      return Promise.reject(notConnected('Fungsi simpan belum terhubung ke backend.'));
    },

    update: function (entity, id, values) {
      var s = spec(entity, 'update');
      if (s) return request(s, Object.assign({ id: id }, values));
      if (demoSupports(entity, 'update')) {
        var i = findIdx(entity, id);
        if (i < 0) return Promise.reject(new Error('Data tidak ditemukan.'));
        Object.assign(S()[entity][i], values);
        return Promise.resolve(S()[entity][i]);
      }
      return Promise.reject(notConnected('Fungsi ubah belum terhubung ke backend.'));
    },

    remove: function (entity, id) {
      var s = spec(entity, 'remove');
      if (s) return request(s, { id: id });
      if (demoSupports(entity, 'remove')) {
        var i = findIdx(entity, id);
        if (i > -1) S()[entity].splice(i, 1);
        return Promise.resolve({ success: true });
      }
      return Promise.reject(notConnected('Fungsi hapus belum terhubung ke backend.'));
    },

    // kind: 'approved' | 'rejected'
    setLeaveStatus: function (id, kind) {
      var value = C.leaveStatusValues[kind];
      var s = spec('leaves', 'updateStatus');
      if (s) return request(s, { id: id, status: value });
      if (demoSupports('leaves', 'updateStatus')) {
        var i = findIdx('leaves', id);
        if (i < 0) return Promise.reject(new Error('Data tidak ditemukan.'));
        S().leaves[i].status = value;
        return Promise.resolve({ success: true });
      }
      return Promise.reject(notConnected('Fungsi persetujuan cuti belum terhubung ke backend.'));
    },

    // Riwayat aktivitas: hanya dari endpoint nyata (tidak ada versi demo)
    activity: function () {
      var s = spec('activity', 'list');
      if (s) return request(s, null).then(normalizeList);
      return Promise.reject(notConnected());
    }
  };
})(window);
