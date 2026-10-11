/* ============================================================
   DICO ERP - Event Module (Template Starter)
   Anggota tim: Kerjakan CRUD di file ini
   ============================================================ */

registerRoute('#event/workshops', pageEventWorkshops);
registerRoute('#event/registrations', pageEventRegistrations);

// ---- PAGE: Data Event ----
function pageEventWorkshops() {
  return `
    <div class="flex-between mb-lg">
      <div>
        <h1>Data Event</h1>
        <p class="text-muted">Kelola workshop, seminar, dan webinar</p>
      </div>
      <button class="btn btn-primary" onclick="alert('TODO: Implementasi tambah event')">${icon('plus')} Tambah Event</button>
    </div>
    <div class="card" style="cursor:default">
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Judul</th>
              <th>Tipe</th>
              <th>Tanggal</th>
              <th>Lokasi</th>
              <th>Harga</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="7" class="text-center text-muted" style="padding:40px">
                Belum ada data event. Klik "Tambah Event" untuk mulai.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ---- PAGE: Registrasi Peserta ----
function pageEventRegistrations() {
  return `
    <div class="flex-between mb-lg">
      <div>
        <h1>Registrasi Peserta</h1>
        <p class="text-muted">Daftar peserta yang mendaftar event</p>
      </div>
    </div>
    <div class="card" style="cursor:default">
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Nama Peserta</th>
              <th>Email</th>
              <th>Event</th>
              <th>Status Bayar</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="5" class="text-center text-muted" style="padding:40px">
                Belum ada data registrasi.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}
