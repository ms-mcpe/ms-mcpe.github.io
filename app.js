/* ═══════════════════════════════════════════════════════════
   NEKOCRAFT ADDONS — Shared App Logic (app.js)
   Used by: home.html, populars.html, favorite.html, downloads.html
   ═══════════════════════════════════════════════════════════ */

const API_URL = 'https://script.google.com/macros/s/AKfycbyI52B-s7qz8wPMfRXLHaYRDuy1Lq_NfpzEA6IrxcQfKDTXA_TsWmDrfwS6b4L8m7oE9g/exec';
const CACHE_KEY = 'nekocraft_addons_cache';
const CACHE_TIME_KEY = 'nekocraft_addons_cache_time';
const FAVS_KEY = 'nekocraft_favorites';
const DOWNLOADS_KEY = 'nekocraft_downloads';
const VERIFY_EXPIRY_KEY = 'nekocraft_verification_expiry';
const CACHE_DURATION = 5 * 60 * 1000; // 5 min cache
const TARGET_CATEGORY = 'Marcketplace';

function isUserVerified() {
  try {
    const expiryStr = localStorage.getItem(VERIFY_EXPIRY_KEY);
    if (!expiryStr) return false;
    const expiry = parseInt(expiryStr) || 0;
    return Date.now() < expiry; // Valid if current time is before expiry
  } catch (e) {
    return false;
  }
}

/* ── SVG Icons (inline) ── */
const ICONS = {
  heart: '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  download: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  downloads: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  fire: '<svg viewBox="0 0 24 24"><path d="M12 2c0 4-4 6-4 10a4 4 0 0 0 8 0c0-4-4-6-4-10z"/></svg>',
  heartEmpty: '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  package: '<svg viewBox="0 0 24 24"><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
  star: '<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
};

/* ── Utility Functions ── */
function formatNumber(n) {
  n = parseInt(n) || 0;
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'K';
  return String(n);
}

function getFirstImage(imagenes) {
  if (!imagenes) return '';
  const parts = String(imagenes).split('|');
  return parts[0].trim();
}

function getAllImages(imagenes) {
  if (!imagenes) return [];
  return String(imagenes).split('|').map(u => u.trim()).filter(u => u);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* ── Migrate old storage keys ── */
(function migrateKeys() {
  const oldKeys = {
    'pinkcraft_addons_cache': CACHE_KEY,
    'pinkcraft_addons_cache_time': CACHE_TIME_KEY,
    'pinkcraft_favorites': FAVS_KEY,
    'pinkcraft_downloads': DOWNLOADS_KEY,
    'pinkcraft_verification_expiry': VERIFY_EXPIRY_KEY
  };
  for (const [oldKey, newKey] of Object.entries(oldKeys)) {
    try {
      const val = localStorage.getItem(oldKey);
      if (val !== null && localStorage.getItem(newKey) === null) {
        localStorage.setItem(newKey, val);
      }
      localStorage.removeItem(oldKey);
    } catch {}
  }
})();

/* ── LocalStorage Helpers ── */
function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVS_KEY)) || [];
  } catch { return []; }
}

function saveFavorites(favs) {
  localStorage.setItem(FAVS_KEY, JSON.stringify(favs));
}

function isFavorite(nombre) {
  return getFavorites().includes(nombre);
}

function toggleFavorite(nombre) {
  let favs = getFavorites();
  const idx = favs.indexOf(nombre);
  if (idx > -1) {
    favs.splice(idx, 1);
  } else {
    favs.push(nombre);
    // Also send like to backend
    sendLike(nombre);
  }
  saveFavorites(favs);
  return favs.includes(nombre);
}

function getDownloadsHistory() {
  try {
    return JSON.parse(localStorage.getItem(DOWNLOADS_KEY)) || [];
  } catch { return []; }
}

function saveDownload(addon) {
  let downloads = getDownloadsHistory();
  // Remove previous entry for same addon (keep latest)
  downloads = downloads.filter(d => d.nombre !== addon.nombre);
  downloads.unshift({
    nombre: addon.nombre,
    imagenes: addon.imagenes,
    categoria: addon.categoria,
    link: addon.link,
    fecha: new Date().toISOString()
  });
  // Keep max 50
  if (downloads.length > 50) downloads = downloads.slice(0, 50);
  localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(downloads));
}

