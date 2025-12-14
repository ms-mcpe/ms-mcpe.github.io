 // Datos de ejemplo
    const addons = [
     {
  "199922573914231@lid": [
    {
      "nombre": "Minecraft 1.21.130.03",
      "descripcion": "*   *Monturas del Caos:* Una nueva entrega que trae desafÃ­os y estrategias renovadas.*   *Mejoras en Monturas:* Caballos, Caballos Zombis, Burros, Mulas y Camellos ya no se hunden en el agua mientras se les monta. Se ha aÃ±adido la *Armadura de Caballo de Netherita*.*   *Nautilus y Nautilus Zombi:* Nuevas criaturas acuÃ¡ticas neutrales que se pueden domesticar, montar con silla de montar y equipar con armadura. Tienen una habilidad de \"Embestida\" y otorgan el efecto \"Aliento del Nautilus\". El Nautilus Zombi aparece con un Jinete Ahogado.*   *Lanza (Spear):* Nueva arma escalonada con ataques de \"Estocada\" y \"Carga\", que ofrece mayor alcance y el encantamiento \"Estocada\" (Lunge).*   *Nuevos Mobs:*    *   *Parched (Sediento):* Una nueva variante de Esqueleto que aparece en desiertos, no se quema con la luz solar y dispara Flechas de Debilidad.    *   *Camel Husk (Momia de Camello):* Una variante no-muerta de Camello que aparece en desiertos con un jinete Momia (Husk) y un Parched.*   *Guardados de Realms (Realms Saves):* Nuevo sistema de copias de seguridad con opciones automÃ¡ticas y manuales, incluyendo almacenamiento en la nube para las guardadas manuales.*ðŸ› ï¸ Correcciones y Mejoras:*La actualizaciÃ³n incluye numerosas correcciones de errores y mejoras en categorÃ­as como Audio, Bloques, Creador de Personajes, Jugabilidad, GrÃ¡ficos, Entrada, Mobs, Estabilidad e Interfaz de Usuario.*âš™ï¸ Actualizaciones TÃ©cnicas:*Se detallan cambios extensos para desarrolladores, incluyendo nuevas metas de IA, lanzamientos y actualizaciones de API, adiciones de consultas Molang y modificaciones en protocolos y componentes de red.*link :* https://cuty.io/CxGI0Z1JG",
      "imagen": "minecraft-1.21.130.03.jpg",
      "subidoPor": "Myst Start",
      "fecha": "2025-12-10"
    },
    {
      "nombre": "Storage++",
      "descripcion": "link: https://linkyshare.com/es/@MystStart/complemento-de-minecraft-bedrock-storage",
      "imagen": "storage.jpg",
      "subidoPor": "Myst Start",
      "fecha": "2025-12-14"
    },
    {
      "nombre": "Pirate Era",
      "descripcion": "link: https://linkyshare.com/es/@MystStart/complemento-para-minecraft-bedrock-pirates",
      "imagen": "pirate-era.jpg",
      "subidoPor": "Myst Start",
      "fecha": "2025-12-14"
    },
    {
      "nombre": "Trains Add",
      "descripcion": "On-\nlink: https://linkyshare.com/es/@MystStart/complemento-para-minecraft-bedrock-trains-add-on",
      "imagen": "trains-add.jpg",
      "subidoPor": "Myst Start",
      "fecha": "2025-12-14"
    },
    {
      "nombre": "Builders Wands",
      "descripcion": "link: https://linkyshare.com/es/@MystStart/complemento-para-minecraft-bedrock-builders-wands",
      "imagen": "builders-wands.jpg",
      "subidoPor": "Myst Start",
      "fecha": "2025-12-14"
    },
    {
      "nombre": "One Block The copper Age",
      "descripcion": "link: https://linkyshare.com/es/@MystStart/complemento-para-minecraft-bedrock-one-block",
      "imagen": "one-block-the-copper-age.jpg",
      "subidoPor": "Myst Start",
      "fecha": "2025-12-14"
    },
    {
      "nombre": "World Minimap",
      "descripcion": "link: https://linkyshare.com/es/@MystStart/complemento-para-minecraft-bedrock-minimap",
      "imagen": "world-minimap.jpg",
      "subidoPor": "Myst Start",
      "fecha": "2025-12-14"
    },
    {
      "nombre": "System Dynamic Light",
      "descripcion": "link: https://linkyshare.com/es/@MystStart/complemento-para-minecraf-bedrock-dynamyc-light",
      "imagen": "system-dynamic-light.jpg",
      "subidoPor": "Myst Start",
      "fecha": "2025-12-14"
    }
  ],
  "113353397682421@lid": []
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
