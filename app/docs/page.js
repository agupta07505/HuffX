export const metadata = {
  title: 'Documentation — HuffX',
  description: 'How HuffX works: Huffman coding, four symbol widths, the .hoffX container format and the HTTP API.',
};

export default function Docs() {
  return (
    <main className="page">
      <p className="kicker">DOCUMENTATION</p>
      <h1 className="page-title">How HuffX works.</h1>
      <p className="page-sub">Huffman coding, four symbol widths, one small container format.</p>

      <section className="doc-sec">
        <h2><span className="hash">01</span> What it is</h2>
        <p>
          HuffX is a <b>lossless text compressor</b> built on <b>Huffman coding</b> (David A. Huffman, 1952):
          frequent symbols get short binary codes, rare symbols get long ones. The engine is{' '}
          <b>pure Python</b> (<code>huffman.py</code>); this site is a <b>Next.js</b> app whose API routes
          shell straight into the engine — so every byte is still crunched by Python.
        </p>
      </section>

      <section className="doc-sec">
        <h2><span className="hash">02</span> The four steps</h2>
        <div className="mini-grid">
          <div className="mini"><b>Scan</b><span>count symbol frequencies</span></div>
          <div className="mini"><b>Tree</b><span>merge the two lightest nodes, repeatedly</span></div>
          <div className="mini"><b>Codes</b><span>left = 0, right = 1; path = code</span></div>
          <div className="mini"><b>Pack</b><span>header + codebook + bitstream → .hoffX</span></div>
        </div>
      </section>

      <section className="doc-sec">
        <h2><span className="hash">03</span> Symbol widths</h2>
        <table className="tbl">
          <thead><tr><th>Width</th><th>Symbol</th><th>Loves</th><th>Output</th></tr></thead>
          <tbody>
            <tr><td><b>8-bit</b></td><td>1 byte</td><td>general prose</td><td><code>.hoff8</code></td></tr>
            <tr><td><b>32-bit</b></td><td>4 bytes</td><td>words, logs</td><td><code>.hoff32</code></td></tr>
            <tr><td><b>64-bit</b></td><td>8 bytes</td><td>code, markup</td><td><code>.hoff64</code></td></tr>
            <tr><td><b>128-bit</b></td><td>16 bytes</td><td>long repeated phrases</td><td><code>.hoff128</code></td></tr>
          </tbody>
        </table>
        <p className="note">
          Wider symbols capture longer patterns; the codebook grows but the payload shrinks.
          HuffX only stores symbols it actually met.
        </p>
      </section>

      <section className="doc-sec">
        <h2><span className="hash">04</span> .hoffX container</h2>
        <table className="tbl mono">
          <thead><tr><th>Offset</th><th>Size</th><th>Field</th></tr></thead>
          <tbody>
            <tr><td>0</td><td>4 B</td><td>magic <code>HFX1</code></td></tr>
            <tr><td>4</td><td>1 B</td><td>width (8 / 32 / 64 / 128)</td></tr>
            <tr><td>5</td><td>1 B</td><td>unused bits in final payload byte</td></tr>
            <tr><td>6</td><td>8 B</td><td>encoded symbol count</td></tr>
            <tr><td>14</td><td>8 B</td><td>original byte length</td></tr>
            <tr><td>22</td><td>4 B</td><td>codebook entry count</td></tr>
            <tr><td>26</td><td>var.</td><td>codebook: symbol · code_len · code bits</td></tr>
            <tr><td>…</td><td>var.</td><td>payload bitstream</td></tr>
          </tbody>
        </table>
        <p className="note">
          All multi-byte integers are big-endian. Decompression reads the header, rebuilds the
          codebook and walks the bitstream — no width picker needed.
        </p>
      </section>

      <section className="doc-sec">
        <h2><span className="hash">05</span> HTTP API</h2>
        <table className="tbl mono">
          <thead><tr><th>Method</th><th>Route</th><th>Form fields → result</th></tr></thead>
          <tbody>
            <tr><td>POST</td><td><code>/api/compress</code></td><td><code>file</code>, <code>width</code> → .hoffX</td></tr>
            <tr><td>POST</td><td><code>/api/decompress</code></td><td><code>file</code> → original .txt</td></tr>
            <tr><td>POST</td><td><code>/api/sample</code></td><td><code>width</code> → compress bundled sample</td></tr>
            <tr><td>GET</td><td><code>/api/download/&lt;token&gt;</code></td><td>download a produced file</td></tr>
          </tbody>
        </table>
        <pre className="code">{`curl -F "file=@essay.txt" -F "width=32" localhost:5000/api/compress
curl -F "file=@essay.hoff32"           localhost:5000/api/decompress`}</pre>
      </section>

      <section className="doc-sec">
        <h2><span className="hash">06</span> Complexity &amp; limits</h2>
        <div className="chips">
          <span className="chip">Build&nbsp; O(n + k log k)</span>
          <span className="chip">Decode&nbsp; O(n)</span>
          <span className="chip">Memory&nbsp; O(k)</span>
          <span className="chip ok">Lossless ✓</span>
        </div>
        <p className="note">
          k = distinct symbols · max upload 16 MB · text files for now ·
          very small files can grow (codebook overhead) — that&apos;s honest Huffman.
        </p>
      </section>

      <section className="doc-sec">
        <h2><span className="hash">07</span> Run it locally</h2>
        <pre className="code">{`npm install
npm run build
npm start                 # → http://localhost:5000

# the Python engine also works standalone (zero dependencies):
python huffman.py selftest
python huffman.py compress essay.txt --width 32     # → essay.hoff32
python huffman.py decompress essay.hoff32           # → essay.txt`}</pre>
      </section>
    </main>
  );
}
