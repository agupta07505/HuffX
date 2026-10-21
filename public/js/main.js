/* ==========================================================================
   HuffX — main.js (public, loaded by app/layout.js via next/script)
   particles background, entrance motion, and the compress/decompress tool.
   ========================================================================== */


/* -------------------------------------------------------- entrance motion */
function introAnim() {
  if (!window.gsap) return;
  const gsap = window.gsap;
  gsap.from('#nav', { y: -18, opacity: 0, duration: .55, ease: 'power3.out' });
  gsap.from(['.kicker', '.tagline', '.sub'], {
    y: 26, opacity: 0, duration: .7, stagger: .09, ease: 'power3.out', delay: .08
  });
  gsap.from('.tool-card', {
    y: 30, opacity: 0, duration: .75, ease: 'power3.out', delay: .3
  });
  gsap.from('.site-footer', { opacity: 0, duration: .8, delay: .9 });
}

/* --------------------------------------------------------------- helpers */
const $ = (s) => document.querySelector(s);

function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

/* tiny dependency-free count-up (works even if gsap fails to load) */
function countTo(el, end, { decimals = 0, suffix = '', ms = 900 } = {}) {
  const start = 0;
  const t0 = performance.now();
  function frame(t) {
    const p = Math.min((t - t0) / ms, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = (start + (end - start) * eased).toFixed(decimals) + suffix;
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function popIn(container) {
  if (!window.gsap) return;
  window.gsap.from(container.children, {
    y: 16, opacity: 0, duration: .5, stagger: .06, ease: 'power3.out', clearProps: 'all'
  });
}

/* ------------------------------------------------------------ the tool */
function initTool() {
  const dz = $('#dropzone'), fi = $('#fileInput'), chip = $('#fileChip');
  const cta = $('#goBtn'), errBox = $('#errBox'), result = $('#result');
  const stats = $('#stats'), wp = $('#widthPicker');
  const pill = $('.mode-pill');
  const modeBtns = Array.from(document.querySelectorAll('.mode-btn'));
  const growNote = $('#growNote');

  let mode = 'compress';
  let file = null;
  let width = 8;

  const MAX = 16 * 1024 * 1024;
  const EXT_OK = {
    compress: ['txt'],
    decompress: ['hoff8', 'hoff32', 'hoff64', 'hoff128']
  };

  /* ---- mode switching ---- */
  function movePill() {
    const active = $('.mode-btn.active');
    if (!active) return;
    pill.style.width = active.offsetWidth + 'px';
    pill.style.transform = `translateX(${active.offsetLeft - 4}px)`;
  }
  window.addEventListener('resize', movePill);

  function setMode(m) {
    mode = m;
    modeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === m));
    movePill();
    clearFile();
    hideResult();
    hideErr();
    if (m === 'compress') {
      $('#dropText').innerHTML = 'Drop your <b>.txt</b> file here';
      fi.accept = '.txt';
      $('#ctaLabel').textContent = 'Compress';
      wp.classList.remove('hidden');
    } else {
      $('#dropText').innerHTML = 'Drop your <b>.hoffX</b> file here';
      fi.accept = '.hoff8,.hoff32,.hoff64,.hoff128';
      $('#ctaLabel').textContent = 'Decompress';
      wp.classList.add('hidden');
    }
    if (window.gsap) window.gsap.fromTo('#toolCard', { scale: .985 }, { scale: 1, duration: .35, ease: 'back.out(2)' });
  }
  modeBtns.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
  requestAnimationFrame(movePill);
  window.addEventListener('load', movePill);

  /* ---- width picker ---- */
  wp.querySelectorAll('.wp-btn').forEach(b => {
    b.addEventListener('click', () => {
      wp.querySelectorAll('.wp-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      width = parseInt(b.dataset.width, 10);
      hideResult();
    });
  });

  /* ---- file handling ---- */
  function ext(name) { return (name.split('.').pop() || '').toLowerCase(); }

  function setFile(f) {
    hideErr();
    hideResult();
    if (f.size > MAX) return showErr('File too large — 16 MB max.');
    if (f.size === 0) return showErr('That file is empty.');
    if (!EXT_OK[mode].includes(ext(f.name))) {
      return showErr(mode === 'compress'
        ? 'Text files only for now — pick a .txt file.'
        : 'That doesn\u2019t look like a HuffX file — pick .hoff8 / .hoff32 / .hoff64 / .hoff128.');
    }
    file = f;
    $('#chipName').textContent = f.name;
    $('#chipSize').textContent = fmtBytes(f.size);
    chip.classList.remove('hidden');
    dz.classList.add('hidden');
    cta.disabled = false;
    if (window.gsap) window.gsap.from(chip, { y: 10, opacity: 0, duration: .35, ease: 'power3.out', clearProps: 'all' });
  }

  function clearFile() {
    file = null;
    fi.value = '';
    chip.classList.add('hidden');
    dz.classList.remove('hidden');
    cta.disabled = true;
  }

  ['dragenter', 'dragover'].forEach(ev =>
    dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev =>
    dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('over'); }));
  dz.addEventListener('drop', e => {
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) setFile(f);
  });
  dz.addEventListener('click', () => fi.click());
  dz.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fi.click(); }
  });
  fi.addEventListener('change', () => { if (fi.files[0]) setFile(fi.files[0]); });
  $('#chipRemove').addEventListener('click', e => { e.stopPropagation(); clearFile(); });

  /* ---- errors & loading ---- */
  function showErr(msg) {
    errBox.textContent = msg;
    errBox.classList.remove('hidden');
    if (window.gsap) window.gsap.from(errBox, { y: 8, opacity: 0, duration: .3, clearProps: 'all' });
  }
  function hideErr() { errBox.classList.add('hidden'); }

  function setLoading(on) {
    cta.classList.toggle('loading', on);
    cta.disabled = on || !file;
    $('#ctaLabel').textContent = on ? 'Crunching…'
      : (mode === 'compress' ? 'Compress' : 'Decompress');
  }

  function hideResult() {
    result.classList.add('hidden');
    growNote.classList.add('hidden');
  }

  /* ---- result rendering ---- */
  function showResult(filename, url) {
    $('#dlName').textContent = filename;
    $('#downloadBtn').href = url;
    result.classList.remove('hidden');
    popIn(result);
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function renderCompress(d) {
    const grew = d.saved_pct < 0;
    growNote.classList.toggle('hidden', !grew);
    const diff = d.original_size - d.compressed_size;
    const diffTxt = diff >= 0 ? `-${fmtBytes(diff)}` : `+${fmtBytes(Math.abs(diff))}`;

    stats.innerHTML = `
      <div class="result-banner ${grew ? 'banner-grow' : 'banner-save'}">
        <div class="banner-top">
          <span class="banner-label">${grew ? 'FILE SIZE INCREASED' : 'SPACE SAVED'}</span>
          <span class="banner-badge ${grew ? 'badge-warn' : 'badge-good'}">
            ${grew ? `${d.ratio}× larger` : `${d.ratio}× smaller`}
          </span>
        </div>
        <div class="banner-body">
          <div class="banner-pct" id="svPct">0%</div>
          <div class="banner-sizes">
            <span class="size-old">${fmtBytes(d.original_size)}</span>
            <span class="size-arr">➔</span>
            <span class="size-new">${fmtBytes(d.compressed_size)}</span>
            <span class="size-diff ${grew ? 'diff-bad' : 'diff-good'}">(${diffTxt})</span>
          </div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-box">
          <div class="sb-label">SYMBOL WIDTH</div>
          <div class="sb-val">${d.width}-bit</div>
          <div class="sb-sub">${d.width / 8} ${d.width === 8 ? 'byte' : 'bytes'} per symbol chunk</div>
        </div>

        <div class="stat-box">
          <div class="sb-label">VOCABULARY</div>
          <div class="sb-val">${d.distinct_symbols.toLocaleString()} <small>unique</small></div>
          <div class="sb-sub">of ${d.symbols.toLocaleString()} total symbols</div>
        </div>

        <div class="stat-box">
          <div class="sb-label">AVG BIT LENGTH</div>
          <div class="sb-val">${d.avg_len} <small>bits</small></div>
          <div class="sb-sub">entropy: ${d.entropy} (raw: ${d.width}b)</div>
        </div>

        <div class="stat-box">
          <div class="sb-label">CONTAINER OVERHEAD</div>
          <div class="sb-val">${fmtBytes(d.overhead)}</div>
          <div class="sb-sub">header + codebook table</div>
        </div>

        <div class="stat-box">
          <div class="sb-label">EXECUTION SPEED</div>
          <div class="sb-val">${d.ms} <small>ms</small></div>
          <div class="sb-sub">pure Python Huffman DSA</div>
        </div>

        <div class="stat-box">
          <div class="sb-label">COMPRESSION RATIO</div>
          <div class="sb-val">${d.ratio}×</div>
          <div class="sb-sub">${grew ? 'overhead exceeds savings' : 'input ÷ compressed size'}</div>
        </div>
      </div>
    `;

    showResult(d.filename, d.download);
    countTo($('#svPct'), Math.abs(d.saved_pct), { decimals: 1, suffix: '%' });
  }

  function renderDecompress(d) {
    stats.innerHTML = `
      <div class="result-banner banner-save">
        <div class="banner-top">
          <span class="banner-label">DECOMPRESSION SUCCESS</span>
          <span class="banner-badge badge-good">100% Lossless Match ✓</span>
        </div>
        <div class="banner-body">
          <div class="banner-pct">${fmtBytes(d.orig_size)}</div>
          <div class="banner-sizes">
            <span class="size-old">${fmtBytes(d.compressed_size)} in</span>
            <span class="size-arr">➔</span>
            <span class="size-new">${fmtBytes(d.orig_size)} restored</span>
          </div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-box">
          <div class="sb-label">DETECTED WIDTH</div>
          <div class="sb-val">${d.width}-bit</div>
          <div class="sb-sub">read from .hoffX header</div>
        </div>

        <div class="stat-box">
          <div class="sb-label">SYMBOLS RESTORED</div>
          <div class="sb-val">${d.symbols.toLocaleString()}</div>
          <div class="sb-sub">exact original stream decoded</div>
        </div>

        <div class="stat-box">
          <div class="sb-label">CODEBOOK LOOKUPS</div>
          <div class="sb-val">${d.codes.toLocaleString()}</div>
          <div class="sb-sub">distinct prefix-free codes</div>
        </div>

        <div class="stat-box">
          <div class="sb-label">DECODE DURATION</div>
          <div class="sb-val">${d.ms} <small>ms</small></div>
          <div class="sb-sub">pure Python bitstream unpack</div>
        </div>
      </div>
    `;

    showResult(d.filename, d.download);
  }

  /* ---- submit ---- */
  async function post(url, formData) {
    const res = await fetch(url, { method: 'POST', body: formData });
    let data = null;
    try { data = await res.json(); } catch (_) { /* non-JSON error page */ }
    if (!res.ok || !data || !data.ok) throw new Error((data && data.error) || `Server error (${res.status}).`);
    return data;
  }

  cta.addEventListener('click', async () => {
    hideErr();
    hideResult();
    if (!file) {
      return showErr(mode === 'compress' ? 'Pick a .txt file first.' : 'Pick a .hoffX file first.');
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      let d;
      if (mode === 'compress') {
        fd.append('width', width);
        d = await post('/api/compress', fd);
        renderCompress(d);
      } else {
        d = await post('/api/decompress', fd);
        renderDecompress(d);
      }
    } catch (e) {
      showErr(e.message);
    } finally {
      setLoading(false);
    }
  });


  /* ---- reset ---- */
  $('#resetBtn').addEventListener('click', () => {
    hideResult();
    clearFile();
    if (window.gsap) window.gsap.from(dz, { opacity: 0, y: 8, duration: .3, clearProps: 'all' });
  });
}

/* ------------------------------------------------------------------ boot */
function huffxBoot() {
  introAnim();
  if (document.getElementById('toolCard')) initTool();
}

/* next/script runs after hydration — DOMContentLoaded may already be gone */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', huffxBoot);
} else {
  huffxBoot();
}
