const $ = (id) => document.getElementById(id);
let mode = 'offline';
let msName = null;
let busy = false;
let S = {};      // configurações salvas
let SYS = {};    // info do PC (RAM, Java recomendado...)
let onStatus = null; // ouvinte extra de progresso (assistente / integridade)

const gb = (mb) => (mb / 1024).toFixed(mb % 1024 ? 1 : 0).replace('.', ',') + ' GB';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function toast(msg, bad) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.className = 'toast';
  t.style.cssText = `position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:99;background:${bad ? '#3a1012' : '#1a1a1e'};border:1px solid ${bad ? '#ff2a2a' : '#2c2c31'};color:#fff;padding:12px 18px;border-radius:8px;font-size:13px;max-width:70%;box-shadow:0 8px 24px #000a`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 5000);
}

const ICONS = {
  GitHub: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-3.2 19.500c.5.100.700-.200.700-.500v-1.800c-2.800.600-3.400-1.200-3.400-1.200-.5-1.200-1.100-1.500-1.100-1.500-.9-.600.100-.600.100-.600 1 .100 1.500 1 1.500 1 .9 1.500 2.300 1.100 2.900.8.100-.7.400-1.100.6-1.300-2.200-.3-4.600-1.100-4.600-5 0-1.100.4-2 1-2.700-.1-.3-.4-1.300.1-2.700 0 0 .8-.3 2.800 1a9.500 9.500 0 0 1 5 0c1.900-1.300 2.800-1 2.800-1 .5 1.400.2 2.400.1 2.700.6.700 1 1.600 1 2.700 0 3.900-2.400 4.700-4.600 5 .4.300.7.900.7 1.800v2.700c0 .3.200.6.700.5A10 10 0 0 0 12 2z"/></svg>',
  Website: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-3a15 15 0 0 0-1.4-3.6A8 8 0 0 1 18.9 8zM12 4c.8 1.2 1.5 2.5 1.9 4h-3.8c.4-1.5 1.1-2.8 1.9-4zM4.3 14a8 8 0 0 1 0-4h3.4a16 16 0 0 0 0 4zm.8 2h3a15 15 0 0 0 1.4 3.6A8 8 0 0 1 5.1 16zm3-8h-3a8 8 0 0 1 4.4-3.6C8.900 5.500 8.400 6.700 8.100 8zM12 20c-.8-1.200-1.500-2.500-1.900-4h3.800c-.4 1.500-1.100 2.800-1.900 4zm2.300-6H9.700a14 14 0 0 1 0-4h4.600a14 14 0 0 1 0 4zm.2 5.600c.6-1.100 1.100-2.300 1.400-3.600h3a8 8 0 0 1-4.400 3.600zm1.800-5.600a16 16 0 0 0 0-4h3.400a8 8 0 0 1 0 4z"/></svg>',
  Discord: '<svg viewBox="0 0 24 24"><path d="M19.300 5.300A17 17 0 0 0 15.100 4l-.5 1a15 15 0 0 0-5.200 0l-.5-1a17 17 0 0 0-4.200 1.300C2 9.300 1.300 13.200 1.600 17a17 17 0 0 0 5.200 2.600l1.100-1.800-1.700-.8.400-.3a12 12 0 0 0 10.800 0l.4.300-1.700.8 1.100 1.800a17 17 0 0 0 5.200-2.600c.4-4.400-.7-8.300-3.100-11.700zM8.700 14.700c-1 0-1.800-.9-1.800-2s.8-2 1.800-2 1.800.9 1.800 2-.8 2-1.800 2zm6.600 0c-1 0-1.800-.9-1.800-2s.8-2 1.800-2 1.800.9 1.800 2-.8 2-1.800 2z"/></svg>',
  YouTube: '<svg viewBox="0 0 24 24"><path d="M21.600 7.200a2.500 2.500 0 0 0-1.800-1.800C18.200 5 12 5 12 5s-6.200 0-7.800.4a2.500 2.500 0 0 0-1.800 1.800C2 8.800 2 12 2 12s0 3.200.4 4.800a2.500 2.500 0 0 0 1.800 1.800C5.800 19 12 19 12 19s6.200 0 7.800-.4a2.500 2.500 0 0 0 1.800-1.800c.4-1.600.4-4.800.4-4.800s0-3.200-.4-4.800zM10 15V9l5.200 3z"/></svg>'
};

