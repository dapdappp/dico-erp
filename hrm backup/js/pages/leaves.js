/* DICO ERP - HRM: Halaman Pengajuan Cuti */
(function (w) {
  'use strict';
  var HRM = (w.HRM = w.HRM || { pages: {}, state: {} });
  var ui = HRM.ui;

  HRM.pages.leaves = {
    mount: function (el) {
      HRM.Crud.mount(el, {
        entity: 'leaves',
        title: 'Pengajuan Cuti',
        subtitle: 'Kelola pengajuan dan approval cuti karyawan',
        searchPlaceholder: 'Cari karyawan atau tipe cuti…',
        allowCreate: false,
        allowEdit: false,
        allowDelete: false,

        // Tombol Setujui/Tolak hanya untuk pengajuan yang masih menunggu
        rowActions: function (row) {
          if (ui.statusKind(row.status) !== 'pending') return [];
          return [
            { act: 'approve', label: 'Setujui', icon: 'check', tone: 'ok' },
            { act: 'reject', label: 'Tolak', icon: 'xcircle', tone: 'danger' }
          ];
        },

        onAction: function (act, row, ctx) {
          if (act !== 'approve' && act !== 'reject') return;
          var kind = act === 'approve' ? 'approved' : 'rejected';
          var wmode = HRM.data.mode('leaves', 'updateStatus');
          if (wmode === 'off') {
            ui.toast('Persetujuan cuti belum terhubung ke backend (endpoint updateStatus belum dikonfigurasi). Status tidak diubah.', 'error');
            return;
          }
          var verb = act === 'approve' ? 'menyetujui' : 'menolak';
          ui.confirm({
            title: act === 'approve' ? 'Setujui pengajuan cuti' : 'Tolak pengajuan cuti',
            message: 'Anda akan ' + verb + ' pengajuan ' + (row.leave_type || 'cuti') + ' dari ' + (row.employee_name || 'karyawan ini') +
              ' (' + ui.period(row.start_date, row.end_date) + '). Lanjutkan?',
            confirmText: act === 'approve' ? 'Ya, setujui' : 'Ya, tolak',
            danger: act === 'reject'
          }).then(function (ok) {
            if (!ok) return;
            HRM.data.setLeaveStatus(row.id, kind).then(function () {
              ui.toast(ctx.okMsg('Pengajuan cuti berhasil ' + (act === 'approve' ? 'disetujui.' : 'ditolak.'), wmode), 'success');
              return ctx.reload();
            }).catch(function (err) {
              ui.toast('Status tidak berubah: ' + (err && err.message ? err.message : 'terjadi kesalahan.'), 'error');
            });
          });
        }
      });
    }
  };
})(window);
