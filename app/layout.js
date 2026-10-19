import Script from 'next/script';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

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
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%234f46e5'/%3E%3Ctext x='32' y='43' font-family='monospace' font-size='28' font-weight='bold' fill='white' text-anchor='middle'%3E01%3C/text%3E%3C/svg%3E",
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
        <div id="particles-js" aria-hidden="true"></div>

        <header className="nav" id="nav">
          <a className="brand" href="/" aria-label="HuffX home">
            <svg viewBox="0 0 26 26" width="26" height="26" fill="none" aria-hidden="true">
              <path d="M13 5.5 L6 14 M13 5.5 L20 14" stroke="#111114" strokeWidth="1.7" strokeLinecap="round" />
              <circle cx="13" cy="4.5" r="3.1" fill="#111114" />
              <circle cx="6" cy="16.5" r="3.6" fill="#4f46e5" />
              <circle cx="20" cy="16.5" r="3.6" fill="#fff" stroke="#4f46e5" strokeWidth="1.7" />
              <path d="M6 20.5 L6 23.5 M20 20.5 L20 23.5" stroke="#4f46e5" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span>HuffX</span>
          </a>
          <nav className="nav-links">
            <a href="/docs">Documentation</a>
            <a href="/animations">Animations</a>
          </nav>
        </header>

        {children}

        <footer className="site-footer">
          <p className="foot-line">
            <span className="foot-brand">HuffX</span> © 2026 &nbsp;·&nbsp; Crafted with{' '}
            <span className="heart">♥</span> by <b>Animesh Gupta</b> &amp; <b>Vikrant Krishna</b>
          </p>
          <nav className="foot-links" aria-label="Footer">
            <a href="/docs">Documentation</a>
            <span className="dot">·</span>
            <a href="/animations">Animations</a>
          </nav>
        </footer>

        {/* classic scripts, executed in order once the page is interactive */}
        <Script src="https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js" strategy="afterInteractive" />
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" strategy="afterInteractive" />
        <Script src="/js/main.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