// ================= início =================
function setStatus({ text, pct }) {
  if (onStatus) onStatus(text, pct);
  $('progress').classList.remove('hidden');
  const v = Math.max(0, Math.min(100, pct || 0));
  $('progTxt').textContent = text.replace(/\s*\d+%$/, '');
  $('progPct').textContent = v ? Math.round(v) + '%' : '';
  $('progBar').style.width = v + '%';
}
const nickOk = () => (mode === 'microsoft' ? !!msName : /^\w{3,16}$/.test($('nick').value.trim()));
function refreshPlay() {
  const ok = nickOk();
  $('play').disabled = busy || !ok;
  const typed = $('nick').value.length > 0;
  $('nick').classList.toggle('bad', mode === 'offline' && typed && !ok);
  $('nickHint').classList.toggle('hidden', !(mode === 'offline' && typed && !ok));
}
function setBusy(b) {
  busy = b;
  $('playTxt').textContent = b ? 'Aguarde...' : 'Jogar';
  $('nick').disabled = b || mode === 'microsoft';
  if (!b) { $('progress').classList.add('hidden'); $('progBar').style.width = '0%'; }
  refreshPlay();
}
function applyMode() {
  const ms = mode === 'microsoft';
  $('nick').disabled = ms;
  $('nickLabel').textContent = ms ? 'Conta Microsoft:' : 'Seu Nickname:';
  $('nick').value = ms ? (msName || 'Não conectado') : ($('nick').dataset.saved || '');
  $('logoutItem').classList.toggle('hidden', !msName);
  document.querySelectorAll('.menu [data-mode]').forEach((e) => e.classList.toggle('sel', e.dataset.mode === mode));
  refreshPlay();
}
async function refreshServer() {
  const r = await api.ping();
  $('dot').classList.toggle('off', !r.online);
  $('stxt').classList.toggle('off', !r.online);
  if (r.online) {
    $('stxt').textContent = r.players ? `Online (${r.players.online}/${r.players.max})` : 'Online';
  } else {
    $('stxt').textContent = 'Offline';
  }
}

document.querySelectorAll('.wc button').forEach((b) => (b.onclick = () => api.win(b.dataset.w)));
$('ddBtn').onclick = (e) => { e.stopPropagation(); $('menu').classList.toggle('hidden'); };
document.addEventListener('click', () => $('menu').classList.add('hidden'));

async function msLoginFlow() {
  toast('Abrindo o login da Microsoft...');
  const r = await api.msLogin();
  if (!r.ok) { toast(r.error || 'Falha no login Microsoft.', !r.cancelled); return false; }
  msName = r.name;
  toast('Conectado como ' + r.name);
  return true;
}
document.querySelectorAll('.menu [data-mode]').forEach((el) => {
  el.onclick = async () => {
    const m = el.dataset.mode;
    if (m === 'logout') { await api.msLogout(); msName = null; mode = 'offline'; }
    else if (m === 'microsoft') { if (!msName && !(await msLoginFlow())) return; mode = 'microsoft'; }
    else mode = 'offline';
    api.save({ mode });
    applyMode();
  };
});
$('nick').oninput = () => { $('nick').dataset.saved = $('nick').value; refreshPlay(); };
$('nick').onkeydown = (e) => { if (e.key === 'Enter' && !$('play').disabled) $('play').click(); };
$('play').onclick = async () => {
  if (busy || !nickOk()) { $('nick').focus(); return; }
  setBusy(true);
  const r = await api.play({ mode, nick: $('nick').value.trim() });
  if (!r.ok) { setBusy(false); toast(r.error, true); }
};
api.on('status', setStatus);
api.on('started', () => { $('playTxt').textContent = 'Jogando'; $('progress').classList.add('hidden'); });
api.on('closed', (code) => { setBusy(false); if (code) toast(`O Minecraft fechou com erro (código ${code}). Veja o log em Configurações › Ferramentas.`, true); });

