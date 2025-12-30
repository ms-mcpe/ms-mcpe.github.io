const sheetId = '1VVO_fKNZqPdeCDagWF8s7clq7uMZfCY3-HDTksAmNnw'; 
const sheetName = 'FROM App MC Addons'; 
const url = `https://opensheet.elk.sh/${sheetId}/${sheetName}`;

let addonsData = []; // Memoria para filtros y búsqueda

async function cargarAddons() {
    const addonGrid = document.getElementById('addon-grid');
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        // Limpiar datos: solo filas con nombre real, saltando encabezados
        addonsData = data.filter(item => {
            const v = Object.values(item);
            return v[1] && v[1].toLowerCase() !== 'name';
        });

        // Ordenar: lo más reciente (Marca temporal) arriba
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
        addonGrid.innerHTML = '<p style="color:#888; text-align:center; width:100%; margin-top:50px;">No se encontraron resultados en esta categoría.</p>';
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
            <div class="card-image" style="background-image: url('${imagen}'); background-size: cover; background-position: center; height: 180px; position: relative;">
                <span class="category-tag" style="position:absolute; top:10px; left:10px; background:#2ecc71; color:#000; padding:3px 8px; border-radius:4px; font-weight:bold; font-size:12px;">${categoria}</span>
            </div>
            <div class="card-info" style="padding:15px;">
                <h3 style="margin-bottom:10px; font-size:1.1rem; color:#fff;">${nombre}</h3>
                <a href="${descarga}" target="_blank" class="btn-download" style="display:block; background:#2ecc71; color:#000; text-align:center; padding:10px; border-radius:5px; text-decoration:none; font-weight:bold; transition: 0.3s;">DESCARGAR</a>
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
            const nombre = (v[1] || "").toLowerCase();
            const categoria = (v[4] || "").toLowerCase();
            return nombre.includes(termino) || categoria.includes(termino);
        });
        renderizarCards(filtrados);
    });
}

// --- NAVEGACIÓN Y FILTROS ---
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (e) => {
        const filtro = link.getAttribute('data-filter');
        if (!filtro) return;

        e.preventDefault();
        
        // Estética del menú
        document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
        link.classList.add('active');

        const addonGrid = document.getElementById('addon-grid');

        // Lógica de filtrado
        if (filtro === 'all') {
            renderizarCards(addonsData);
        } 
        else if (filtro === 'Comunidad') {
            addonGrid.innerHTML = `
                <div style="padding:40px; text-align:center; width:100%;">
                    <i class="fas fa-users" style="font-size:3rem; color:#2ecc71; margin-bottom:20px;"></i>
                    <h2>Comunidad</h2>
                    <p style="color:#bbb; margin-top:10px;">¡Únete a nuestro servidor para no perderte ninguna actualización!</p>
                    <a href="https://whatsapp.com/channel/0029Vb6MoFQ0gcfCKJhYNU33/526" class="btn-download" style="display:inline-block; margin-top:20px; width:220px; text-decoration:none;">Discord Oficial</a>
                </div>`;
        } 
        else if (filtro === 'Politicas') {
            addonGrid.innerHTML = `
                <div style="padding:40px; width:100%; color:#fff;">
                    <h2 style="color:#2ecc71;">Políticas de Privacidad</h2>
                    <p style="margin-top:20px; color:#bbb;">• Todo el contenido es propiedad de sus respectivos autores.</p>
                    <p style="margin-top:10px; color:#bbb;">• No recolectamos datos personales de los usuarios.</p>
                    <p style="margin-top:10px; color:#bbb;">• El uso de esta app es para fines informativos y de descarga.</p>
                </div>`;
        } 
        else {
            // Filtra buscando la palabra en la columna "category" (Columna E / índice 4)
            const filtrados = addonsData.filter(item => {
                const cat = (Object.values(item)[4] || "").toLowerCase();
                return cat.includes(filtro.toLowerCase());
            });
            renderizarCards(filtrados);
        }
    });
});

document.addEventListener('DOMContentLoaded', cargarAddons);
