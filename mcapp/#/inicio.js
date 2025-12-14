 // Datos de ejemplo
    const addons = [
      {
        "nombre": "Super Espadas",
        "descripcion": "Este addon agrega espadas mágicas con poderes únicos que te permiten derrotar enemigos fácilmente. Cada espada tiene habilidades especiales como fuego, hielo, rayos y más. Además incluye un sistema de mejora para hacerlas aún más poderosas.",
        "imagen": "addons-img/super-espadas.png",
        "fecha": "2025-12-10",
        "subidopor": "Myst"
      },
      {
        "nombre": "Animales Extra",
        "descripcion": "Añade nuevos animales al mundo de Minecraft, incluyendo tigres, osos y aves exóticas.",
        "imagen": "addons-img/animales-extra.png",
        "fecha": "2025-12-12",
        "subidopor": "Myst"
      }
    ];

    const container = document.getElementById('addons');

    function renderAddons(list){
      container.innerHTML = "";
      list.forEach(addon=>{
        const card = document.createElement('div');
        card.className = "addon-card";

        const img = document.createElement('img');
        img.src = addon.imagen;
        img.alt = addon.nombre;

        const title = document.createElement('h2');
        title.textContent = addon.nombre;

        const desc = document.createElement('p');
        const fullText = addon.descripcion;
        if(fullText.length > 120){
          desc.textContent = fullText.substring(0,120)+"...";
          const leerMas = document.createElement('span');
          leerMas.className = "leer-mas";
          leerMas.textContent = "Leer más";
          leerMas.onclick = ()=>{
            if(desc.textContent.endsWith("...")){
              desc.textContent = fullText;
              leerMas.textContent = "Leer menos";
            } else {
              desc.textContent = fullText.substring(0,120)+"...";
              leerMas.textContent = "Leer más";
            }
          };
          card.appendChild(desc);
          card.appendChild(leerMas);
        } else {
          desc.textContent = fullText;
          card.appendChild(desc);
        }

        const meta = document.createElement('div');
        meta.className = "meta";
        meta.textContent = `Subido por ${addon.subidopor} · ${addon.fecha}`;

        card.appendChild(img);
        card.appendChild(title);
        card.appendChild(meta);

        container.appendChild(card);
      });
    }

    renderAddons(addons);

    // Buscador
    document.getElementById('search').addEventListener('input', e=>{
      const term = e.target.value.toLowerCase();
      const filtered = addons.filter(a=>a.nombre.toLowerCase().includes(term));
      renderAddons(filtered);
    });
