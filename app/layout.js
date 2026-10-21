import Script from 'next/script';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import ParticlesBackground from '@/components/ParticlesBackground';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const grotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-grotesk',
  display: 'swap',
});

export const metadata = {
  title: 'HuffX — Every bit counts.',
  description:
    'HuffX — Huffman text compression at 8, 32, 64 & 128-bit symbol widths. Pure Python engine. Every bit counts.',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable}`}>
      <body>
        <ParticlesBackground />

        <header className="nav" id="nav">
          <a className="brand" href="/" aria-label="HuffX home">
            <img src="/icon.svg" width="26" height="26" alt="HuffX logo" />
            <span>HuffX</span>
          </a>

          <div className="nav-links">
            <a href="/animations" className="nav-link">Animations</a>
            {/* Replace '#' with your actual project report link (e.g. Google Docs, PDF, or GitHub) */}
            <a
              href="#"
              className="report-btn"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Project Report"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
              </svg>
              <span>Project Report</span>
            </a>
          </div>
        </header>

        {children}

        <footer className="site-footer">
          <p className="foot-line">
            <span className="foot-brand">HuffX</span> © 2026 &nbsp;·&nbsp; Crafted with{' '}
            <span className="heart">♥</span> by <b>Animesh Gupta</b> &amp; <b>Vikrant Krishna</b>
          </p>
          <div className="foot-links">
            <a href="/">Workspace</a>
            <a href="/animations">Animations</a>
          </div>
        </footer>

        {/* Local bundled scripts - 100% offline and dependency-free */}
        <Script src="/js/gsap.min.js" strategy="beforeInteractive" />
        <Script src="/js/main.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
