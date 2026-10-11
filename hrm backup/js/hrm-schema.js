/* ============================================================
   DICO ERP - HRM: Skema field per entitas
   ------------------------------------------------------------
   Tabel, formulir, filter, dan detail dibangun dari skema ini.
   Jika nama kolom di database berbeda, cukup ubah `key` di sini.

   Field yang ditandai `assumed: true` TIDAK ada di template awal
   dan hanya asumsi; hapus jika tidak ada di database.
   Kolom NIK, nama, departemen, jabatan, status (karyawan) dan
   karyawan, tipe cuti, tanggal, status (cuti) berasal dari
   template tabel di hrm.js awal.

   Properti field:
   key, label, type (text|email|tel|number|date|time|datetime|
   select|textarea), required, table, search, filter, badge,
   form (false = tidak di formulir), detail (false = tidak di detail),
   options (untuk select), sortable (false = tidak bisa diurutkan),
   render(row) -> HTML aman untuk sel tabel.
   ============================================================ */
(function (w) {
  'use strict';
  var HRM = (w.HRM = w.HRM || { pages: {}, state: {} });

  function ui() { return HRM.ui; }

  w.HRM_SCHEMA = {
    employees: {
      label: 'Karyawan',
      icon: 'users',
      pk: 'id',
      nameKey: 'name',
      defaultSort: { key: 'name', dir: 'asc' },
      fields: [
        { key: 'nik', label: 'NIK', type: 'text', required: true, table: true, search: true },
        { key: 'name', label: 'Nama lengkap', type: 'text', required: true, table: true, search: true },
        { key: 'department', label: 'Departemen', type: 'text', table: true, search: true, filter: true },
        { key: 'position', label: 'Jabatan', type: 'text', table: true, search: true },
        { key: 'status', label: 'Status', type: 'select', options: ['Aktif', 'Nonaktif'], table: true, filter: true, badge: true },
        { key: 'email', label: 'Email', type: 'email', search: true, assumed: true },
        { key: 'phone', label: 'No. telepon', type: 'tel', assumed: true },
        { key: 'join_date', label: 'Tanggal bergabung', type: 'date', assumed: true }
      ],
      validate: function (v) {
        var e = {};
        if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = 'Format email tidak valid.';
        if (v.phone && !/^[0-9+\-\s()]{6,20}$/.test(v.phone)) e.phone = 'Nomor telepon tidak valid.';
        return e;
      }
    },

    leaves: {
      label: 'Pengajuan cuti',
      icon: 'clipboard',
      pk: 'id',
      nameKey: 'employee_name',
      defaultSort: { key: 'created_at', dir: 'desc' },
      fields: [
        { key: 'employee_name', label: 'Karyawan', type: 'text', table: true, search: true },
        { key: 'leave_type', label: 'Tipe cuti', type: 'text', table: true, search: true, filter: true },
        {
          key: 'start_date', label: 'Tanggal', type: 'date', table: true, search: false,
          render: function (r) { return ui().esc(ui().period(r.start_date, r.end_date)); }
        },
        { key: 'end_date', label: 'Tanggal selesai', type: 'date' },
        { key: 'reason', label: 'Alasan', type: 'textarea' },
        {
          key: 'status', label: 'Status', type: 'select', table: true, filter: true, badge: true,
          options: [] // opsi filter diambil dari data nyata
        },
        { key: 'created_at', label: 'Diajukan pada', type: 'datetime', assumed: true }
      ]
    },

    events: {
      label: 'Event',
      icon: 'calendar',
      pk: 'id',
      nameKey: 'title',
      defaultSort: { key: 'date', dir: 'desc' },
      fields: [
        {
          key: 'title', label: 'Nama event', type: 'text', required: true, table: true, search: true,
          render: function (r) {
            var e = ui().esc, d = r.description ? String(r.description) : '';
            if (d.length > 70) d = d.slice(0, 70) + '…';
            return '<strong>' + e(r.title) + '</strong>' + (d ? '<div class="hrm-cell-sub">' + e(d) + '</div>' : '');
          }
        },
        { key: 'date', label: 'Tanggal', type: 'date', required: true, table: true },
        { key: 'time', label: 'Waktu', type: 'time', table: true },
        { key: 'location', label: 'Lokasi', type: 'text', table: true, search: true },
        { key: 'category', label: 'Kategori', type: 'text', table: true, search: true, filter: true },
        { key: 'status', label: 'Status', type: 'select', options: ['Aktif', 'Selesai', 'Dibatalkan'], table: true, filter: true, badge: true },
        {
          key: '_regCount', label: 'Peserta', type: 'number', table: true, form: false, detail: false,
          render: function (r) { return r._regCount == null ? '<span class="hrm-dash">—</span>' : String(r._regCount); }
        },
        { key: 'description', label: 'Deskripsi', type: 'textarea', search: true }
      ],
      validate: function (v) {
        var e = {};
        if (v.date && !/^\d{4}-\d{2}-\d{2}$/.test(v.date)) e.date = 'Tanggal tidak valid.';
        return e;
      }
    },

    registrations: {
      label: 'Registrasi',
      icon: 'file',
      pk: 'id',
      nameKey: 'participant_name',
      defaultSort: { key: 'registered_at', dir: 'desc' },
      fields: [
        { key: 'participant_name', label: 'Peserta', type: 'text', table: true, search: true },
        { key: 'email', label: 'Email', type: 'email', table: true, search: true, assumed: true },
        { key: 'event_name', label: 'Event', type: 'text', table: true, search: true },
        { key: 'registered_at', label: 'Tanggal registrasi', type: 'datetime', table: true },
        { key: 'status', label: 'Status', type: 'text', table: true, filter: true, badge: true }
      ]
    }
  };
})(window);
