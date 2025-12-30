const sheetId = '1VVO_fKNZqPdeCDagWF8s7clq7uMZfCY3-HDTksAmNnw'; 
const sheetName = 'FROM App MC Addons'; 
const url = `https://opensheet.elk.sh/${sheetId}/${sheetName}`;

let addonsData = []; // Memoria para las búsquedas

async function cargarAddons() {
    const addonGrid = document.getElementById('addon-grid');
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        // Filtramos para obtener solo filas con datos reales
        addonsData = data.filter(item => {
            const v = Object.values(item);
            return v[1] && v[1].toLowerCase() !== 'name';
        });

        // Ordenar: lo más nuevo primero
        addonsData.sort((a, b) => new Date(Object.values(b)[0]) - new Date(Object.values(a)[0]));

        renderizarCards(addonsData);

    } catch (error) {
        console.error("Error:", error);
        addonGrid.innerHTML = '<p style="color:white; text-align:center;">Error de conexión.</p>';
    }
}

function renderizarCards(lista) {
    const addonGrid = document.getElementById('addon-grid');
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
            <div class="card-image" style="background-image: url('${imagen}'); background-size: cover; background-position: center; background-color: #222; height: 160px; border-radius: 8px 8px 0 0;">
                <span class="category-tag" style="background: #2ecc71; color: #000; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; position: absolute; top: 10px; left: 10px; font-weight: bold;">${categoria}</span>
            </div>
            <div class="card-info" style="padding: 15px;">
                <h3 style="font-size: 1rem; margin-bottom: 10px; color: #fff;">${nombre}</h3>
                <a href="${descarga}" target="_blank" class="btn-download" style="display: block; background: #2ecc71; color: #000; text-align: center; padding: 8px; border-radius: 5px; text-decoration: none; font-weight: bold; font-size: 0.8rem;">DESCARGAR</a>
            </div>
        `;
        addonGrid.appendChild(card);
    });
}

// --- ARREGLO DEL BUSCADOR ---
const inputBusqueda = document.getElementById('addon-search');
if (inputBusqueda) {
    inputBusqueda.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtrados = addonsData.filter(item => {
            const v = Object.values(item);
            return (v[1] || "").toLowerCase().includes(term) || (v[4] || "").toLowerCase().includes(term);
        });
        renderizarCards(filtrados);
    });
}

// --- ARREGLO DE SECCIONES Y MENÚ ---
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const filtro = link.getAttribute('data-filter');
        const addonGrid = document.getElementById('addon-grid');
        const titulo = document.getElementById('current-category');

        // Actualizar título visualmente
        if (titulo) titulo.innerText = link.innerText;

        // Quitar y poner clase activa
        document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
        link.classList.add('active');

        // Lógica de secciones especiales
        if (filtro === 'Comunidad') {
            addonGrid.innerHTML = '<div style="padding:20px;"><h2>Comunidad</h2><p>Únete a nuestro Discord para compartir tus addons.</p></div>';
        } else if (filtro === 'Politicas') {
            addonGrid.innerHTML = '<div style="padding:20px;"><h2>Políticas</h2><p>Respetamos los derechos de autor. No subas contenido robado.</p></div>';
        } else if (filtro === 'all') {
            renderizarCards(addonsData);
        } else {
            // Filtrado por categoría (Addon, Textura, etc)
            const filtrados = addonsData.filter(item => {
                const cat = (Object.values(item)[4] || "").toLowerCase();
                return cat.includes(filtro.toLowerCase());
            });
            renderizarCards(filtrados);
        }
    });
});

document.addEventListener('DOMContentLoaded', cargarAddons);
