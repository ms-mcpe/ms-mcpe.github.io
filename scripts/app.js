const sheetId = '1VVO_fKNZqPdeCDagWF8s7clq7uMZfCY3-HDTksAmNnw'; 
const sheetName = 'FROM App MC Addons'; 
const url = `https://opensheet.elk.sh/${sheetId}/${sheetName}`;

let addonsData = [];

// --- CARGA DE DATOS ---
async function cargarAddons() {
    const addonGrid = document.getElementById('addon-grid');
    try {
        const response = await fetch(url);
        const data = await response.json();

        // Limpieza e Inversión (Nuevos primero)
        addonsData = data.filter(item => {
            const v = Object.values(item);
            return v[1] && v[1].toLowerCase() !== 'name';
        }).reverse(); 

        renderizarCards(addonsData);
    } catch (error) {
        console.error("Error:", error);
        addonGrid.innerHTML = '<p style="color:white; text-align:center; padding:20px;">Error al conectar con la base de datos.</p>';
    }
}

function renderizarCards(lista) {
    const addonGrid = document.getElementById('addon-grid');
    if (!addonGrid) return;
    addonGrid.innerHTML = '';

    if (lista.length === 0) {
        addonGrid.innerHTML = '<p style="color:#888; text-align:center; width:100%; margin-top:50px;">No se encontraron resultados.</p>';
        return;
    }

    lista.forEach((item) => {
        const valores = Object.values(item);
        const nombre = valores[1] || "Sin nombre";
        const descarga = valores[2] || "#";
        const imagen = valores[3] || "";
        const categoria = valores[4] || "General";

        const card = document.createElement('div');
        card.className = 'addon-card';
        card.innerHTML = `
            <div class="card-image" style="background-image: url('${imagen}')">
                <span class="category-tag">${categoria}</span>
            </div>
            <div class="card-info">
                <h3>${nombre}</h3>
                <a href="${descarga}" target="_blank" class="btn-download">DESCARGAR</a>
            </div>
        `;
        addonGrid.appendChild(card);
    });
}

// --- BUSCADOR ---
const buscador = document.getElementById('addon-search');
if (buscador) {
    buscador.addEventListener('input', (e) => {
        const termino = e.target.value.toLowerCase();
        const filtrados = addonsData.filter(item => {
            const v = Object.values(item);
            return (v[1] || "").toLowerCase().includes(termino) || (v[4] || "").toLowerCase().includes(termino);
        });
        renderizarCards(filtrados);
    });
}

// --- LÓGICA DE INTERFAZ (MENÚS) ---
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const toggleBtn = document.getElementById('toggle-btn');
const dropBtn = document.getElementById('drop-btn');
const submenu = document.getElementById('submenu');
const dropContainer = document.querySelector('.dropdown-container');

// Abrir/Cerrar Sidebar
toggleBtn.addEventListener('click', () => {
    sidebar.classList.add('active');
    overlay.classList.add('show');
});

overlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('show');
});

// Dropdown de Complementos
dropBtn.addEventListener('click', (e) => {
    e.preventDefault();
    submenu.classList.toggle('open');
    dropContainer.classList.toggle('active');
});

// Filtros de Navegación
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (e) => {
        const filtro = link.getAttribute('data-filter');
        if (!filtro) return; // Si es el link de chat o drop-btn, no filtrar aquí

        e.preventDefault();
        
        // Estética de activo
        document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
        link.classList.add('active');

        // Cerrar menú en móvil tras elegir
        if(!link.classList.contains('dropdown-trigger')) {
            sidebar.classList.remove('active');
            overlay.classList.remove('show');
        }

        const addonGrid = document.getElementById('addon-grid');
        if (filtro === 'all') {
            renderizarCards(addonsData);
        } else if (filtro === 'Comunidad') {
            addonGrid.innerHTML = `
                <div style="padding:40px; text-align:center; width:100%;">
                    <i class="fab fa-whatsapp" style="font-size:3rem; color:#2ecc71;"></i>
                    <h2>Canal de WhatsApp</h2>
                    <a href="https://whatsapp.com/channel/0029Vb6MoFQ0gcfCKJhYNU33/526" target="_blank" class="btn-download" style="margin-top:20px;">Unirse</a>
                </div>`;
        } else if (filtro === 'Politicas') {
            addonGrid.innerHTML = `<div style="padding:40px; color:white;"><h2>Políticas</h2><p>Contenido propiedad de sus creadores...</p></div>`;
        } else {
            const filtrados = addonsData.filter(item => (Object.values(item)[4] || "").toLowerCase().includes(filtro.toLowerCase()));
            renderizarCards(filtrados);
        }
    });
});

document.addEventListener('DOMContentLoaded', cargarAddons);