/* ── API Calls ── */
function sendLike(nombre) {
  const img = new Image();
  img.src = API_URL + '?action=like&nombre=' + encodeURIComponent(nombre) + '&_t=' + Date.now();
}

function sendDownload(nombre) {
  const img = new Image();
  img.src = API_URL + '?action=download&nombre=' + encodeURIComponent(nombre) + '&_t=' + Date.now();
}

/* ── Data Loading via JSONP ── */
function loadAddonsJSONP() {
  return new Promise((resolve, reject) => {
    const callbackName = '__nekocraft_cb_' + Date.now();
    const script = document.createElement('script');
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Timeout'));
    }, 15000);

    function cleanup() {
      clearTimeout(timeout);
      delete window[callbackName];
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    window[callbackName] = function(data) {
      cleanup();
      if (data && data.status === 'OK' && data.addons) {
        resolve(data.addons);
      } else {
        reject(new Error('Invalid response'));
      }
    };

    script.src = API_URL + '?action=getMcpedlAddons&callback=' + callbackName;
    script.onerror = function() { cleanup(); reject(new Error('Network error')); };
    document.head.appendChild(script);
  });
}

function getCachedAddons() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const cachedTime = parseInt(localStorage.getItem(CACHE_TIME_KEY)) || 0;
    if (cached && (Date.now() - cachedTime) < CACHE_DURATION) {
      return JSON.parse(cached);
    }
  } catch {}
  return null;
}

function cacheAddons(addons) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(addons));
    localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
  } catch {}
}

async function getAddons() {
  // Try cache first
  const cached = getCachedAddons();
  if (cached) {
    // Refresh in background
    loadAddonsJSONP().then(fresh => {
      const filtered = fresh.filter(a => a.categoria === TARGET_CATEGORY);
      cacheAddons(filtered);
    }).catch(() => {});
    return cached;
  }
  // Load fresh
  const fresh = await loadAddonsJSONP();
  const filtered = fresh.filter(a => a.categoria === TARGET_CATEGORY);
  cacheAddons(filtered);
  return filtered;
}

/* ── Card HTML Rendering ── */
function renderAddonCard(addon, index) {
  const img = getFirstImage(addon.imagenes);
  const liked = isFavorite(addon.nombre);
  return `
    <div class="addon-card" data-addon-name="${escapeHtml(addon.nombre)}" onclick="openModal('${escapeHtml(addon.nombre)}')" style="animation-delay:${index * 0.03}s">
      <img class="addon-img" src="${escapeHtml(img)}" alt="${escapeHtml(addon.nombre)}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 72 72%22><rect fill=%22%23FFE8EE%22 width=%2272%22 height=%2272%22/><text x=%2236%22 y=%2240%22 text-anchor=%22middle%22 font-size=%2224%22>📦</text></svg>'">
      <div class="addon-info">
        <div class="addon-name">${escapeHtml(addon.nombre)}</div>
        <div class="addon-meta">
          <span class="addon-category">${escapeHtml(addon.categoria)}</span>
          <span class="addon-stat">
            <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            ${formatNumber(addon.downloads)}
          </span>
        </div>
      </div>
      <div class="addon-actions">
        <button class="addon-like-btn ${liked ? 'liked' : ''}" onclick="event.stopPropagation(); handleLike('${escapeHtml(addon.nombre)}', this)" title="Me gusta">
          ${ICONS.heart}
        </button>
        <button class="addon-download-btn" onclick="event.stopPropagation(); handleDownload('${escapeHtml(addon.nombre)}')" title="Descargar">
          ${ICONS.download}
        </button>
      </div>
    </div>
  `;
}

function renderAddonGridCard(addon, index) {
  const img = getFirstImage(addon.imagenes);
  return `
    <div class="addon-grid-card" data-addon-name="${escapeHtml(addon.nombre)}" onclick="openModal('${escapeHtml(addon.nombre)}')" style="animation-delay:${index * 0.04}s">
      <img class="addon-grid-img" src="${escapeHtml(img)}" alt="${escapeHtml(addon.nombre)}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 125%22><rect fill=%22%23FFE8EE%22 width=%22200%22 height=%22125%22/><text x=%22100%22 y=%2270%22 text-anchor=%22middle%22 font-size=%2230%22>📦</text></svg>'">
      <div class="addon-grid-body">
        <div class="addon-grid-name">${escapeHtml(addon.nombre)}</div>
        <div class="addon-grid-footer">
          <span class="addon-grid-likes">
            <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            ${formatNumber(addon.likes)}
          </span>
          <span class="addon-grid-dl">
            <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            ${formatNumber(addon.downloads)}
          </span>
        </div>
      </div>
    </div>
  `;
}

