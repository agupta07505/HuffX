/* ==========================================================================
   HuffX — animations page (public, loaded by app/animations/page.js)
   Replays the whole Huffman pipeline on "ABRACADABRA":
   count → merge tree → codes → packed bits.
   Drop your own video/GIF below with ANIM_MEDIA_URL.
   ========================================================================== */

const ANIM_MEDIA_URL = '';   // ← e.g. 'https://www.youtube.com/embed/VIDEO_ID' or a .mp4 link

const VIZ_TEXT = 'ABRACADABRA';
const COLORS = { A: '#4f46e5', B: '#0ea5e9', C: '#f59e0b', D: '#10b981', R: '#ef4444' };

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const STEP = REDUCED ? 0 : 1;

/* ------------------------------------------------------------------ math */
function buildHuffman(text) {
  const freq = {};
  for (const ch of text) freq[ch] = (freq[ch] || 0) + 1;

  let idc = 0;
  let forest = Object.entries(freq)
    .map(([ch, f]) => ({ ch, f, id: idc++, left: null, right: null }));
  const merges = [];

  while (forest.length > 1) {
    forest.sort((a, b) => a.f - b.f || a.id - b.id);
    const a = forest.shift(), b = forest.shift();
    const p = { ch: null, f: a.f + b.f, id: idc++, left: a, right: b };
    merges.push([a.id, b.id, p.id]);
    forest.push(p);
  }
  const root = forest[0];

  const codes = {};
  (function dfs(n, path) {
    if (!n) return;
    if (n.ch !== null) { codes[n.ch] = path.length ? path : '0'; return; }
    dfs(n.left, path + '0');
    dfs(n.right, path + '1');
  })(root, '');

  return { freq, root, merges, codes };
}

function layoutTree(root) {
  const pos = new Map();
  let leaves = 0, depth = 0;
  (function place(n, d) {
    depth = Math.max(depth, d);
    if (!n.left && !n.right) { pos.set(n.id, { x: leaves++, d }); return; }
    place(n.left, d + 1);
    place(n.right, d + 1);
    pos.set(n.id, { x: (pos.get(n.left.id).x + pos.get(n.right.id).x) / 2, d });
  })(root, 0);
  return { pos, leaves, depth };
}

/* collect every node by id for rendering */
function collectNodes(root) {
  const map = new Map();
  (function walk(n) {
    if (!n) return;
    map.set(n.id, n);
    walk(n.left); walk(n.right);
  })(root);
  return map;
}

/* ---------------------------------------------------------------- render */
const DX = 88, DY = 84, R = 21, PAD = 24;

function px(p) { return PAD + p.x * DX + DX / 2; }
function py(p) { return PAD + p.d * DY + R + 4; }

function renderTree(root, pos, leaves, depth) {
  const nodes = collectNodes(root);
  const W = PAD * 2 + (leaves - 1) * DX + DX;
  const H = PAD * 2 + depth * DY + R * 2 + 26;

  let edges = '', groups = '';

  for (const n of nodes.values()) {
    if (n.left) {
      const pl = pos.get(n.left.id);
      edges += `<line class="viz-edge" id="e-${n.id}-${n.left.id}" x1="${px(pos.get(n.id))}" y1="${py(pos.get(n.id)) + R}" x2="${px(pl)}" y2="${py(pl) - R}"/>`;
    }
    if (n.right) {
      const pr = pos.get(n.right.id);
      edges += `<line class="viz-edge" id="e-${n.id}-${n.right.id}" x1="${px(pos.get(n.id))}" y1="${py(pos.get(n.id)) + R}" x2="${px(pr)}" y2="${py(pr) - R}"/>`;
    }
  }

  for (const n of nodes.values()) {
    const leaf = n.ch !== null;
    const p = pos.get(n.id);
    const color = leaf ? (COLORS[n.ch] || '#4f46e5') : '#111114';
    groups += `
      <g class="viz-node ${leaf ? 'leaf' : ''}" id="n-${n.id}" opacity="0" transform="translate(0,8)">
        <circle cx="${px(p)}" cy="${py(p)}" r="${R}" ${leaf ? `stroke="${color}"` : ''}/>
        ${leaf
          ? `<text x="${px(p)}" y="${py(p) + 5}" font-size="15" text-anchor="middle" fill="${color}">${n.ch}</text>
             <text class="nfreq" x="${px(p)}" y="${py(p) + R + 15}" font-size="10" text-anchor="middle">×${n.f}</text>`
          : `<text class="nfreq" x="${px(p)}" y="${py(p) + 4}" font-size="11" text-anchor="middle" fill="#6b7280">${n.f}</text>`
        }
      </g>`;
  }

  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Huffman tree">${edges}${groups}</svg>`;
}

