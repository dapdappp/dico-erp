/* DICO ERP - HRM: Halaman Data Karyawan */
(function (w) {
  'use strict';
  var HRM = (w.HRM = w.HRM || { pages: {}, state: {} });

  HRM.pages.employees = {
    mount: function (el) {
      HRM.Crud.mount(el, {
        entity: 'employees',
        title: 'Data Karyawan',
        subtitle: 'Kelola semua data karyawan DICO Community',
        addLabel: 'Tambah Karyawan',
        allowCreate: true,
        allowEdit: true,
        allowDelete: true
      });
    }
  };
})(window);
