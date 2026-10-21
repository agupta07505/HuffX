import Script from 'next/script';
import styles from './page.module.css';

export const metadata = {
  title: 'Animations — HuffX',
  description: 'Watch Huffman think: a step-by-step animated build of a Huffman tree, from frequencies to packed bits.',
};

export default function Animations() {
  return (
    <main className={`${styles.page} page`}>
      <p className={`${styles.kicker} kicker`}>STEP-BY-STEP VISUALIZATION</p>
      <h1 className={`${styles.pageTitle} page-title`}>Watch Huffman think.</h1>
      <p className={`${styles.pageSub} page-sub`}>
        Building a tree for <b>ABRACADABRA</b> — count, merge, code, pack.
      </p>

      <section className={`${styles.vizCard} viz-card`} id="vizCard">
        <div className={`${styles.vizStage} viz-stage`} id="vizLetters"></div>
        <div className={`${styles.vizFreq} viz-freq`} id="vizFreq"></div>
        <div className={`${styles.vizTree} viz-tree`} id="vizTree"></div>
        <div className={`${styles.vizBottom} viz-bottom`}>
          <div className={`${styles.vizCodes} viz-codes`} id="vizCodes"></div>
          <div className={`${styles.vizBitsWrap} viz-bits-wrap`}>
            <div className={`${styles.vizBits} viz-bits`} id="vizBits"></div>
            <div className={`${styles.vizVerdict} viz-verdict`} id="vizVerdict"></div>
          </div>
        </div>
        <button className={`${styles.cta} cta slim`} id="replayBtn" type="button">↺&nbsp; Replay</button>
      </section>

      <Script src="/js/anim.js" strategy="afterInteractive" />
    </main>
  );
}
