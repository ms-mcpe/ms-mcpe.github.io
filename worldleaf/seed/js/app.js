/**
 * ============================================================
 *  WorldLeaf Seed - Aplicación Principal
 * ============================================================
 *  Propósito: Lógica principal de la interfaz de usuario.
 *  Maneja navegación, renderizado, formularios, modales y
 *  comunicación con el backend.
 * ============================================================
 */

const App = (() => {

  // ============================================================
  // ESTADO DE LA APLICACIÓN
  // ============================================================

  const state = {
    currentPage: 1,
    totalPages: 1,
    pageSize: 12,
    totalSeeds: 0,
    seeds: [],
    shuffleSeed: 0,
    filters: {
      q: '',
      version: '',
      biome: '',
      structure: ''
    },
    selectedImages: [],
    viewMode: 'grid',
    isLoading: false,
    isSubmitting: false,
    currentSeed: null
  };

  // Listas de opciones para filtros
  const BIOMES = [
    'Plains', 'Desert', 'Forest', 'Taiga', 'Jungle', 'Savanna',
    'Swamp', 'Mountains', 'Ocean', 'River', 'Mushroom', 'Nether',
    'End', 'Badlands', 'Cherry Grove', 'Deep Dark', 'Meadow',
    'Snowy', 'Warm Ocean', 'Lush Caves', 'Dripstone Caves'
  ];

  const STRUCTURES = [
    'Village', 'Stronghold', 'Woodland Mansion', 'Ocean Monument',
    'Desert Temple', 'Jungle Temple', 'Witch Hut', 'Igloo',
    'Shipwreck', 'Buried Treasure', 'Pillager Outpost', 'Ancient City',
    'Trial Chamber', 'Fortress', 'Bastion Remnant', 'End City',
    'Mineshaft', 'Dungeon', 'Stronghold Portal', 'Other'
  ];

  // ============================================================
  // INICIALIZACIÓN
  // ============================================================ */

  // ============================================================
  // CONFIGURACIÓN
  // ============================================================

  /**
   * URL del API de Google Apps Script.
   * Configurada directamente para funcionar de forma independiente.
   */
  const API_URL = 'https://script.google.com/macros/s/AKfycbzBdIA0GeNT79gjumisQ-t88PxuDbNLXR7QQgdibGNudNSJ_Vr6eWxRCehSF5BhnYc6/exec';

  /**
   * Inicializa la aplicación cuando el DOM está listo.
   */
  function init() {
    // Configurar URL del API (ya configurada arriba)
    API.setBaseUrl(API_URL);

    // Cargar configuración guardada (si existe, sobreescribe)
    loadConfig();

    // Configurar event listeners
    setupNavigation();
    setupSearch();
    setupFilters();
    setupForm();
    setupImageUpload();
    setupModal();
    setupViewToggle();
    setupScrollEffects();
    setupLangToggles();

    // Cargar datos iniciales
    loadInitialData();

    // Ocultar loading overlay
    hideLoading();
  }

  /**
   * Carga configuración desde localStorage.
   * La URL del API ya está configurada por defecto arriba.
   */
  function loadConfig() {
    try {
      const savedUrl = localStorage.getItem('worldleaf_api_url');
      if (savedUrl) {
        API.setBaseUrl(savedUrl);
      } else {
        // Usar la URL por defecto
        API.setBaseUrl(API_URL);
      }
    } catch (error) {
      console.warn('No se pudo cargar configuración:', error);
      API.setBaseUrl(API_URL);
    }
  }

  /**
   * Guarda la URL del API en localStorage.
   * @param {string} url
   */
  function saveApiUrl(url) {
    try {
      localStorage.setItem('worldleaf_api_url', url);
      API.setBaseUrl(url);
    } catch (error) {
      console.warn('No se pudo guardar configuración:', error);
    }
  }

  // ============================================================
  // LOADING OVERLAY
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

  // ============================================================
  // NAVEGACIÓN
  // ============================================================

  /**
   * Configura la navegación del sitio.
   */
  function setupNavigation() {
    const navToggle = document.getElementById('navToggle');
    const nav = document.getElementById('nav');
    const navLinks = document.querySelectorAll('.nav-link');
    const header = document.getElementById('header');

    // Toggle menú móvil
    if (navToggle && nav) {
      navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        nav.classList.toggle('open');
      });
    }

    // Cerrar menú al hacer clic en un enlace
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (navToggle) navToggle.classList.remove('active');
        if (nav) nav.classList.remove('open');
      });
    });

    // Actualizar enlace activo según scroll
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
      const scrollPos = window.scrollY + 100;

      sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        const id = section.getAttribute('id');

        if (scrollPos >= top && scrollPos < top + height) {
          navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === id) {
              link.classList.add('active');
            }
          });
        }
      });

      // Efecto scrolled en header
      if (header) {
        if (window.scrollY > 50) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      }
    });
  }

  /**
   * Configura los efectos de scroll.
   */
  function setupScrollEffects() {
    // Crear partículas del hero
    createParticles();
  }

  // ============================================================
  // BÚSQUEDA Y FILTROS
  // ============================================================

  /**
   * Configura la búsqueda en tiempo real.
   */
  function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');

    if (!searchInput) return;

    // Debounce para búsqueda
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      const value = e.target.value;

      // Mostrar/ocultar botón de limpiar
      if (searchClear) {
        searchClear.classList.toggle('visible', value.length > 0);
      }

      // Debounce de 400ms
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        state.filters.q = value;
        state.currentPage = 1;
        loadSeeds();
      }, 400);
    });

    // Limpiar búsqueda
    if (searchClear) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchClear.classList.remove('visible');
        state.filters.q = '';
        state.currentPage = 1;
        loadSeeds();
      });
    }
  }

  /**
   * Configura los selects de filtros.
   */
  function setupFilters() {
    const filterVersion = document.getElementById('filterVersion');
    const filterBiome = document.getElementById('filterBiome');
    const filterStructure = document.getElementById('filterStructure');
    const btnClearFilters = document.getElementById('btnClearFilters');

    // Poblar selects de biomas y estructuras
    if (filterBiome) {
      BIOMES.forEach(biome => {
        const option = document.createElement('option');
        option.value = biome;
        option.textContent = biome;
        filterBiome.appendChild(option);
      });
    }

    if (filterStructure) {
      STRUCTURES.forEach(structure => {
        const option = document.createElement('option');
        option.value = structure;
        option.textContent = structure;
        filterStructure.appendChild(option);
      });
    }

    // Event listeners
    if (filterVersion) {
      filterVersion.addEventListener('change', (e) => {
        state.filters.version = e.target.value;
        state.currentPage = 1;
        loadSeeds();
      });
    }

    if (filterBiome) {
      filterBiome.addEventListener('change', (e) => {
        state.filters.biome = e.target.value;
        state.currentPage = 1;
        loadSeeds();
      });
    }

    if (filterStructure) {
      filterStructure.addEventListener('change', (e) => {
        state.filters.structure = e.target.value;
        state.currentPage = 1;
        loadSeeds();
      });
    }

    // Limpiar todos los filtros
    if (btnClearFilters) {
      btnClearFilters.addEventListener('click', clearFilters);
    }
  }

  /**
   * Limpia todos los filtros.
   */
  function clearFilters() {
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    const filterVersion = document.getElementById('filterVersion');
    const filterBiome = document.getElementById('filterBiome');
    const filterStructure = document.getElementById('filterStructure');

    if (searchInput) searchInput.value = '';
    if (searchClear) searchClear.classList.remove('visible');
    if (filterVersion) filterVersion.value = '';
    if (filterBiome) filterBiome.value = '';
    if (filterStructure) filterStructure.value = '';

    state.filters = { q: '', version: '', biome: '', structure: '' };
    state.currentPage = 1;

    loadSeeds();

    showToast('info', 'Filtros limpios', 'Se muestran todas las semillas.');
  }

  /**
   * Configura el toggle de vista (grid/list).
   */
  function setupViewToggle() {
    const viewButtons = document.querySelectorAll('.view-btn');
    const seedsGrid = document.getElementById('seedsGrid');

    viewButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');

        viewButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (seedsGrid) {
          if (view === 'list') {
            seedsGrid.classList.add('list-view');
          } else {
            seedsGrid.classList.remove('list-view');
          }
        }

        state.viewMode = view;
      });
    });
  }

  // ============================================================
  // CARGA DE DATOS
  // ============================================================

  /**
   * Carga los datos iniciales de la aplicación.
   */
  async function loadInitialData() {
    showLoading();

    try {
      // Verificar configuración
      if (!API.getBaseUrl()) {
        showConfigWarning();
        renderEmptySeeds();
        return;
      }

      // Orden aleatorio desde el primer vistazo (misma semilla al paginar)
      state.shuffleSeed = Math.floor(Math.random() * 2147483647) + 1;

      // Cargar semillas y estadísticas en paralelo
      const [seedsResult, statsResult] = await Promise.allSettled([
        API.getSeeds({ page: 1, limit: state.pageSize, shuffleSeed: state.shuffleSeed }),
        API.getStats()
      ]);

      // Procesar semillas
      if (seedsResult.status === 'fulfilled' && seedsResult.value.success) {
        updateSeedsUI(seedsResult.value);
      } else {
        renderEmptySeeds();
        showToast('warning', 'Sin conexión', 'No se pudieron cargar las semillas.');
      }

      // Procesar estadísticas
      if (statsResult.status === 'fulfilled' && statsResult.value.success) {
        updateStatsUI(statsResult.value.stats);
      }

    } catch (error) {
      console.error('Error cargando datos:', error);
      renderEmptySeeds();
      showToast('error', 'Error', API.formatError(error));
    } finally {
      hideLoading();
    }
  }

  /**
   * Carga semillas con los filtros actuales.
   */
  async function loadSeeds() {
    if (state.isLoading) return;

    state.isLoading = true;
    showSeedsLoading();

    try {
      // Orden aleatorio por sesión: se genera al cargar o cambiar filtros
      // (página 1) y se reutiliza al paginar para que el orden sea estable.
      if (state.currentPage === 1 || !state.shuffleSeed) {
        state.shuffleSeed = Math.floor(Math.random() * 2147483647) + 1;
      }

      const params = {
        page: state.currentPage,
        limit: state.pageSize,
        shuffleSeed: state.shuffleSeed,
        q: state.filters.q,
        version: state.filters.version,
        biome: state.filters.biome,
        structure: state.filters.structure
      };

      let result;

      if (state.filters.q || state.filters.version || state.filters.biome || state.filters.structure) {
        result = await API.searchSeeds(params);
      } else {
        result = await API.getSeeds(params);
      }

      if (result.success) {
        updateSeedsUI(result);
      } else {
        showToast('error', 'Error', result.error || 'No se pudieron cargar las semillas.');
      }

    } catch (error) {
      console.error('Error cargando semillas:', error);
      showToast('error', 'Error', API.formatError(error));
    } finally {
      state.isLoading = false;
    }
  }

  // ============================================================
  // RENDERIZADO DE UI
  // ============================================================

  /**
   * Actualiza la UI con las semillas recibidas.
   * @param {Object} result - Resultado de la API
   */
  function updateSeedsUI(result) {
    state.seeds = result.seeds || [];
    state.totalSeeds = result.total || 0;
    state.totalPages = result.totalPages || 1;
    state.currentPage = result.page || 1;

    renderSeeds();
    renderPagination();
    updateResultsCount();
  }

  /**
   * Renderiza las semillas en el grid.
   */
  function renderSeeds() {
    const grid = document.getElementById('seedsGrid');
    const emptyState = document.getElementById('emptyState');

    if (!grid) return;

    if (state.seeds.length === 0) {
      grid.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    grid.innerHTML = state.seeds.map((seed, index) => renderSeedCard(seed, index)).join('');

    // Agregar event listeners a las cards
    grid.querySelectorAll('.seed-card').forEach(card => {
      card.addEventListener('click', () => {
        const seedId = card.getAttribute('data-id');
        const seed = state.seeds.find(s => s.id === seedId);
        if (seed) openModal(seed);
      });
    });
  }

  /**
   * Traduce un texto al español en el cliente (endpoint público de Google).
   * Devuelve '' si falla.
   */
  async function translateText(text) {
    try {
      const url = 'https://translate.googleapis.com/translate_a/single' +
        '?client=gtx&sl=auto&tl=es&dt=t&q=' + encodeURIComponent(text);
      const response = await fetch(url);
      if (!response.ok) return '';
      const data = await response.json();
      return (Array.isArray(data[0]) ? data[0] : [])
        .map((part) => (Array.isArray(part) ? String(part[0] || '') : ''))
        .join('')
        .trim();
    } catch (error) {
      return '';
    }
  }

  /**
   * Alterna descripción EN/ES en cards y modal (delegación global).
   * Si la traducción del servidor no existe, la pide al vuelo.
   */
  function setupLangToggles() {
    document.addEventListener('click', async (event) => {
      const button = event.target.closest('.lang-toggle');
      if (!button || button.disabled) return;

      const block = button.closest('.desc-block, .modal-seed-description');
      if (!block) return;

      const textEl = block.querySelector('[data-desc-en]');
      if (!textEl) return;

      const showingEs = textEl.getAttribute('data-lang') === 'es';
      const span = button.querySelector('span');

      if (showingEs) {
        textEl.textContent = textEl.getAttribute('data-desc-en') || '';
        textEl.setAttribute('data-lang', 'en');
        if (span) span.textContent = 'ES';
        button.classList.remove('active');
        return;
      }

      let es = (textEl.getAttribute('data-desc-es') || '').trim();

      if (!es) {
        const original = (textEl.getAttribute('data-desc-en') || '').trim();
        if (!original) return;

        button.disabled = true;
        if (span) span.textContent = '…';
        es = await translateText(original);
        button.disabled = false;

        if (!es) {
          if (span) span.textContent = 'Traducir';
          showToast('error', 'No se pudo traducir la descripción');
          return;
        }
        textEl.setAttribute('data-desc-es', es);
      }

      textEl.textContent = es;
      textEl.setAttribute('data-lang', 'es');
      if (span) span.textContent = 'EN';
      button.classList.add('active');
    });
  }

  /**
   * Renderiza una card de semilla.
   * @param {Object} seed - Datos de la semilla
   * @param {number} index - Índice para animación
   * @returns {string} HTML de la card
   */
  function renderSeedCard(seed, index) {
    const versionClass = seed.version === 'Java' ? 'java' :
                         seed.version === 'Bedrock' ? 'bedrock' : 'both';

    // Obtener primera imagen
    const images = seed.imageUrls ? seed.imageUrls.split('|').filter(u => u.trim()) : [];
    const firstImage = images[0] || '';

    const imageHtml = firstImage ?
      `<img src="${Security.escapeAttribute(firstImage)}" alt="${Security.escapeAttribute(seed.name)}" loading="lazy">` :
      `<div class="no-image">
        <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
          <path d="M21 15L16 10L5 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Sin imagen</span>
      </div>`;

    const author = seed.author || 'Anónimo';
    const date = formatDate(seed.createdAt);
    const hasEs = !!(seed.descriptionEs && String(seed.descriptionEs).trim());
    const hasDesc = !!(seed.description && String(seed.description).trim());

    return `
      <article class="seed-card" data-id="${Security.escapeAttribute(seed.id)}" style="animation-delay: ${Math.min(index * 0.05, 0.6)}s">
        <div class="seed-card-image">
          ${imageHtml}
          <span class="seed-card-version ${versionClass}">${Security.escapeHtml(seed.version)}</span>
        </div>
        <div class="seed-card-body">
          <h3 class="seed-card-title">${Security.escapeHtml(seed.name)}</h3>
          <div class="seed-card-seed" title="${Security.escapeAttribute(seed.seedNumber)}">
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
              <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            </svg>
            ${Security.escapeHtml(seed.seedNumber)}
          </div>
          <div class="desc-block">
            <p class="seed-card-description" data-lang="en" data-desc-en="${Security.escapeAttribute(seed.description || '')}" data-desc-es="${Security.escapeAttribute(seed.descriptionEs || '')}">${Security.escapeHtml(seed.description)}</p>
            ${hasDesc ? `
            <div class="desc-actions">
              <button type="button" class="lang-toggle" aria-label="Traducir descripción">🌐 <span>${hasEs ? 'ES' : 'Traducir'}</span></button>
            </div>` : ''}
          </div>
          <div class="seed-card-meta">
            <div class="seed-card-author">
              <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2"/>
                <path d="M20 21C20 18.2386 16.4183 16 12 16C7.58172 16 4 18.2386 4 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              ${Security.escapeHtml(author)}
            </div>
            <span class="seed-card-date">${date}</span>
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Renderiza el estado vacío.
   */
  function renderEmptySeeds() {
    const grid = document.getElementById('seedsGrid');
    const emptyState = document.getElementById('emptyState');

    if (grid) grid.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    renderPagination();
    updateResultsCount();
  }

  /**
   * Muestra estado de carga en el grid de semillas.
   */
  function showSeedsLoading() {
    const grid = document.getElementById('seedsGrid');
    const emptyState = document.getElementById('emptyState');

    if (emptyState) emptyState.style.display = 'none';

    if (!grid) return;

    // Mostrar skeleton cards
    const skeletonCount = 6;
    let skeletonHtml = '';

    for (let i = 0; i < skeletonCount; i++) {
      skeletonHtml += `
        <div class="skeleton skeleton-card">
          <div class="skeleton-line" style="height: 200px; border-radius: 0;"></div>
          <div style="padding: 16px;">
            <div class="skeleton-line medium"></div>
            <div class="skeleton-line short"></div>
            <div class="skeleton-line"></div>
          </div>
        </div>
      `;
    }

    grid.innerHTML = skeletonHtml;
  }

  /**
   * Renderiza la paginación.
   */
  function renderPagination() {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    if (state.totalPages <= 1) {
      pagination.innerHTML = '';
      return;
    }

    let html = '';

    // Botón anterior
    html += `
      <button class="page-btn" ${state.currentPage <= 1 ? 'disabled' : ''} data-page="${state.currentPage - 1}">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    `;

    // Números de página
    const maxVisible = 5;
    let startPage = Math.max(1, state.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(state.totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    // Primera página y ellipsis
    if (startPage > 1) {
      html += `<button class="page-btn" data-page="1">1</button>`;
      if (startPage > 2) {
        html += `<span class="page-btn" style="border: none; background: transparent;">...</span>`;
      }
    }

    // Páginas visibles
    for (let i = startPage; i <= endPage; i++) {
      html += `
        <button class="page-btn ${i === state.currentPage ? 'active' : ''}" data-page="${i}">
          ${i}
        </button>
      `;
    }

    // Última página y ellipsis
    if (endPage < state.totalPages) {
      if (endPage < state.totalPages - 1) {
        html += `<span class="page-btn" style="border: none; background: transparent;">...</span>`;
      }
      html += `<button class="page-btn" data-page="${state.totalPages}">${state.totalPages}</button>`;
    }

    // Botón siguiente
    html += `
      <button class="page-btn" ${state.currentPage >= state.totalPages ? 'disabled' : ''} data-page="${state.currentPage + 1}">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    `;

    pagination.innerHTML = html;

    // Event listeners
    pagination.querySelectorAll('.page-btn[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.getAttribute('data-page'));
        if (page && page >= 1 && page <= state.totalPages && page !== state.currentPage) {
          state.currentPage = page;
          loadSeeds();
          scrollToSeeds();
        }
      });
    });
  }

  /**
   * Actualiza el contador de resultados.
   */
  function updateResultsCount() {
    const countEl = document.getElementById('resultsCount');
    if (!countEl) return;

    if (state.totalSeeds === 0) {
      countEl.textContent = 'No se encontraron semillas';
    } else {
      const start = ((state.currentPage - 1) * state.pageSize) + 1;
      const end = Math.min(start + state.pageSize - 1, state.totalSeeds);
      countEl.innerHTML = `Mostrando <strong>${start}-${end}</strong> de <strong>${state.totalSeeds}</strong> semillas`;
    }
  }

  /**
   * Actualiza las estadísticas en el hero.
   * @param {Object} stats
   */
  function updateStatsUI(stats) {
    animateCounter('statTotal', stats.total || 0);
    animateCounter('statJava', stats.java || 0);
    animateCounter('statBedrock', stats.bedrock || 0);
  }

  /**
   * Anima un contador numérico.
   * @param {string} elementId
   * @param {number} target
   */
  function animateCounter(elementId, target) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const duration = 1500;
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (target - start) * eased);

      el.textContent = current.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  // ============================================================
  // MODAL DE DETALLE
  // ============================================================

  /**
   * Configura el modal de detalles.
   */
  function setupModal() {
    const modal = document.getElementById('seedModal');
    const backdrop = document.getElementById('modalBackdrop');
    const closeBtn = document.getElementById('modalClose');

    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    if (backdrop) {
      backdrop.addEventListener('click', closeModal);
    }

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
        closeModal();
      }
    });
  }

  /**
   * Abre el modal con los detalles de una semilla.
   * @param {Object} seed
   */
  function openModal(seed) {
    const modal = document.getElementById('seedModal');
    const modalBody = document.getElementById('modalBody');

    if (!modal || !modalBody) return;

    state.currentSeed = seed;
    modalBody.innerHTML = renderModalContent(seed);
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Configurar thumbnails
    setupModalThumbnails();
  }

  /**
   * Cierra el modal.
   */
  function closeModal() {
    const modal = document.getElementById('seedModal');
    if (!modal) return;

    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    state.currentSeed = null;
  }

  /**
   * Renderiza el contenido del modal.
   * @param {Object} seed
   * @returns {string}
   */
  function renderModalContent(seed) {
    const images = seed.imageUrls ? seed.imageUrls.split('|').filter(u => u.trim()) : [];
    const versionClass = seed.version === 'Java' ? 'java' :
                         seed.version === 'Bedrock' ? 'bedrock' : 'both';
    const author = seed.author || 'Anónimo';
    const authorInitial = author.charAt(0).toUpperCase();

    // Imagen principal
    const mainImageHtml = images.length > 0 ?
      `<img src="${Security.escapeAttribute(images[0])}" alt="${Security.escapeAttribute(seed.name)}" class="modal-main-image" id="modalMainImage">` :
      `<div class="modal-main-image" style="display: flex; align-items: center; justify-content: center; background: var(--bg-card); min-height: 200px; color: var(--text-muted);">
        <svg viewBox="0 0 24 24" fill="none" width="64" height="64">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
          <path d="M21 15L16 10L5 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>`;

    // Thumbnails
    const thumbnailsHtml = images.length > 1 ?
      `<div class="modal-thumbnails">
        ${images.map((img, i) => `
          <div class="modal-thumbnail ${i === 0 ? 'active' : ''}" data-index="${i}" style="animation-delay: ${i * 0.05}s">
            <img src="${Security.escapeAttribute(img)}" alt="Imagen ${i + 1}">
          </div>
        `).join('')}
      </div>` : '';

    // Biomas y estructuras
    const biomes = seed.biomes ? seed.biomes.split(',').map(b => b.trim()).filter(Boolean) : [];
    const structures = seed.structures ? seed.structures.split(',').map(s => s.trim()).filter(Boolean) : [];

    const biomesHtml = biomes.length > 0 ?
      `<div class="modal-seed-tags">
        ${biomes.map(b => `<span class="tag">🌿 ${Security.escapeHtml(b)}</span>`).join('')}
      </div>` : '';

    const structuresHtml = structures.length > 0 ?
      `<div class="modal-seed-tags">
        ${structures.map(s => `<span class="tag">🏛️ ${Security.escapeHtml(s)}</span>`).join('')}
      </div>` : '';

    return `
      <div class="modal-seed-header">
        <h2 class="modal-seed-title" id="modalTitle">${Security.escapeHtml(seed.name)}</h2>
        <div class="modal-seed-badges">
          <span class="badge badge-version">${Security.escapeHtml(seed.version)}</span>
          <span class="badge badge-seed">Seed: ${Security.escapeHtml(seed.seedNumber)}</span>
        </div>
      </div>

      <div class="modal-seed-images">
        ${mainImageHtml}
        ${thumbnailsHtml}
      </div>

      <div class="modal-seed-info">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-item-label">Versión</div>
            <div class="info-item-value">${Security.escapeHtml(seed.version)}</div>
          </div>
          <div class="info-item">
            <div class="info-item-label">Versión Juego</div>
            <div class="info-item-value">${Security.escapeHtml(seed.versionNumber || 'N/A')}</div>
          </div>
          <div class="info-item">
            <div class="info-item-label">Dimensión</div>
            <div class="info-item-value">${Security.escapeHtml(seed.dimension || 'Overworld')}</div>
          </div>
          <div class="info-item">
            <div class="info-item-label">Coordenadas</div>
            <div class="info-item-value">${Security.escapeHtml(seed.coordinates || 'N/A')}</div>
          </div>
        </div>
      </div>

      ${biomesHtml}
      ${structuresHtml}

      <div class="modal-seed-description">
        <h4>Descripción</h4>
        <p data-lang="en" data-desc-en="${Security.escapeAttribute(seed.description || '')}" data-desc-es="${Security.escapeAttribute(seed.descriptionEs || '')}">${Security.escapeHtml(seed.description)}</p>
        ${seed.description && String(seed.description).trim() ? `
        <div class="desc-actions">
          <button type="button" class="lang-toggle" aria-label="Traducir descripción">🌐 <span>${seed.descriptionEs && String(seed.descriptionEs).trim() ? 'ES' : 'Traducir'}</span></button>
        </div>` : ''}
      </div>

      <div class="modal-seed-author">
        <div class="author-avatar">${Security.escapeHtml(authorInitial)}</div>
        <div class="author-info">
          <div class="author-name">${Security.escapeHtml(author)}</div>
          <div class="author-label">Autor de la semilla</div>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn btn-primary" onclick="App.copySeed('${Security.escapeAttribute(seed.seedNumber)}')">
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
            <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/>
            <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" stroke-width="2"/>
          </svg>
          Copiar Seed
        </button>
        <button class="btn btn-outline" onclick="App.closeModal()">
          Cerrar
        </button>
      </div>
    `;
  }

  /**
   * Configura los thumbnails del modal.
   */
  function setupModalThumbnails() {
    const thumbnails = document.querySelectorAll('.modal-thumbnail');
    const mainImage = document.getElementById('modalMainImage');

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
   * Copia el número de semilla al portapapeles.
   * @param {string} seedNumber
   */
  function copySeed(seedNumber) {
    navigator.clipboard.writeText(seedNumber).then(() => {
      showToast('success', '¡Copiado!', `Seed "${seedNumber}" copiado al portapapeles.`);
    }).catch(() => {
      showToast('error', 'Error', 'No se pudo copiar. Copia manualmente: ' + seedNumber);
    });
  }

  // ============================================================
  // FORMULARIO DE ENVÍO
  // ============================================================

  /**
   * Configura el formulario de envío.
   */
  function setupForm() {
    const form = document.getElementById('seedForm');
    const descInput = document.getElementById('seedDescription');
    const descCounter = document.getElementById('descCounter');

    // Renderizar checkboxes de biomas y estructuras
    renderCheckboxGrid('biomesGrid', BIOMES, 'biomes');
    renderCheckboxGrid('structuresGrid', STRUCTURES, 'structures');

    // Contador de caracteres
    if (descInput && descCounter) {
      descInput.addEventListener('input', () => {
        const length = descInput.value.length;
        descCounter.textContent = `${length}/500`;

        descCounter.classList.remove('warning', 'danger');
        if (length > 450) {
          descCounter.classList.add('danger');
        } else if (length > 350) {
          descCounter.classList.add('warning');
        }
      });
    }

    // Validación en tiempo real
    setupRealTimeValidation();

    // Envío del formulario
    if (form) {
      form.addEventListener('submit', handleFormSubmit);
    }
  }

  /**
   * Renderiza un grid de checkboxes.
   * @param {string} containerId
   * @param {Array} options
   * @param {string} fieldName
   */
  function renderCheckboxGrid(containerId, options, fieldName) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = options.map(option => `
      <div class="checkbox-item">
        <input type="checkbox" id="${fieldName}_${option.replace(/\s+/g, '_')}" name="${fieldName}" value="${Security.escapeAttribute(option)}">
        <span class="checkmark"></span>
        <label for="${fieldName}_${option.replace(/\s+/g, '_')}">${Security.escapeHtml(option)}</label>
      </div>
    `).join('');
  }

  /**
   * Configura validación en tiempo real.
   */
  function setupRealTimeValidation() {
    const nameInput = document.getElementById('seedName');
    const seedInput = document.getElementById('seedNumber');
    const descInput = document.getElementById('seedDescription');

    if (nameInput) {
      nameInput.addEventListener('blur', () => validateField('name', nameInput.value));
      nameInput.addEventListener('input', () => clearFieldError('name'));
    }

    if (seedInput) {
      seedInput.addEventListener('blur', () => validateField('seedNumber', seedInput.value));
      seedInput.addEventListener('input', () => clearFieldError('seedNumber'));
    }

    if (descInput) {
      descInput.addEventListener('blur', () => validateField('description', descInput.value));
      descInput.addEventListener('input', () => clearFieldError('description'));
    }
  }

  /**
   * Valida un campo individual.
   * @param {string} field
   * @param {string} value
   */
  function validateField(field, value) {
    let isValid = true;
    let error = '';

    switch (field) {
      case 'name':
        const cleanName = Security.sanitizeString(value, 80);
        if (!cleanName || cleanName.length < 3) {
          isValid = false;
          error = 'Mínimo 3 caracteres.';
        }
        break;

      case 'seedNumber':
        const cleanSeed = Security.sanitizeSeedNumber(value);
        if (!cleanSeed) {
          isValid = false;
          error = 'Número de semilla obligatorio.';
        }
        break;

      case 'description':
        const cleanDesc = Security.sanitizeString(value, 500);
        if (!cleanDesc || cleanDesc.length < 10) {
          isValid = false;
          error = 'Mínimo 10 caracteres.';
        }
        break;
    }

    if (!isValid) {
      showFieldError(field, error);
    } else {
      clearFieldError(field);
    }

    return isValid;
  }

  /**
   * Muestra error en un campo.
   * @param {string} field
   * @param {string} message
   */
  function showFieldError(field, message) {
    const errorEl = document.getElementById(`${field}Error`);
    const inputEl = document.getElementById(
      field === 'name' ? 'seedName' :
      field === 'seedNumber' ? 'seedNumber' :
      field === 'description' ? 'seedDescription' :
      field
    );

    if (errorEl) {
      errorEl.textContent = message;
    }

    if (inputEl) {
      inputEl.classList.add('invalid');
      // Animación de shake
      inputEl.classList.add('shake');
      setTimeout(() => inputEl.classList.remove('shake'), 400);
    }
  }

  /**
   * Limpia error de un campo.
   * @param {string} field
   */
  function clearFieldError(field) {
    const errorEl = document.getElementById(`${field}Error`);
    const inputEl = document.getElementById(
      field === 'name' ? 'seedName' :
      field === 'seedNumber' ? 'seedNumber' :
      field === 'description' ? 'seedDescription' :
      field
    );

    if (errorEl) errorEl.textContent = '';
    if (inputEl) inputEl.classList.remove('invalid');
  }

  /**
   * Maneja el envío del formulario.
   * @param {Event} e
   */
  async function handleFormSubmit(e) {
    e.preventDefault();

    if (state.isSubmitting) {
      showToast('warning', 'Espere', 'Ya se está procesando un envío.');
      return;
    }

    // Recolectar datos del formulario
    const formData = collectFormData();

    // Validar
    const validation = Security.validateForm(formData);
    if (!validation.valid) {
      // Mostrar errores
      Object.keys(validation.errors).forEach(field => {
        showFieldError(field, validation.errors[field]);
      });

      showToast('error', 'Formulario incompleto', 'Revisa los campos marcados en rojo.');
      return;
    }

    // Confirmar envío
    if (!confirm('¿Estás seguro de que quieres enviar esta semilla? Será revisada antes de publicarse.')) {
      return;
    }

    // Enviar
    state.isSubmitting = true;
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn?.querySelector('.btn-text');
    const btnLoading = submitBtn?.querySelector('.btn-loading');

    if (submitBtn) submitBtn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnLoading) btnLoading.style.display = 'inline-flex';

    try {
      // Verificar configuración
      if (!API.getBaseUrl()) {
        showToast('error', 'Sin configuración', 'El servicio no está configurado. Contacta al administrador.');
        return;
      }

      // Procesar imágenes con compresión
      showToast('info', 'Procesando', 'Comprimiendo imágenes...');
      const imageUrls = await processImages(formData.images);

      // Verificar tamaño total del payload
      const tempPayload = {
        ...formData,
        images: imageUrls
      };
      const payloadSize = new Blob([JSON.stringify(tempPayload)]).size;
      console.log('Tamaño del payload:', Math.round(payloadSize / 1024), 'KB');

      if (payloadSize > 5 * 1024 * 1024) { // 5MB límite
        showToast('error', 'Imágenes muy grandes', 'El total de imágenes excede 5MB. Reduce el tamaño o cantidad.');
        return;
      }

      // Enviar al servidor
      showToast('info', 'Enviando', 'Subiendo tu semilla...');
      const result = await API.submitSeed(tempPayload);

      if (result && result.success) {
        showToast('success', '¡Éxito!', result.message || 'Semilla enviada correctamente.');
        resetForm();
        loadSeeds();
        loadInitialData();
      } else {
        showToast('error', 'Error', result?.error || 'No se pudo enviar la semilla.');
      }

    } catch (error) {
      console.error('Error al enviar:', error);

      // Mostrar error específico
      let errorMsg = 'Error al enviar la semilla.';
      if (error.message) {
        if (error.message.includes('Contraseña incorrecta')) {
          errorMsg = 'Error de autenticación.';
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMsg = 'Sin conexión al servidor. Verifica tu internet.';
        } else if (error.message.includes('timeout') || error.message.includes('aborted')) {
          errorMsg = 'El servidor tardó demasiado. Reduce el tamaño de las imágenes.';
        } else if (error.message.includes('413') || error.message.includes('Payload')) {
          errorMsg = 'Las imágenes son demasiado grandes. Reduce su cantidad o tamaño.';
        } else {
          errorMsg = error.message;
        }
      }

      showToast('error', 'Error', errorMsg);
    } finally {
      state.isSubmitting = false;
      if (submitBtn) submitBtn.disabled = false;
      if (btnText) btnText.style.display = '';
      if (btnLoading) btnLoading.style.display = 'none';
    }
  }

  /**
   * Recolecta los datos del formulario.
   * @returns {Object}
   */
  function collectFormData() {
    const name = document.getElementById('seedName')?.value || '';
    const seedNumber = document.getElementById('seedNumber')?.value || '';
    const version = document.getElementById('seedVersion')?.value || '';
    const description = document.getElementById('seedDescription')?.value || '';
    const author = document.getElementById('seedAuthor')?.value || '';
    const coordinates = document.getElementById('coordinates')?.value || '';
    const dimension = document.getElementById('dimension')?.value || 'Overworld';
    const versionNumber = document.getElementById('gameVersion')?.value || '';

    // Recolectar checkboxes
    const biomes = Array.from(document.querySelectorAll('input[name="biomes"]:checked'))
      .map(el => el.value);
    const structures = Array.from(document.querySelectorAll('input[name="structures"]:checked'))
      .map(el => el.value);

    return {
      name: Security.sanitizeString(name, 80),
      seedNumber: Security.sanitizeSeedNumber(seedNumber),
      version: Security.validateEnum(version, ['Java', 'Bedrock', 'Ambos']),
      description: Security.sanitizeString(description, 500),
      author: Security.sanitizeString(author, 50) || 'Anónimo',
      coordinates: Security.sanitizeString(coordinates, 100),
      dimension: dimension,
      versionNumber: Security.sanitizeString(versionNumber, 20),
      biomes: biomes,
      structures: structures,
      images: [...state.selectedImages]
    };
  }

  /**
   * Procesa las imágenes seleccionadas a DataURLs optimizados.
   * Comprime las imágenes para reducir el tamaño del payload.
   * @param {Array} images - Array de File objects
   * @returns {Promise<Array>}
   */
  async function processImages(images) {
    if (!images || images.length === 0) return [];

    const dataUrls = [];
    const MAX_WIDTH = 1200; // Ancho máximo
    const MAX_HEIGHT = 800; // Alto máximo
    const QUALITY = 0.7;    // Calidad JPEG (0.1 - 1.0)

    for (const image of images) {
      try {
        const validation = Security.validateImageFile(image);
        if (!validation.valid) {
          showToast('warning', 'Imagen omitida', validation.error);
          continue;
        }

        // Comprimir imagen
        const compressedUrl = await compressImage(image, MAX_WIDTH, MAX_HEIGHT, QUALITY);
        if (compressedUrl) {
          dataUrls.push(compressedUrl);
          console.log(`Imagen comprimida: ${Math.round(image.size/1024)}KB → ${Math.round(compressedUrl.length*0.75/1024)}KB`);
        }
      } catch (error) {
        console.error('Error procesando imagen:', error);
        showToast('error', 'Error', 'No se pudo procesar una imagen.');
      }
    }

    return dataUrls;
  }

  /**
   * Comprime una imagen usando Canvas.
   * @param {File} file - Archivo de imagen
   * @param {number} maxWidth - Ancho máximo
   * @param {number} maxHeight - Alto máximo
   * @param {number} quality - Calidad JPEG
   * @returns {Promise<string>} DataURL comprimido
   */
  function compressImage(file, maxWidth, maxHeight, quality) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
          // Calcular dimensiones manteniendo aspect ratio
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }

          // Crear canvas y dibujar imagen redimensionada
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convertir a JPEG comprimido
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = function() {
          console.error('Error al cargar imagen');
          resolve(null);
        };
        img.src = e.target.result;
      };
      reader.onerror = function() {
        console.error('Error al leer archivo');
        resolve(null);
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Reinicia el formulario.
   */
  function resetForm() {
    const form = document.getElementById('seedForm');
    if (form) form.reset();

    state.selectedImages = [];
    updateImagePreviews();

    // Limpiar errores
    ['name', 'seedNumber', 'description', 'version', 'biomes'].forEach(field => {
      clearFieldError(field);
    });

    // Reiniciar contador
    const descCounter = document.getElementById('descCounter');
    if (descCounter) {
      descCounter.textContent = '0/500';
      descCounter.classList.remove('warning', 'danger');
    }
  }

  // ============================================================
  // GESTIÓN DE IMÁGENES
  // ============================================================

  /**
   * Configura la zona de carga de imágenes.
   */
  function setupImageUpload() {
    const uploadZone = document.getElementById('imageUploadZone');
    const imageInput = document.getElementById('imageInput');

    if (!uploadZone || !imageInput) return;

    // Click para abrir selector
    uploadZone.addEventListener('click', (e) => {
      if (e.target.closest('.preview-remove')) return;
      imageInput.click();
    });

    // Selección de archivos
    imageInput.addEventListener('change', (e) => {
      handleImageSelection(e.target.files);
    });

    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
      handleImageSelection(e.dataTransfer.files);
    });
  }

  /**
   * Maneja la selección de imágenes.
   * @param {FileList} files
   */
  function handleImageSelection(files) {
    const maxImages = 10;

    if (state.selectedImages.length >= maxImages) {
      showToast('warning', 'Límite alcanzado', `Máximo ${maxImages} imágenes.`);
      return;
    }

    for (const file of files) {
      if (state.selectedImages.length >= maxImages) {
        showToast('warning', 'Límite alcanzado', `Máximo ${maxImages} imágenes.`);
        break;
      }

      const validation = Security.validateImageFile(file);
      if (validation.valid) {
        state.selectedImages.push(file);
      } else {
        showToast('error', 'Imagen no válida', validation.error);
      }
    }

    updateImagePreviews();
  }

  /**
   * Actualiza las previsualizaciones de imágenes.
   */
  function updateImagePreviews() {
    const previewsContainer = document.getElementById('imagePreviews');
    const placeholder = document.getElementById('uploadPlaceholder');

    if (!previewsContainer) return;

    if (state.selectedImages.length === 0) {
      previewsContainer.innerHTML = '';
      if (placeholder) placeholder.style.display = '';
      return;
    }

    if (placeholder) placeholder.style.display = 'none';

    previewsContainer.innerHTML = state.selectedImages.map((file, index) => `
      <div class="preview-item">
        <img src="" alt="Preview ${index + 1}" id="preview_${index}">
        <button type="button" class="preview-remove" data-index="${index}" aria-label="Eliminar imagen">×</button>
      </div>
    `).join('');

    // Cargar previews
    state.selectedImages.forEach((file, index) => {
      const img = document.getElementById(`preview_${index}`);
      if (img) {
        const reader = new FileReader();
        reader.onload = (e) => { img.src = e.target.result; };
        reader.readAsDataURL(file);
      }
    });

    // Event listeners para eliminar
    previewsContainer.querySelectorAll('.preview-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.getAttribute('data-index'));
        state.selectedImages.splice(index, 1);
        updateImagePreviews();
      });
    });
  }

  // ============================================================
  // TOAST NOTIFICATIONS
  // ============================================================

  /**
   * Muestra una notificación toast.
   * @param {string} type - success, error, warning, info
   * @param {string} title
   * @param {string} message
   * @param {number} duration - ms
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

    // Animar entrada
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Botón de cerrar
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => hideToast(toast));

    // Auto-cerrar
    setTimeout(() => hideToast(toast), duration);
  }

  /**
   * Oculta un toast.
   * @param {HTMLElement} toast
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

  // ============================================================
  // PARTÍCULAS DEL HERO
  // ============================================================

  /**
   * Crea partículas animadas en el hero.
   */
  function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    const particleCount = window.innerWidth < 768 ? 15 : 30;
    const colors = ['particle-lime', 'particle-blue', 'particle-white'];

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = `particle ${colors[Math.floor(Math.random() * colors.length)]}`;

      const size = Math.random() * 4 + 2;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animationDuration = `${Math.random() * 10 + 10}s`;
      particle.style.animationDelay = `${Math.random() * 5}s`;

      container.appendChild(particle);
    }
  }

  // ============================================================
  // UTILIDADES
  // ============================================================

  /**
   * Formatea una fecha a formato local.
   * @param {string} dateString
   * @returns {string}
   */
  function formatDate(dateString) {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  }

  /**
   * Hace scroll a la sección de semillas.
   */
  function scrollToSeeds() {
    const section = document.getElementById('semillas');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Muestra una advertencia de configuración.
   */
  function showConfigWarning() {
    showToast('warning', 'Configuración pendiente', 'Configura la URL del API para ver semillas.', 10000);
  }

  /**
   * Configura la URL del API (para administradores).
   * @param {string} url
   */
  function configureApi(url) {
    saveApiUrl(url);
    showToast('success', 'Configurado', 'URL del API guardada correctamente.');
    loadInitialData();
  }

  // ============================================================
  // API PÚBLICA
  // ============================================================ */

  return {
    init,
    configureApi,
    copySeed,
    closeModal,
    loadSeeds,
    showToast,
    saveApiUrl
  };

})();

// ============================================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

// Exponer para uso en onclick del HTML
window.App = App;