const PAGES = { Home: 'pageHome', News: 'pageNews', Settings: 'pageSettings' };
function goPage(name) {
  document.querySelectorAll('.nav').forEach((x) => x.classList.toggle('active', x.dataset.page === name));
  for (const [k, id] of Object.entries(PAGES)) {
    const el = $(id);
    el.classList.toggle('hidden', k !== name);
    if (k === name) { el.classList.remove('enter'); void el.offsetWidth; el.classList.add('enter'); }
  }
  if (name === 'Settings') renderDiag();
  if (name === 'News') loadReleases();
}
document.querySelectorAll('.nav').forEach((n) => (n.onclick = () => goPage(n.dataset.page)));
$('newsCard').onclick = () => goPage('News');
$('pageHome').classList.add('enter');

// ripple nos botões
document.addEventListener('click', (e) => {
  const b = e.target.closest('.btn-play,.btn2,.btn-dd');
  if (!b || b.disabled) return;
  const r = b.getBoundingClientRect(), d = document.createElement('span');
  d.className = 'rip'; d.style.left = e.clientX - r.left + 'px'; d.style.top = e.clientY - r.top + 'px';
  b.appendChild(d); setTimeout(() => d.remove(), 650);
});

// links e imagens dentro das notas (markdown)
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-href]');
  if (a) { e.preventDefault(); api.link(a.dataset.href); return; }
  const img = e.target.closest('.md img');
  if (img) {
    const z = document.createElement('div'); z.className = 'zoom'; z.innerHTML = '<img>'; z.firstChild.src = img.src;
    z.onclick = () => z.remove(); document.body.appendChild(z);
  }
});

// ================= notas de versão (GitHub) =================
let RELS = [];
const fmtDate = (d) => { try { return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }); } catch { return ''; } };
function paintHome() {
  const r = RELS[0];
  if (!r) return;
  $('relDate').textContent = fmtDate(r.date) ? '• ' + fmtDate(r.date) : '';
  $('relTitle').textContent = r.name;
  $('welcome').textContent = md.summary(r.body, 170) || S.cfgNews.welcome;
  $('vMc').textContent = r.tag;
  $('newsTitle').textContent = 'Novidades da versão ' + r.tag;
  $('newsText').textContent = 'Toque para ver as notas de atualização completas';
}
function paintNews() {
  const box = $('relList');
  if (!RELS.length) { box.innerHTML = '<div class="card empty"><span class="emo">📭</span>Nenhuma versão publicada ainda.<br>As notas de atualização do GitHub aparecem aqui.</div>'; return; }
  box.innerHTML = RELS.map((r, k) => `<section class="card rel enter-card ${k === 0 ? 'open' : ''}"><div class="rel-h"><span class="tag">${esc(r.tag)}</span><h3>${esc(r.name)}${k === 0 ? ' <span class="badge g">Mais recente</span>' : ''}${r.pre ? ' <span class="badge w">Pré-lançamento</span>' : ''}</h3><time>${esc(fmtDate(r.date))}</time><span class="chev2">›</span></div><div class="rel-b md">${r.body ? md.render(r.body) : '<p>Sem notas para esta versão.</p>'}</div></section>`).join('');
  box.querySelectorAll('.rel-h').forEach((h) => (h.onclick = () => h.parentElement.classList.toggle('open')));
}
async function loadReleases() {
  const r = await api.releases();
  RELS = r.list || [];
  paintHome(); paintNews();
}
$('relReload').onclick = async () => { $('relReload').disabled = true; await loadReleases(); $('relReload').disabled = false; toast('Notas atualizadas'); };

