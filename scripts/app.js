// Configuración de tu Google Sheets
const sheetId = '1VVO_fKNZqPdeCDagWF8s7clq7uMZfCY3-HDTksAmNnw'; 
const sheetName = 'FROM App MC Addons'; 
const url = `https://opensheet.elk.sh/${sheetId}/${sheetName}`;

async function cargarAddons() {
    const addonGrid = document.getElementById('addon-grid');
    
    try {
        const response = await fetch(url);
        let data = await response.json();

        // LÓGICA DE ORDENAMIENTO:
        // Ordenamos los datos basándonos en la "Marca temporal"
        // Convertimos la fecha a un objeto Date para comparar.
        data.sort((a, b) => {
            return new Date(b["Marca temporal"]) - new Date(a["Marca temporal"]);
        });

        // Limpiar el contenedor
        addonGrid.innerHTML = '';

        // Generar las tarjetas
        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'addon-card';
            
            card.innerHTML = `
                <div class="card-image" style="background-image: url('${item.Urlimg}'); background-size: cover; background-position: center;">
                    <span class="category-tag">${item.category}</span>
                </div>
                <div class="card-info">
                    <h3>${item.name}</h3>
                    <p style="font-size: 0.7rem; color: #666; margin-bottom: 10px;">
                        Publicado: ${item["Marca temporal"]}
                    </p>
                    <a href="${item.Urldws}" target="_blank" class="btn-download">DESCARGAR</a>
                </div>
            `;
            addonGrid.appendChild(card);
        });

    } catch (error) {
        console.error("Error al obtener datos:", error);
        addonGrid.innerHTML = '<p style="color:white; text-align:center;">Error cargando addons...</p>';
    }
}

// Ejecutar al cargar la web
document.addEventListener('DOMContentLoaded', cargarAddons);
