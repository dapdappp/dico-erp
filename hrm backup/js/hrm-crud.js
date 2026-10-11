/* ============================================================
   DICO ERP - HRM: Mesin halaman daftar (tabel, cari, filter,
   pagination, detail, formulir, hapus) berbasis HRM_SCHEMA.
   Dipakai oleh halaman Karyawan, Cuti, Event, dan Registrasi.
   ============================================================ */
(function (w) {
  'use strict';
  var HRM = (w.HRM = w.HRM || { pages: {}, state: {} });
  var ui = HRM.ui;
  var esc = ui.esc;

  function isEmpty(v) { return v === null || v === undefined || v === ''; }
  function str(v) { return isEmpty(v) ? '' : String(v); }

  function mount(el, cfg) {
    var schema = w.HRM_SCHEMA[cfg.entity];
    var fields = schema.fields;
    var pk = schema.pk || 'id';
    var S = {
      rows: [], aux: null, loading: true, error: null, q: '', filters: {}, page: 1,
      size: w.HRM_CONFIG.pageSize || 10,
      sort: schema.defaultSort ? { key: schema.defaultSort.key, dir: schema.defaultSort.dir } : null
    };

    var pending = HRM.state.pendingAction;
    HRM.state.pendingAction = null;
    if (cfg.initialFilters) {
      var init = cfg.initialFilters();
      if (init) S.filters = init;
    }

    var addBtn = cfg.allowCreate
      ? '<button type="button" class="hrm-btn hrm-btn-primary" data-act="add">' + ui.icon('plus', 16) + esc(cfg.addLabel || 'Tambah') + '</button>'
      : '';

    el.innerHTML =
      '<div class="hrm-page">' +
      '<header class="hrm-head"><div><h1 class="hrm-title">' + esc(cfg.title) + '</h1>' +
      '<p class="hrm-sub">' + esc(cfg.subtitle || '') + '</p></div>' +
      '<div class="hrm-head-actions">' + addBtn + '</div></header>' +
      '<div data-slot="banner"></div>' +
      (cfg.note ? '<div class="hrm-banner hrm-banner-note">' + ui.icon('info', 20) + '<div>' + cfg.note + '</div></div>' : '') +
      '<section class="hrm-card"><div data-slot="toolbar"></div><div data-slot="table"></div></section>' +
      '</div>';

    function slot(n) { return el.querySelector('[data-slot="' + n + '"]'); }
    function extraFilters() { return cfg.extraFilters ? cfg.extraFilters(S) || [] : []; }

    /* ---------- Muat data ---------- */
    function load() {
      S.loading = true;
      S.error = null;
      renderTable();
      var p = HRM.data.list(cfg.entity).then(
        function (rows) { S.rows = rows; },
        function (err) { S.rows = []; S.error = err; }
      );
      var a = cfg.loadAux
        ? cfg.loadAux().then(function (r) { S.aux = r; }, function () { S.aux = {}; })
        : Promise.resolve();
      return Promise.all([p, a]).then(function () {
        if (cfg.enrich && !S.error) cfg.enrich(S.rows, S.aux || {});
        S.loading = false;
        slot('banner').innerHTML = ui.banner([{ label: schema.label, mode: HRM.data.mode(cfg.entity, 'list') }]);
        renderToolbar();
        renderTable();
      });
    }

    /* ---------- Toolbar ---------- */
    function filterDefs() {
      var defs = [];
      fields.forEach(function (f) {
        if (!f.filter) return;
        var seen = {}, opts = [];
        S.rows.forEach(function (r) {
          var v = str(r[f.key]).trim();
          if (v && !seen[v]) { seen[v] = 1; opts.push({ value: v, label: v }); }
        });
        if (!opts.length && !S.rows.length) {
          (f.options || []).forEach(function (o) { opts.push({ value: o, label: o }); });
        }
        if (opts.length) defs.push({ key: f.key, label: 'Semua ' + f.label.toLowerCase(), options: opts });
      });
      return defs.concat(extraFilters());
    }

    function renderToolbar() {
      var defs = filterDefs();
      Object.keys(S.filters).forEach(function (k) {
        var d = defs.filter(function (x) { return x.key === k; })[0];
        if (!d || !d.options.some(function (o) { return String(o.value) === String(S.filters[k]); })) delete S.filters[k];
      });

      var searchLabels = fields.filter(function (f) { return f.search; }).slice(0, 3).map(function (f) { return f.label.toLowerCase(); });
      var ph = cfg.searchPlaceholder || ('Cari ' + searchLabels.join(', ') + '…');

      var html = '<div class="hrm-toolbar"><label class="hrm-search">' + ui.icon('search', 16) +
        '<input type="search" class="hrm-input" data-q value="' + esc(S.q) + '" placeholder="' + esc(ph) + '" aria-label="Cari ' + esc(schema.label) + '"></label>';
      defs.forEach(function (d) {
        html += '<select class="hrm-select" data-filter="' + esc(d.key) + '" aria-label="' + esc(d.label) + '"><option value="">' + esc(d.label) + '</option>';
        d.options.forEach(function (o) {
          html += '<option value="' + esc(o.value) + '"' + (String(S.filters[d.key]) === String(o.value) ? ' selected' : '') + '>' + esc(o.label) + '</option>';
        });
        html += '</select>';
      });
      html += '<button type="button" class="hrm-btn hrm-btn-ghost hrm-btn-sm" data-act="reset">Atur ulang</button>' +
        '<span class="hrm-count" data-slot="count" aria-live="polite"></span></div>';
      slot('toolbar').innerHTML = html;
    }

    /* ---------- Filter, sort ---------- */
    function filtered() {
      var q = S.q.trim().toLowerCase();
      var extras = extraFilters();
      var list = S.rows.filter(function (r) {
        if (q) {
          var hit = fields.some(function (f) { return f.search && str(r[f.key]).toLowerCase().indexOf(q) > -1; });
          if (!hit) return false;
        }
        for (var k in S.filters) {
          var v = S.filters[k];
          if (!v) continue;
          var ef = extras.filter(function (x) { return x.key === k; })[0];
          if (ef) { if (!ef.match(r, v)) return false; }
          else if (str(r[k]).trim() !== v) return false;
        }
        return true;
      });
      if (S.sort) {
        var key = S.sort.key, dir = S.sort.dir === 'desc' ? -1 : 1;
        list = list.slice().sort(function (a, b) {
          var x = a[key], y = b[key];
          if (isEmpty(x) && isEmpty(y)) return 0;
          if (isEmpty(x)) return 1;
          if (isEmpty(y)) return -1;
          return String(x).localeCompare(String(y), 'id', { numeric: true }) * dir;
        });
      }
      return list;
    }

    /* ---------- Tabel ---------- */
    function cell(f, row) {
      if (f.render) return f.render(row);
      var v = row[f.key];
      if (isEmpty(v)) return '<span class="hrm-dash">—</span>';
      if (f.badge) return ui.badge(v);
      if (f.type === 'date') return esc(ui.fmtDate(v));
      if (f.type === 'datetime') return esc(ui.fmtDateTime(v));
      if (f.type === 'time') return esc(ui.fmtTime(v));
      return esc(v);
    }

    function actionsHtml(row) {
      var id = esc(str(row[pk]));
      var h = '<div class="hrm-row-actions">';
      h += '<button type="button" class="hrm-icon-btn" data-act="detail" data-id="' + id + '" title="Detail" aria-label="Lihat detail">' + ui.icon('eye', 16) + '</button>';
      (cfg.rowActions ? cfg.rowActions(row) : []).forEach(function (a) {
        h += '<button type="button" class="hrm-icon-btn' + (a.tone ? ' hrm-tone-' + a.tone : '') + '" data-act="' + esc(a.act) + '" data-id="' + id + '" title="' + esc(a.label) + '" aria-label="' + esc(a.label) + '">' + ui.icon(a.icon || 'arrow', 16) + '</button>';
      });
      if (cfg.allowEdit) h += '<button type="button" class="hrm-icon-btn" data-act="edit" data-id="' + id + '" title="Ubah" aria-label="Ubah">' + ui.icon('edit', 16) + '</button>';
      if (cfg.allowDelete) h += '<button type="button" class="hrm-icon-btn hrm-tone-danger" data-act="delete" data-id="' + id + '" title="Hapus" aria-label="Hapus">' + ui.icon('trash', 16) + '</button>';
      return h + '</div>';
    }

    function pagerHtml(total, pages, start) {
      var from = total ? start + 1 : 0;
      var to = Math.min(start + S.size, total);
      var a = Math.max(1, S.page - 2), b = Math.min(pages, a + 4);
      a = Math.max(1, b - 4);
      var h = '<div class="hrm-pager"><span class="hrm-pager-info">Menampilkan ' + from + '–' + to + ' dari ' + total + ' data</span><div class="hrm-pager-btns">';
      h += '<button type="button" class="hrm-page-btn" data-act="page" data-page="' + (S.page - 1) + '"' + (S.page <= 1 ? ' disabled' : '') + ' aria-label="Halaman sebelumnya">' + ui.icon('left', 16) + '</button>';
      for (var i = a; i <= b; i++) {
        h += '<button type="button" class="hrm-page-btn' + (i === S.page ? ' is-active' : '') + '" data-act="page" data-page="' + i + '"' + (i === S.page ? ' aria-current="page"' : '') + '>' + i + '</button>';
      }
      h += '<button type="button" class="hrm-page-btn" data-act="page" data-page="' + (S.page + 1) + '"' + (S.page >= pages ? ' disabled' : '') + ' aria-label="Halaman berikutnya">' + ui.icon('right', 16) + '</button>';
      return h + '</div></div>';
    }

    function renderTable() {
      var box = slot('table');
      if (!box) return;
      var cnt = slot('count');

      if (S.loading) {
        var sk = '';
        for (var i = 0; i < 5; i++) sk += '<div class="hrm-skel-row"><span class="hrm-skel"></span><span class="hrm-skel"></span><span class="hrm-skel"></span></div>';
        box.innerHTML = '<div class="hrm-skel-wrap" aria-busy="true">' + sk + '</div>';
        if (cnt) cnt.textContent = '';
        return;
      }

      if (S.error) {
        if (cnt) cnt.textContent = '';
        if (S.error.code === 'NOT_CONNECTED') {
          box.innerHTML = ui.empty('plug', 'Data ' + schema.label.toLowerCase() + ' belum terhubung',
            'Endpoint daftar ' + schema.label.toLowerCase() + ' belum diisi di js/hrm-config.js, jadi tidak ada data yang bisa ditampilkan.',
            w.HRM_CONFIG.demoAvailable ? '<button type="button" class="hrm-btn hrm-btn-ghost" data-hrm-demo="on">Tampilkan data demo</button>' : '');
        } else {
          box.innerHTML = ui.empty('alert', 'Data gagal dimuat', S.error.message || 'Terjadi kesalahan saat mengambil data.',
            '<button type="button" class="hrm-btn hrm-btn-primary" data-act="reload">' + ui.icon('refresh', 16) + 'Coba lagi</button>');
        }
        return;
      }

      if (!S.rows.length) {
        if (cnt) cnt.textContent = '0 data';
        box.innerHTML = ui.empty(schema.icon || 'file', 'Belum ada data ' + schema.label.toLowerCase(),
          cfg.allowCreate ? 'Klik "' + (cfg.addLabel || 'Tambah') + '" untuk menambahkan data pertama.' : 'Data akan muncul di sini setelah tersedia.');
        return;
      }

      var list = filtered();
      var total = list.length;
      if (cnt) cnt.textContent = total === S.rows.length ? total + ' data' : total + ' dari ' + S.rows.length + ' data';

      if (!total) {
        box.innerHTML = ui.empty('search', 'Tidak ada hasil', 'Tidak ada data yang cocok dengan pencarian atau filter saat ini.',
          '<button type="button" class="hrm-btn hrm-btn-ghost" data-act="reset">Atur ulang pencarian</button>');
        return;
      }

      var pages = Math.max(1, Math.ceil(total / S.size));
      if (S.page > pages) S.page = pages;
      var start = (S.page - 1) * S.size;
      var slice = list.slice(start, start + S.size);

      var cols = fields.filter(function (f) { return f.table; });
      var th = cols.map(function (f) {
        if (f.sortable === false) return '<th scope="col">' + esc(f.label) + '</th>';
        var on = S.sort && S.sort.key === f.key;
        var arrow = on ? (S.sort.dir === 'asc' ? ' ↑' : ' ↓') : '';
        return '<th scope="col" aria-sort="' + (on ? (S.sort.dir === 'asc' ? 'ascending' : 'descending') : 'none') + '">' +
          '<button type="button" class="hrm-th" data-act="sort" data-key="' + esc(f.key) + '">' + esc(f.label) + '<span class="hrm-th-arrow">' + arrow + '</span></button></th>';
      }).join('');

      var tr = slice.map(function (row) {
        return '<tr>' + cols.map(function (f) { return '<td data-label="' + esc(f.label) + '">' + cell(f, row) + '</td>'; }).join('') +
          '<td class="hrm-td-actions">' + actionsHtml(row) + '</td></tr>';
      }).join('');

      box.innerHTML = '<div class="hrm-table-wrap"><table class="hrm-table"><thead><tr>' + th + '<th scope="col" class="hrm-th-actions">Aksi</th></tr></thead><tbody>' + tr + '</tbody></table></div>' +
        pagerHtml(total, pages, start);
    }

    /* ---------- Detail ---------- */
    function findRow(id) {
      for (var i = 0; i < S.rows.length; i++) if (String(S.rows[i][pk]) === String(id)) return S.rows[i];
      return null;
    }

    function detailValue(f, row) {
      var v = row[f.key];
      if (isEmpty(v)) return '<span class="hrm-dash">—</span>';
      if (f.badge) return ui.badge(v);
      if (f.type === 'date') return esc(ui.fmtDate(v));
      if (f.type === 'datetime') return esc(ui.fmtDateTime(v));
      if (f.type === 'time') return esc(ui.fmtTime(v));
      if (f.type === 'textarea') return '<span class="hrm-pre">' + esc(v) + '</span>';
      return esc(v);
    }

    function showDetail(row) {
      var items = fields.filter(function (f) { return f.detail !== false; }).map(function (f) {
        return '<div class="hrm-dl-row"><dt>' + esc(f.label) + '</dt><dd>' + detailValue(f, row) + '</dd></div>';
      }).join('');
      var id = esc(str(row[pk]));
      var foot = '<button type="button" class="hrm-btn hrm-btn-ghost" data-close>Tutup</button>';
      (cfg.rowActions ? cfg.rowActions(row) : []).forEach(function (a) {
        foot += '<button type="button" class="hrm-btn ' + (a.tone === 'danger' ? 'hrm-btn-danger-soft' : a.tone === 'ok' ? 'hrm-btn-ok' : 'hrm-btn-ghost') + '" data-act="' + esc(a.act) + '" data-id="' + id + '">' + ui.icon(a.icon || 'arrow', 16) + esc(a.label) + '</button>';
      });
      if (cfg.allowEdit) foot += '<button type="button" class="hrm-btn hrm-btn-primary" data-act="edit" data-id="' + id + '">' + ui.icon('edit', 16) + 'Ubah</button>';
      var m = ui.openModal({
        title: 'Detail ' + schema.label.toLowerCase(),
        body: '<dl class="hrm-dl">' + items + '</dl>' + (cfg.detailExtra ? cfg.detailExtra(row, S) : ''),
        footer: foot
      });
      m.el.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('[data-act]');
        if (!b) return;
        ui.closeModal();
        doAction(b.getAttribute('data-act'), row);
      });
    }

    /* ---------- Formulir ---------- */
    function inputHtml(f, v) {
      var nm = esc(f.key), id = 'hrm-f-' + nm;
      var ph = f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : '';
      var base = 'class="hrm-input" id="' + id + '" name="' + nm + '"';
      switch (f.type) {
        case 'textarea':
          return '<textarea class="hrm-input hrm-textarea" id="' + id + '" name="' + nm + '" rows="4"' + ph + '>' + esc(v) + '</textarea>';
        case 'select':
          var opts = (f.options || []).slice();
          if (v && opts.indexOf(v) < 0) opts.unshift(v);
          return '<select class="hrm-select hrm-select-full" id="' + id + '" name="' + nm + '"><option value="">' + (f.required ? 'Pilih ' + esc(f.label.toLowerCase()) : '— Tidak dipilih —') + '</option>' +
            opts.map(function (o) { return '<option value="' + esc(o) + '"' + (o === v ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>';
        case 'date': return '<input ' + base + ' type="date" value="' + esc(String(v || '').slice(0, 10)) + '">';
        case 'time': return '<input ' + base + ' type="time" value="' + esc(String(v || '').slice(0, 5)) + '">';
        case 'email': return '<input ' + base + ' type="email" value="' + esc(v) + '"' + ph + '>';
        case 'tel': return '<input ' + base + ' type="tel" value="' + esc(v) + '"' + ph + '>';
        case 'number': return '<input ' + base + ' type="number" value="' + esc(v) + '"' + ph + '>';
        default: return '<input ' + base + ' type="text" value="' + esc(v) + '"' + ph + '>';
      }
    }

    function openForm(row) {
      var editing = !!row;
      var wmode = HRM.data.mode(cfg.entity, editing ? 'update' : 'create');
      var vals = row || {};
      var body = '<form id="hrm-form" novalidate><div class="hrm-form-error" data-form-error role="alert" hidden></div>';
      if (wmode === 'off') {
        body += '<div class="hrm-banner hrm-banner-warn">' + ui.icon('plug', 20) + '<div><strong>Penyimpanan belum terhubung.</strong> Endpoint ' + (editing ? 'ubah' : 'tambah') + ' belum diisi di <code>js/hrm-config.js</code>, jadi data tidak dapat disimpan.</div></div>';
      } else if (wmode === 'demo') {
        body += '<div class="hrm-banner hrm-banner-demo">' + ui.icon('info', 20) + '<div>Mode demo: data hanya tersimpan di memori browser, bukan di database.</div></div>';
      }
      body += '<div class="hrm-form-grid">';
      fields.forEach(function (f) {
        if (f.form === false) return;
        var full = f.type === 'textarea' ? ' hrm-field-full' : '';
        body += '<div class="hrm-field' + full + '"><label for="hrm-f-' + esc(f.key) + '">' + esc(f.label) + (f.required ? ' <span class="hrm-req" aria-hidden="true">*</span>' : '') + '</label>' +
          inputHtml(f, vals[f.key]) + '<div class="hrm-err" data-err="' + esc(f.key) + '"></div></div>';
      });
      body += '</div></form>';

      var m = ui.openModal({
        title: (editing ? 'Ubah ' : 'Tambah ') + schema.label.toLowerCase(),
        body: body,
        footer: '<button type="button" class="hrm-btn hrm-btn-ghost" data-close>Batal</button>' +
          '<button type="submit" form="hrm-form" class="hrm-btn hrm-btn-primary" data-submit' + (wmode === 'off' ? ' disabled' : '') + '>' + (editing ? 'Simpan perubahan' : 'Simpan') + '</button>'
      });

      var form = m.el.querySelector('#hrm-form');
      var submit = m.el.querySelector('[data-submit]');
      var formErr = m.el.querySelector('[data-form-error]');

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var values = {};
        fields.forEach(function (f) {
          if (f.form === false) return;
          var inp = form.querySelector('[name="' + f.key + '"]');
          if (inp) values[f.key] = inp.value.trim();
        });

        var errs = {};
        fields.forEach(function (f) {
          if (f.form !== false && f.required && !values[f.key]) errs[f.key] = f.label + ' wajib diisi.';
        });
        if (schema.validate) {
          var ex = schema.validate(values) || {};
          Object.keys(ex).forEach(function (k) { if (!errs[k]) errs[k] = ex[k]; });
        }

        fields.forEach(function (f) {
          var box = form.querySelector('[data-err="' + f.key + '"]');
          var inp = form.querySelector('[name="' + f.key + '"]');
          if (!box) return;
          box.textContent = errs[f.key] || '';
          if (inp) { if (errs[f.key]) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid'); }
        });
        formErr.hidden = true;
        var keys = Object.keys(errs);
        if (keys.length) {
          var bad = form.querySelector('[name="' + keys[0] + '"]');
          if (bad) bad.focus();
          return;
        }

        submit.disabled = true;
        var label = submit.textContent;
        submit.textContent = 'Menyimpan…';
        var op = editing ? HRM.data.update(cfg.entity, row[pk], values) : HRM.data.create(cfg.entity, values);
        op.then(function () {
          ui.closeModal();
          ui.toast(okMsg(schema.label + (editing ? ' berhasil diperbarui.' : ' berhasil ditambahkan.'), wmode), 'success');
          return load();
        }).catch(function (err) {
          submit.disabled = false;
          submit.textContent = label;
          formErr.hidden = false;
          formErr.textContent = 'Data tidak tersimpan: ' + (err && err.message ? err.message : 'terjadi kesalahan.');
        });
      });
    }

    function okMsg(text, m) {
      return m === 'demo' ? text + ' (data demo, tidak masuk database)' : text;
    }

    /* ---------- Hapus ---------- */
    function del(row) {
      var wmode = HRM.data.mode(cfg.entity, 'remove');
      if (wmode === 'off') {
        ui.toast('Fungsi hapus belum terhubung ke backend (endpoint remove belum dikonfigurasi).', 'error');
        return;
      }
      var name = row[schema.nameKey] || 'data ini';
      ui.confirm({
        title: 'Hapus ' + schema.label.toLowerCase(),
        message: 'Hapus "' + name + '"? Tindakan ini tidak dapat dibatalkan.',
        confirmText: 'Hapus',
        danger: true
      }).then(function (ok) {
        if (!ok) return;
        HRM.data.remove(cfg.entity, row[pk]).then(function () {
          ui.toast(okMsg(schema.label + ' berhasil dihapus.', wmode), 'success');
          return load();
        }).catch(function (err) {
          ui.toast('Gagal menghapus: ' + (err && err.message ? err.message : 'terjadi kesalahan.'), 'error');
        });
      });
    }

    /* ---------- Aksi ---------- */
    var ctx = { reload: load, state: S, okMsg: okMsg };

    function doAction(act, row) {
      if (act === 'detail') showDetail(row);
      else if (act === 'edit') {
        if (cfg.allowEdit) openForm(row);
      } else if (act === 'delete') del(row);
      else if (cfg.onAction) cfg.onAction(act, row, ctx);
    }

    el.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-act]');
      if (!b || !el.contains(b)) return;
      var act = b.getAttribute('data-act');
      if (act === 'add') { openForm(null); return; }
      if (act === 'reload') { load(); return; }
      if (act === 'reset') {
        S.q = ''; S.filters = {}; S.page = 1;
        renderToolbar(); renderTable();
        return;
      }
      if (act === 'sort') {
        var k = b.getAttribute('data-key');
        if (S.sort && S.sort.key === k) S.sort.dir = S.sort.dir === 'asc' ? 'desc' : 'asc';
        else S.sort = { key: k, dir: 'asc' };
        renderTable();
        return;
      }
      if (act === 'page') {
        var n = parseInt(b.getAttribute('data-page'), 10);
        if (n >= 1) { S.page = n; renderTable(); }
        return;
      }
      var row = findRow(b.getAttribute('data-id'));
      if (row) doAction(act, row);
    });

    var onQ = ui.debounce(function (v) { S.q = v; S.page = 1; renderTable(); }, 180);
    el.addEventListener('input', function (e) {
      if (e.target.hasAttribute && e.target.hasAttribute('data-q')) onQ(e.target.value);
    });
    el.addEventListener('change', function (e) {
      var k = e.target.getAttribute && e.target.getAttribute('data-filter');
      if (!k) return;
      if (e.target.value) S.filters[k] = e.target.value; else delete S.filters[k];
      S.page = 1;
      renderTable();
    });

    load().then(function () {
      if (pending === 'add' && cfg.allowCreate) openForm(null);
    });
  }

  HRM.Crud = { mount: mount };
})(window);
