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
        <ParticlesBackground />

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

          <div className="nav-links">
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
        </footer>

        {/* Local bundled scripts - 100% offline and dependency-free */}
        <Script src="/js/gsap.min.js" strategy="beforeInteractive" />
        <Script src="/js/main.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
