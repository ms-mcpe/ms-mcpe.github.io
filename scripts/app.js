// app.js - cada complemento es un box independiente: thumb, nombre, descargar

/* ===== Data box (extensible) ===== */
const dataBox = (function(){
  const items = [
    { nombre: "Rise Of Horror", formato: ".mcaddon", urlDws: "https://linkyshare.com/es/@MystStart/descarga-rise-of-horror-para-minecraft", urlImg: "https://linkyshare.com/storage/posts/thumbnails/hq6zhGBhq30RSXyedIxTa74YFxnsFm9Np286qsTx.jpg" },
    { nombre: "Redstone", formato: ".mcaddon", urlDws: "https://linkyshare.com/es/@MystStart/descarga-redstone-para-minecraft-pe", urlImg: "https://linkyshare.com/storage/posts/thumbnails/sBEfuQTNZDDxeJ8anct1Rc9LKkY8o2XNwAKugVeL.jpg" },
    { nombre: "DragonBall Z", formato: ".mcaddon", urlDws: "https://linkyshare.com/es/@MystStart/descarga-dragonball-z-para-minecraft-pe", urlImg: "https://linkyshare.com/storage/posts/thumbnails/vP4BBovyUNY7X9EBrMamyj4HteX8MLO8cGgksJuO.jpg" }
  ];
  return { all: () => items.slice(), add: it => items.push(it) };
})();

/* ===== Renderer minimalista (un box por item) ===== */
const renderBox = (function(){
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');

  function makeCard(item){
    const article = document.createElement('article');
    article.className = 'card';
    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    thumb.style.backgroundImage = `url('${escapeHtml(item.urlImg)}')`;
    const body = document.createElement('div');
    body.className = 'card-body';
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = item.nombre;
    const actions = document.createElement('div');
    actions.className = 'actions';
    const btn = document.createElement('a');
    btn.className = 'btn primary';
    btn.setAttribute('href', item.urlDws);
    btn.setAttribute('target', '_blank');
    btn.setAttribute('rel', 'noopener noreferrer');
    btn.textContent = 'Descargar';
    actions.appendChild(btn);
    body.appendChild(title);
    body.appendChild(actions);
    article.appendChild(thumb);
    article.appendChild(body);
    return article;
  }

  function show(items){
    grid.innerHTML = '';
    if(!items || items.length === 0){ empty.style.display = 'block'; return; }
    empty.style.display = 'none';
    const frag = document.createDocumentFragment();
    items.forEach(it => frag.appendChild(makeCard(it)));
    grid.appendChild(frag);
  }

  return { show };
})();

/* ===== Buscador: filtra y muestra ===== */
const searchBox = (function(){
  const input = document.getElementById('search');
  const clearBtn = document.getElementById('clear');
  function norm(s){ return s.trim().toLowerCase(); }
  function filter(q){
    if(!q) return dataBox.all();
    const qq = norm(q);
    return dataBox.all().filter(it => {
      const name = norm(it.nombre);
      if(name.startsWith(qq)) return true;
      const initials = name.split(/\s+/).map(w => w[0]).join('');
      if(initials.startsWith(qq)) return true;
      return name.split(/\s+/).some(w => w.startsWith(qq));
    });
  }
  function attach(onChange){
    input.addEventListener('input', () => onChange(filter(input.value)));
    clearBtn.addEventListener('click', () => { input.value = ''; input.dispatchEvent(new Event('input')); input.focus(); });
  }
  return { attach };
})();

/* ===== Utils ===== */
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

/* ===== Init ===== */
(function init(){
  renderBox.show(dataBox.all());
  searchBox.attach(filtered => renderBox.show(filtered));
})();