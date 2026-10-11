/* ============================================================
   DICO ERP - Dashboard Module
   ============================================================ */

registerRoute('#dashboard', pageDashboard);

function pageDashboard() {
  const user = getCurrentUser();
  return `
    <div style="margin-bottom:24px">
      <h1>Selamat Datang, ${user ? user.nama : 'Admin'}</h1>
      <p class="text-muted">Ringkasan sistem ERP DICO Community</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;margin-bottom:24px">
      <div class="card" style="cursor:default">
        <p class="text-muted" style="font-size:13px;margin-bottom:8px">Total Event</p>
        <h2 style="color:var(--primary)">—</h2>
      </div>
      <div class="card" style="cursor:default">
        <p class="text-muted" style="font-size:13px;margin-bottom:8px">Total Karyawan</p>
        <h2 style="color:var(--teal)">—</h2>
      </div>
      <div class="card" style="cursor:default">
        <p class="text-muted" style="font-size:13px;margin-bottom:8px">Total Customer</p>
        <h2 style="color:var(--success)">—</h2>
      </div>
      <div class="card" style="cursor:default">
        <p class="text-muted" style="font-size:13px;margin-bottom:8px">Saldo Kas</p>
        <h2 style="color:var(--warning)">—</h2>
      </div>
    </div>
    <div class="card" style="cursor:default">
      <h3 style="margin-bottom:12px">Informasi Sistem</h3>
      <p style="font-size:14px;color:var(--text-secondary)">
        Login sebagai <strong>${user ? user.role_name : '-'}</strong> —
        Modul yang tersedia sesuai hak akses role kamu ada di sidebar kiri.
      </p>
    </div>
  `;
}
