const sheetId = '1VVO_fKNZqPdeCDagWF8s7clq7uMZfCY3-HDTksAmNnw'; 
const sheetName = 'FROM App MC Addons'; 
const url = `https://opensheet.elk.sh/${sheetId}/${sheetName}`;

async function cargarAddons() {
    const addonGrid = document.getElementById('addon-grid');
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        // Limpiamos el grid
        addonGrid.innerHTML = '';

        // Google Forms a veces envía la primera fila como basura
        // Usamos Object.values para obtener los datos sin importar el nombre de la columna
        data.forEach((row, index) => {
            const columnas = Object.values(row);

            // SEGÚN TU IMAGEN:
            // columnas[0] = Marca temporal
            // columnas[1] = name
            // columnas[2] = Urldws
            // columnas[3] = Urlimg
            // columnas[4] = category

            const nombre = columnas[1];
            const descarga = columnas[2];
            const imagen = columnas[3];
            const categoria = columnas[4];

            // Solo creamos la tarjeta si el nombre no es igual al encabezado
            if (nombre && nombre !== 'name' && nombre !== 'Sin nombre') {
                const card = document.createElement('div');
                card.className = 'addon-card';
                
                card.innerHTML = `
                    <div class="card-image" style="background-image: url('${imagen}'); background-size: cover; background-position: center;">
                        <span class="category-tag">${categoria || 'Add-on'}</span>
                    </div>
                    <div class="card-info">
                        <h3>${nombre}</h3>
                        <a href="${descarga}" target="_blank" class="btn-download">DESCARGAR</a>
                    </div>
                `;
                addonGrid.appendChild(card);
            }
        });

        // Ordenar visualmente (opcional, ya que los forms suelen ir en orden)
        // Si necesitas que el último sea el primero, podrías usar: 
        // addonGrid.style.display = 'flex'; addonGrid.style.flexDirection = 'column-reverse';

    } catch (error) {
        console.error("Error crítico:", error);
        addonGrid.innerHTML = '<p style="color:white; text-align:center;">Error al procesar los datos de la hoja.</p>';
    }
}

document.addEventListener('DOMContentLoaded', cargarAddons);
