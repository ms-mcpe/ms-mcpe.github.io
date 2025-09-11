 <script>
        document.addEventListener('DOMContentLoaded', () => {

            // Array de objetos con la información de los archivos
            const files = [
                {
                    name: 'MapaAventura',
                    preview: 'https://placehold.co/400x300/1a1a2e/e0e0f0?text=Vista+Previa+del+Mapa',
                    downloadLink: 'https://ejemplo.com/file.mcworld',
                    date: '15 de Mayo de 2024',
                    formato: '.mcworld'
                },
                {
                    name: 'PackTexturasFantasia',
                    preview: 'https://placehold.co/400x300/1a1a2e/e0e0f0?text=Vista+Previa+del+Pack',
                    downloadLink: 'https://ejemplo.com/file.mcpack',
                    date: '10 de Febrero de 2024',
                    formato: '.mcpack'
                },
                {
                    name: 'AddonMagia',
                    preview: 'https://placehold.co/400x300/1a1a2e/e0e0f0?text=Vista+Previa+del+Addon',
                    downloadLink: 'https://ejemplo.com/file.mcaddon',
                    date: '22 de Marzo de 2024',
                    formato: '.mcaddon'
                },
                {
                    name: 'PlantillaSurvival',
                    preview: 'https://placehold.co/400x300/1a1a2e/e0e0f0?text=Vista+Previa+de+la+Plantilla',
                    downloadLink: 'https://ejemplo.com/file.mctemplate',
                    date: '05 de Enero de 2024',
                    formato: '.mctemplate'
                },
                 {
                    name: 'AjustesAvanzados',
                    preview: 'https://placehold.co/400x300/1a1a2e/e0e0f0?text=Vista+Previa+de+Ajustes',
                    downloadLink: 'https://ejemplo.com/file.mcaddon',
                    date: '18 de Febrero de 2024',
                    formato: '.mcaddon'
                }
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
                            <img src="https://placehold.co/400x400/1a1a2e/e0e0f0?text=File" alt="File icon">
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
    </script>
