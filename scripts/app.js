const sheetId = '1VVO_fKNZqPdeCDagWF8s7clq7uMZfCY3-HDTksAmNnw'; 
const sheetName = 'FROM App MC Addons'; 
const url = `https://opensheet.elk.sh/${sheetId}/${sheetName}`;

let addonsData = []; // Guardamos los datos aquí para que el buscador funcione

async function cargarAddons() {
    const addonGrid = document.getElementById('addon-grid');
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        // Limpieza de datos: obtener solo filas válidas saltando encabezados raros
        addonsData = data.filter(item => {
            const v = Object.values(item);
            return v[1] && v[1].toLowerCase() !== 'name';
        });

        // Ordenar por fecha (Marca temporal en la columna 0)
        addonsData.sort((a, b) => new Date(Object.values(b)[0]) - new Date(Object.values(a)[0]));

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
            <div class="card-image" style="background-image: url('${imagen}'); background-size: cover; background-position: center; height: 180px;">
                <span class="category-tag" style="position:absolute; top:10px; left:10px; background:#2ecc71; color:#000; padding:3px 8px; border-radius:4px; font-weight:bold; font-size:12px;">${categoria}</span>
            </div>
            <div class="card-info" style="padding:15px;">
                <h3 style="margin-bottom:10px; font-size:1.1rem;">${nombre}</h3>
                <a href="${descarga}" target="_blank" class="btn-download" style="display:block; background:#2ecc71; color:#000; text-align:center; padding:10px; border-radius:5px; text-decoration:none; font-weight:bold;">DESCARGAR</a>
            </div>
        `;
        addonGrid.appendChild(card);
    });
}

// --- FUNCIONALIDAD DEL BUSCADOR ---
const buscador = document.getElementById('addon-search');
if (buscador) {
    buscador.addEventListener('input', (e) => {
        const termino = e.target.value.toLowerCase();
        const filtrados = addonsData.filter(item => {
            const v = Object.values(item);
            const nombre = (v[1] || "").toLowerCase();
            const categoria = (v[4] || "").toLowerCase();
            return nombre.includes(termino) || categoria.includes(termino);
        });
        renderizarCards(filtrados);
    });
}

// --- FUNCIONALIDAD DEL MENÚ LATERAL ---
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (e) => {
        const filtro = link.getAttribute('data-filter');
        if (!filtro) return;

        // Quitamos "active" de todos y ponemos al seleccionado
        document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
        link.classList.add('active');

        const addonGrid = document.getElementById('addon-grid');

        if (filtro === 'all') {
            renderizarCards(addonsData);
        } 
        else if (filtro === 'Comunidad') {
            addonGrid.innerHTML = `
                <div style="padding:40px; text-align:center; width:100%;">
                    <i class="fas fa-users" style="font-size:3rem; color:#2ecc71; margin-bottom:20px;"></i>
                    <h2>Nuestra Comunidad</h2>
                    <p style="color:#bbb; margin-top:10px;">Únete a nuestro servidor oficial para compartir tus creaciones.</p>
                    <a href="#" class="btn-download" style="display:inline-block; margin-top:20px; width:200px;">Unirse al Discord</a>
                </div>`;
        } 
        else if (filtro === 'Politicas') {
            addonGrid.innerHTML = `
                <div style="padding:40px; width:100%;">
                    <h2>Políticas de Uso</h2>
                    <p style="color:#bbb; margin-top:20px;">1. No se permite subir contenido robado.</p>
                    <p style="color:#bbb; margin-top:10px;">2. Todos los créditos deben ir a sus respectivos creadores.</p>
                    <p style="color:#bbb; margin-top:10px;">3. Los links deben ser directos o a través de acortadores permitidos.</p>
                </div>`;
        } 
        else {
            // Filtrar por la columna de categoría del Excel
            const filtrados = addonsData.filter(item => {
                const cat = (Object.values(item)[4] || "").toLowerCase();
                return cat.includes(filtro.toLowerCase());
            });
            renderizarCards(filtrados);
        }
    });
});

// Iniciar carga
document.addEventListener('DOMContentLoaded', cargarAddons);
