// ══════════════════════════════════════════════════
// LÓGICA PRINCIPAL DE LA APP (app.js)
// ══════════════════════════════════════════════════

const API_URL = 'https://script.google.com/macros/s/AKfycbzAFKX9RRSEbp5-kqDFHQHi3Rk17mLhBmhBq9Y3I9oTlfhNfc1wFXwUgv6P5LZ5sBkV/exec';

document.addEventListener('DOMContentLoaded', async () => {
  // Inicialización
  initTheme();
  initSidebar();
  checkUrlParams(); // Nueva función para verificar parámetros de URL
  
  // Validar mantenimiento
  await checkMaintenance();
});

const VERIFY_LINK = 'https://cuty.io/bY5SE4ORJ';
const VERIFY_DURATION = 15 * 60 * 60 * 1000;

function checkUrlParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('verified') === 'true') {
    localStorage.setItem('bv_verified_time', Date.now().toString());
    // Limpiar la URL para que no diga ?verified=true permanentemente
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

function isVerified() {
  const verifiedTime = localStorage.getItem('bv_verified_time');
  if (!verifiedTime) return false;
  return (Date.now() - parseInt(verifiedTime)) < VERIFY_DURATION;
}

async function checkMaintenance() {
  try {
    const res = await fetch(`${API_URL}?action=getStats`);
    const data = await res.json();
    
    if (data.mantenimiento) {
      const userRole = localStorage.getItem('bv_role');
      if (userRole !== 'Admin' && userRole !== 'Owner') {
        // Bloquear acceso
        document.body.innerHTML = `
          <div style="height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; background:var(--bg-app); color:var(--primary-color); text-align:center; padding:20px;">
            <i class="fa-solid fa-person-digging" style="font-size:4rem; margin-bottom:20px;"></i>
            <h1 style="font-family:'Space Grotesk', sans-serif; font-size:2rem; margin-bottom:10px;">En Mantenimiento</h1>
            <p style="color:var(--text-muted); font-size:0.9rem;">Estamos mejorando BlockVault. Vuelve más tarde.</p>
          </div>
        `;
        return; // Detener ejecución
      }
    }
    
    // Si no hay mantenimiento o es Admin, cargar normal
    initNavigation();
    const frame = document.getElementById('page-frame');
    if (frame && (frame.src === '' || frame.src.includes('about:blank'))) {
      navigateTo('pages/inicio.html');
    }
  } catch (e) {
    console.error("Error al validar mantenimiento", e);
    // Cargar normal si falla
    initNavigation();
    navigateTo('pages/inicio.html');
  }
}

/* ══════════════════════════════════════════════════
   SISTEMA DE TEMAS Y PERSONALIZACIÓN
══════════════════════════════════════════════════ */
function initTheme() {
  const savedTheme = localStorage.getItem('bv_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  const savedColor = localStorage.getItem('bv_primary_color');
  if (savedColor) {
    document.documentElement.style.setProperty('--primary-color', savedColor);
    document.documentElement.style.setProperty('--border-neon', savedColor);
    // Calcular un color suave para el resplandor basado en el principal
    // (Simplificado, en producción podría usar color-mix o RGB)
    document.documentElement.style.setProperty('--neon-glow', savedColor + '66'); // 40% opacity hex
  }
}

// Escuchar cambios desde el iframe (ej. desde ajustes)
window.addEventListener('message', (e) => {
  if (!e.data || !e.data.type) return;
  
  if (e.data.type === 'theme-change') {
    localStorage.setItem('bv_theme', e.data.theme);
    document.documentElement.setAttribute('data-theme', e.data.theme);
  }
  
  if (e.data.type === 'color-change') {
    localStorage.setItem('bv_primary_color', e.data.color);
    document.documentElement.style.setProperty('--primary-color', e.data.color);
    document.documentElement.style.setProperty('--border-neon', e.data.color);
    document.documentElement.style.setProperty('--neon-glow', e.data.color + '66');
  }
  
  if (e.data.type === 'language-change') {
    // Reenviar a los iframes si están abiertos
    const frame = document.getElementById('page-frame');
    if(frame && frame.contentWindow) {
       frame.contentWindow.postMessage(e.data, '*');
    }
  }
  
  // Soporte para navegación solicitada desde el iframe
  if (e.data.type === 'navigate') {
    navigateTo(e.data.page);
  }

  // Solicitud de verificación desde el iframe
  if (e.data.type === 'check-verify') {
    const verified = isVerified();
    const frame = document.getElementById('page-frame');
    if (frame && frame.contentWindow) {
      frame.contentWindow.postMessage({ type: 'verify-status', verified: verified }, '*');
    }
  }

  // Redirigir a verificación
  if (e.data.type === 'go-verify') {
    window.location.href = VERIFY_LINK;
  }
});

/* ══════════════════════════════════════════════════
   NAVEGACIÓN (Iframe y Menú Inferior)
══════════════════════════════════════════════════ */
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Remover clase activa de todos
      navItems.forEach(nav => nav.classList.remove('active'));
      
      // Añadir clase activa al clickeado
      item.classList.add('active');
      
      // Navegar
      const targetPage = item.getAttribute('data-target');
      if (targetPage) {
        navigateTo(targetPage);
      }
    });
  });
}