// ================= brasas no banner =================
(function embers() {
  const c = $('embers'), x = c.getContext('2d');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let W = 0, H = 0; const P = [];
  const size = () => { W = c.width = c.clientWidth; H = c.height = c.clientHeight; };
  const spawn = (init) => ({ x: Math.random() * W, y: init ? Math.random() * H : H + 10, r: .6 + Math.random() * 1.8, vy: .25 + Math.random() * .8, ph: Math.random() * 6.28, sp: .01 + Math.random() * .02, a: .35 + Math.random() * .65, h: 8 + Math.random() * 30 });
  size(); addEventListener('resize', size);
  for (let i = 0; i < 46; i++) P.push(spawn(true));
  (function loop() {
    requestAnimationFrame(loop);
    if (document.hidden || !W || !H) { if (!W) size(); return; }
    x.clearRect(0, 0, W, H);
    for (const p of P) {
      p.y -= p.vy; p.ph += p.sp; p.x += Math.sin(p.ph) * .5;
      const life = Math.max(0, p.y / H);
      if (p.y < -10) Object.assign(p, spawn(false));
      x.globalAlpha = p.a * Math.min(1, life * 1.6);
      x.fillStyle = `hsl(${p.h},100%,55%)`;
      x.shadowColor = '#ff2a2a'; x.shadowBlur = 8;
      x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.283); x.fill();
    }
  })();
})();

// ================= controles reutilizáveis =================
function ramLevel(mb) {
  if (mb < SYS.minMb) return ['Muito pouco', 'x'];
  if (mb < SYS.goodMb) return ['Mínimo', 'w'];
  if (mb < SYS.recMb) return ['Bom', 'g'];
  if (mb <= SYS.recMb * 1.4) return ['Recomendado', 'g'];
  return ['Mais que o necessário', 'w'];
}
// slider de RAM: el = { slider, val, badge, info, marks }
function bindRam(el, onSave) {
  const min = 1024, max = SYS.maxMb;
  el.slider.min = min; el.slider.max = max; el.slider.step = 256;
  const pos = (v) => ((v - min) / (max - min)) * 100;
  if (el.marks) {
    const m = [[SYS.goodMb, '4 GB'], [SYS.recMb, SYS.recMb === SYS.goodMb ? '' : gb(SYS.recMb)]];
    el.marks.innerHTML = m.filter((x) => x[1]).map(([v, t]) => `<span class="${v === SYS.recMb ? 'rec' : ''}" style="left:${pos(v)}%">${t}${v === SYS.recMb ? ' ★' : ''}</span>`).join('');
  }
  const paint = () => {
    const v = +el.slider.value;
    el.slider.style.setProperty('--p', pos(v) + '%');
    const [txt, cls] = ramLevel(v);
    el.val.textContent = gb(v);
    el.badge.textContent = txt; el.badge.className = 'badge ' + cls;
    el.info.textContent = `Seu PC tem ${gb(SYS.totalMb)}. Para jogar com mods, ${gb(SYS.goodMb)} já é bom — quanto mais, melhor, até ~${gb(SYS.recMb)}. O resto fica para o Windows.`;
  };
  el.slider.value = S.ramMb || SYS.recMb;
  paint();
  el.slider.oninput = paint;
  el.slider.onchange = () => { S.ramMb = +el.slider.value; api.save({ ramMb: S.ramMb }); onSave && onSave(); };
  return { reset: () => { el.slider.value = SYS.recMb; S.ramMb = null; api.save({ ramMb: null }); paint(); onSave && onSave(); } };
}

// select de Java detectado
async function bindJava(sel, warnEl, recEl, refresh) {
  const list = await api.javaList(!!refresh);
  const cur = S.javaPath || '';
  const opts = [`<option value="">Automático — Java ${SYS.javaMajor} embutido (recomendado)</option>`];
  for (const j of list) opts.push(`<option value="${esc(j.path)}">Java ${j.major} • ${esc(j.vendor)} ${j.is64 ? '64-bit' : '32-bit'} • ${esc(j.source)}${j.major === SYS.javaMajor ? ' ✓' : ''}</option>`);
  if (cur && !list.some((j) => j.path === cur)) opts.push(`<option value="${esc(cur)}">Personalizado — ${esc(cur)}</option>`);
  opts.push('<option value="__pick">Escolher outro arquivo...</option>');
  sel.innerHTML = opts.join('');
  sel.value = cur;
  if (recEl) recEl.textContent = `Recomendado para Minecraft ${SYS.mc}: Java ${SYS.javaMajor}${list.some((j) => j.major === SYS.javaMajor) ? ' (já detectado no PC)' : ' (o launcher baixa sozinho)'}`;
  const check = () => {
    const j = list.find((x) => x.path === sel.value);
    let msg = '', bad = false;
    if (j && j.major !== SYS.javaMajor) { msg = `Java ${j.major} pode não funcionar com o Minecraft ${SYS.mc}. O recomendado é o Java ${SYS.javaMajor}.`; bad = true; }
    else if (j && !j.is64) msg = 'Java de 32 bits limita a memória do jogo a cerca de 1,5 GB.';
    warnEl.textContent = msg; warnEl.classList.toggle('hidden', !msg); warnEl.classList.toggle('bad', bad);
  };
  check();
  sel.onchange = async () => {
    if (sel.value === '__pick') {
      const p = await api.pickJava();
      if (!p) { sel.value = S.javaPath || ''; return; }
      S.javaPath = p; await api.save({ javaPath: p });
      return bindJava(sel, warnEl, recEl);
    }
    S.javaPath = sel.value || null;
    await api.save({ javaPath: S.javaPath });
    check();
  };
}

