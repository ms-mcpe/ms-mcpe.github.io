const addons = [
    {
        name: "Dragon Mounts v3",
        Urldws: "#",
        Urlimg: "https://mcpedl.com/wp-content/uploads/2020/08/dragon-mounts-2-v1-0-0-1_1.png",
        category: "Addon"
    },
    {
        name: "OSBES Shader HD",
        Urldws: "#",
        Urlimg: "https://mcpedl.com/wp-content/uploads/2020/02/osbes-shader_1.png",
        category: "Shaders"
    },
    {
        name: "Modern City Textures",
        Urldws: "#",
        Urlimg: "https://resourcepack.net/fl/conquest-resource-pack.jpg",
        category: "Textura"
    }
];

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('addon-grid');
    const search = document.getElementById('addon-search');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const toggleBtn = document.getElementById('toggle-btn');
    const countBadge = document.getElementById('addon-count');

    // Función para renderizar
    function displayAddons(data) {
        grid.innerHTML = data.map(item => `
            <div class="addon-card">
                <div class="card-image" style="background-image: url('${item.Urlimg}')">
                    <span class="category-tag">${item.category}</span>
                </div>
                <div class="card-info">
                    <h3>${item.name}</h3>
                    <p>Contenido profesional para Minecraft Bedrock/Java.</p>
                    <a href="${item.Urldws}" class="btn-download">DESCARGAR</a>
                </div>
            </div>
        `).join('');
        countBadge.innerText = `${data.length} items`;
    }

    displayAddons(addons);

    // LÓGICA DEL MENÚ (Activar/Desactivar)
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.add('active');
        overlay.classList.add('show');
    });

    // Cerrar al hacer clic fuera del menú
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('show');
    });

    // Filtros y Buscador
    search.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = addons.filter(a => a.name.toLowerCase().includes(query));
        displayAddons(filtered);
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            const cat = link.getAttribute('data-filter');
            // Cerrar menú al elegir categoría (especialmente en móvil)
            sidebar.classList.remove('active');
            overlay.classList.remove('show');
            
            document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
            link.classList.add('active');

            if(cat === 'all') displayAddons(addons);
            else displayAddons(addons.filter(a => a.category === cat));
        });
    });
});
