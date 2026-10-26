// Gera src/integrity.json (sha256 dos arquivos do launcher). O launcher empacotado confere isso ao abrir.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const raiz = path.join(__dirname, '..');
const lista = {};
function andar(rel) {
  const abs = path.join(raiz, rel);
  for (const d of fs.readdirSync(abs, { withFileTypes: true })) {
    const r = path.posix.join(rel, d.name);
    if (d.isDirectory()) andar(r);
    else if (r !== 'src/integrity.json') lista[r] = crypto.createHash('sha256').update(fs.readFileSync(path.join(raiz, r))).digest('hex');
  }
}
andar('src');
lista['config.json'] = crypto.createHash('sha256').update(fs.readFileSync(path.join(raiz, 'config.json'))).digest('hex');
fs.writeFileSync(path.join(raiz, 'src', 'integrity.json'), JSON.stringify(lista, null, 2));
console.log('integrity.json: ' + Object.keys(lista).length + ' arquivos');
