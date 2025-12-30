// Base de datos de Addons
const addons = [
    {
        name: "Dragon Mounts v3",
        Urldws: "#",
        Urlimg: "https://mcpedl.com/wp-content/uploads/2020/08/dragon-mounts-2-v1-0-0-1_1.png",
        category: "Addon"
    },
    {
        name: "OSBES Shader",
        Urldws: "#",
        Urlimg: "https://mcpedl.com/wp-content/uploads/2020/02/osbes-shader_1.png",
        category: "Shaders"
    },
    {
        name: "Medieval Texture Pack",
        Urldws: "#",
        Urlimg: "https://resourcepack.net/fl/conquest-resource-pack.jpg",
        category: "Textura"
    },
    {
        name: "Hero Skins Pro",
        Urldws: "#",
        Urlimg: "https://mcpedl.com/wp-content/uploads/2023/04/skin-pack-thumbnail.png",
        category: "Skins"
    }
];

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('addon-grid');
    const search = document.getElementById('addon-search');
    const countBadge = id => document.getElementById(id);
    const sidebar = document.getElementById('sidebar');
    const main = document.querySelector('.main-content');
    const toggleBtn = document.getElementById('toggle-btn');

    // 1. Función para mostrar los addons
    function displayAddons(data) {
        grid.innerHTML = '';
        data.forEach(item => {
            const card = `
                <div class="addon-card">
                    <div class="card-image" style="background-image: url('${item.Urlimg}')">
                        <span class="category-tag">${item.category}</span>
                    </div>
                    <div class="card-info">
                        <h3>${item.name}</h3>
                        <p>Mejora tu experiencia de juego con este contenido increíble.</p>
                        <a href="${item.Urldws}" class="btn-download">DESCARGAR</a>
                    </div>
                </div>
            `;
            grid.innerHTML += card;
        });
        countBadge('addon-count').innerText = `${data.length} items encontrados`;
    }

    // Inicializar
    displayAddons(addons);

    // 2. Buscador en tiempo real
    search.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = addons.filter(a => 
            a.name.toLowerCase().includes(query) || 
            a.category.toLowerCase().includes(query)
        );
        displayAddons(filtered);
    });

    // 3. Filtros del menú lateral
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Estética de botones activos
            document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
            link.classList.add('active');

            const category = link.getAttribute('data-filter');
            document.getElementById('current-category').innerText = category === 'all' ? 'Todos los Addons' : category;

            if(category === 'all') {
                displayAddons(addons);
            } else {
                const filtered = addons.filter(a => a.category === category);
                displayAddons(filtered);
            }
        });
    });

    // 4. Toggle Sidebar (Colapsar)
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        main.classList.toggle('expanded');
    });
});