// ================= diagnóstico =================
async function renderDiag(target = $('diag')) {
  const rows = await api.diag();
  target.innerHTML = '';
  for (const r of rows) {
    const d = document.createElement('div');
    d.className = 'dg ' + (r.fatal ? 'x' : r.ok && !r.warn ? '' : 'w');
    d.innerHTML = '<i></i><b></b><span></span><em></em>';
    d.children[1].textContent = r.label;
    d.children[2].textContent = r.value;
    d.children[3].textContent = r.hint || '';
    target.appendChild(d);
  }
  return rows;
}

// ================= configurações =================
function bindSettings() {
  const ram = bindRam({ slider: $('ram'), val: $('ramVal'), badge: $('ramBadge'), info: $('ramInfo'), marks: $('ramMarks') });
  $('ramAuto').onclick = () => ram.reset();
  bindJava($('javaSel'), $('javaWarn'), $('javaRec'));
  $('javaScan').onclick = async () => { $('javaScan').disabled = true; await bindJava($('javaSel'), $('javaWarn'), $('javaRec'), true); $('javaScan').disabled = false; toast('Busca de Java concluída'); };
  $('after').value = S.afterLaunch || 'hide';
  $('after').onchange = () => api.save({ afterLaunch: $('after').value });
  $('fullscreen').checked = !!S.fullscreen;
  $('fullscreen').onchange = () => { api.save({ fullscreen: $('fullscreen').checked }); $('winW').disabled = $('winH').disabled = $('fullscreen').checked; };
  $('winW').value = S.width || ''; $('winH').value = S.height || '';
  $('winW').disabled = $('winH').disabled = !!S.fullscreen;
  $('winW').onchange = () => api.save({ width: +$('winW').value || null });
  $('winH').onchange = () => api.save({ height: +$('winH').value || null });
  $('jvm').value = S.jvmArgs || '';
  $('jvm').onchange = () => api.save({ jvmArgs: $('jvm').value.trim() || null });
  $('dirInfo').textContent = SYS.gameDir;
  $('openDir').onclick = () => api.openFolder('game');
  $('openLogs').onclick = () => api.openFolder('logs');
  $('rediag').onclick = () => renderDiag();
  $('redoWiz').onclick = () => wizOpen();
  $('resetAll').onclick = async () => {
    await api.resetSettings(); toast('Configurações restauradas. Reiniciando a tela...');
    setTimeout(() => location.reload(), 900);
  };

  $('vLauncher').onclick = async () => {
    $('vLauncher').disabled = true; $('intLauncher').textContent = 'Verificando...';
    const r = await api.verifyLauncher();
    $('intLauncher').textContent = r.skipped ? '✓ Modo desenvolvimento (sem lista de integridade)' : r.ok ? `✓ ${r.total} arquivos íntegros` : `⚠ Arquivos alterados: ${r.bad.join(', ')}. Reinstale o launcher.`;
    $('intLauncher').className = r.ok ? '' : 'warnline bad';
    $('vLauncher').disabled = false;
  };
  $('vPack').onclick = async () => {
    $('vPack').disabled = $('repair').disabled = true; $('intPack').className = '';
    onStatus = (t) => { $('intPack').textContent = t; };
    const r = await api.verifyPack();
    onStatus = null; $('progress').classList.add('hidden');
    $('intPack').textContent = r.error ? '⚠ ' + r.error : r.ok ? `✓ ${r.total} arquivos íntegros` : `⚠ ${r.bad.length} arquivo(s) com problema: ${r.bad.slice(0, 3).join(', ')}${r.bad.length > 3 ? '...' : ''} — clique em Reparar`;
    $('intPack').className = r.ok ? '' : 'warnline bad';
    $('vPack').disabled = $('repair').disabled = false;
  };
  $('repair').onclick = async () => {
    $('vPack').disabled = $('repair').disabled = true; $('intPack').className = '';
    onStatus = (t) => { $('intPack').textContent = t; };
    await api.repair();
    const r = await api.prepare();
    onStatus = null; $('progress').classList.add('hidden');
    $('intPack').textContent = r.ok ? '✓ Modpack reparado e atualizado' : '⚠ ' + r.error;
    $('intPack').className = r.ok ? '' : 'warnline bad';
    $('vPack').disabled = $('repair').disabled = false;
  };
}

