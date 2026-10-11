/* ============================================================
   DICO ERP - HRM Module (Template Starter)
   Anggota tim: Kerjakan CRUD di file ini
   ============================================================ */

// Register routes
registerRoute('#hrm/employees', pageHrmEmployees);
registerRoute('#hrm/leaves', pageHrmLeaves);

// ---- PAGE: Data Karyawan ----
function pageHrmEmployees() {
  return `
    <div class="flex-between mb-lg">
      <div>
        <h1>Data Karyawan</h1>
        <p class="text-muted">Kelola semua data karyawan DICO Community</p>
      </div>
      <button class="btn btn-primary" onclick="alert('TODO: Implementasi tambah karyawan')">${icon('plus')} Tambah Karyawan</button>
    </div>
    <div class="card" style="cursor:default">
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>NIK</th>
              <th>Nama Lengkap</th>
              <th>Departemen</th>
              <th>Jabatan</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="6" class="text-center text-muted" style="padding:40px">
                Belum ada data karyawan. Klik "Tambah Karyawan" untuk mulai.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ---- PAGE: Pengajuan Cuti ----
function pageHrmLeaves() {
  return `
    <div class="flex-between mb-lg">
      <div>
        <h1>Pengajuan Cuti</h1>
        <p class="text-muted">Kelola pengajuan dan approval cuti karyawan</p>
      </div>
    </div>
    <div class="card" style="cursor:default">
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Karyawan</th>
              <th>Tipe Cuti</th>
              <th>Tanggal</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="5" class="text-center text-muted" style="padding:40px">
                Belum ada pengajuan cuti.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}
