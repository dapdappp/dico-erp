/* ============================================================
   DICO ERP - API Wrapper (Standard Fetch)
   ============================================================ */

// Standard API Call
async function apiCall(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('[API ERROR]', url, err);
    return { success: false, message: 'Koneksi server gagal. Pastikan XAMPP MySQL ON.' };
  }
}

// GET Request
async function apiGet(url) {
  return apiCall(url);
}

// POST Request (FormData)
async function apiPost(url, formData) {
  return apiCall(url, { method: 'POST', body: formData });
}

// POST Request (JSON)
async function apiPostJSON(url, data) {
  return apiCall(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

// Build FormData from Object
function buildFormData(obj) {
  const fd = new FormData();
  for (const key in obj) {
    if (obj[key] !== null && obj[key] !== undefined) {
      fd.append(key, obj[key]);
    }
  }
  return fd;
}
