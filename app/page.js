export default function Home() {
  return (
    <main className="hero" id="hero">
      <p className="kicker">HUFFMAN CODING · PURE PYTHON</p>
      <h1 className="tagline">
        Every bit <em>counts.</em>
      </h1>
      <p className="sub">Lossless text compression at 8, 32, 64 &amp; 128-bit symbol widths.</p>

      <section className="tool-card" id="toolCard" aria-label="Compression tool">
        <div className="mode-switch" id="modeSwitch">
          <span className="mode-pill" aria-hidden="true"></span>
          <button className="mode-btn active" data-mode="compress" type="button">Compress</button>
          <button className="mode-btn" data-mode="decompress" type="button">Decompress</button>
        </div>

        <div className="dropzone" id="dropzone" role="button" tabIndex={0} aria-label="Upload file">
          <svg
            className="dz-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          >
            <path d="M20 16.6A5 5 0 0 0 18 7h-1.3A8 8 0 1 0 4 15.3" />
            <path d="M12 12v9" />
            <path d="m8 16 4-4 4 4" />
          </svg>
          <p className="dz-text" id="dropText">
            Drop your <b>.txt</b> file here
          </p>
          <span className="dz-browse">or <u>browse files</u></span>
          <input type="file" id="fileInput" accept=".txt" hidden />
        </div>

        <div className="file-chip hidden" id="fileChip">
          <svg
            viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor"
            strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
          <span className="fc-name" id="chipName">—</span>
          <span className="fc-size" id="chipSize"></span>
          <button className="fc-x" id="chipRemove" type="button" title="Remove file" aria-label="Remove file">×</button>
        </div>

        <div className="width-picker" id="widthPicker">
          <span className="wp-label">SYMBOL WIDTH</span>
          <div className="wp-options" role="radiogroup" aria-label="Symbol width">
            <button className="wp-btn active" data-width="8" type="button">8-bit<small>1 byte · classic</small></button>
            <button className="wp-btn" data-width="32" type="button">32-bit<small>4 bytes · words</small></button>
            <button className="wp-btn" data-width="64" type="button">64-bit<small>8 bytes · code</small></button>
            <button className="wp-btn" data-width="128" type="button">128-bit<small>16 bytes · repeats</small></button>
          </div>
        </div>

        <div className="err hidden" id="errBox" role="alert"></div>

        <button className="cta" id="goBtn" type="button" disabled>
          <span className="cta-label" id="ctaLabel">Compress</span>
          <svg
            className="cta-arrow" viewBox="0 0 24 24" width="19" height="19" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
          <span className="spinner" aria-hidden="true"></span>
        </button>

        <p className="hint" id="hint">Lossless · outputs <b>.hoff8</b> · 16 MB max</p>
        <p className="sample-line" id="sampleLine">
          No file handy? <button id="sampleBtn" type="button">try the sample.txt</button>
        </p>

        <div className="result hidden" id="result">
          <div className="stats" id="stats"></div>
          <p className="grow-note hidden" id="growNote">
            Tiny files can grow — the codebook sometimes outweighs the savings. Longer texts shine.
          </p>
          <a className="download" id="downloadBtn" href="#" download>
            <svg
              viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            >
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M4 21h16" />
            </svg>
            <span id="dlName">file.hoff8</span>
          </a>
          <button className="ghost" id="resetBtn" type="button">↺&nbsp; another file</button>
        </div>
      </section>

      <div className="steps" aria-hidden="true">
        <div className="step"><b>01</b><span>Drop a .txt</span></div>
        <div className="step"><b>02</b><span>Pick a width</span></div>
        <div className="step"><b>03</b><span>Get your .hoffX</span></div>
      </div>
    </main>
  );
}
