/* ============================================================================
 * WorldLeaf — security.js  (v1.0.0)
 * Capa de blindaje del LADO DEL CLIENTE (defensa en profundidad).
 * ----------------------------------------------------------------------------
 * LEE ESTO PRIMERO (honestidad tecnica):
 *   Ninguna proteccion del lado del cliente es infalible. Un atacante puede
 *   llamar DIRECTAMENTE a la API (Apps Script) con curl/Postman y este archivo
 *   no puede impedirlo. Por lo tanto:
 *
 *   - Este archivo ENDURECE el navegador contra:
 *       * Clickjacking (que metan tu web en un iframe)
 *       * Inyeccion de enlaces javascript:/data:text/html
 *       * Parametros de URL maliciosos
 *       * Rafagas/loops de peticiones que agotan la cuota de Apps Script
 *       * document.write inyectado tras la carga
 *       * Automatizacion basica (bots)
 *       * Prototype pollution (opcional)
 *       * Curiosos con devtools (DISUASIVO, evitable a proposito)
 *
 *   - La proteccion REAL contra "tumbar la plataforma" (DoS / abuso de cuota)
 *     DEBE vivir en el servidor: limites de peticiones por IP/usuario,
 *     validacion estricta y autenticacion en TODAS las acciones de code.gs.
 *     Ver la seccion "PROTECCION DE SERVIDOR" al final de este archivo.
 *
 * Como usarlo: incluir en el <head> ANTES de los demas scripts:
 *     <script src="security.js"></script>
 * Configuracion opcional (antes de cargarlo):
 *     <script>window.WL_SECURITY_CONFIG = { blockContextMenu: true };</script>
 * ========================================================================== */
