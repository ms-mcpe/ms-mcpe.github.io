
        let currentCategory = 'official';

        // Datos de ejemplo para las diferentes categorías
        const contentData = [
       

{
  name: "Minecraft 1.21.101",
  category: "official",
  Image: "https://linkyshare.com/storage/posts/thumbnails/6DJCkTGG4fb3Y7j0JFdy8pba07Zr0EhDG7ht78fz.jpg",
  link: "https://sites.google.com/view/mcproyect/minecraft/1-21-101"
}
     
   ];

        // Función para renderizar el contenido según la categoría y el término de búsqueda
        function renderContent(category, searchTerm = '') {
            currentCategory = category;
            const contentArea = document.getElementById('content-area');
            contentArea.innerHTML = ''; // Limpia el contenido anterior

            let filteredData = contentData.filter(item => item.category === category);

            // Filtra por término de búsqueda si existe
            if (searchTerm) {
                const lowerCaseSearchTerm = searchTerm.toLowerCase();
                filteredData = filteredData.filter(item => 
                    item.name.toLowerCase().startsWith(lowerCaseSearchTerm)
                );
            }

            if (filteredData.length === 0) {
                contentArea.innerHTML = '<p>No hay contenido disponible para esta categoría.</p>';
                return;
            }

            filteredData.forEach(item => {
                const box = document.createElement('div');
                box.className = 'content-box';

                const title = document.createElement('h3');
                title.textContent = item.name;

                const image = document.createElement('img');
                image.src = item.image;
                image.alt = item.name;

                const link = document.createElement('a');
                link.href = item.link;
                link.textContent = 'Descargar';
                link.className = 'download-link';

                box.appendChild(title);
                box.appendChild(image);
                box.appendChild(link);
                contentArea.appendChild(box);
            });
        }

        // Función que maneja la búsqueda al escribir
        function handleSearch() {
            const searchTerm = document.getElementById('search-box').value;
            renderContent(currentCategory, searchTerm);
        }

        // Renderiza el contenido oficial por defecto al cargar la página
        window.onload = function() {
            renderContent('official');
        }

  
