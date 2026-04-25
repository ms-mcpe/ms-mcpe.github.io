// =========================================================
// SEGURIDAD, TRADUCCIÓN Y UTILIDADES GLOBALES
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. DESHABILITAR CLICK DERECHO
  document.addEventListener('contextmenu', event => event.preventDefault());

  // 2. DESHABILITAR ATAJOS DE TECLADO (F12, Ctrl+Shift+I, Ctrl+U)
  document.addEventListener('keydown', (e) => {
    // F12
    if (e.keyCode === 123) {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+I
    if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+J
    if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
      e.preventDefault();
      return false;
    }
    // Ctrl+U
    if (e.ctrlKey && e.keyCode === 85) {
      e.preventDefault();
      return false;
    }
  });

  // 3. CONVERTIR SCROLL VERTICAL A HORIZONTAL EN CONTENEDORES ESPECÍFICOS
  // Esto arregla el problema de "no tiene movimiento al mover para arriba o abajo con la ruedita del mouse"
  const scrollContainers = document.querySelectorAll('.categories-scroll, .popular-scroll');
  scrollContainers.forEach(container => {
    container.addEventListener('wheel', (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        // Ajustar velocidad de scroll (e.deltaY * 1.5 para hacerlo más fluido)
        container.scrollLeft += e.deltaY;
      }
    });
  });
  
  // Traducir la página si hay idioma configurado
  applyLanguage();
});

// 4. SISTEMA DE TRADUCCIÓN BÁSICA
const dictionary = {
  'es': {
    'Inicio': 'Inicio', 'Nuevos': 'Nuevos', 'Descargas': 'Descargas', 'Guide': 'Guía',
    'Ajustes y Temas': 'Ajustes y Temas', 'Idioma (Español)': 'Idioma (Español)', 'Subir Addons': 'Subir Addons',
    'Todos': 'Todos', 'Mapas': 'Mapas', 'Texturas': 'Texturas', 'Skins': 'Skins', 'Popurris': 'Popurris',
    'Popular': 'Popular', 'Más Gustados': 'Más Gustados', 'Todo el contenido': 'Todo el contenido',
    'elementos': 'elementos'
  },
  'en': {
    'Inicio': 'Home', 'Nuevos': 'New', 'Descargas': 'Downloads', 'Guide': 'Guide',
    'Ajustes y Temas': 'Settings & Themes', 'Idioma (Español)': 'Language (English)', 'Subir Addons': 'Upload Addons',
    'Todos': 'All', 'Mapas': 'Maps', 'Texturas': 'Textures', 'Skins': 'Skins', 'Popurris': 'Mashups',
    'Popular': 'Trending', 'Más Gustados': 'Most Liked', 'Todo el contenido': 'All Content',
    'elementos': 'items'
  },
  'pt': {
    'Inicio': 'Início', 'Nuevos': 'Novos', 'Descargas': 'Baixados', 'Guide': 'Guia',
    'Ajustes y Temas': 'Configurações e Temas', 'Idioma (Español)': 'Idioma (Português)', 'Subir Addons': 'Enviar Addons',
    'Todos': 'Todos', 'Mapas': 'Mapas', 'Texturas': 'Texturas', 'Skins': 'Skins', 'Popurris': 'Mix',
    'Popular': 'Populares', 'Más Gustados': 'Mais Curtidos', 'Todo el contenido': 'Todo o conteúdo',
    'elementos': 'itens'
  }
  // Se pueden añadir más idiomas aquí
};

function applyLanguage() {
  const lang = localStorage.getItem('bv_language') || 'es';
  if (lang === 'es' || !dictionary[lang]) return; // Por defecto
  
  const dict = dictionary[lang];
  
  // Buscar elementos que tengan el atributo data-i18n o buscar texto directo
  // Para hacerlo sencillo en un proyecto existente sin reconstruir el DOM, 
  // buscaremos clases específicas y cambiaremos su textContent.
  
  const elements = document.querySelectorAll('[data-i18n], .nav-item span, .sidebar-item span, .cat-btn, .section-title, .header-descargas h2, .header-nuevos-title h2');
  
  elements.forEach(el => {
    // Si tiene hijos (como iconos), solo reemplazamos los nodos de texto
    Array.from(el.childNodes).forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text && dict[text]) {
          node.textContent = ' ' + dict[text] + ' ';
        } else {
          // Intentar coincidencia parcial (útil para "X elementos")
          for (let key in dict) {
            if (text.includes(key)) {
               node.textContent = node.textContent.replace(key, dict[key]);
            }
          }
        }
      }
    });
  });
}

// Escuchar cambios de idioma desde el iframe o viceversa
window.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'language-change') {
    applyLanguage();
  }
});
