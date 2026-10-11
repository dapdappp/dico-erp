/* DICO ERP - HRM: Halaman Registrasi */
(function (w) {
  'use strict';
  var HRM = (w.HRM = w.HRM || { pages: {}, state: {} });

  HRM.pages.registrations = {
    mount: function (el) {
      var preset = HRM.state.registrationEvent;
      HRM.state.registrationEvent = null;

      HRM.Crud.mount(el, {
        entity: 'registrations',
        title: 'Registrasi',
        subtitle: 'Daftar peserta yang mendaftar pada event DICO Community',
        searchPlaceholder: 'Cari peserta, email, atau event…',
        note: 'Sinkronisasi Google Forms belum diverifikasi. Halaman ini hanya menampilkan data yang dikembalikan endpoint registrasi, ' +
          'dan tidak mengasumsikan integrasi eksternal sudah berjalan.',
        allowCreate: false,
        allowEdit: false,
        allowDelete: false,

        initialFilters: function () {
          return preset != null ? { event: String(preset) } : null;
        },

        loadAux: function () {
          return HRM.data.list('events').then(
            function (rows) { return { events: rows }; },
            function () { return { events: [] }; }
          );
        },

        // Filter event: pakai daftar event bila ada, jika tidak pakai nama event dari data registrasi
        extraFilters: function (S) {
          var events = (S.aux && S.aux.events) || [];
          var byId = {}, options = [];
          if (events.length) {
            events.forEach(function (e) {
              byId[String(e.id)] = e.title;
              options.push({ value: String(e.id), label: e.title });
            });
          } else {
            var seen = {};
            S.rows.forEach(function (r) {
              if (r.event_name && !seen[r.event_name]) { seen[r.event_name] = 1; options.push({ value: r.event_name, label: r.event_name }); }
            });
          }
          if (!options.length) return [];
          return [{
            key: 'event',
            label: 'Semua event',
            options: options,
            match: function (row, val) {
              if (row.event_id != null && String(row.event_id) === val) return true;
              return !!row.event_name && (row.event_name === val || row.event_name === byId[val]);
            }
          }];
        }
      });
    }
  };
})(window);
