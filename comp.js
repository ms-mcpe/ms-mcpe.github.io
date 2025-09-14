document.addEventListener('DOMContentLoaded', () => {

    // Array de objetos con la información de los archivos
    const files = [
    
    [
{"name":"Actions And Stuff 1.5.1","preview":"https://linkyshare.com/storage/posts/thumbnails/aDxUfWQX0AnfsgHCGlYyusxYSY1zaCaEBiJay3aN.jpg","downloadLink":"https://linkyshare.com/es/@MystStart/descarga-actions-stuff-para-minecraft","date":"13/09/2025","formato":".mcpack"},
{"name":"Alien Apocalypse Add-On ","preview":"https://linkyshare.com/storage/posts/thumbnails/SEyNtY1NmcHHRHb1g8bJOlxdPgxVqeLGlINl2mzn.jpg","downloadLink":"https://linkyshare.com/es/@MystStart/descarga-alien-apocalypse-add-on-para-minecraft","date":"13/09/2025","formato":".mcaddon"},
{"name":"Biome Wardenss","preview":"https://linkyshare.com/storage/posts/thumbnails/FP7t9sBr5rlImW17y3LQxiK3Z1zAqyKlA7Q2lFSL.png","downloadLink":"https://linkyshare.com/es/@MystStart/descarga-biome-wardens-para-minecraft","date":"13/09/2025","formato":".mcaddon"},
{"name":"Bones x Stuff v2.5.4","preview":"https://linkyshare.com/storage/posts/thumbnails/CQ9oUBA6ry17VSucuzcCjeBHUObtGZptYvGS4gT1.jpg","downloadLink":"https://linkyshare.com/es/@MystStart/descarga-barebones-stuff-para-minecraft","date":"13/09/2025","formato":".mcpack"},
{"name":"Craftable Dungeons 🍷","preview":"https://linkyshare.com/storage/posts/thumbnails/qZonFG8aLZ0daWJppd6344dJfmwTJ8b6OOgKQAeA.jpg","downloadLink":"https://linkyshare.com/es/@MystStart/descarga-craftable-dungeons-para-minecraft","date":"13/09/2025","formato":".mcaddon"},
{"name":"DWELLERS v2.1 Add-On","preview":"https://linkyshare.com/storage/posts/thumbnails/0dojrOs4R8hLztm8iJnt80O8nKDYj48iX5MPVSCd.jpg","downloadLink":"https://linkyshare.com/es/@MystStart/descarga-dwellers-para-minecraft-pe","date":"13/09/2025","formato":".mcaddon"},
{"name":"Economy","preview":"https://linkyshare.com/storage/posts/thumbnails/IbgDQ0IwIHIWyM9ykcr1izTvPs46wHaLU7vsgTyf.jpg","downloadLink":"https://linkyshare.com/es/@MystStart/descarga-economy-add-on-para-minecraft","date":"13/09/2025","formato":".mcaddon"},
{"name":"Lunac Shaders 2.1.1","preview":"https://linkyshare.com/storage/posts/thumbnails/EaDNulwh1y0UhE6EbMvXpAHXstK9J1cP031cnOsc.jpg","downloadLink":"https://linkyshare.com/es/@MystStart/descarga-lunac-shaders-para-minecraft","date":"13/09/2025","formato":".mcpack"},
{"name":"Lunar Moon Add-On","preview":"https://linkyshare.com/storage/posts/thumbnails/oInMfDxy5Xt6yfkffGqVC4PESnfqRcYqx5ttJhGL.jpg","downloadLink":"https://linkyshare.com/es/@MystStart/descarga-lunar-moon-add-on-para-minecraft","date":"13/09/2025","formato":".mcaddon"},
{"name":"Madness Legends (skin_pack)","preview":"https://linkyshare.com/storage/posts/thumbnails/EaYSrirDzbiNPzpJSqFQ19bH5PkkNsgRh2ZA1pRi.jpg","downloadLink":"https://linkyshare.com/es/@MystStart/descarga-madness-legends-para-minecraft","date":"13/09/2025","formato":".mcpack"},
{"name":"More Crops Add-On","preview":"https://linkyshare.com/storage/posts/thumbnails/vvvSWcgBf9Ca7kxU3U34wnopFKCLdQxot8zCW7y0.jpg","downloadLink":"https://linkyshare.com/es/@MystStart/descarga-more-crops-add-on-para-minecraft","date":"13/09/2025","formato":".mcaddon"},
{"name":"One Blocks Civilization","preview":"https://linkyshare.com/storage/posts/thumbnails/4T32xbiMkcS0lsZOVYT2KauNnacLODpzWfVSnIgE.jpg","downloadLink":"https://linkyshare.com/es/@MystStart/descarga-one-block-civilization-para-minecraft","date":"13/09/2025","formato":".mctemplate"},
{"name":"RealismCraft v2.0","preview":"https://linkyshare.com/storage/posts/thumbnails/OhoB4ms0no18PC35lAGr9k6PM8OGdxVBY40j2bT5.jpg","downloadLink":"https://linkyshare.com/es/@MystStart/descarga-realismcraft-para-minecraft-pe","date":"13/09/2025","formato":".mcaddon"},
{"name":"Savage Crew (skin_pack)","preview":"https://linkyshare.com/storage/posts/thumbnails/NzwTzROVWke4onEdCeppx87D5sdSzHHrDrzRBCLZ.jpg","downloadLink":"https://linkyshare.com/es/@MystStart/descarga-savage-crew-para-minecraft","date":"13/09/2025","formato":".mcpack"},
{"name":"Soulfire Fists (skin_pack)","preview":"https://linkyshare.com/storage/posts/thumbnails/cNFXA2OHMXTjZjTSYu8UYhiK4ETehQhuiUpcahqj.jpg","downloadLink":"https://linkyshare.com/es/@MystStart/descarga-soulfire-fists-para-minecraft","date":"13/09/2025","formato":".mcpack"},
{"name":"Spider-Man Add-on","preview":"https://linkyshare.com/storage/posts/thumbnails/Gxb5yjKJfthixhX486M7wg0midzGjctPVRPi2QeC.jpg","downloadLink":"https://linkyshare.com/es/@MystStart/descarga-mr-nidos-spider-man-minecraft","date":"13/09/2025","formato":".mcaddon"},
{"name":"Sword Art HD (skin_pack)","preview":"https://linkyshare.com/storage/posts/thumbnails/kEemWi9ggqRPDcFUb0yxRAfbfkc6okGXxvGwuPwI.jpg","downloadLink":"https://linkyshare.com/es/@MystStart/descarga-sword-art-hd-para-minecraft","date":"13/09/2025","formato":".mcpack"}
]
    
    ];

    const container = document.getElementById('file-list-container');
    const modal = document.getElementById('preview-modal');
    const previewImage = document.getElementById('preview-image');
    const downloadBtn = document.getElementById('download-btn');
    const closeBtn = document.querySelector('.close-btn');
    const searchInput = document.getElementById('search-input');
    const menuButton = document.getElementById('menu-button');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const menuOptions = document.querySelectorAll('.menu-option');
    const mainTitle = document.getElementById('main-title');
    
    let currentFiles = [];

    // Función para generar dinámicamente los elementos de archivo
    function createFiles(fileList) {
        container.innerHTML = '';
        currentFiles = [];
        fileList.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.classList.add('file-item');
            
            const fullFileName = `${file.name}${file.formato}`;

            fileItem.innerHTML = `
                <div class="file-icon">
                    <img src="https://ms-mcpe.github.io/cd/img
/file.png" alt="File icon">
                </div>
                <div class="file-info">
                    <span class="file-name">${fullFileName}</span>
                    <span class="file-date">Última modificación: ${file.date}</span>
                </div>
            `;

            // Asignar el evento click
            fileItem.addEventListener('click', () => {
                previewImage.src = file.preview;
                downloadBtn.href = file.downloadLink;
                downloadBtn.setAttribute('download', fullFileName);
                modal.style.display = 'flex';
            });

            container.appendChild(fileItem);
            currentFiles.push(fileItem);
        });
    }

    // Función para filtrar los archivos según la entrada de búsqueda
    function filterFiles() {
        const query = searchInput.value.toLowerCase();
        currentFiles.forEach(item => {
            const fileName = item.querySelector('.file-name').textContent.toLowerCase();
            if (fileName.includes(query)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // Función para filtrar y renderizar archivos según el formato
    function filterAndRenderFiles(format) {
        let filteredList = files;
        if (format !== 'all') {
            filteredList = files.filter(file => file.formato === format);
            mainTitle.textContent = `Archivos ${format}`;
        } else {
            mainTitle.textContent = `Archivos de Addons`;
        }
        createFiles(filteredList);
        searchInput.value = ''; // Limpiar el buscador
        dropdownMenu.classList.remove('visible');
    }

    // Llamada inicial para renderizar todos los archivos
    filterAndRenderFiles('all');

    // Agregar un event listener al input de búsqueda
    searchInput.addEventListener('input', filterFiles);

    // Toggle del menú de 3 puntos
    menuButton.addEventListener('click', () => {
        dropdownMenu.classList.toggle('visible');
    });

    // Event listener para las opciones del menú
    menuOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            const format = e.target.getAttribute('data-format');
            filterAndRenderFiles(format);
        });
    });

    // Cerrar el modal al hacer clic en el botón de cierre
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Cerrar el modal al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});
