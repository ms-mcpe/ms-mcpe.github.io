const sheetId = '1VVO_fKNZqPdeCDagWF8s7clq7uMZfCY3-HDTksAmNnw'; 
const sheetName = 'FROM App MC Addons'; 
const url = `https://opensheet.elk.sh/${sheetId}/${sheetName}`;

async function cargarAddons() {
    const addonGrid = document.getElementById('addon-grid');
    
    try {
        const response = await fetch(url);
        let data = await response.json();

        // Si el formulario añade una fila extra de "Form_Responses", la API suele detectarla.
        // Filtramos cualquier fila que no tenga un nombre real para evitar errores.
        const itemsValidos = data.filter(item => item.name || item.Name);

        // Ordenar por Marca temporal (Más reciente primero)
        itemsValidos.sort((a, b) => {
            return new Date(b["Marca temporal"]) - new Date(a["Marca temporal"]);
        });

        addonGrid.innerHTML = '';

        itemsValidos.forEach(item => {
            // Acceso directo según tus columnas de la imagen
            const nombre = item.name;
            const descarga = item.Urldws;
            const imagen = item.Urlimg;
            const categoria = item.category;

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
        console.error("Error:", error);
        addonGrid.innerHTML = '<p style="color:white; text-align:center;">Error al conectar con el formulario.</p>';
    }
}

document.addEventListener('DOMContentLoaded', cargarAddons);
