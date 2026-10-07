/**
 * ============================================================
 *  WorldLeaf Seed - Módulo de Seguridad (Cliente)
 * ============================================================
 *  Propósito: Sanitización y validación de entradas en el
 *  lado del cliente antes de enviar al servidor.
 *
 *  IMPORTANTE: La validación del servidor SIEMPRE es la
 *  autoridad final. Estas funciones mejoran la UX pero no
 *  reemplazan la validación server-side.
 * ============================================================
 */

const Security = (() => {

  /**
   * Límites configurables (deben coincidir con el backend).
   */
  const LIMITS = {
    MAX_NAME_LENGTH: 80,
    MAX_SEED_NUMBER_LENGTH: 30,
    MAX_DESCRIPTION_LENGTH: 500,
    MAX_AUTHOR_LENGTH: 50,
    MAX_COORDINATES_LENGTH: 100,
    MAX_IMAGES: 10,
    MAX_IMAGE_SIZE_MB: 10,
    MIN_DESCRIPTION_LENGTH: 10,
    MIN_NAME_LENGTH: 3
  };

  /**
   * Patrones peligrosos que nunca deben pasar.
   */
  const DANGEROUS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:\s*text\/html/gi,
    /vbscript:/gi,
    /expression\s*\(/gi,
    /url\s*\(\s*['"]?\s*javascript:/gi,
    /<!--[\s\S]*?-->/g,
    /<!\[CDATA\[[\s\S]*?\]\]>/g
  ];

  /**
   * Sanitiza una cadena eliminando HTML peligroso y caracteres de control.
   * @param {string} input - Cadena de entrada
   * @param {number} maxLength - Longitud máxima permitida
   * @returns {string} Cadena sanitizada
   */
  function sanitizeString(input, maxLength) {
    if (!input || typeof input !== 'string') {
      return '';
    }

    let clean = input.trim();

    // Eliminar patrones peligrosos
    for (const pattern of DANGEROUS_PATTERNS) {
      clean = clean.replace(pattern, '');
    }

    // Eliminar tags HTML restantes
    clean = clean.replace(/<[^>]*>/g, '');

    // Eliminar caracteres de control
    clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Normalizar espacios múltiples
    clean = clean.replace(/\s+/g, ' ');

    // Limitar longitud
    if (maxLength && clean.length > maxLength) {
      clean = clean.substring(0, maxLength);
    }

    return clean.trim();
  }

  /**
   * Sanitiza un número de semilla.
   * Permite: dígitos, guiones, puntos, comas, espacios, letras A-F (hex)
   * @param {string} input - Número de semilla
   * @returns {string} Semilla sanitizada
   */
  function sanitizeSeedNumber(input) {
    if (!input || typeof input !== 'string') {
      return '';
    }

    let clean = input.trim();

    // Solo permitir caracteres seguros
    clean = clean.replace(/[^0-9\-.,\sA-Fa-f]/g, '');

    // Eliminar espacios múltiples
    clean = clean.replace(/\s+/g, ' ');

    // Limitar longitud
    if (clean.length > LIMITS.MAX_SEED_NUMBER_LENGTH) {
      clean = clean.substring(0, LIMITS.MAX_SEED_NUMBER_LENGTH);
    }

    return clean.trim();
  }

  /**
   * Valida un email (si se implementara autenticación).
   * @param {string} email
   * @returns {boolean}
   */
  function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  /**
   * Valida que un valor esté en una lista permitida.
   * @param {string} value
   * @param {Array} allowedValues
   * @returns {string} Valor válido o cadena vacía
   */
  function validateEnum(value, allowedValues) {
    if (!value || typeof value !== 'string') return '';
    const clean = value.trim();
    return allowedValues.includes(clean) ? clean : '';
  }

  /**
   * Valida una URL.
   * @param {string} url
   * @returns {boolean}
   */
  function isValidUrl(url) {
    if (!url || typeof url !== 'string') return false;

    try {
      const parsed = new URL(url);
      // Solo permitir HTTP/HTTPS
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Valida un archivo de imagen.
   * @param {File} file - Archivo a validar
   * @returns {Object} { valid: boolean, error: string }
   */
  function validateImageFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (!file) {
      return { valid: false, error: 'No se seleccionó ningún archivo.' };
    }

    if (!validTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Formato no válido. Usa JPEG, PNG, GIF o WebP.'
      };
    }

    const maxSizeBytes = LIMITS.MAX_IMAGE_SIZE_MB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `Imagen demasiado grande (${sizeMB}MB). Máximo ${LIMITS.MAX_IMAGE_SIZE_MB}MB.`
      };
    }

    return { valid: true, error: '' };
  }

  /**
   * Convierte un archivo a DataURL (base64).
   * @param {File} file
   * @returns {Promise<string>}
   */
  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Valida todo el formulario antes de enviar.
   * @param {Object} data - Datos del formulario
   * @returns {Object} { valid: boolean, errors: Object }
   */
  function validateForm(data) {
    const errors = {};

    // Nombre
    const name = sanitizeString(data.name, LIMITS.MAX_NAME_LENGTH);
    if (!name || name.length < LIMITS.MIN_NAME_LENGTH) {
      errors.name = `El nombre debe tener al menos ${LIMITS.MIN_NAME_LENGTH} caracteres.`;
    } else if (name.length > LIMITS.MAX_NAME_LENGTH) {
      errors.name = `El nombre no puede exceder ${LIMITS.MAX_NAME_LENGTH} caracteres.`;
    }

    // Número de semilla
    const seedNumber = sanitizeSeedNumber(data.seedNumber);
    if (!seedNumber) {
      errors.seedNumber = 'El número de semilla es obligatorio.';
    } else if (seedNumber.length > LIMITS.MAX_SEED_NUMBER_LENGTH) {
      errors.seedNumber = `El número no puede exceder ${LIMITS.MAX_SEED_NUMBER_LENGTH} caracteres.`;
    }

    // Versión
    const validVersions = ['Java', 'Bedrock', 'Ambos'];
    if (!validateEnum(data.version, validVersions)) {
      errors.version = 'Selecciona una versión válida.';
    }

    // Descripción
    const description = sanitizeString(data.description, LIMITS.MAX_DESCRIPTION_LENGTH);
    if (!description || description.length < LIMITS.MIN_DESCRIPTION_LENGTH) {
      errors.description = `La descripción debe tener al menos ${LIMITS.MIN_DESCRIPTION_LENGTH} caracteres.`;
    } else if (description.length > LIMITS.MAX_DESCRIPTION_LENGTH) {
      errors.description = `La descripción no puede exceder ${LIMITS.MAX_DESCRIPTION_LENGTH} caracteres.`;
    }

    // Biomas (mínimo 1)
    const biomes = Array.isArray(data.biomes) ? data.biomes : [];
    if (biomes.length === 0) {
      errors.biomes = 'Selecciona al menos un bioma.';
    }

    // Autor (opcional)
    if (data.author) {
      const author = sanitizeString(data.author, LIMITS.MAX_AUTHOR_LENGTH);
      if (author.length > LIMITS.MAX_AUTHOR_LENGTH) {
        errors.author = `El nombre del autor no puede exceder ${LIMITS.MAX_AUTHOR_LENGTH} caracteres.`;
      }
    }

    // Coordenadas (opcional)
    if (data.coordinates) {
      const coords = sanitizeString(data.coordinates, LIMITS.MAX_COORDINATES_LENGTH);
      if (coords.length > LIMITS.MAX_COORDINATES_LENGTH) {
        errors.coordinates = `Las coordenadas no pueden exceder ${LIMITS.MAX_COORDINATES_LENGTH} caracteres.`;
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Genera un token simple para CSRF (patrón básico).
   * En producción se recomienda usar tokens del servidor.
   * @returns {string}
   */
  function generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Escapa HTML para prevenir XSS al renderizar.
   * @param {string} text
   * @returns {string}
   */
  function escapeHtml(text) {
    if (text === null || text === undefined || text === '') return '';
    if (typeof text === 'number' || typeof text === 'boolean') text = String(text);
    if (typeof text !== 'string') return '';

    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Escape seguro para atributos HTML.
   * @param {string} text
   * @returns {string}
   */
  function escapeAttribute(text) {
    if (text === null || text === undefined || text === '') return '';
    if (typeof text === 'number' || typeof text === 'boolean') text = String(text);
    if (typeof text !== 'string') return '';

    return text
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Valida una URL de imagen de Google (para exibición).
   * @param {string} url
   * @returns {boolean}
   */
  function isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;

    // Permitir URLs de Google (lh3, drive, etc.)
    const allowedDomains = [
      'lh3.googleusercontent.com',
      'drive.google.com',
      'docs.google.com',
      'googleusercontent.com'
    ];

    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' &&
             allowedDomains.some(domain => parsed.hostname.endsWith(domain));
    } catch {
      return false;
    }
  }

  // API pública
  return {
    LIMITS,
    sanitizeString,
    sanitizeSeedNumber,
    isValidEmail,
    validateEnum,
    isValidUrl,
    validateImageFile,
    fileToDataURL,
    validateForm,
    generateCSRFToken,
    escapeHtml,
    escapeAttribute,
    isValidImageUrl
  };

})();