/* --------------------------------------------------------------- sequence */
async function playViz() {
  const { freq, root, merges, codes } = buildHuffman(VIZ_TEXT);
  const { pos, leaves, depth } = layoutTree(root);

  const lettersEl = document.getElementById('vizLetters');
  const freqEl = document.getElementById('vizFreq');
  const treeEl = document.getElementById('vizTree');
  const codesEl = document.getElementById('vizCodes');
  const bitsEl = document.getElementById('vizBits');
  const verdictEl = document.getElementById('vizVerdict');

  lettersEl.innerHTML = ''; freqEl.innerHTML = ''; treeEl.innerHTML = '';
  codesEl.innerHTML = ''; bitsEl.innerHTML = ''; verdictEl.innerHTML = '';

  /* 1 — the text */
  for (const ch of VIZ_TEXT) {
    const s = document.createElement('span');
    s.className = 'viz-letter';
    s.style.borderColor = COLORS[ch] || '#e8e9ef';
    s.style.color = COLORS[ch] || '#111114';
    s.textContent = ch;
    lettersEl.appendChild(s);
  }
  if (window.gsap) window.gsap.from(lettersEl.children, { y: -18, opacity: 0, rotationX: -60, stagger: .045 * STEP, duration: .45 * STEP, ease: 'back.out(2)' });
  await sleep(850 * STEP);

  /* 2 — frequency bars */
  const syms = Object.keys(freq).sort((a, b) => freq[b] - freq[a]);
  const maxF = Math.max(...Object.values(freq));
  for (const s of syms) {
    const item = document.createElement('div');
    item.className = 'freq-item';
    item.innerHTML = `
      <span class="freq-sym" style="color:${COLORS[s]}">${s}</span>
      <div class="freq-bar-track"><div class="freq-bar" style="background:${COLORS[s]}"></div></div>
      <span class="freq-fig">×${freq[s]}</span>`;
    freqEl.appendChild(item);
  }
  if (window.gsap) {
    window.gsap.from(freqEl.children, { y: 14, opacity: 0, stagger: .07 * STEP, duration: .4 * STEP, ease: 'power3.out' });
    freqEl.querySelectorAll('.freq-bar').forEach(bar => {
      const f = freq[bar.closest('.freq-item').querySelector('.freq-sym').textContent];
      window.gsap.to(bar, { width: (f / maxF * 100) + '%', duration: .8 * STEP, ease: 'power3.out', delay: .25 * STEP });
    });
  } else {
    freqEl.querySelectorAll('.freq-bar').forEach(bar => {
      const f = freq[bar.closest('.freq-item').querySelector('.freq-sym').textContent];
      bar.style.width = (f / maxF * 100) + '%';
    });
  }
  await sleep(1400 * STEP);

  /* 3 — the tree, merge by merge */
  treeEl.innerHTML = renderTree(root, pos, leaves, depth);
  if (window.gsap) window.gsap.from(freqEl, { opacity: 0, height: 0, marginTop: 0, duration: .5 * STEP, ease: 'power2.in' });
  else freqEl.style.display = 'none';
  await sleep(520 * STEP);

  const nodes = collectNodes(root);
  const leafIds = [...nodes.values()].filter(n => n.ch !== null).map(n => n.id);

  for (const id of leafIds) {
    const g = document.getElementById(`n-${id}`);
    if (window.gsap) window.gsap.to(g, { opacity: 1, y: 0, duration: .35 * STEP, ease: 'back.out(2.5)' });
    else { g.setAttribute('opacity', 1); g.setAttribute('transform', ''); }
    await sleep(110 * STEP);
  }

  for (const [a, b, p] of merges) {
    for (const [edge, dur] of [[`e-${p}-${a}`, .28], [`e-${p}-${b}`, .28]]) {
      const line = document.getElementById(edge);
      const len = Math.hypot(line.x2.baseVal.value - line.x1.baseVal.value,
                             line.y2.baseVal.value - line.y1.baseVal.value);
      line.style.strokeDasharray = len;
      line.style.strokeDashoffset = len;
      if (window.gsap) window.gsap.to(line, { strokeDashoffset: 0, duration: dur * STEP, ease: 'power1.out' });
      else line.style.strokeDashoffset = 0;
    }
    const pg = document.getElementById(`n-${p}`);
    if (window.gsap) window.gsap.to(pg, { opacity: 1, y: 0, duration: .4 * STEP, delay: .15 * STEP, ease: 'back.out(3)' });
    else { pg.setAttribute('opacity', 1); pg.setAttribute('transform', ''); }
    await sleep(430 * STEP);
  }

  const rootG = document.getElementById(`n-${root.id}`);
  if (window.gsap && rootG) window.gsap.fromTo(rootG, { scale: 1 }, { scale: 1.12, transformOrigin: '50% 50%', yoyo: true, repeat: 1, duration: .22 * STEP });
  await sleep(650 * STEP);

  /* 4 — code table */
  let rows = '';
  for (const s of syms) {
    rows += `<tr>
      <td style="color:${COLORS[s]}">${s}</td>
      <td class="freq-col">×${freq[s]}</td>
      <td class="code-col" style="color:${COLORS[s]}">${codes[s]}</td>
    </tr>`;
  }
  codesEl.innerHTML = `<table>
    <thead><tr><th>sym</th><th>freq</th><th>code</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
  if (window.gsap) window.gsap.from(codesEl.querySelectorAll('tr'), { x: -14, opacity: 0, stagger: .08 * STEP, duration: .4 * STEP, ease: 'power2.out' });
  await sleep(900 * STEP);

  /* 5 — the packed bitstream */
  let encodedBits = 0;
  for (const ch of VIZ_TEXT) {
    const g = document.createElement('span');
    g.className = 'bitgroup';
    g.style.color = COLORS[ch];
    g.textContent = codes[ch];
    bitsEl.appendChild(g);
    encodedBits += codes[ch].length;
  }
  if (window.gsap) window.gsap.from(bitsEl.children, { opacity: 0, y: 8, stagger: .04 * STEP, duration: .3 * STEP });

  const rawBits = VIZ_TEXT.length * 8;
  const saved = Math.round((1 - encodedBits / rawBits) * 100);
  verdictEl.innerHTML =
    `<b>${encodedBits} bits</b> vs ${rawBits} raw ASCII — <b>${saved}% smaller</b> · avg ${(encodedBits / VIZ_TEXT.length).toFixed(2)} bits/char`;
  if (window.gsap) window.gsap.from(verdictEl, { opacity: 0, y: 10, delay: .5 * STEP, duration: .5 * STEP, ease: 'power2.out' });
}

/* your own media slot */
function mountOwnSlot() {
  const slot = document.getElementById('ownSlot');
  if (!slot || !ANIM_MEDIA_URL) return;
  const isVideo = /\.(mp4|webm|ogg)(\?|$)/i.test(ANIM_MEDIA_URL);
  slot.innerHTML = isVideo
    ? `<video controls src="${ANIM_MEDIA_URL}"></video>`
    : `<iframe src="${ANIM_MEDIA_URL}" allowfullscreen loading="lazy" title="Team animation"></iframe>`;
}

/* ------------------------------------------------------------------ boot */
function animBoot() {
  if (!document.getElementById('vizTree')) return;
  mountOwnSlot();
  (function startWhenReady(tries) {
    if (window.gsap || REDUCED || tries > 40) { playViz(); return; }
    setTimeout(() => startWhenReady(tries + 1), 100);
  })(0);
  document.getElementById('replayBtn').addEventListener('click', playViz);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', animBoot);
} else {
  animBoot();
}
