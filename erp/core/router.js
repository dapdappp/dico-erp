/* ============================================================
   DICO ERP - SPA Router (Hash-based)
   ============================================================ */

// Route handlers registry
const ROUTES = {};

// Register a route
function registerRoute(hash, handler) {
  ROUTES[hash] = handler;
}

// Navigate to route
function navigateTo(hash) {
  window.location.hash = hash;
}

// Render current route
function renderRoute() {
  const hash = window.location.hash || '#dashboard';
  const contentArea = document.getElementById('contentArea');

  // Find matching route handler
  const handler = ROUTES[hash];
  if (handler) {
    const result = handler();
    if (typeof result === 'string') {
      contentArea.innerHTML = result;
    }
  } else {
    contentArea.innerHTML = `
      <div class="card" style="text-align:center;padding:60px 24px">
        <h2 style="margin-bottom:8px">Modul Belum Tersedia</h2>
        <p class="text-muted">Halaman <code>${hash}</code> belum dikembangkan.</p>
        <p class="text-muted" style="margin-top:12px">Hubungi koordinator tim untuk modul ini.</p>
      </div>
    `;
  }

  updateActiveLink();
}

// Global render function (for re-rendering current page)
function render() {
  renderRoute();
}

// Init Router
function initRouter() {
  // Load module JS files dynamically
  loadModuleScripts().then(() => {
    // Listen for hash changes
    window.addEventListener('hashchange', renderRoute);

    // Initial render
    if (!window.location.hash) {
      window.location.hash = '#dashboard';
    } else {
      renderRoute();
    }
  });
}

// Load module scripts dynamically
async function loadModuleScripts() {
  for (const mod of MODULE_REGISTRY) {
    try {
      const scriptPath = `${mod._path}/${mod.id}.js`;
      await loadScript(scriptPath);
    } catch (e) {
      // Module JS not ready yet, skip
    }
  }
}

// Helper: Load external JS file
function loadScript(src) {
  return new Promise((resolve, reject) => {
    // Skip if already loaded
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = resolve; // Don't block on missing modules
    document.body.appendChild(script);
  });
}