function renderEmptyState(icon, title, subtitle) {
  return `
    <div class="empty-state">
      <div class="empty-icon">${icon}</div>
      <div class="empty-title">${title}</div>
      <div class="empty-subtitle">${subtitle}</div>
    </div>
  `;
}

function renderLoader() {
  return `
    <div class="loader-container">
      <div class="loader"></div>
      <div class="loader-text">Cargando addons...</div>
    </div>
  `;
}

/* ── Interaction Handlers ── */
function performLike(nombre) {
  let favs = getFavorites();
  const idx = favs.indexOf(nombre);
  const isLiking = (idx === -1);
  
  if (isLiking) {
    favs.push(nombre);
    sendLike(nombre);
  } else {
    favs.splice(idx, 1);
  }
  saveFavorites(favs);
  
  // Update memory and cache
  let addon = allLoadedAddons.find(a => a.nombre === nombre);
  if (addon) {
    addon.likes = Math.max(0, (parseInt(addon.likes) || 0) + (isLiking ? 1 : -1));
  }
  let cached = getCachedAddons();
  if (cached) {
    let cAddon = cached.find(a => a.nombre === nombre);
    if (cAddon) {
      cAddon.likes = Math.max(0, (parseInt(cAddon.likes) || 0) + (isLiking ? 1 : -1));
      cacheAddons(cached);
    }
  }

  // Update DOM elements on the page instantly
  updateDomForAddon(nombre, isLiking, addon ? addon.likes : null, null);
  
  return isLiking;
}

function performDownload(nombre) {
  const addons = allLoadedAddons.length ? allLoadedAddons : (getCachedAddons() || []);
  const addon = addons.find(a => a.nombre === nombre);
  if (!addon || !addon.link) return;

  // Increment download count locally for instant feedback
  addon.downloads = (parseInt(addon.downloads) || 0) + 1;
  let cached = getCachedAddons();
  if (cached) {
    let cAddon = cached.find(a => a.nombre === nombre);
    if (cAddon) {
      cAddon.downloads = (parseInt(cAddon.downloads) || 0) + 1;
      cacheAddons(cached);
    }
  }

  // Update DOM elements on the page instantly
  updateDomForAddon(nombre, null, null, addon.downloads);

  if (isUserVerified()) {
    // Already verified within last 12 hours - bypass verification page
    saveDownload(addon);
    sendDownload(nombre);
    if (addon.link) {
      window.open(addon.link, '_blank');
    }
    // Redirect parent to downloads tab
    try {
      if (window.parent && window.parent !== window && typeof window.parent.navigateTo === 'function') {
        const btn = window.parent.document.querySelector('[data-page="downloads.html"]');
        window.parent.navigateTo('downloads.html', btn);
      } else {
        window.location.href = 'downloads.html';
      }
    } catch (e) {
      window.location.href = 'downloads.html';
    }
  } else {
    // Verification expired or non-existent - redirect to verification page
    window.location.href = `adsterra.html?link=${encodeURIComponent(addon.link)}&nombre=${encodeURIComponent(addon.nombre)}`;
  }
}

