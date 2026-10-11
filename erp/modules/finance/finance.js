/* ============================================================
   DICO ERP - Finance Module (Template Starter)
   Anggota tim: Kerjakan CRUD di file ini
   ============================================================ */

registerRoute('#finance/accounts', pageFinAccounts);
registerRoute('#finance/transactions', pageFinTransactions);
registerRoute('#finance/journal', pageFinJournal);

// ---- PAGE: Chart of Accounts ----
function pageFinAccounts() {
  return `
    <div class="flex-between mb-lg">
      <div>
        <h1>Chart of Accounts</h1>
        <p class="text-muted">Daftar akun keuangan (Aset, Liabilitas, Ekuitas, Pendapatan, Beban)</p>
      </div>
      <button class="btn btn-primary" onclick="alert('TODO: Implementasi tambah akun')">${icon('plus')} Tambah Akun</button>
    </div>
    <div class="card" style="cursor:default">
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Kode Akun</th>
              <th>Nama Akun</th>
              <th>Tipe</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="4" class="text-center text-muted" style="padding:40px">
                Belum ada data akun. Klik "Tambah Akun" untuk mulai.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ---- PAGE: Transaksi ----
function pageFinTransactions() {
  return `
    <div class="flex-between mb-lg">
      <div>
        <h1>Transaksi</h1>
        <p class="text-muted">Input dan kelola transaksi keuangan</p>
      </div>
      <button class="btn btn-primary" onclick="alert('TODO: Implementasi tambah transaksi')">${icon('plus')} Tambah Transaksi</button>
    </div>
    <div class="card" style="cursor:default">
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Kode</th>
              <th>Tanggal</th>
              <th>Deskripsi</th>
              <th>Sumber</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="5" class="text-center text-muted" style="padding:40px">
                Belum ada transaksi.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ---- PAGE: Jurnal ----
function pageFinJournal() {
  return `
    <div class="flex-between mb-lg">
      <div>
        <h1>Laporan Jurnal</h1>
        <p class="text-muted">Ringkasan jurnal debit & kredit</p>
      </div>
    </div>
    <div class="card" style="cursor:default">
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Kode Transaksi</th>
              <th>Akun</th>
              <th>Debit</th>
              <th>Kredit</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="4" class="text-center text-muted" style="padding:40px">
                Belum ada data jurnal.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}