// ================= assistente de primeiro uso =================
const WSTEPS = ['welcome', 'pc', 'mem', 'account', 'download', 'done'];
let W = { i: 0 };

function wizOpen() {
  W = { i: 0, dl: 'idle', tasks: [] };
  $('wizard').classList.remove('hidden');
  wizRender();
}
function wizClose() { $('wizard').classList.add('hidden'); onStatus = null; }

function wmsg(t, bad) { $('wmsg').textContent = t || ''; $('wmsg').classList.toggle('bad', !!bad); }

async function wizRender() {
  const id = WSTEPS[W.i];
  $('wsteps').innerHTML = WSTEPS.map((_, k) => `<i class="${k <= W.i ? 'on' : ''}"></i>`).join('');
  $('wback').style.visibility = W.i === 0 || id === 'done' ? 'hidden' : 'visible';
  $('wback').disabled = false;
  $('wnext').disabled = false;
  $('wnext').textContent = 'Continuar';
  wmsg('');
  const body = $('wbody');
  body.classList.remove('wanim'); void body.offsetWidth; body.classList.add('wanim');
  $('wnext').onclick = () => wizGo(1);
  $('wback').onclick = () => wizGo(-1);

  if (id === 'welcome') {
    body.innerHTML = `<div class="hero2"><img src="../assets/icon.png" alt=""><h2>Bem-vindo ao ${esc(S.cfgName || 'DeathAwaits')}!</h2>
      <p class="lead">Vamos deixar tudo pronto em poucos passos: checar seu PC, escolher a memória, definir sua conta e baixar os arquivos do jogo. Você não precisa instalar nada por fora — Java e Minecraft já vêm com o launcher.</p></div>`;
    $('wnext').textContent = 'Começar';
  }

  if (id === 'pc') {
    body.innerHTML = `<h2>Verificando seu PC</h2><p class="lead">Conferimos se o computador atende aos requisitos para rodar o modpack.</p><div id="wdiag" class="card set"></div>
      <div class="recbox"><div>Mínimo<b>${gb(SYS.minMb)}</b>de RAM para o jogo</div><div class="g">Bom<b>${gb(SYS.goodMb)}</b>já roda bem</div><div>Seu PC<b>${gb(SYS.totalMb)}</b>${gb(SYS.freeMb)} livres agora</div></div>`;
    const rows = await renderDiag($('wdiag'));
    const fatal = rows.find((r) => r.fatal);
    if (fatal) { $('wnext').disabled = true; wmsg(`${fatal.label}: ${fatal.hint}`, true); }
  }

  if (id === 'mem') {
    body.innerHTML = `<h2>Memória e Java</h2><p class="lead">A memória define quanto o jogo pode usar. O ideal já vem selecionado para o seu PC — se não souber, só continue.</p>
      <div class="card set"><div class="row col"><div class="ramtop"><div><b id="wRamVal"></b> <span id="wRamBadge" class="badge"></span></div><button class="btn2 sm" id="wRamAuto">Usar recomendado</button></div>
      <div class="slider"><input type="range" id="wRam"><div class="marks" id="wRamMarks"></div></div><small id="wRamInfo"></small></div></div>
      <div class="field"><label>Versão do Java <span id="wJavaRec"></span></label><select id="wJava" class="sel"></select><small id="wJavaWarn" class="warnline hidden"></small></div>`;
    const ram = bindRam({ slider: $('wRam'), val: $('wRamVal'), badge: $('wRamBadge'), info: $('wRamInfo'), marks: $('wRamMarks') });
    $('wRamAuto').onclick = () => ram.reset();
    bindJava($('wJava'), $('wJavaWarn'), $('wJavaRec'));
  }

  if (id === 'account') {
    body.innerHTML = `<h2>Sua conta</h2><p class="lead">Escolha como quer jogar. Você pode trocar depois no botão ▾ ao lado de "Jogar".</p>
      <div class="rcards">
        <label class="rcard"><input type="radio" name="wacc" value="offline"><span class="dot2"></span><span><b>Conta pirata</b><small>Só precisa de um nickname. Não precisa comprar o jogo.</small></span></label>
        <label class="rcard"><input type="radio" name="wacc" value="microsoft"><span class="dot2"></span><span><b>Conta original</b><small>Entre com sua conta Microsoft (Minecraft Java comprado).</small></span></label>
      </div>
      <div id="waccBody"></div>`;
    const draw = () => {
      const m = document.querySelector('input[name=wacc]:checked').value;
      W.mode = m;
      if (m === 'offline') {
        $('waccBody').innerHTML = `<div class="field"><label>Seu nickname (3 a 16 letras, números ou _)</label><input id="wNick" class="inp" maxlength="16" placeholder="Digite seu Nickname.." spellcheck="false" autocomplete="off"></div>`;
        $('wNick').value = $('nick').dataset.saved || S.nick || '';
        const v = () => { const ok = /^\w{3,16}$/.test($('wNick').value.trim()); $('wnext').disabled = !ok; wmsg($('wNick').value && !ok ? 'Nickname inválido' : '', true); $('wNick').style.borderColor = $('wNick').value && !ok ? '#ff2a2a' : ''; };
        $('wNick').oninput = v; v(); $('wNick').focus();
      } else {
        $('waccBody').innerHTML = msName ? `<div class="sum"><div><span>Conta conectada</span><b>${esc(msName)}</b></div></div>` : `<div class="field"><button class="btn2" id="wMs">Entrar com a Microsoft</button></div>`;
        $('wnext').disabled = !msName;
        if (!msName) $('wMs').onclick = async () => { if (await msLoginFlow()) draw(); };
      }
    };
    document.querySelectorAll('input[name=wacc]').forEach((r) => (r.onchange = draw));
    document.querySelector(`input[name=wacc][value=${W.mode || mode}]`).checked = true;
    draw();
  }

  if (id === 'download') wizDownload();

  if (id === 'done') {
    const java = S.javaPath ? 'Personalizado' : `Java ${SYS.javaMajor} (automático)`;
    body.innerHTML = `<div class="hero2"><img src="../assets/icon.png" alt=""><h2>Tudo pronto!</h2><p class="lead">Seu launcher está configurado. Clique em <b>Jogar</b> — na primeira vez ele ainda baixa as bibliotecas e sons do Minecraft, depois abre direto.</p></div>
      <div class="sum"><div><span>Conta</span><b>${W.mode === 'microsoft' ? esc(msName || 'Microsoft') : esc($('nick').dataset.saved || S.nick || '')}</b></div><div><span>Memória RAM</span><b>${gb(S.ramMb || SYS.recMb)}</b></div><div><span>Java</span><b>${java}</b></div></div>`;
    $('wnext').textContent = 'Começar a jogar';
    $('wnext').onclick = wizFinish;
  }
}

