import styles from './page.module.css';

export default function Home() {
  return (
    <main className={`${styles.hero} hero`} id="hero">
      <p className={`${styles.kicker} kicker`}>HUFFMAN CODING · PURE PYTHON</p>
      <h1 className={`${styles.tagline} tagline`}>
        Every bit <em>counts.</em>
      </h1>
      <p className={`${styles.sub} sub`}>Lossless text compression at 8, 32, 64 &amp; 128-bit symbol widths.</p>

      <section className={`${styles.toolCard} tool-card`} id="toolCard" aria-label="Compression tool">
        <div className={`${styles.modeSwitch} mode-switch`} id="modeSwitch">
          <span className={`${styles.modePill} mode-pill`} aria-hidden="true"></span>
          <button className={`${styles.modeBtn} mode-btn active`} data-mode="compress" type="button">Compress</button>
          <button className={`${styles.modeBtn} mode-btn`} data-mode="decompress" type="button">Decompress</button>
        </div>

        <div className={`${styles.dropzone} dropzone`} id="dropzone" role="button" tabIndex={0} aria-label="Upload file">
          <svg
            className={`${styles.dzIcon} dz-icon`} viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          >
            <path d="M20 16.6A5 5 0 0 0 18 7h-1.3A8 8 0 1 0 4 15.3" />
            <path d="M12 12v9" />
            <path d="m8 16 4-4 4 4" />
          </svg>
          <p className={`${styles.dzText} dz-text`} id="dropText">
            Drop your <b>.txt</b> file here
          </p>
          <span className={`${styles.dzBrowse} dz-browse`}>or <u>browse files</u></span>
          <input type="file" id="fileInput" accept=".txt" hidden />
        </div>

        <div className={`${styles.fileChip} file-chip hidden`} id="fileChip">
          <svg
            viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor"
            strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
          <span className={`${styles.fcName} fc-name`} id="chipName">—</span>
          <span className={`${styles.fcSize} fc-size`} id="chipSize"></span>
          <button className={`${styles.fcX} fc-x`} id="chipRemove" type="button" title="Remove file" aria-label="Remove file">×</button>
        </div>

        <div className={`${styles.widthPicker} width-picker`} id="widthPicker">
          <span className={`${styles.wpLabel} wp-label`}>SYMBOL WIDTH</span>
          <div className={`${styles.wpOptions} wp-options`} role="radiogroup" aria-label="Symbol width">
            <button className={`${styles.wpBtn} wp-btn active`} data-width="8" type="button">8-bit<small>1 byte · classic</small></button>
            <button className={`${styles.wpBtn} wp-btn`} data-width="32" type="button">32-bit<small>4 bytes · words</small></button>
            <button className={`${styles.wpBtn} wp-btn`} data-width="64" type="button">64-bit<small>8 bytes · code</small></button>
            <button className={`${styles.wpBtn} wp-btn`} data-width="128" type="button">128-bit<small>16 bytes · repeats</small></button>
          </div>
        </div>

        <div className={`${styles.err} err hidden`} id="errBox" role="alert"></div>

        <button className={`${styles.cta} cta`} id="goBtn" type="button" disabled>
          <span className="cta-label" id="ctaLabel">Compress</span>
          <svg
            className={`${styles.ctaArrow} cta-arrow`} viewBox="0 0 24 24" width="19" height="19" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
          <span className={`${styles.spinner} spinner`} aria-hidden="true"></span>
        </button>

        <p className={`${styles.hint} hint`} id="hint">Lossless · outputs <b>.hoff8</b> · 16 MB max</p>

        <div className={`${styles.result} result hidden`} id="result">
          <div className={`${styles.stats} stats`} id="stats"></div>
          <p className={`${styles.growNote} grow-note hidden`} id="growNote">
            Tiny files can grow — the codebook sometimes outweighs the savings. Longer texts shine.
          </p>
          <a className={`${styles.download} download`} id="downloadBtn" href="#" download>
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
          <button className={`${styles.ghost} ghost`} id="resetBtn" type="button">↺&nbsp; another file</button>
        </div>
      </section>

      <div className={`${styles.steps} steps`} aria-hidden="true">
        <div className={`${styles.step} step`}><b>01</b><span>Drop a .txt</span></div>
        <div className={`${styles.step} step`}><b>02</b><span>Pick a width</span></div>
        <div className={`${styles.step} step`}><b>03</b><span>Get your .hoffX</span></div>
      </div>
    </main>
  );
}
