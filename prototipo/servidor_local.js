// Servidor local para abrir el panel por http://localhost:8080.
// Motivo: los navegadores solo entregan getUserMedia (camara del equipo) en
// contextos seguros (https:// o http://localhost). Abriendo el archivo con
// file:// no hay camara nativa.
// Uso: node servidor_local.js [puerto]
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = __dirname;
const PORT = parseInt(process.argv[2] || '8080', 10);
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8'
};

http.createServer(function (req, res) {
  try {
    const u = decodeURIComponent(req.url.split('?')[0]);
    let file = path.normalize(path.join(ROOT, u === '/' ? '/index.html' : u));
    if (file.indexOf(ROOT) !== 0) { res.writeHead(403); return res.end('403'); }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { file = path.join(ROOT, 'index.html'); }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    });
    fs.createReadStream(file).pipe(res);
  } catch (e) { res.writeHead(500); res.end('500'); }
}).listen(PORT, function () {
  console.log('Panel listo: http://localhost:' + PORT + '/web.html  (Ctrl+C para cerrar)');
});
