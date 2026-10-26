// Mini renderizador de Markdown (notas de versão do GitHub) — seguro: escapa HTML, só aceita imagens/links https.
(function () {
  const EMOJI = {
    fire: '🔥', skull: '💀', sparkles: '✨', warning: '⚠️', tada: '🎉', bug: '🐛', zap: '⚡', rocket: '🚀', star: '⭐', gear: '⚙️',
    wrench: '🔧', new: '🆕', heart: '❤️', sword: '⚔️', crossed_swords: '⚔️', gun: '🔫', shield: '🛡️', map: '🗺️', package: '📦', art: '🎨',
    memo: '📝', lock: '🔒', white_check_mark: '✅', check: '✅', heavy_check_mark: '✔️', x: '❌', construction: '🚧', zombie: '🧟', bomb: '💣',
    gift: '🎁', trophy: '🏆', megaphone: '📣', loudspeaker: '📢', pushpin: '📌', hammer: '🔨', boom: '💥', moneybag: '💰', key: '🔑',
    house: '🏠', sunrise: '🌅', moon: '🌙', ghost: '👻', eyes: '👀', pick: '⛏️', axe: '🪓', bow_and_arrow: '🏹', crown: '👑', bell: '🔔',
    link: '🔗', globe_with_meridians: '🌐', hourglass: '⏳', syringe: '💉', pill: '💊', radioactive: '☢️', biohazard: '☣️', knife: '🔪',
    rotating_light: '🚨', speech_balloon: '💬', thumbsup: '👍', musical_note: '🎵', camera: '📷', video_game: '🎮', chart_with_upwards_trend: '📈',
    arrow_up: '⬆️', arrow_down: '⬇️', recycle: '♻️', lipstick: '💄', fix: '🩹', adhesive_bandage: '🩹', books: '📚', mag: '🔍', cloud: '☁️', sparkle: '❇️'
  };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const safeUrl = (u) => (/^https?:\/\//i.test(u) ? u : null);
  const ALERTS = { NOTE: ['ℹ️', 'Nota'], TIP: ['💡', 'Dica'], IMPORTANT: ['❗', 'Importante'], WARNING: ['⚠️', 'Atenção'], CAUTION: ['🚨', 'Cuidado'] };

  function inline(raw) {
    const hold = [];
    const keep = (html) => '\u0000' + (hold.push(html) - 1) + '\u0000';
    let s = raw;
    // <img src=".." width=".."> (GitHub) e <br>
    s = s.replace(/<img\b[^>]*>/gi, (tag) => {
      const src = /src\s*=\s*"([^"]+)"/i.exec(tag), alt = /alt\s*=\s*"([^"]*)"/i.exec(tag), w = /width\s*=\s*"?(\d+)/i.exec(tag);
      const u = src && safeUrl(src[1]);
      return u ? keep(`<img src="${esc(u)}" alt="${esc(alt ? alt[1] : '')}" loading="lazy"${w ? ` style="max-width:min(100%,${+w[1]}px)"` : ''}>`) : '';
    });
    s = s.replace(/<br\s*\/?>/gi, '\n');
    s = s.replace(/`([^`]+)`/g, (_, c) => keep(`<code>${esc(c)}</code>`));
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, alt, url) => { const u = safeUrl(url); return u ? keep(`<img src="${esc(u)}" alt="${esc(alt)}" loading="lazy">`) : esc(alt); });
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, t, url) => { const u = safeUrl(url); return u ? keep(`<a href="#" data-href="${esc(u)}">${esc(t)}</a>`) : esc(t); });
    s = s.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, (_, pre, url) => pre + keep(`<a href="#" data-href="${esc(url)}">${esc(url)}</a>`));
    s = esc(s);
    s = s.replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, (_, a, b) => `<strong>${a || b}</strong>`)
      .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
      .replace(/(^|[^_\w])_([^_\n]+)_(?![_\w])/g, '$1<em>$2</em>')
      .replace(/~~([^~]+)~~/g, '<del>$1</del>')
      .replace(/:([a-z0-9_+-]+):/g, (m, n) => (EMOJI[n] ? `<span class="emo">${EMOJI[n]}</span>` : m))
      .replace(/\n/g, '<br>');
    return s.replace(/\u0000(\d+)\u0000/g, (_, i) => hold[+i]);
  }

  function render(src) {
    const lines = String(src || '').replace(/\r\n?/g, '\n').split('\n');
    const out = [];
    let i = 0;
    const indentOf = (l) => /^\s*/.exec(l)[0].replace(/\t/g, '  ').length;
    const isList = (l) => /^\s*([-*+]|\d+[.)])\s+/.test(l);

    function list(startIndent) {
      const ordered = /^\s*\d+[.)]/.test(lines[i]);
      let html = ordered ? '<ol>' : '<ul>';
      while (i < lines.length && isList(lines[i]) && indentOf(lines[i]) >= startIndent) {
        const ind = indentOf(lines[i]);
        if (ind > startIndent) { html += list(ind); continue; }
        let text = lines[i].replace(/^\s*([-*+]|\d+[.)])\s+/, '');
        i++;
        let cls = '';
        const t = /^\[( |x|X)\]\s+(.*)/.exec(text);
        if (t) { cls = ' class="task"'; text = `<span class="tick ${t[1] === ' ' ? '' : 'on'}"></span>` + inline(t[2]); } else text = inline(text);
        let sub = '';
        if (i < lines.length && isList(lines[i]) && indentOf(lines[i]) > startIndent) sub = list(indentOf(lines[i]));
        html += `<li${cls}>${text}${sub}</li>`;
      }
      return html + (ordered ? '</ol>' : '</ul>');
    }

    while (i < lines.length) {
      const l = lines[i];
      if (!l.trim()) { i++; continue; }
      let m;
      if ((m = /^\s*(```|~~~)\s*(\w*)/.exec(l))) {
        const fence = m[1]; const buf = []; i++;
        while (i < lines.length && !lines[i].trim().startsWith(fence)) buf.push(lines[i++]);
        i++;
        out.push(`<pre><code>${esc(buf.join('\n'))}</code></pre>`);
      } else if ((m = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(l))) {
        const n = Math.min(m[1].length + 1, 5);
        out.push(`<h${n}>${inline(m[2])}</h${n}>`); i++;
      } else if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(l)) { out.push('<hr>'); i++; }
      else if (/^\s*>/.test(l)) {
        const buf = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) buf.push(lines[i++].replace(/^\s*>\s?/, ''));
        let cls = '', head = '';
        const a = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/i.exec(buf[0] || '');
        if (a) { const k = a[1].toUpperCase(); cls = ' class="alert ' + k.toLowerCase() + '"'; head = `<div class="atitle"><span class="emo">${ALERTS[k][0]}</span> ${ALERTS[k][1]}</div>`; buf.shift(); }
        out.push(`<blockquote${cls}>${head}${render(buf.join('\n'))}</blockquote>`);
      } else if (isList(l)) out.push(list(indentOf(l)));
      else if (/^\s*\|.*\|\s*$/.test(l) && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1] || '')) {
        const cells = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
        const head = cells(l); const al = cells(lines[i + 1]).map((c) => (/^:-+:$/.test(c) ? 'center' : /-+:$/.test(c) ? 'right' : 'left'));
        i += 2; const rows = [];
        while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) rows.push(cells(lines[i++]));
        out.push(`<div class="tbl"><table><thead><tr>${head.map((c, k) => `<th style="text-align:${al[k] || 'left'}">${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, k) => `<td style="text-align:${al[k] || 'left'}">${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      } else {
        const buf = [];
        while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|\s*>|\s*(```|~~~)|\s*([-*_])(\s*\3){2,}\s*$)/.test(lines[i]) && !(isList(lines[i]) && buf.length)) buf.push(lines[i++]);
        if (!buf.length) { buf.push(lines[i++]); }
        const html = inline(buf.join('\n'));
        out.push(/^(<img [^>]*>\s*)+$/.test(html.trim()) ? `<div class="imgs">${html}</div>` : `<p>${html}</p>`);
      }
    }
    return out.join('');
  }

  // texto simples (primeira frase útil) para resumo
  function summary(src, max = 150) {
    const clean = (raw) => raw.replace(/^#+\s*/, '').replace(/!\[[^\]]*\]\([^)]*\)|<[^>]+>/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`~>]/g, '').replace(/^\s*([-+]|\d+\.)\s+/, '').replace(/:([a-z0-9_+-]+):/g, (m, n) => EMOJI[n] || m).trim();
    const lines = String(src || '').split(/\r?\n/);
    const pick = (skipHeadings) => {
      for (const raw of lines) {
        if (skipHeadings && /^\s*(#|>|\||```|!\[|<img)/.test(raw)) continue;
        const t = clean(raw);
        if (t && !/^(-{3,}|\[!\w+\])$/.test(t)) return t.length > max ? t.slice(0, max - 1) + '…' : t;
      }
      return '';
    };
    return pick(true) || pick(false);
  }

  window.md = { render, summary };
})();
