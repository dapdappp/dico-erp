/* ============================================================
   DICO ERP - CRM Module (Template Starter)
   Anggota tim: Kerjakan CRUD di file ini
   ============================================================ */

registerRoute('#crm/customers', pageCrmCustomers);
registerRoute('#crm/interactions', pageCrmInteractions);

// ---- PAGE: Data Customer ----
function pageCrmCustomers() {
  return `
    <div class="flex-between mb-lg">
      <div>
        <h1>Data Customer</h1>
        <p class="text-muted">Kelola data customer, leads, dan partner</p>
      </div>
      <button class="btn btn-primary" onclick="alert('TODO: Implementasi tambah customer')">${icon('plus')} Tambah Customer</button>
    </div>
    <div class="card" style="cursor:default">
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Email</th>
              <th>No HP</th>
              <th>Tipe</th>
              <th>Status Prospek</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="6" class="text-center text-muted" style="padding:40px">
                Belum ada data customer. Klik "Tambah Customer" untuk mulai.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ---- PAGE: Log Interaksi ----
function pageCrmInteractions() {
  return `
    <div class="flex-between mb-lg">
      <div>
        <h1>Log Interaksi</h1>
        <p class="text-muted">Riwayat kontak dengan customer (call, email, meeting, whatsapp)</p>
      </div>
    </div>
    <div class="card" style="cursor:default">
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Tipe Kontak</th>
              <th>Catatan</th>
              <th>Tanggal</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="4" class="text-center text-muted" style="padding:40px">
                Belum ada log interaksi.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}
