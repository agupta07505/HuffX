import Script from 'next/script';

export const metadata = {
  title: 'Animations — HuffX',
  description: 'Watch Huffman think: a step-by-step animated build of a Huffman tree, from frequencies to packed bits.',
};

export default function Animations() {
  return (
    <main className="page">
      <p className="kicker">STEP-BY-STEP VISUALIZATION</p>
      <h1 className="page-title">Watch Huffman think.</h1>
      <p className="page-sub">
        Building a tree for <b>ABRACADABRA</b> — count, merge, code, pack.
      </p>

      <section className="viz-card" id="vizCard">
        <div className="viz-stage" id="vizLetters"></div>
        <div className="viz-freq" id="vizFreq"></div>
        <div className="viz-tree" id="vizTree"></div>
        <div className="viz-bottom">
          <div className="viz-codes" id="vizCodes"></div>
          <div className="viz-bits-wrap">
            <div className="viz-bits" id="vizBits"></div>
            <div className="viz-verdict" id="vizVerdict"></div>
          </div>
        </div>
        <button className="cta slim" id="replayBtn" type="button">↺&nbsp; Replay</button>
      </section>

      <section className="own-anim">
        <h3>Your animation lives here</h3>
        <p>
          Set <code>ANIM_MEDIA_URL</code> at the top of <code>public/js/anim.js</code> to any
          YouTube / Drive / .mp4 link and it embeds right here — then link it from the footer.
        </p>
        <div id="ownSlot" className="own-slot"></div>
      </section>

      <Script src="/js/anim.js" strategy="afterInteractive" />
    </main>
  );
}
