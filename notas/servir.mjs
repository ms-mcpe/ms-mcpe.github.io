/**
 * Servidor local sin dependencias para probar la app y poder instalarla.
 * Uso:  node servir.mjs [puerto]     (por defecto 5173)
 * Luego abre http://localhost:5173 en el navegador.
 *
 * ¿Por qué hace falta un servidor? Los navegadores solo permiten instalar una
 * PWA (agregarla a la pantalla de inicio) cuando la página se sirve desde
 * https:// o desde localhost. Al abrir el archivo con doble clic (file://) la
 * app funciona, pero no se puede instalar.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('.', import.meta.url));
const PUERTO = Number(process.argv[2]) || 5173;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.css': 'text/css; charset=utf-8'
};

createServer(async (peticion, respuesta) => {
  try {
    let ruta = decodeURIComponent(new URL(peticion.url, 'http://localhost').pathname);
    if (ruta === '/' || ruta.endsWith('/')) ruta += 'index.html';

    const destino = normalize(join(RAIZ, ruta));
    if (!destino.startsWith(RAIZ.endsWith(sep) ? RAIZ : RAIZ + sep)) {
      respuesta.writeHead(403).end('Prohibido');
      return;
    }

    const info = await stat(destino);
    if (!info.isFile()) throw new Error('No es un archivo');

    const cuerpo = await readFile(destino);
    respuesta.writeHead(200, {
      'Content-Type': TIPOS[extname(destino).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'Service-Worker-Allowed': '/'
    });
    respuesta.end(cuerpo);
  } catch {
    respuesta.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    respuesta.end('404 - no encontrado');
  }
}).listen(PUERTO, () => {
  console.log(`\n  Mis Notas  ->  http://localhost:${PUERTO}\n`);
  console.log('  Para instalarla en el móvil, publica la carpeta en un hosting https');
  console.log('  (por ejemplo: arrastra la carpeta a https://app.netlify.com/drop)\n');
});