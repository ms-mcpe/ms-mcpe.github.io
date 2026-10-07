/**
 * ============================================================
 *  WorldLeaf Seed - Panel de Administración
 * ============================================================
 *  Propósito: Lógica del panel admin para gestionar semillas
 *  pendientes (aprobar/rechazar).
 * ============================================================
 */

const AdminApp = (() => {

  // ============================================================
  // CONFIGURACIÓN
  // ============================================================

  /**
   * URL del API de Google Apps Script.
   * Configurada directamente para funcionar de forma independiente.
   */
  const API_URL = 'https://script.google.com/macros/s/AKfycbzBdIA0GeNT79gjumisQ-t88PxuDbNLXR7QQgdibGNudNSJ_Vr6eWxRCehSF5BhnYc6/exec';

  /**
   * Estado de la aplicación admin.
   */
  const state = {
    isAuthenticated: false,
    adminToken: null,
    pendingSeeds: [],
    currentSeed: null,
    stats: {
      approved: 0,
      pending: 0,
      java: 0,
      bedrock: 0
    },
    isLoading: false
  };

  // ============================================================
  // INICIALIZACIÓN
  // ============================================================

  /**
   * Inicializa la aplicación admin.
   */
  function init() {
    // Configurar URL del API (ya configurada)
    API.setBaseUrl(API_URL);

    setupEventListeners();
    checkExistingSession();
    hideLoading();
  }

  /**
   * Configura todos los event listeners.
   */
  function setupEventListeners() {
    // Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }

    // Toggle password
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword) {
      togglePassword.addEventListener('click', togglePasswordVisibility);
    }

    // Logout
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
      btnLogout.addEventListener('click', handleLogout);
    }

    // Refresh
    const btnRefresh = document.getElementById('btnRefresh');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', refreshData);
    }

    // Modal
    const modalClose = document.getElementById('modalClose');
    const modalBackdrop = document.getElementById('modalBackdrop');
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

    // Confirm modal
    const confirmCancel = document.getElementById('confirmCancel');
    const confirmAccept = document.getElementById('confirmAccept');
    const confirmBackdrop = document.getElementById('confirmBackdrop');
    if (confirmCancel) confirmCancel.addEventListener('click', closeConfirmModal);
    if (confirmAccept) confirmAccept.addEventListener('click', confirmAction);
    if (confirmBackdrop) confirmBackdrop.addEventListener('click', closeConfirmModal);

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal();
        closeConfirmModal();
      }
    });
  }

  /**
   * Verifica si hay una sesión existente.
   */
  function checkExistingSession() {
    try {
      const savedToken = sessionStorage.getItem('admin_token');
      const savedExpiry = sessionStorage.getItem('admin_token_expiry');

      if (savedToken && savedExpiry && Date.now() < parseInt(savedExpiry)) {
        state.adminToken = savedToken;
        state.isAuthenticated = true;
        showPanel();
        loadAdminData();
      } else {
        showLogin();
      }
    } catch (error) {
      showLogin();
    }
  }

  // ============================================================
  // LOGIN / LOGOUT
  // ============================================================

  /**
   * Maneja el login.
   */
  async function handleLogin(e) {
    e.preventDefault();

    const passwordInput = document.getElementById('adminPassword');
    const loginError = document.getElementById('loginError');
    const loginBtn = document.getElementById('loginBtn');
    const btnText = loginBtn?.querySelector('.btn-text');
    const btnLoading = loginBtn?.querySelector('.btn-loading');

    const password = passwordInput?.value || '';

    if (!password) {
      showFieldError('loginError', 'Ingresa la contraseña');
      return;
    }

    // Limpiar error anterior
    if (loginError) loginError.textContent = '';
    if (passwordInput) passwordInput.classList.remove('invalid');

    // Estado de loading
    if (loginBtn) loginBtn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnLoading) btnLoading.style.display = 'inline-flex';

    try {
      // Verificar configuración
      if (!API.getBaseUrl()) {
        showFieldError('loginError', 'El servicio no está configurado.');
        return;
      }

      // adminLogin ya incluye handleResponse internamente
      const result = await API.adminLogin(password);

      if (result.success && result.token) {
        // Guardar sesión
        state.adminToken = result.token;
        state.isAuthenticated = true;

        const expiry = Date.now() + (24 * 60 * 60 * 1000); // 24h
        sessionStorage.setItem('admin_token', result.token);
        sessionStorage.setItem('admin_token_expiry', expiry.toString());

        showToast('success', '¡Bienvenido!', 'Autenticación exitosa.');
        showPanel();
        loadAdminData();
      } else {
        showFieldError('loginError', result.error || 'Contraseña incorrecta');
      }

    } catch (error) {
      console.error('Error de login:', error);

      // Mostrar error específico
      let errorMsg = 'Error de conexión. Verifica tu internet.';
      if (error.message) {
        if (error.message.includes('Contraseña incorrecta')) {
          errorMsg = 'Contraseña incorrecta.';
        } else if (error.message.includes('URL del backend')) {
          errorMsg = 'Servicio no configurado.';
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMsg = 'Sin conexión al servidor. Verifica tu internet.';
        } else if (error.message.includes('timeout') || error.message.includes('aborted')) {
          errorMsg = 'El servidor tardó demasiado. Intenta de nuevo.';
        } else {
          errorMsg = error.message;
        }
      }

      showFieldError('loginError', errorMsg);
    } finally {
      if (loginBtn) loginBtn.disabled = false;
      if (btnText) btnText.style.display = '';
      if (btnLoading) btnLoading.style.display = 'none';
      // No limpiar el password aquí para que el usuario pueda reintentar
    }
  }

  /**
   * Maneja el logout.
   */
  function handleLogout() {
    state.isAuthenticated = false;
    state.adminToken = null;
    state.pendingSeeds = [];

    try {
      sessionStorage.removeItem('admin_token');
      sessionStorage.removeItem('admin_token_expiry');
    } catch (error) {
      console.warn('Error al limpiar sesión:', error);
    }

    showToast('info', 'Sesión cerrada', 'Has cerrado la sesión correctamente.');
    showLogin();
  }

  /**
   * Alterna la visibilidad de la contraseña.
   */
  function togglePasswordVisibility() {
    const passwordInput = document.getElementById('adminPassword');
    const toggleBtn = document.getElementById('togglePassword');

    if (!passwordInput || !toggleBtn) return;

    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      toggleBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
          <path d="M17.94 17.94C16.2302 19.2721 14.1723 19.9942 12 20C5 20 1 12 1 12C2.69162 9.26896 5.09577 7.06957 7.94 5.58M9.9 4.24C10.5883 4.07886 11.2936 3.99989 12 4C19 4 23 12 23 12C22.2135 13.4649 21.259 14.8179 20.16 16.04M9.9 9.9C9.60557 10.1945 9.37042 10.5406 9.21021 10.9189C9.05 11.2971 8.96877 11.7004 8.97181 12.1067C8.97485 12.5129 9.06209 12.9154 9.22781 13.2862C9.39354 13.657 9.63372 13.9873 9.93234 14.2579C10.231 14.5284 10.5812 14.7332 10.9606 14.8575C11.34 14.9817 11.7397 15.0224 12.1336 14.9766C12.5275 14.9307 12.9054 14.7993 13.2416 14.5909C13.5778 14.3825 13.8639 14.1025 14.0804 13.7702" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M1 1L23 23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `;
    } else {
      passwordInput.type = 'password';
      toggleBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
          <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="2"/>
          <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
        </svg>
      `;
    }
  }

  // ============================================================
  // CARGA DE DATOS
  // ============================================================

  /**
   * Carga todos los datos del admin.
   */
  async function loadAdminData() {
    if (state.isLoading) return;

    state.isLoading = true;
    showLoading();

    try {
      // Cargar pendientes y stats en paralelo
      const [pendingResult, statsResult] = await Promise.allSettled([
        API.getPendingSeeds(state.adminToken),
        API.getAdminStats(state.adminToken)
      ]);

      // Procesar pendientes
      if (pendingResult.status === 'fulfilled' && pendingResult.value.success) {
        state.pendingSeeds = pendingResult.value.seeds || [];
        renderPendingList();
      } else {
        showToast('error', 'Error', 'No se pudieron cargar las semillas pendientes.');
      }

      // Procesar stats
      if (statsResult.status === 'fulfilled' && statsResult.value.success) {
        state.stats = statsResult.value.stats || state.stats;
        updateStatsUI();
      }

    } catch (error) {
      console.error('Error cargando datos admin:', error);
      showToast('error', 'Error', API.formatError(error));
    } finally {
      state.isLoading = false;
      hideLoading();
    }
  }

  /**
   * Recarga los datos.
   */
  async function refreshData() {
    await loadAdminData();
    showToast('info', 'Actualizado', 'Datos recargados correctamente.');
  }

  // ============================================================
  // RENDERIZADO
  // ============================================================

  /**
   * Muestra el panel de admin.
   */
  function showPanel() {
    const loginSection = document.getElementById('adminLogin');
    const panelSection = document.getElementById('adminPanel');
    const adminUser = document.getElementById('adminUser');

    if (loginSection) loginSection.style.display = 'none';
    if (panelSection) panelSection.style.display = 'block';
    if (adminUser) adminUser.style.display = 'flex';
  }

  /**
   * Muestra el login.
   */
  function showLogin() {
    const loginSection = document.getElementById('adminLogin');
    const panelSection = document.getElementById('adminPanel');
    const adminUser = document.getElementById('adminUser');

    if (loginSection) loginSection.style.display = 'flex';
    if (panelSection) panelSection.style.display = 'none';
    if (adminUser) adminUser.style.display = 'none';
  }

  /**
   * Anima un contador desde su valor actual hasta el objetivo.
   */
  function animateCounter(element, target) {
    if (!element) return;

    const current = parseInt(element.textContent) || 0;
    if (current === target) return;

    const duration = 600;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing: easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(current + (target - current) * eased);

      element.textContent = value;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  /**
   * Actualiza las estadísticas en la UI.
   */
  function updateStatsUI() {
    const statPending = document.getElementById('statPending');
    const statApproved = document.getElementById('statApproved');
    const statJava = document.getElementById('statJava');
    const statBedrock = document.getElementById('statBedrock');
    const pendingBadge = document.getElementById('pendingBadge');

    animateCounter(statPending, state.stats.pending || 0);
    animateCounter(statApproved, state.stats.approved || 0);
    animateCounter(statJava, state.stats.java || 0);
    animateCounter(statBedrock, state.stats.bedrock || 0);

    if (pendingBadge) {
      const count = state.stats.pending || 0;
      pendingBadge.textContent = count;
      pendingBadge.classList.toggle('zero', count === 0);
    }
  }

  /**
   * Renderiza la lista de semillas pendientes.
   */
  function renderPendingList() {
    const list = document.getElementById('pendingList');
    const emptyState = document.getElementById('adminEmpty');

    if (!list) return;

    if (state.pendingSeeds.length === 0) {
      list.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    list.innerHTML = state.pendingSeeds.map((seed, index) => renderPendingItem(seed, index)).join('');

    // Agregar event listeners
    list.querySelectorAll('.pending-item').forEach(item => {
      const seedId = item.getAttribute('data-id');

      const viewBtn = item.querySelector('.btn-view');
      const approveBtn = item.querySelector('.btn-approve');
      const rejectBtn = item.querySelector('.btn-reject');

      if (viewBtn) {
        viewBtn.addEventListener('click', () => {
          const seed = state.pendingSeeds.find(s => s.id === seedId);
          if (seed) openSeedDetail(seed);
        });
      }

      if (approveBtn) {
        approveBtn.addEventListener('click', () => {
          const seed = state.pendingSeeds.find(s => s.id === seedId);
          if (seed) confirmApprove(seed);
        });
      }

      if (rejectBtn) {
        rejectBtn.addEventListener('click', () => {
          const seed = state.pendingSeeds.find(s => s.id === seedId);
          if (seed) confirmReject(seed);
        });
      }
    });
  }

  /**
   * Renderiza un item de la lista de pendientes.
   */
  function renderPendingItem(seed, index) {
    const versionClass = seed.version === 'Java' ? 'java' :
                         seed.version === 'Bedrock' ? 'bedrock' : 'both';

    const images = seed.imageUrls ? seed.imageUrls.split('|').filter(u => u.trim()) : [];
    const firstImage = images[0] || '';

    const imageHtml = firstImage ?
      `<img src="${Security.escapeAttribute(firstImage)}" alt="${Security.escapeAttribute(seed.name)}" loading="lazy">` :
      `<div class="no-image">
        <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
          <path d="M21 15L16 10L5 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Sin imagen</span>
      </div>`;

    const author = seed.author || 'Anónimo';
    const date = formatDate(seed.createdAt);

    return `
      <div class="pending-item" data-id="${Security.escapeAttribute(seed.id)}" style="animation-delay: ${Math.min(index * 0.05, 0.5)}s">
        <div class="pending-item-image">
          ${imageHtml}
        </div>
        <div class="pending-item-info">
          <div class="pending-item-header">
            <div>
              <h3 class="pending-item-title">${Security.escapeHtml(seed.name)}</h3>
              <div class="pending-item-badges">
                <span class="badge-sm ${versionClass}">${Security.escapeHtml(seed.version)}</span>
                ${seed.versionNumber ? `<span class="badge-sm">${Security.escapeHtml(seed.versionNumber)}</span>` : ''}
                ${seed.dimension ? `<span class="badge-sm">${Security.escapeHtml(seed.dimension)}</span>` : ''}
              </div>
            </div>
          </div>
          <div class="pending-item-seed" title="${Security.escapeAttribute(seed.seedNumber)}">
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
              <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            </svg>
            ${Security.escapeHtml(seed.seedNumber)}
          </div>
          <p class="pending-item-description">${Security.escapeHtml(seed.description)}</p>
          <div class="pending-item-meta">
            <span>
              <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2"/>
                <path d="M20 21C20 18.2386 16.4183 16 12 16C7.58172 16 4 18.2386 4 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              ${Security.escapeHtml(author)}
            </span>
            <span>
              <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              ${date}
            </span>
            ${images.length > 0 ? `
              <span>
                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                  <path d="M21 15L16 10L5 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                ${images.length} imagen${images.length > 1 ? 'es' : ''}
              </span>
            ` : ''}
          </div>
        </div>
        <div class="pending-item-actions">
          <button class="btn btn-approve btn-sm">
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
              <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Aprobar
          </button>
          <button class="btn btn-reject btn-sm">
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Rechazar
          </button>
          <button class="btn btn-view btn-sm">
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
              <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="2"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
            </svg>
            Ver detalle
          </button>
        </div>
      </div>
    `;
  }

  // ============================================================
  // MODAL DETALLE
  // ============================================================

  /**
   * Abre el modal con el detalle de una semilla.
   */
  function openSeedDetail(seed) {
    const modal = document.getElementById('seedDetailModal');
    const modalBody = document.getElementById('modalBody');
    const modalFooter = document.getElementById('modalFooter');

    if (!modal || !modalBody) return;

    state.currentSeed = seed;
    modalBody.innerHTML = renderSeedDetail(seed);

    if (modalFooter) {
      modalFooter.innerHTML = `
        <button class="btn btn-ghost" id="detailClose">Cerrar</button>
        <button class="btn btn-reject" id="detailReject">
          <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Rechazar
        </button>
        <button class="btn btn-approve" id="detailApprove">
          <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
            <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Aprobar
        </button>
      `;

      // Event listeners
      const detailClose = document.getElementById('detailClose');
      const detailApprove = document.getElementById('detailApprove');
      const detailReject = document.getElementById('detailReject');

      if (detailClose) detailClose.addEventListener('click', closeModal);
      if (detailApprove) {
        detailApprove.addEventListener('click', () => {
          closeModal();
          confirmApprove(seed);
        });
      }
      if (detailReject) {
        detailReject.addEventListener('click', () => {
          closeModal();
          confirmReject(seed);
        });
      }
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Configurar thumbnails
    setupDetailThumbnails();
  }

  /**
   * Renderiza el detalle de una semilla.
   */
  function renderSeedDetail(seed) {
    const images = seed.imageUrls ? seed.imageUrls.split('|').filter(u => u.trim()) : [];
    const versionClass = seed.version === 'Java' ? 'java' :
                         seed.version === 'Bedrock' ? 'bedrock' : 'both';
    const author = seed.author || 'Anónimo';
    const authorInitial = author.charAt(0).toUpperCase();

    const mainImageHtml = images.length > 0 ?
      `<img src="${Security.escapeAttribute(images[0])}" alt="${Security.escapeAttribute(seed.name)}" class="admin-main-image" id="detailMainImage">` :
      `<div class="admin-main-image" style="display: flex; align-items: center; justify-content: center; background: var(--bg-card); min-height: 200px; color: var(--text-muted);">
        <svg viewBox="0 0 24 24" fill="none" width="64" height="64">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
          <path d="M21 15L16 10L5 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>`;

    const thumbnailsHtml = images.length > 1 ?
      `<div class="admin-thumbnails">
        ${images.map((img, i) => `
          <div class="admin-thumbnail ${i === 0 ? 'active' : ''}" data-index="${i}">
            <img src="${Security.escapeAttribute(img)}" alt="Imagen ${i + 1}">
          </div>
        `).join('')}
      </div>` : '';

    const biomes = seed.biomes ? seed.biomes.split(',').map(b => b.trim()).filter(Boolean) : [];
    const structures = seed.structures ? seed.structures.split(',').map(s => s.trim()).filter(Boolean) : [];

    return `
      <div class="admin-seed-detail">
        <div class="admin-seed-detail-header">
          <h2 class="admin-seed-detail-title">${Security.escapeHtml(seed.name)}</h2>
          <div class="admin-seed-detail-badges">
            <span class="badge badge-version">${Security.escapeHtml(seed.version)}</span>
            <span class="badge badge-seed">Seed: ${Security.escapeHtml(seed.seedNumber)}</span>
          </div>
        </div>

        <div class="admin-seed-images">
          ${mainImageHtml}
          ${thumbnailsHtml}
        </div>

        <div class="admin-seed-info-grid">
          <div class="admin-info-item">
            <div class="admin-info-label">Versión</div>
            <div class="admin-info-value">${Security.escapeHtml(seed.version)}</div>
          </div>
          <div class="admin-info-item">
            <div class="admin-info-label">Versión Juego</div>
            <div class="admin-info-value">${Security.escapeHtml(seed.versionNumber || 'N/A')}</div>
          </div>
          <div class="admin-info-item">
            <div class="admin-info-label">Dimensión</div>
            <div class="admin-info-value">${Security.escapeHtml(seed.dimension || 'Overworld')}</div>
          </div>
          <div class="admin-info-item">
            <div class="admin-info-label">Coordenadas</div>
            <div class="admin-info-value">${Security.escapeHtml(seed.coordinates || 'N/A')}</div>
          </div>
        </div>

        ${biomes.length > 0 ? `
          <div class="admin-seed-tags">
            ${biomes.map(b => `<span class="tag">🌿 ${Security.escapeHtml(b)}</span>`).join('')}
          </div>
        ` : ''}

        ${structures.length > 0 ? `
          <div class="admin-seed-tags">
            ${structures.map(s => `<span class="tag">🏛️ ${Security.escapeHtml(s)}</span>`).join('')}
          </div>
        ` : ''}

        <div class="admin-seed-description">
          <h4>Descripción</h4>
          <p>${Security.escapeHtml(seed.description)}</p>
        </div>

        <div class="admin-seed-author">
          <div class="admin-author-avatar">${Security.escapeHtml(authorInitial)}</div>
          <div class="admin-author-info">
            <div class="admin-author-name">${Security.escapeHtml(author)}</div>
            <div class="admin-author-label">Autor de la semilla</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Configura los thumbnails del modal de detalle.
   */
  function setupDetailThumbnails() {
    const thumbnails = document.querySelectorAll('.admin-thumbnail');
    const mainImage = document.getElementById('detailMainImage');

    if (!mainImage || thumbnails.length === 0) return;

    thumbnails.forEach(thumb => {
      thumb.addEventListener('click', () => {
        const img = thumb.querySelector('img');
        if (img) {
          mainImage.src = img.src;
          thumbnails.forEach(t => t.classList.remove('active'));
          thumb.classList.add('active');
        }
      });
    });
  }

  /**
   * Cierra el modal de detalle.
   */
  function closeModal() {
    const modal = document.getElementById('seedDetailModal');
    if (!modal) return;

    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    state.currentSeed = null;
  }

  // ============================================================
  // ACCIONES: APROBAR / RECHAZAR
  // ============================================================

  /**
   * Confirma la aprobación de una semilla.
   */
  function confirmApprove(seed) {
    state.currentSeed = seed;

    const modal = document.getElementById('confirmModal');
    const confirmIcon = document.getElementById('confirmIcon');
    const confirmTitle = document.getElementById('confirmTitle');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmReasonGroup = document.getElementById('confirmReasonGroup');
    const confirmAccept = document.getElementById('confirmAccept');

    if (!modal) return;

    if (confirmIcon) {
      confirmIcon.className = 'confirm-icon approve';
      confirmIcon.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" width="48" height="48">
          <path d="M22 11.08V12C21.9988 14.1565 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43729 15.628 1.87981 13.4881 2.02166 11.3363C2.1635 9.18455 2.99718 7.13631 4.39828 5.49706C5.79938 3.85781 7.69279 2.71537 9.79619 2.22345C11.8996 1.73152 14.1003 1.91319 16.1 2.73999" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
    }

    if (confirmTitle) confirmTitle.textContent = '¿Aprobar semilla?';
    if (confirmMessage) {
      confirmMessage.innerHTML = `La semilla <strong>${Security.escapeHtml(seed.name)}</strong> será publicada en el sitio principal.`;
    }
    if (confirmReasonGroup) confirmReasonGroup.style.display = 'none';
    if (confirmAccept) {
      confirmAccept.textContent = 'Sí, aprobar';
      confirmAccept.className = 'btn btn-approve';
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  /**
   * Confirma el rechazo de una semilla.
   */
  function confirmReject(seed) {
    state.currentSeed = seed;

    const modal = document.getElementById('confirmModal');
    const confirmIcon = document.getElementById('confirmIcon');
    const confirmTitle = document.getElementById('confirmTitle');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmReasonGroup = document.getElementById('confirmReasonGroup');
    const confirmAccept = document.getElementById('confirmAccept');
    const rejectReason = document.getElementById('rejectReason');

    if (!modal) return;

    if (confirmIcon) {
      confirmIcon.className = 'confirm-icon reject';
      confirmIcon.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" width="48" height="48">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
    }

    if (confirmTitle) confirmTitle.textContent = '¿Rechazar semilla?';
    if (confirmMessage) {
      confirmMessage.innerHTML = `La semilla <strong>${Security.escapeHtml(seed.name)}</strong> será eliminada de pendientes.`;
    }
    if (confirmReasonGroup) confirmReasonGroup.style.display = 'block';
    if (rejectReason) rejectReason.value = '';
    if (confirmAccept) {
      confirmAccept.textContent = 'Sí, rechazar';
      confirmAccept.className = 'btn btn-reject';
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  /**
   * Ejecuta la acción confirmada (aprobar/rechazar).
   */
  async function confirmAction() {
    const confirmAccept = document.getElementById('confirmAccept');
    const rejectReason = document.getElementById('rejectReason');

    if (!state.currentSeed) {
      closeConfirmModal();
      return;
    }

    const seedId = state.currentSeed.id;
    const isApprove = confirmAccept?.textContent?.includes('aprobar');
    const reason = rejectReason?.value?.trim() || '';

    // Cerrar modal de confirmación
    closeConfirmModal();

    // Marcar item como procesando
    const item = document.querySelector(`.pending-item[data-id="${seedId}"]`);
    if (item) item.classList.add('processing');

    try {
      let result;

      if (isApprove) {
        result = await API.handleResponse(API.adminApproveSeed(state.adminToken, seedId));
      } else {
        result = await API.handleResponse(API.adminRejectSeed(state.adminToken, seedId, reason));
      }

      if (result.success) {
        showToast('success',
          isApprove ? 'Semilla aprobada' : 'Semilla rechazada',
          result.message || 'Acción completada correctamente.'
        );

        // Recargar datos
        await loadAdminData();
      } else {
        showToast('error', 'Error', result.error || 'No se pudo completar la acción.');
        if (item) item.classList.remove('processing');
      }

    } catch (error) {
      console.error('Error en acción:', error);
      showToast('error', 'Error', API.formatError(error));
      if (item) item.classList.remove('processing');
    } finally {
      state.currentSeed = null;
    }
  }

  /**
   * Cierra el modal de confirmación.
   */
  function closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    if (!modal) return;

    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  // ============================================================
  // UTILIDADES
  // ============================================================

  /**
   * Muestra el overlay de carga.
   */
  function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.remove('hidden');
      overlay.setAttribute('aria-hidden', 'false');
    }
  }

  /**
   * Oculta el overlay de carga.
   */
  function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');
    }
  }

  /**
   * Muestra error en un campo.
   */
  function showFieldError(fieldId, message) {
    const errorEl = document.getElementById(fieldId);
    if (errorEl) {
      errorEl.textContent = message;
    }
  }

  /**
   * Muestra una notificación toast.
   */
  function showToast(type, title, message, duration = 5000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const iconMap = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    toast.innerHTML = `
      <div class="toast-icon">${iconMap[type] || 'ℹ'}</div>
      <div class="toast-body">
        <div class="toast-title">${Security.escapeHtml(title)}</div>
        <div class="toast-message">${Security.escapeHtml(message)}</div>
      </div>
      <button class="toast-close" aria-label="Cerrar">×</button>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => hideToast(toast));

    setTimeout(() => hideToast(toast), duration);
  }

  /**
   * Oculta un toast.
   */
  function hideToast(toast) {
    if (!toast || !toast.parentNode) return;

    toast.classList.remove('show');
    toast.classList.add('hide');

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  /**
   * Formatea una fecha.
   */
  function formatDate(dateString) {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  }

  /**
   * Configura la URL del API.
   */
  function configureApi(url) {
    API.setBaseUrl(url);
    try {
      localStorage.setItem('worldleaf_api_url', url);
    } catch (error) {
      console.warn('No se pudo guardar configuración:', error);
    }
    showToast('success', 'Configurado', 'URL del API guardada correctamente.');
  }

  // ============================================================
  // API PÚBLICA
  // ============================================================

  return {
    init,
    configureApi,
    refreshData
  };

})();

// ============================================================
// EXTENSIÓN DE API PARA ADMIN
// ============================================================ */

// Agregar métodos admin al objeto API
API.adminLogin = async function(password) {
  if (!this.getBaseUrl()) {
    throw new Error('URL del backend no configurada.');
  }

  const url = `${this.getBaseUrl()}`;

  try {
    const result = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({ action: 'admin_login', password }),
      timeout: 20000
    });

    return result;
  } catch (error) {
    console.error('Error en adminLogin:', error);
    throw new Error(error.message || 'Error de conexión con el servidor');
  }
};