function updateDomForAddon(nombre, isLiked, likesCount, downloadsCount) {
  // Select all cards with this name safely
  const cards = Array.from(document.querySelectorAll('[data-addon-name]')).filter(
    card => card.getAttribute('data-addon-name') === nombre
  );
  
  cards.forEach(card => {
    // 1. Update like button state
    if (isLiked !== null) {
      const likeBtn = card.querySelector('.addon-like-btn');
      if (likeBtn) {
        if (isLiked) likeBtn.classList.add('liked');
        else likeBtn.classList.remove('liked');
      }
    }
    
    // 2. Update likes text count if present (in grid cards)
    if (likesCount !== null) {
      const likesEl = card.querySelector('.addon-grid-likes');
      if (likesEl) {
        const svg = likesEl.querySelector('svg');
        likesEl.innerHTML = (svg ? svg.outerHTML : '') + ' ' + formatNumber(likesCount);
      }
    }
    
    // 3. Update downloads text count
    if (downloadsCount !== null) {
      const dlEl = card.querySelector('.addon-grid-dl');
      if (dlEl) {
        const svg = dlEl.querySelector('svg');
        dlEl.innerHTML = (svg ? svg.outerHTML : '') + ' ' + formatNumber(downloadsCount);
      }
      
      const dlStatEl = card.querySelector('.addon-stat');
      if (dlStatEl) {
        const svg = dlStatEl.querySelector('svg');
        dlStatEl.innerHTML = (svg ? svg.outerHTML : '') + ' ' + formatNumber(downloadsCount);
      }
    }
  });

  // Update open Modal if it exists and matches this addon
  const modalOverlay = document.getElementById('modal-overlay');
  if (modalOverlay && modalOverlay.classList.contains('active')) {
    const modalTitle = modalOverlay.querySelector('.modal-title');
    if (modalTitle && modalTitle.textContent === nombre) {
      if (isLiked !== null) {
        const modalLikeBtn = modalOverlay.querySelector('#modal-like-btn');
        if (modalLikeBtn) {
          if (isLiked) modalLikeBtn.classList.add('liked');
          else modalLikeBtn.classList.remove('liked');
        }
      }
      
      if (likesCount !== null || downloadsCount !== null) {
        const statBoxes = modalOverlay.querySelectorAll('.modal-stat-box');
        statBoxes.forEach(box => {
          const label = box.querySelector('.modal-stat-label');
          const valEl = box.querySelector('.modal-stat-value');
          if (label && valEl) {
            if (likesCount !== null && label.textContent.toLowerCase() === 'likes') {
              valEl.textContent = formatNumber(likesCount);
            }
            if (downloadsCount !== null && label.textContent.toLowerCase() === 'descargas') {
              valEl.textContent = formatNumber(downloadsCount);
            }
          }
        });
      }
    }
  }
}

function handleLike(nombre, btnEl) {
  performLike(nombre);
}

function handleDownload(nombre) {
  performDownload(nombre);
}

/* ── Modal ── */
let allLoadedAddons = [];

function openModal(nombre) {
  const addons = allLoadedAddons.length ? allLoadedAddons : (getCachedAddons() || []);
  const addon = addons.find(a => a.nombre === nombre);
  if (!addon) return;

  const img = getFirstImage(addon.imagenes);
  const liked = isFavorite(addon.nombre);

  let overlay = document.getElementById('modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.className = 'modal-overlay';
    overlay.onclick = function(e) { if (e.target === overlay) closeModal(); };
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-handle"></div>
      <img class="modal-img" src="${escapeHtml(img)}" alt="${escapeHtml(addon.nombre)}" onerror="this.style.display='none'">
      <div class="modal-body">
        <div class="modal-title">${escapeHtml(addon.nombre)}</div>
        ${addon.version ? `<span class="modal-version">v${escapeHtml(addon.version)}</span>` : ''}
        <p class="modal-desc">${escapeHtml(addon.descripcion || 'Sin descripción disponible.')}</p>
        <div class="modal-stats">
          <div class="modal-stat-box">
            <div class="modal-stat-value">${formatNumber(addon.likes)}</div>
            <div class="modal-stat-label">Likes</div>
          </div>
          <div class="modal-stat-box">
            <div class="modal-stat-value">${formatNumber(addon.downloads)}</div>
            <div class="modal-stat-label">Descargas</div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="modal-btn-primary" onclick="handleDownload('${escapeHtml(addon.nombre)}'); closeModal();">
            ${ICONS.download} Descargar
          </button>
          <button class="modal-btn-like ${liked ? 'liked' : ''}" id="modal-like-btn" onclick="handleModalLike('${escapeHtml(addon.nombre)}')">
            ${ICONS.heart}
          </button>
        </div>
      </div>
    </div>
  `;

  requestAnimationFrame(() => overlay.classList.add('active'));
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    setTimeout(() => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 400);
  }
}

function handleModalLike(nombre) {
  performLike(nombre);
  if (typeof renderFavorites === 'function') {
    const addons = allLoadedAddons.length ? allLoadedAddons : (getCachedAddons() || []);
    renderFavorites(addons);
  }
}

/* ── Search filter (called from parent window) ── */
window.filterAddons = function(query) {
  // Each page implements its own renderFiltered or uses this default
  if (typeof window.onFilterAddons === 'function') {
    window.onFilterAddons(query);
  }
};

/* ── Shuffle array ── */
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