(function () {
  'use strict';

  var W = window;
  var D = document;
  var S = W.WL_SECURITY = W.WL_SECURITY || {};
  S.version = '1.0.0';

  /* ------------------------------------------------------------------ *
   * 1. CONFIGURACION                                                    *
   * ------------------------------------------------------------------ */
  var cfg = Object.assign({
    frameGuard: true,          // anti-clickjacking (rompe iframes externos)
    hardenLinks: true,         // neutraliza javascript:/data:text/html
    sanitizeURLParams: true,   // limpia parametros leidos de la URL
    throttleNetwork: true,     // limita rafagas de fetch/XHR/script
    maxReqPerMinute: 150,      // tope global de peticiones por minuto
    minGapSameRequestMs: 250,  // separacion minima entre peticiones identicas
    blockDevtoolsKeys: true,   // atajos F12 / Ctrl+Shift+I / Ctrl+U (DISUASIVO)
    blockContextMenu: false,   // bloquear click derecho (DISUASIVO, molesto)
    detectDevtools: false,     // heuristica devtools (solo reporta)
    freezePrototypes: false,   // mitigar prototype pollution (puede romper libs)
    noDocumentWrite: true,     // anula document.write DESPUES de cargar
    report: false,             // true => envia anomalias a reportURL
    reportURL: ''              // p.ej. API_URL + '?action=reportEvent'
  }, W.WL_SECURITY_CONFIG || {});
  S.config = cfg;

  var API_ORIGIN = (function () {
    try { return new URL(cfg.reportURL || location.href).origin; } catch (e) { return location.origin; }
  })();

  /* ------------------------------------------------------------------ *
   * 2. UTILIDADES INTERNAS                                              *
   * ------------------------------------------------------------------ */
  var anomalies = [];
  function record(kind, detail) {
    var entry = { t: new Date().toISOString(), kind: kind, detail: String(detail || '').slice(0, 300) };
    anomalies.push(entry);
    if (anomalies.length > 50) anomalies.shift();
    try { if (W.console && console.warn) console.warn('[WL_SECURITY]', kind, detail); } catch (e) {}
    if (cfg.report && cfg.reportURL) sendReport(entry);
  }
  S.record = record;
  S.getAnomalies = function () { return anomalies.slice(); };

  var lastReport = 0;
  function sendReport(entry) {
    var now = Date.now();
    if (now - lastReport < 5000) return; // anti-loop de reportes
    lastReport = now;
    try {
      var url = cfg.reportURL + (cfg.reportURL.indexOf('?') > -1 ? '&' : '?') +
        'tipo=' + encodeURIComponent(entry.kind) + '&detalle=' + encodeURIComponent(entry.detail);
      if (W.navigator && navigator.sendBeacon) navigator.sendBeacon(url);
      else if (W.fetch) W.fetch(url, { method: 'GET', keepalive: true, mode: 'no-cors' }).catch(function () {});
    } catch (e) {}
  }

  /* ------------------------------------------------------------------ *
   * 3. HELPERS DE SEGURIDAD (API publica)                               *
   * ------------------------------------------------------------------ */
  // Escapa HTML para inserciones seguras.
  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // Sanea texto: quita etiquetas, caracteres de control y limita longitud.
  function sanitize(str, maxLen) {
    var s = String(str == null ? '' : str)
      .replace(/<[^>]*>/g, '')
      .replace(/[\u0000-\u001F\u007F]/g, '')
      .trim();
    maxLen = maxLen || 500;
    return s.length > maxLen ? s.slice(0, maxLen) : s;
  }
  // Lee un parametro de la URL ya saneado.
  function getParam(name, maxLen) {
    try {
      var v = new URLSearchParams(location.search).get(name);
      return v == null ? null : sanitize(v, maxLen || 200);
    } catch (e) { return null; }
  }
  // Solo permite http/https (bloquea javascript:, data:, vbscript:...).
  function isSafeUrl(url) {
    var u = String(url || '').trim();
    if (/^(https?:|\/|\.\/|\.\.\/|#|\?)/i.test(u)) return true;
    return false;
  }
  // JSON.parse a prueba de errores.
  function safeJSONParse(str, fallback) {
    try { return JSON.parse(str); } catch (e) { return fallback; }
  }
  // Congela profundamente un objeto (evita mutaciones silenciosas).
  function deepFreeze(obj) {
    try {
      Object.freeze(obj);
      Object.keys(obj).forEach(function (k) {
        if (obj[k] && typeof obj[k] === 'object' && !Object.isFrozen(obj[k])) deepFreeze(obj[k]);
      });
    } catch (e) {}
    return obj;
  }

  S.escapeHtml = escapeHtml;
  S.sanitize = sanitize;
  S.getParam = getParam;
  S.isSafeUrl = isSafeUrl;
  S.safeJSONParse = safeJSONParse;
  S.deepFreeze = deepFreeze;

  /* ------------------------------------------------------------------ *
   * 4. GUARDIANES INMEDIATOS (se ejecutan al cargar)                    *
   * ------------------------------------------------------------------ */
  // 4.1 Anti-clickjacking: si estamos dentro de un iframe ajeno, salir.
  if (cfg.frameGuard) {
    try {
      if (W.top !== W.self) {
        record('clickjacking', 'documento embebido en iframe');
        try { W.top.location = W.self.location.href; } catch (e) {}
        try { if (D.documentElement) D.documentElement.style.display = 'none'; } catch (e) {}
      }
    } catch (e) {}
  }

  // 4.2 Cortar el canal window.opener (evita tabnabbing / manipulacion).
  try { if (W.opener) W.opener = null; } catch (e) {}

  // 4.3 Neutralizar document.write/writeln una vez cargada la pagina.
  if (cfg.noDocumentWrite) {
    var _dw = D.write, _dwl = D.writeln;
    var loaded = false;
    W.addEventListener('load', function () { loaded = true; });
    D.write = function () {
      if (loaded) { record('document.write', 'intento de escritura tras load'); return; }
      return _dw.apply(D, arguments);
    };
    D.writeln = function () {
      if (loaded) { record('document.write', 'intento de escritura tras load'); return; }
      return _dwl.apply(D, arguments);
    };
  }

  /* ------------------------------------------------------------------ *
   * 5. ENDURECIMIENTO DE ENLACES Y NAVEGACION                          *
   * ------------------------------------------------------------------ */
  if (cfg.hardenLinks) {
    // Bloquea clicks a enlaces javascript:/data:text/html.
    D.addEventListener('click', function (ev) {
      var el = ev.target;
      var a = el && el.closest ? el.closest('a[href]') : null;
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (/^\s*(javascript:|data:text\/html|vbscript:)/i.test(href)) {
        ev.preventDefault();
        record('enlace_inseguro', href);
      }
    }, true);

    // Bloquea window.open con URIs peligrosas.
    var _open = W.open;
    W.open = function (url) {
      if (url && /^\s*(javascript:|data:text\/html|vbscript:)/i.test(String(url))) {
        record('window.open_inseguro', url);
        return null;
      }
      return _open.apply(W, arguments);
    };
  }

  /* ------------------------------------------------------------------ *
   * 6. LIMITE DE PETICIONES (anti rafagas / loops accidentales)         *
   * ------------------------------------------------------------------ */
  var reqStamps = [];              // marcas de tiempo globales (ventana 60s)
  var reqLastByUrl = Object.create(null); // ultima vez por URL identica

  function allowRequest(url) {
    if (!cfg.throttleNetwork) return true;
    var now = Date.now();
    // Poda de la ventana de 60s
    reqStamps = reqStamps.filter(function (t) { return now - t < 60000; });
    if (reqStamps.length >= cfg.maxReqPerMinute) {
      record('rate_global', (reqStamps.length) + ' req/min | ' + url);
      return false;
    }
    var key = String(url).split('#')[0];
    if (reqLastByUrl[key] && (now - reqLastByUrl[key]) < cfg.minGapSameRequestMs) {
      record('rate_duplicada', url);
      return false;
    }
    reqLastByUrl[key] = now;
    reqStamps.push(now);
    return true;
  }
  S.allowRequest = allowRequest;

  if (cfg.throttleNetwork) {
    // 6.1 fetch()
    var _fetch = W.fetch;
    if (typeof _fetch === 'function') {
      W.fetch = function (input) {
        var url = (typeof input === 'string') ? input : (input && input.url) || '';
        if (!allowRequest(url)) {
          return Promise.reject(new Error('WL_SECURITY: peticion bloqueada (rate limit)'));
        }
        return _fetch.apply(this, arguments);
      };
    }

    // 6.2 XMLHttpRequest
    if (W.XMLHttpRequest) {
      var _xopen = XMLHttpRequest.prototype.open;
      var _xsend = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.open = function (method, url) {
        this.__wlUrl = String(url || '');
        this.__wlBlocked = !allowRequest(this.__wlUrl);
        return _xopen.apply(this, arguments);
      };
      XMLHttpRequest.prototype.send = function () {
        if (this.__wlBlocked) {
          var self = this;
          try { this.abort(); } catch (e) {}
          setTimeout(function () {
            try { self.dispatchEvent(new Event('error')); } catch (e) {}
            try { if (self.onerror) self.onerror(); } catch (e) {}
          }, 0);
          return;
        }
        return _xsend.apply(this, arguments);
      };
    }

    // 6.3 JSONP (scripts insertados con src) — usado por index/spaces.
    if (W.Node && Node.prototype.appendChild) {
      var _append = Node.prototype.appendChild;
      Node.prototype.appendChild = function (node) {
        try {
          if (node && node.tagName === 'SCRIPT' && node.src && !node.__wlOk) {
            if (!allowRequest(String(node.src))) {
              record('rate_script', node.src);
              return node; // se descarta el nodo (no se inserta)
            }
            node.__wlOk = true;
          }
        } catch (e) {}
        return _append.apply(this, arguments);
      };
    }
  }

  /* ------------------------------------------------------------------ *
   * 7. DISUASIVOS DE DEVTOOLS (evitables a proposito)                   *
   * ------------------------------------------------------------------ */
  if (cfg.blockDevtoolsKeys) {
    D.addEventListener('keydown', function (ev) {
      var k = ev.key || '';
      // F12
      if (k === 'F12') { ev.preventDefault(); return record('devtools_key', 'F12'); }
      // Ctrl/Cmd + Shift + I / J / C  (inspeccionar / consola)
      if ((ev.ctrlKey || ev.metaKey) && ev.shiftKey && /^[ijc]$/i.test(k)) {
        ev.preventDefault(); return record('devtools_key', 'Ctrl+Shift+' + k);
      }
      // Ctrl/Cmd + U (ver codigo fuente)
      if ((ev.ctrlKey || ev.metaKey) && k.toLowerCase() === 'u') {
        ev.preventDefault(); return record('devtools_key', 'Ctrl+U');
      }
    }, true);
  }

  if (cfg.blockContextMenu) {
    D.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });
  }

  if (cfg.detectDevtools) {
    // Heuristica simple (solo reporta; hay falsos positivos).
    var threshold = 160;
    setInterval(function () {
      try {
        if (W.outerWidth - W.innerWidth > threshold || W.outerHeight - W.innerHeight > threshold) {
          record('devtools_open', 'posible devtools/docked');
        }
      } catch (e) {}
    }, 4000);
  }

  /* ------------------------------------------------------------------ *
   * 8. DETECCION BASICA DE BOTS / AUTOMATIZACION (solo informa)         *
   * ------------------------------------------------------------------ */
  S.isBot = function () {
    try {
      if (navigator.webdriver) return true;
      if (!navigator.languages || navigator.languages.length === 0) return true;
      if (/HeadlessChrome|PhantomJS|Selenium|puppeteer/i.test(navigator.userAgent)) return true;
    } catch (e) {}
    return false;
  };
  // Trampa (honeypot): marca bots que rellenan campos ocultos.
  S.installHoneypot = function (form) {
    if (!form || form.querySelector('.wl-hp')) return;
    var trap = D.createElement('input');
    trap.type = 'text';
    trap.name = 'wl_hp_' + Math.random().toString(36).slice(2, 8);
    trap.className = 'wl-hp';
    trap.setAttribute('autocomplete', 'off');
    trap.setAttribute('tabindex', '-1');
    trap.style.cssText = 'position:absolute;left:-9999px;opacity:0;height:0;width:0';
    form.appendChild(trap);
    form.addEventListener('submit', function (ev) {
      if (trap.value) { ev.preventDefault(); record('honeypot', 'formulario rellenado por bot'); }
    }, true);
  };

  /* ------------------------------------------------------------------ *
   * 9. MITIGACION DE PROTOTYPE POLLUTION (opcional, puede romper libs)  *
   * ------------------------------------------------------------------ */
  if (cfg.freezePrototypes) {
    try {
      [Object.prototype, Array.prototype, String.prototype, Number.prototype].forEach(function (p) {
        Object.freeze(p);
      });
    } catch (e) {}
  }

  /* ------------------------------------------------------------------ *
   * 10. OBSERVABILIDAD Y ESTABILIDAD (no dejes que un error tumbe todo) *
   * ------------------------------------------------------------------ */
  var errCount = 0;
  W.addEventListener('error', function (e) {
    errCount++;
    record('js_error', (e && e.message ? e.message : 'error') + ' @ ' + (e && e.filename ? e.filename : '?') + ':' + (e && e.lineno ? e.lineno : '?'));
    if (errCount > 100) record('js_error_burst', 'posible ataque de saturacion por errores');
  });
  W.addEventListener('unhandledrejection', function (e) {
    var r = e && e.reason;
    record('promise_rejection', (r && r.message) ? r.message : String(r));
  });
  // Escucha violaciones de CSP (diagnostico de inyecciones bloqueadas).
  D.addEventListener('securitypolicyviolation', function (e) {
    record('csp_violation', (e.violatedDirective || '') + ' -> ' + (e.blockedURI || ''));
  });

  /* ------------------------------------------------------------------ *
   * 11. FIRMA/MARCA INTERNA                                             *
   * ------------------------------------------------------------------ */
  try {
    S.origin = location.origin;
    S.secureContext = (W.isSecureContext === true);
    S.loadedAt = Date.now();
  } catch (e) {}

  /* ================================================================== *
   * PROTECCION DE SERVIDOR (code.gs) — YA IMPLEMENTADA
   * ------------------------------------------------------------------
   * En code.gs se añadio (fail-open, no bloquea trafico legitimo):
   *   1) LIMITE DE PETICIONES con CacheService: RATE_LIMITS + verificarLimite()
   *      aplicado en handleJsonpAction (JSONP) y en doPost().
   *      - Cupo por accion + identidad (param user).
   *      - Cupo global anonimo de respaldo (LIMITE_GLOBAL_ANON).
   *   2) Rechazo de payloads > 60.000 chars (anti-cuelgue).
   *   3) Limite de tamano de config (MAX_CHARS.config = 50.000).
   *   4) Autenticacion en todas las acciones que escriben datos.
   *   5) Accion "reportEvent" para registrar anomalias en el log.
   *
   * PARA ACTIVAR EL REPORTE desde el cliente, define antes de cargar
   * security.js (reemplaza API_URL por tu URL real):
   *   <script>
   *     window.WL_SECURITY_CONFIG = {
   *       report: true,
   *       reportURL: 'https://script.google.com/macros/s/.../exec?action=reportEvent'
   *     };
   *   </script>
   * Nota: el limite por identidad es debil contra rotacion del param "user"
   * (Apps Script no expone la IP); por eso existe el cupo global de respaldo.
   * ================================================================== */
})();