async function wizGo(dir) {
  const id = WSTEPS[W.i];
  if (dir > 0 && id === 'account') {
    mode = W.mode;
    if (mode === 'offline') { const n = $('wNick').value.trim(); S.nick = n; $('nick').dataset.saved = n; await api.save({ nick: n, mode }); }
    else await api.save({ mode });
    applyMode();
  }
  W.i = Math.max(0, Math.min(WSTEPS.length - 1, W.i + dir));
  wizRender();
}

async function wizDownload() {
  const names = ['Verificando requisitos e atualizações', 'Baixando e instalando o modpack', 'Preparando o Java'];
  const draw = (cur, state) => {
    $('wbody').querySelector('.tasks').innerHTML = names.map((n, k) => `<div class="task ${k < cur ? 'ok' : k === cur ? state : ''}"><span class="ic"></span>${n}</div>`).join('');
  };
  $('wbody').innerHTML = `<h2>Primeiro download</h2><p class="lead">Estamos baixando o que o jogo precisa. Isso só acontece uma vez — depois só baixa atualizações.</p>
    <div class="tasks"></div><div class="ptop"><span id="wdlTxt">Iniciando...</span><b id="wdlPct"></b></div><div class="bar"><i id="wdlBar"></i></div>
    <p class="lead" style="margin-top:14px">Observação: as bibliotecas e sons do Minecraft (cerca de 150 MB) são baixados no primeiro clique em "Jogar".</p>`;
  if (W.dl === 'ok') { draw(3, 'ok'); $('wdlBar').style.width = '100%'; $('wdlTxt').textContent = 'Tudo pronto!'; return; }
  let cur = 0;
  draw(cur, 'run');
  $('wnext').disabled = true; $('wback').disabled = true; wmsg('Baixando... não feche o launcher.');
  onStatus = (t, p) => {
    if (/Java/.test(t)) cur = 2; else if (/modpack|Verificando arq|Reparando|Atualizando/i.test(t)) cur = Math.max(cur, 1);
    draw(cur, 'run');
    $('wdlTxt').textContent = t.replace(/\s*\d+%$/, '');
    $('wdlPct').textContent = p ? Math.round(p) + '%' : '';
    $('wdlBar').style.width = (p || 0) + '%';
    $('progress').classList.add('hidden');
  };
  W.dl = 'run';
  const r = await api.prepare();
  onStatus = null;
  if (WSTEPS[W.i] !== 'download') return;
  if (r.ok) {
    W.dl = 'ok'; draw(3, 'ok'); $('wdlBar').style.width = '100%'; $('wdlTxt').textContent = 'Tudo pronto!'; $('wdlPct').textContent = '100%';
    $('wnext').disabled = false; $('wback').disabled = false; wmsg('');
  } else {
    W.dl = 'err'; draw(cur, 'err'); wmsg(r.error, true);
    $('wback').disabled = false; $('wnext').disabled = false; $('wnext').textContent = 'Tentar de novo';
    $('wnext').onclick = wizDownload;
  }
}

