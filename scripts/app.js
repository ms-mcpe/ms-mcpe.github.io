const sheetId = '1VVO_fKNZqPdeCDagWF8s7clq7uMZfCY3-HDTksAmNnw'; 
const sheetName = 'FROM App MC Addons'; 
const url = `https://opensheet.elk.sh/${sheetId}/${sheetName}`;
const scriptURL = "https://script.google.com/macros/s/AKfycbyxezM7lhtD7lmpqg_ww8X3afZ_VEUTH56klo55skV9CJ-0XlW63hAUvyyTyYGWUr8mdQ/exec";

let addonsData = []; // Memoria para filtros y búsqueda

async function cargarAddons() {
    const addonGrid = document.getElementById('addon-grid');
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        // 1. Limpieza de datos: Solo filas con nombre, saltando encabezados
        // CAMBIO AQUÍ: Agregamos .reverse() al final del filtro para invertir el orden del Excel
        addonsData = data.filter(item => {
            const v = Object.values(item);
            return v[1] && v[1].toLowerCase() !== 'name';
        }).reverse(); 

        // Se eliminó la función .sort() que no funcionaba y se reemplazó por el .reverse() de arriba
        // que es mucho más fiable para el formato de Google Sheets.

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
        const likes = valores[5] || 0;
        
        const card = document.createElement('div');
        card.className = 'addon-card';
        card.innerHTML = `
            <div class="card-image" style="background-image: url('${imagen}'); background-size: cover; background-position: center; height: 180px; position: relative;">
                <span class="category-tag" style="position:absolute; top:10px; left:10px; background:#2ecc71; color:#000; padding:3px 8px; border-radius:4px; font-weight:bold; font-size:12px;">${categoria}</span>
            </div>
            <div class="card-info" style="padding:15px;">
                <h3 style="margin-bottom:10px; font-size:1.1rem; color:#fff;">${nombre}</h3>
                <a href="${descarga}" target="_blank" class="btn-download" style="display:block; background:#2ecc71; color:#000; text-align:center; padding:10px; border-radius:5px; text-decoration:none; font-weight:bold; transition: 0.3s;">DESCARGAR</a>
               <div class="like-btn" onclick="enviarLike('${nombre}', this)" style="cursor:pointer; display: flex; flex-direction: column; align-items: center; min-width: 40px;">
                        <i class="fas fa-heart" style="color: #ff4757; font-size: 1.2rem;"></i>
                        <span class="like-count" style="font-size: 0.8rem; color: #bbb;">${likes}</span>
                    </div>
                </div>
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
        
        document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
        link.classList.add('active');

        const addonGrid = document.getElementById('addon-grid');

        if (filtro === 'all') {
            renderizarCards(addonsData);
        } 
        else if (filtro === 'Comunidad') {
            addonGrid.innerHTML = `
                <div style="padding:40px; text-align:center; width:100%;">
                    <i class="fab fa-whatsapp" style="font-size:3rem; color:#2ecc71; margin-bottom:20px;"></i>
                    <h2>Canal de WhatsApp</h2>
                    <p style="color:#bbb; margin-top:10px;">¡Únete para recibir noticias al instante!</p>
                    <a href="https://whatsapp.com/channel/0029Vb6MoFQ0gcfCKJhYNU33/526" target="_blank" class="btn-download" style="display:inline-block; margin-top:20px; width:220px; text-decoration:none;">Unirse al Canal</a>
                </div>
                
                <div style="padding:40px; text-align:center; width:100%;">
                    <i class="fab fa-discord" style="font-size:3rem; color:#5865F2; margin-bottom:20px;"></i>
                    <h2>Servidor de Discord</h2>
                    <p style="color:#bbb; margin-top:10px;">Comunidad activa, soporte y addons exclusivos.</p>
                    <a href="https://discord.gg/Tp9hpGkMzz" target="_blank" class="btn-download" style="display:inline-block; margin-top:20px; width:220px; text-decoration:none; background:#5865F2;">Entrar al Discord</a>
                </div>
                `;
        } 
        else if (filtro === 'Politicas') {
            addonGrid.innerHTML = `
                <div style="padding:40px; width:100%; color:#fff;">
                    <h2 style="color:#2ecc71; margin-bottom:20px;">Políticas de Privacidad</h2>
                    <p style="margin-bottom:15px; color:#bbb;">• <b>Contenido:</b> Todo el material compartido es propiedad de sus creadores originales.</p>
                    <p style="margin-bottom:15px; color:#bbb;">• <b>Datos:</b> MineAddon no recopila información personal de ningún tipo.</p>
                    <p style="margin-bottom:15px; color:#bbb;">• <b>Uso:</b> Esta herramienta es exclusivamente para facilitar el acceso a contenido de Minecraft.</p>
                </div>`;
        } 
        else {
            const filtrados = addonsData.filter(item => {
                const cat = (Object.values(item)[4] || "").toLowerCase();
                return cat.includes(filtro.toLowerCase());
            });
            renderizarCards(filtrados);
        }
    });
});

document.addEventListener('DOMContentLoaded', cargarAddons);