function navigateTo(url) {
  const frame = document.getElementById('page-frame');
  if (!frame) return;
  
  frame.classList.add('loading');
  
  // Pequeño delay para la animación
  setTimeout(() => {
    frame.src = url;
    frame.onload = () => {
      frame.classList.remove('loading');
      // Pasar info al hijo (tema actual, etc)
      frame.contentWindow.postMessage({
        type: 'init-data',
        theme: localStorage.getItem('bv_theme') || 'dark',
        color: localStorage.getItem('bv_primary_color')
      }, '*');
    };
  }, 200);
  
  // Cerrar sidebar si está abierto
  closeSidebar();
}

/* ══════════════════════════════════════════════════
   MENÚ LATERAL (Sidebar)
══════════════════════════════════════════════════ */
function initSidebar() {
  const menuToggle = document.getElementById('menu-toggle');
  const sidebarClose = document.getElementById('sidebar-close');
  const overlay = document.getElementById('sidebar-overlay');
  
  if (menuToggle) {
    menuToggle.addEventListener('click', openSidebar);
  }
  
  if (sidebarClose) {
    sidebarClose.addEventListener('click', closeSidebar);
  }
  
  if (overlay) {
    overlay.addEventListener('click', closeSidebar);
  }
  
  // Enlaces del sidebar
  const sidebarLinks = document.querySelectorAll('.sidebar-item');
  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      // Si tiene un submenú o el ID es tools-toggle, no navegar aquí directamente
      if (link.id === 'tools-toggle') return;

      e.preventDefault();
      const targetPage = link.getAttribute('data-target');
      if (targetPage) {
        navigateTo(targetPage);
      }
    });
  });
  
  // Submenú Herramientas Toggle
  const toolsToggle = document.getElementById('tools-toggle');
  const toolsSubmenu = document.getElementById('tools-submenu');
  if (toolsToggle && toolsSubmenu) {
    toolsToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toolsSubmenu.classList.toggle('active');
      const icon = toolsToggle.querySelector('.toggle-icon');
      if (icon) {
        icon.style.transform = toolsSubmenu.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
      }
    });
  }

  // Enlaces del submenú
  const subItems = document.querySelectorAll('.sidebar-subitem');
  subItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetPage = item.getAttribute('data-target');
      if (targetPage) {
        navigateTo(targetPage);
      }
    });
  });
  
  // Botón Subir Addons
  const btnUpload = document.getElementById('btn-upload');
  if (btnUpload) {
    btnUpload.addEventListener('click', () => {
      const accepted = localStorage.getItem('bv_policies_accepted');
      if (accepted === 'true') {
        navigateTo('pages/panel.html');
      } else {
        navigateTo('pages/politicas.html');
      }
    });
  }
}

function openSidebar() {
  document.getElementById('sidebar').classList.add('active');
  document.getElementById('sidebar-overlay').classList.add('active');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('active');
  document.getElementById('sidebar-overlay').classList.remove('active');
}