async function wizFinish() {
  S.setupDone = true;
  await api.save({ setupDone: true, mode });
  applyMode();
  wizClose();
  bindSettings();
}

// ================= inicialização =================
(async () => {
  const init = await api.init();
  const { config, version } = init;
  S = init.settings || {};
  SYS = await api.sys();
  S.cfgName = config.name;
  S.cfgNews = config.news;
  $('packName').textContent = config.name;
  $('packSub').textContent = `${config.modpackName} ${config.mcVersion}`;
  $('vMc').textContent = config.mcVersion;
  $('vPack').textContent = config.name;
  $('welcome').textContent = config.news.welcome;
  $('newsTitle').textContent = config.news.title;
  $('newsText').textContent = config.news.text;
  $('launcherVer').textContent = `${config.name} Launcher v${version}`;
  $('nick').dataset.saved = S.nick || '';
  msName = S.ms && S.ms.name;
  mode = S.mode || 'offline';
  if (mode === 'microsoft' && !msName) mode = 'offline';
  applyMode();

  for (const [name, url] of Object.entries(config.links)) {
    const li = document.createElement('li');
    li.innerHTML = (ICONS[name] || '') + `<span>${esc(name)}</span>`;
    li.onclick = () => api.link(url);
    $('links').appendChild(li);
  }
  bindSettings();
  loadReleases();
  refreshServer();
  setInterval(refreshServer, 30000);

  // integridade do launcher a cada abertura
  api.verifyLauncher().then((r) => {
    if (!r.ok) { $('launcherVer').textContent = '⚠ Launcher alterado — reinstale'; $('launcherVer').style.color = '#ff2a2a'; }
  });

  if (!S.setupDone) wizOpen();
})();
