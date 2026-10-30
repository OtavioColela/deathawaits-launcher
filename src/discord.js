// Rich Presence do Discord (sem dependencias): fala com o Discord aberto no PC pelo "pipe" local dele.
// Protocolo: cada mensagem = [op int32 LE][tamanho int32 LE][JSON]. op 0 = handshake, op 1 = comando.
const net = require('net');
const crypto = require('crypto');

class DiscordRPC {
  constructor(clientId) {
    this.clientId = clientId;
    this.sock = null;
    this.pronto = false;
    this.atividade = null; // ultima atividade pedida (reenviada ao reconectar)
    this.buf = Buffer.alloc(0);
  }

  _caminho(i) {
    if (process.platform === 'win32') return `\\\\?\\pipe\\discord-ipc-${i}`;
    const dir = process.env.XDG_RUNTIME_DIR || process.env.TMPDIR || process.env.TMP || process.env.TEMP || '/tmp';
    return `${dir.replace(/\/$/, '')}/discord-ipc-${i}`;
  }

  _enviar(op, dados) {
    if (!this.sock) return;
    const json = Buffer.from(JSON.stringify(dados), 'utf8');
    const cab = Buffer.alloc(8);
    cab.writeInt32LE(op, 0);
    cab.writeInt32LE(json.length, 4);
    try { this.sock.write(Buffer.concat([cab, json])); } catch {}
  }

  _ler(pedaco) {
    this.buf = Buffer.concat([this.buf, pedaco]);
    while (this.buf.length >= 8) {
      const op = this.buf.readInt32LE(0), len = this.buf.readInt32LE(4);
      if (this.buf.length < 8 + len) return;
      let msg = null;
      try { msg = JSON.parse(this.buf.subarray(8, 8 + len).toString('utf8')); } catch {}
      this.buf = this.buf.subarray(8 + len);
      if (op === 1 && msg && msg.evt === 'READY') { this.pronto = true; this._aplicar(); }
      if (op === 2) this._fechar(); // o Discord pediu para fechar
      if (op === 3) this._enviar(4, msg); // ping -> pong
    }
  }

  _fechar() {
    this.pronto = false;
    if (this.sock) { try { this.sock.destroy(); } catch {} }
    this.sock = null;
    this.buf = Buffer.alloc(0);
  }

  /** Tenta conectar nos pipes 0..9. Sem Discord aberto: so falha em silencio. */
  conectar() {
    if (this.sock || this._conectando) return;
    this._conectando = true;
    const tentar = (i) => {
      if (i > 9) { this._conectando = false; return; }
      const s = net.connect(this._caminho(i));
      s.once('connect', () => {
        this._conectando = false;
        this.sock = s;
        s.on('data', (d) => this._ler(d));
        s.on('close', () => this._fechar());
        s.on('error', () => this._fechar());
        this._enviar(0, { v: 1, client_id: this.clientId });
      });
      s.once('error', () => { s.destroy(); tentar(i + 1); });
    };
    tentar(0);
  }

  _aplicar() {
    if (!this.pronto) return;
    this._enviar(1, { cmd: 'SET_ACTIVITY', args: { pid: process.pid, activity: this.atividade }, nonce: crypto.randomUUID() });
  }

  /** Define (ou limpa, com null) a atividade. Conecta sozinho se precisar. */
  definir(atividade) {
    this.atividade = atividade;
    if (!this.sock) { if (atividade) this.conectar(); return; }
    this._aplicar();
  }

  encerrar() {
    if (this.pronto) this._enviar(1, { cmd: 'SET_ACTIVITY', args: { pid: process.pid, activity: null }, nonce: crypto.randomUUID() });
    setTimeout(() => this._fechar(), 200);
  }
}

module.exports = DiscordRPC;