API.getPendingSeeds = async function(token) {
  if (!this.getBaseUrl()) {
    throw new Error('URL del backend no configurada.');
  }

  const url = `${this.getBaseUrl()}?action=admin_pending&token=${encodeURIComponent(token)}`;

  return this.handleResponse(this.fetchWithRetry(url, {
    method: 'GET',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' }
  }));
};

API.getAdminStats = async function(token) {
  if (!this.getBaseUrl()) {
    throw new Error('URL del backend no configurada.');
  }

  const url = `${this.getBaseUrl()}?action=admin_stats&token=${encodeURIComponent(token)}`;

  return this.handleResponse(this.fetchWithRetry(url, {
    method: 'GET',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' }
  }));
};

API.adminApproveSeed = async function(token, seedId) {
  if (!this.getBaseUrl()) {
    throw new Error('URL del backend no configurada.');
  }

  return this.handleResponse(this.fetchWithRetry(`${this.getBaseUrl()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify({ action: 'admin_approve', token, seedId }),
    timeout: 30000
  }));
};

API.adminRejectSeed = async function(token, seedId, reason) {
  if (!this.getBaseUrl()) {
    throw new Error('URL del backend no configurada.');
  }

  return this.handleResponse(this.fetchWithRetry(`${this.getBaseUrl()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify({ action: 'admin_reject', token, seedId, reason }),
    timeout: 30000
  }));
};

// ============================================================
// INICIALIZACIÓN
// ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // La URL ya está configurada en AdminApp.API_URL
  // Configurar por defecto
  const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbzBdIA0GeNT79gjumisQ-t88PxuDbNLXR7QQgdibGNudNSJ_Vr6eWxRCehSF5BhnYc6/exec';

  try {
    const savedUrl = localStorage.getItem('worldleaf_api_url');
    if (savedUrl) {
      API.setBaseUrl(savedUrl);
    } else {
      API.setBaseUrl(DEFAULT_API_URL);
    }
  } catch (error) {
    console.warn('No se pudo cargar configuración:', error);
    API.setBaseUrl(DEFAULT_API_URL);
  }

  AdminApp.init();
});

// Exponer para consola
window.AdminApp = AdminApp;
window.API = API;
