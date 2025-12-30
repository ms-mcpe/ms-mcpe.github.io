const sheetId = '1VVO_fKNZqPdeCDagWF8s7clq7uMZfCY3-HDTksAmNnw'; 
const sheetName = 'FROM App MC Addons'; 
const url = `https://opensheet.elk.sh/${sheetId}/${sheetName}`;

async function cargarAddons() {
    const addonGrid = document.getElementById('addon-grid');
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("No se pudo obtener la información");
        
        const data = await response.json();

        // 1. Ordenar por Marca temporal (Más reciente primero)
        data.sort((a, b) => {
            const fechaA = new Date(a["Marca temporal"] || 0);
            const fechaB = new Date(b["Marca temporal"] || 0);
            return fechaB - fechaA;
        });

        addonGrid.innerHTML = '';

        // 2. Renderizar los datos
        data.forEach(item => {
            // Buscamos los datos incluso si hay variaciones en los nombres de columna
            const nombre = item.name || item.Name || item.NOMBRE || "Sin nombre";
            const descarga = item.Urldws || item.URLDWS || item.Descarga || "#";
            const imagen = item.Urlimg || item.URLIMG || item.Imagen || "https://via.placeholder.com/300x160?text=No+Image";
            const categoria = item.category || item.Category || item.Categoría || "General";

            const card = document.createElement('div');
            card.className = 'addon-card';
            
            card.innerHTML = `
                <div class="card-image" style="background-image: url('${imagen}'); background-size: cover; background-position: center;">
                    <span class="category-tag">${categoria}</span>
                </div>
                <div class="card-info">
                    <h3>${nombre}</h3>
                    <a href="${descarga}" target="_blank" class="btn-download">DESCARGAR</a>
                </div>
            `;
            addonGrid.appendChild(card);
        });

    } catch (error) {
        console.error("Error detallado:", error);
        addonGrid.innerHTML = `<p style="color:white; text-align:center; padding: 20px;">
            Error al conectar con la hoja: ${sheetName}. <br>
            Asegúrate de que la hoja sea pública (Cualquier persona con el enlace).
        </p>`;
    }
}

document.addEventListener('DOMContentLoaded', cargarAddons);
