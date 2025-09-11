    <script>
        document.addEventListener('DOMContentLoaded', () => {

            // Array de objetos con la información de los archivos
            const files = [
            
                 {
                    name: 'AjustesAvanzados',
                    preview: 'https://placehold.co/400x300/1a1a2e/e0e0f0?text=Vista+Previa+de+Ajustes',
                    downloadLink: 'https://ejemplo.com/AjustesAvanzados.mc',
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
            const fileElements = []; // To store the created DOM elements

            // Function to get the file extension from the download link
            function getFileExtension(url) {
                return url.split('.').pop();
            }

            // Function to generate dynamically the file elements
            function createFiles() {
                // Filtramos los archivos para mostrar solo los que tienen el formato .mcaddon
             <script src="https://ms-mcpe.github.io/cd/cons/addons.js"></script>
                filteredFiles.forEach(file => {
                    const fileItem = document.createElement('div');
                    fileItem.classList.add('file-item');
                    
                    const fullFileName = `${file.name}${file.formato}`;

                    fileItem.innerHTML = `
                        <div class="file-icon">
                            <!-- Se ha corregido la URL para que no tenga espacios -->
                            <img src="https://ms-mcpe.github.io/cd/img
/file.png" alt="File icon">
                        </div>
                        <div class="file-info">
                            <span class="file-name">${fullFileName}</span>
                            <span class="file-date">Última modificación: ${file.date}</span>
                        </div>
                    `;

                    // Assign the click event
                    fileItem.addEventListener('click', () => {
                        // Updates the modal content
                        previewImage.src = file.preview;
                        downloadBtn.href = file.downloadLink;
                        
                        // Sets the filename for download
                        downloadBtn.setAttribute('download', fullFileName);
                        
                        // Displays the modal
                        modal.style.display = 'flex';
                    });

                    container.appendChild(fileItem);
                    fileElements.push(fileItem); // Stores the element for later filtering
                });
            }

            // Function to filter the files based on search input
            function filterFiles() {
                const query = searchInput.value.toLowerCase();
                fileElements.forEach(item => {
                    const fileName = item.querySelector('.file-name').textContent.toLowerCase();
                    if (fileName.includes(query)) {
                        item.style.display = 'flex'; // Show if it matches
                    } else {
                        item.style.display = 'none'; // Hide if it doesn't
                    }
                });
            }

            // Initial call to create files
            createFiles();

            // Add event listener to the search input
            searchInput.addEventListener('input', filterFiles);

            // Close modal on close button click
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });

            // Close modal on outside click
            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    </script>
