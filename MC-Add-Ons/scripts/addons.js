  
    const ADDONS = [
      
    ];

    const grid = document.getElementById('addonsGrid');
    const input = document.getElementById('search');

    function createAddonBox(item) {
      const box = document.createElement('div');
      box.className = 'addon-box';
      box.dataset.title = item.nombre;

      const img = document.createElement('img');
      img.className = 'addon-img';
      img.loading = 'lazy';
      img.src = item.urlImg;
      img.alt = item.nombre;
      img.onerror = () => {
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450">
             <rect width="100%" height="100%" fill="#0d0f13"/>
             <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
                   fill="#889" font-size="20" font-family="Segoe UI, Roboto, Arial">
               Imagen no disponible
             </text>
           </svg>`
        );
      };

      const title = document.createElement('h3');
      title.className = 'addon-title';
      title.textContent = item.nombre;

      const btn = document.createElement('a');
      btn.className = 'download-btn';
      btn.href = item.urlDws;
      btn.target = '_blank';
      btn.rel = 'noopener';
      btn.textContent = 'Descargar';

      box.appendChild(img);
      box.appendChild(title);
      box.appendChild(btn);
      return box;
    }

    function render(list) {
      grid.innerHTML = '';
      list.forEach(item => grid.appendChild(createAddonBox(item)));
    }

    function filterByPrefix(raw) {
      const prefix = (raw || '').trim().toLowerCase();
      if (!prefix) { render(ADDONS); return; }
      const filtered = ADDONS.filter(a => a.nombre.toLowerCase().startsWith(prefix));
      render(filtered);
    }

    // Inicial
    render(ADDONS);
    input.addEventListener('input', (e) => filterByPrefix(e.target.value));
  
