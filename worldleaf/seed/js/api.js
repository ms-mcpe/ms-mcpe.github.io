/**
 * ============================================================
 *  WorldLeaf Seed - Módulo API (Cliente)
 * ============================================================
 *  Propósito: Comunicación con el backend de Google Apps Script.
 *  Maneja peticiones HTTP, reintentos, timeouts y manejo de errores.
 * ============================================================
 */

const API = (() => {

  /**
   * URL del endpoint de Google Apps Script.
   * CONFIGURAR: Reemplazar con tu URL de Web App desplegada.
   */
  let BASE_URL = ''; // Ejemplo: 'https://script.google.com/macros/s/AKfycb.../exec'

  /**
   * Configuración de red.
   */
  const CONFIG = {
    TIMEOUT_MS: 30000,
    MAX_RETRIES: 2,
    RETRY_DELAY_MS: 1000,
    RETRY_BACKOFF: 2
  };

  /**
   * Estado de conexión.
   */
  let isConnected = false;
  let lastError = null;

  /**
   * Establece la URL del backend.
   * @param {string} url - URL del Web App de Apps Script
   */
  function setBaseUrl(url) {
    if (url && typeof url === 'string') {
      BASE_URL = url.replace(/\/$/, ''); // Eliminar slash final
    }
  }

  /**
   * Obtiene la URL actual del backend.
   * @returns {string}
   */
  function getBaseUrl() {
    return BASE_URL;
  }

  /**
   * Realiza una petición HTTP con timeout y reintentos.
   * @param {string} url - URL completa
   * @param {Object} options - Opciones de fetch
   * @returns {Promise<Object>}
   */
  async function fetchWithRetry(url, options = {}) {
    const { timeout = CONFIG.TIMEOUT_MS, retries = CONFIG.MAX_RETRIES } = options;

    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          redirect: 'follow'
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Verificar que la respuesta sea JSON
        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error('Respuesta no es JSON:', text.substring(0, 300));
          throw new Error(`Respuesta inválida del servidor (no es JSON): ${text.substring(0, 100)}`);
        }

        isConnected = true;
        lastError = null;

        return data;
      } catch (error) {
        lastError = error;
        console.error(`Intento ${attempt + 1} falló:`, error.message);

        // Si es el último intento, propagar el error
        if (attempt === retries) {
          break;
        }

        // Esperar con backoff exponencial
        const delay = CONFIG.RETRY_DELAY_MS * Math.pow(CONFIG.RETRY_BACKOFF, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    isConnected = false;
    lastError = lastError || new Error('Error desconocido de red');
    throw lastError;
  }

  /**
   * Obtiene semillas con filtros y paginación.
   * @param {Object} params - Parámetros de búsqueda
   * @returns {Promise<Object>}
   */
  async function getSeeds(params = {}) {
    if (!BASE_URL) {
      throw new Error('URL del backend no configurada. Ejecuta API.setBaseUrl() primero.');
    }

    const queryParams = new URLSearchParams({
      action: 'list',
      page: params.page || 1,
      limit: params.limit || 12,
      shuffleSeed: params.shuffleSeed || ''
    });

    // Parámetros de búsqueda
    if (params.q) queryParams.set('q', params.q);
    if (params.version) queryParams.set('version', params.version);
    if (params.biome) queryParams.set('biome', params.biome);
    if (params.structure) queryParams.set('structure', params.structure);

    const url = `${BASE_URL}?${queryParams.toString()}`;

    return fetchWithRetry(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8'
      }
    });
  }

  /**
   * Busca semillas específicas.
   * @param {Object} params - Parámetros de búsqueda
   * @returns {Promise<Object>}
   */
  async function searchSeeds(params = {}) {
    if (!BASE_URL) {
      throw new Error('URL del backend no configurada.');
    }

    const queryParams = new URLSearchParams({
      action: 'search',
      page: params.page || 1,
      limit: params.limit || 12,
      shuffleSeed: params.shuffleSeed || '',
      q: params.q || '',
      version: params.version || '',
      biome: params.biome || '',
      structure: params.structure || ''
    });

    const url = `${BASE_URL}?${queryParams.toString()}`;

    return fetchWithRetry(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8'
      }
    });
  }

  /**
   * Envía una nueva semilla al servidor.
   * @param {Object} seedData - Datos de la semilla
   * @returns {Promise<Object>}
   */
  async function submitSeed(seedData) {
    if (!BASE_URL) {
      throw new Error('URL del backend no configurada.');
    }

    // Preparar payload
    const payload = {
      action: 'submit',
      name: seedData.name || '',
      seedNumber: seedData.seedNumber || '',
      version: seedData.version || '',
      description: seedData.description || '',
      author: seedData.author || '',
      biomes: seedData.biomes || [],
      structures: seedData.structures || [],
      coordinates: seedData.coordinates || '',
      dimension: seedData.dimension || 'Overworld',
      versionNumber: seedData.versionNumber || '',
      images: seedData.images || []
    };

    const url = `${BASE_URL}`;

    try {
      const result = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8'
        },
        body: JSON.stringify(payload),
        timeout: 90000 // 90 segundos para subida de imágenes
      });

      return result;
    } catch (error) {
      console.error('Error en submitSeed:', error);
      throw new Error(error.message || 'Error al enviar la semilla');
    }
  }

  /**
   * Obtiene estadísticas del sitio.
   * @returns {Promise<Object>}
   */
  async function getStats() {
    if (!BASE_URL) {
      throw new Error('URL del backend no configurada.');
    }

    const url = `${BASE_URL}?action=stats`;

    return fetchWithRetry(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8'
      }
    });
  }

  /**
   * Verifica la conexión con el backend.
   * @returns {Promise<boolean>}
   */
  async function checkConnection() {
    try {
      await getStats();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene el último error registrado.
   * @returns {Error|null}
   */
  function getLastError() {
    return lastError;
  }

  /**
   * Verifica si hay conexión activa.
   * @returns {boolean}
   */
  function isOnline() {
    return isConnected;
  }

  /**
   * Formatea un error de red a un mensaje amigable.
   * @param {Error} error
   * @returns {string}
   */
  function formatError(error) {
    if (!error) return 'Error desconocido';

    const message = error.message || String(error);
    console.error('formatError detectó:', message, error);

    if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      return 'Sin conexión a internet o el servidor no está disponible.';
    }

    if (message.includes('aborted') || message.includes('timeout')) {
      return 'La conexión tardó demasiado. Verifica tu conexión e inténtalo de nuevo.';
    }

    if (message.includes('Unexpected token') || message.includes('JSON')) {
      return 'El servidor devolvió una respuesta inválida. Verifica la URL del backend.';
    }

    if (message.includes('HTTP 429')) {
      return 'Demasiadas solicitudes. Espera un momento antes de intentar de nuevo.';
    }

    if (message.includes('HTTP 4')) {
      return 'Solicitud inválida. Revisa los datos ingresados.';
    }

    if (message.includes('HTTP 5')) {
      return 'Error del servidor. Inténtalo de nuevo en unos segundos.';
    }

    if (message.includes('URL del backend no configurada')) {
      return 'El servicio no está configurado. Contacta al administrador.';
    }

    return `Error: ${message}`;
  }

  /**
   * Clase para manejo de errores de API.
   */
  class APIError extends Error {
    constructor(message, statusCode = null, data = null) {
      super(message);
      this.name = 'APIError';
      this.statusCode = statusCode;
      this.data = data;
    }
  }

  /**
   * Wrapper para manejar respuestas con errores del servidor.
   */
  async function handleResponse(promise) {
    try {
      const result = await promise;

      if (result && result.success === false) {
        throw new APIError(
          result.error || 'Error del servidor',
          null,
          result
        );
      }

      return result;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }

      // Convertir errores de red a APIError
      throw new APIError(formatError(error), null, null);
    }
  }

  // API pública
  return {
    setBaseUrl,
    getBaseUrl,
    getSeeds,
    searchSeeds,
    submitSeed,
    getStats,
    checkConnection,
    getLastError,
    isOnline,
    formatError,
    handleResponse,
    fetchWithRetry,
    APIError,
    CONFIG
  };

})();
