/* DICO ERP - HRM: Halaman Data Event */
(function (w) {
  'use strict';
  var HRM = (w.HRM = w.HRM || { pages: {}, state: {} });

  HRM.pages.events = {
    mount: function (el) {
      HRM.Crud.mount(el, {
        entity: 'events',
        title: 'Data Event',
        subtitle: 'Kelola event DICO Community beserta jadwal dan lokasinya',
        addLabel: 'Tambah Event',
        searchPlaceholder: 'Cari nama event, lokasi, atau kategori…',
        allowCreate: true,
        allowEdit: true,
        allowDelete: true,

        // Jumlah peserta dihitung dari data registrasi yang nyata (jika tersedia)
        loadAux: function () {
          return HRM.data.list('registrations').then(
            function (rows) { return { registrations: rows }; },
            function () { return { registrations: null }; }
          );
        },
        enrich: function (rows, aux) {
          var regs = aux.registrations;
          rows.forEach(function (e) {
            if (!regs) { delete e._regCount; return; }
            e._regCount = regs.filter(function (r) {
              return (r.event_id != null && String(r.event_id) === String(e.id)) || (r.event_name && r.event_name === e.title);
            }).length;
          });
        },

        rowActions: function () {
          return [{ act: 'regs', label: 'Lihat registrasi peserta', icon: 'file' }];
        },
        onAction: function (act, row) {
          if (act !== 'regs') return;
          HRM.state.registrationEvent = row.id;
          w.location.hash = '#hrm/registrations';
        }
      });
    }
  };
})(window);
