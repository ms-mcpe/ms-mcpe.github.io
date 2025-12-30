const sheetId = '1VVO_fKNZqPdeCDagWF8s7clq7uMZfCY3-HDTksAmNnw'; 
const sheetName = 'FROM App MC Addons'; 
const url = `https://opensheet.elk.sh/${sheetId}/${sheetName}`;

async function cargarAddons() {
    const addonGrid = document.getElementById('addon-grid');
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        // 1. DEPUREMOS: Mira la consola de tu navegador (F12) para ver esto
        console.log("Datos crudos recibidos:", data);

        addonGrid.innerHTML = '';

        data.forEach((item) => {
            // Obtenemos todos los valores de la fila como un arreglo simple
            const valores = Object.values(item);
            
            // Según tu imagen, el orden en el arreglo 'valores' debería ser:
            // [0] Marca temporal, [1] name, [2] Urldws, [3] Urlimg, [4] category
            
            const nombre = valores[1] || "Sin nombre";
            const descarga = valores[2] || "#";
            const imagen = valores[3] || "";
            const categoria = valores[4] || "General";

            // Saltamos la fila si es el encabezado o si el nombre está vacío
            if (nombre.toLowerCase() === 'name' || nombre === "Sin nombre") return;

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

    } catch (error) {
        console.error("Error cargando la hoja:", error);
        addonGrid.innerHTML = '<p style="color:white; text-align:center;">Error de conexión con la base de datos.</p>';
    }
}

document.addEventListener('DOMContentLoaded', cargarAddons);
