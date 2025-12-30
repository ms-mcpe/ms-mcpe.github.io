const sheetId = '1VVO_fKNZqPdeCDagWF8s7clq7uMZfCY3-HDTksAmNnw'; 
const sheetName = 'FROM App MC Addons'; 
const url = `https://opensheet.elk.sh/${sheetId}/${sheetName}`;

// Variable global para guardar los datos y poder filtrarlos
let addonsData = [];

async function cargarAddons() {
    const addonGrid = document.getElementById('addon-grid');
    const countBadge = document.getElementById('addon-count');
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        // Limpiamos y preparamos los datos reales (saltando encabezados si los hay)
        addonsData = data.filter(item => {
            const valores = Object.values(item);
            return valores[1] && valores[1].toLowerCase() !== 'name';
        });

        // Ordenar por Marca temporal (Más reciente primero)
        addonsData.sort((a, b) => {
            const valoresA = Object.values(a);
            const valoresB = Object.values(b);
            return new Date(valoresB[0]) - new Date(valoresA[0]);
        });

        renderizarCards(addonsData);

    } catch (error) {
        console.error("Error:", error);
        addonGrid.innerHTML = '<p style="color:white; text-align:center;">Error al cargar la base de datos.</p>';
    }
}

// Función para dibujar las tarjetas en pantalla
function renderizarCards(lista) {
    const addonGrid = document.getElementById('addon-grid');
    const countBadge = document.getElementById('addon-count');
    
    addonGrid.innerHTML = '';
    
    lista.forEach((item) => {
        const valores = Object.values(item);
        
        const nombre = valores[1] || "Sin nombre";
        const descarga = valores[2] || "#";
        const imagen = valores[3] || "";
        const categoria = valores[4] || "General";

        const card = document.createElement('div');
        card.className = 'addon-card';
        
        card.innerHTML = `
            <div class="card-image" style="background-image: url('${imagen}'); background-size: cover; background-position: center; background-color: #333;">
                <span class="category-tag">${categoria}</span>
            </div>
            <div class="card-info">
                <h3>${nombre}</h3>
                <a href="${descarga}" target="_blank" class="btn-download">DESCARGAR</a>
            </div>
        `;
        addonGrid.appendChild(card);
    });

    if (countBadge) countBadge.innerText = `${lista.length} items`;
}

// --- LÓGICA DEL BUSCADOR ---
document.getElementById('addon-search').addEventListener('input', (e) => {
    const busqueda = e.target.value.toLowerCase();
    
    const filtrados = addonsData.filter(item => {
        const valores = Object.values(item);
        const nombre = (valores[1] || "").toLowerCase();
        const categoria = (valores[4] || "").toLowerCase();
        return nombre.includes(busqueda) || categoria.includes(busqueda);
    });

    renderizarCards(filtrados);
});

// --- LÓGICA DE FILTROS POR MENÚ LATERAL ---
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (e) => {
        // Solo aplicar si tiene el atributo data-filter
        const filtro = link.getAttribute('data-filter');
        if (!filtro) return;

        e.preventDefault();
        
        // Quitar clase activa de todos y ponerla al actual
        document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
        link.classList.add('active');

        // Actualizar título de sección
        const tituloSeccion = document.getElementById('current-category');
        if (tituloSeccion) tituloSeccion.innerText = link.innerText;

        if (filtro === 'all') {
            renderizarCards(addonsData);
        } else {
            const filtrados = addonsData.filter(item => {
                const valores = Object.values(item);
                const categoria = (valores[4] || "").toLowerCase();
                return categoria.includes(filtro.toLowerCase());
            });
            renderizarCards(filtrados);
        }
    });
});

// Iniciar app
document.addEventListener('DOMContentLoaded', cargarAddons);
