// Descripción: Este archivo contiene la lógica JavaScript para la página.

let currentCategory = 'addons';

// Datos de ejemplo para laas diferentes categorías
const contentData = [
    {
        name: "Addon de Muebles",
        category: "addons",
        image: "https://placehold.co/400x300/10B981/0d0c1d?text=Addon+Muebles",
        link: "#"
    },
    {
        name: "Addon de Armas",
        category: "addons",
        image: "https://placehold.co/400x300/065F46/0d0c1d?text=Addon+Armas",
        link: "#"
    },
    {
        name: "Textura Realista",
        category: "texturas",
        image: "https://placehold.co/400x300/A16207/0d0c1d?text=Textura+Realista",
        link: "#"
    },
    {
        name: "Textura 8x8",
        category: "texturas",
        image: "https://placehold.co/400x300/713F12/0d0c1d?text=Textura+8x8",
        link: "#"
    },
    {
        name: "Mapa de Aventura",
        category: "mapas",
        image: "https://placehold.co/400x300/3B82F6/0d0c1d?text=Mapa+Aventura",
        link: "#"
    },
    {
        name: "Mapa de Parkour",
        category: "mapas",
        image: "https://placehold.co/400x300/1D4ED8/0d0c1d?text=Mapa+Parkour",
        link: "#"
    },
    {
        name: "Shaders V.1",
        category: "shaders",
        image: "https://placehold.co/400x300/8B5CF6/0d0c1d?text=Shaders+V.1",
        link: "#"
    },
    {
        name: "Shaders V.2",
        category: "shaders",
        image: "https://placehold.co/400x300/6D28D9/0d0c1d?text=Shaders+V.2",
        link: "#"
    },
    {
        name: "Skin de Guerrero",
        category: "skins",
        image: "https://placehold.co/400x300/DC2626/0d0c1d?text=Skin+Guerrero",
        link: "#"
    },
    {
        name: "Skin de Mago",
        category: "skins",
        image: "https://placehold.co/400x300/991B1B/0d0c1d?text=Skin+Mago",
        link: "#"
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

// Renderiza el contenido de "Addons" por defecto al cargar la página
window.onload = function() {
    renderContent('addons');
}
