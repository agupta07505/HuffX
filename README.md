# HuffX — *Every bit counts.*

Lossless **Huffman text compression** at **8 / 32 / 64 / 128-bit symbol widths** —
a **Next.js** app (App Router, plain CSS, `.js` everywhere) sitting on a
**100 % Python** compression engine. Every byte is crunched by Python.

**Team:** Animesh Gupta & Vikrant Krishna

---

## Run it

```bash
npm install
npm run build
npm start            # → http://localhost:5000
```

Dev mode: `npm run dev` (also on port 5000).

- **Compress** — drop a `.txt`, pick a width, get a `.hoffX` file back
- **Decompress** — drop any `.hoffX` file, get the original `.txt` back
- **Docs** — `/docs` · **Live animation** — `/animations`

## Architecture

```
browser ──► Next.js (App Router, port 5000)
              ├── app/page.js ............ home tool UI
              ├── app/docs ............... documentation
              ├── app/animations ......... live Huffman animation
              └── app/api/* .............. route handlers
                       │  spawn python3 pyengine.py …
                       ▼
              huffman.py — the pure-Python Huffman engine
```

The JavaScript never compresses anything itself: `pyengine.py` reads the upload,
calls `huffman.compress_bytes` / `decompress_bytes`, writes the result and returns
JSON stats to the route handler.

## Python engine, standalone (zero dependencies)

```bash
python huffman.py selftest                              # round-trip tests, all widths
python huffman.py compress essay.txt --width 32         # → essay.hoff32
python huffman.py decompress essay.hoff32               # → essay.txt
```

## Symbol widths

| Mode    | Symbol  | Output      | Loves                    |
|---------|---------|-------------|--------------------------|
| 8-bit   | 1 byte  | `.hoff8`    | general prose            |
| 32-bit  | 4 bytes | `.hoff32`   | words, logs              |
| 64-bit  | 8 bytes | `.hoff64`   | code, markup             |
| 128-bit | 16 bytes| `.hoff128`  | long repeated phrases    |

## .hoffX container (big-endian)

| Offset | Size | Field                                   |
|--------|------|-----------------------------------------|
| 0      | 4 B  | magic `HFX1`                            |
| 4      | 1 B  | width (8/32/64/128)                     |
| 5      | 1 B  | unused bits in final payload byte       |
| 6      | 8 B  | encoded symbol count                    |
| 14     | 8 B  | original byte length                    |
| 22     | 4 B  | codebook entry count                    |
| 26     | var  | codebook: symbol · code_len · code bits |
| …      | var  | payload bitstream                       |

## Project layout

```
huffx/
├── huffman.py            # the compressor (all the brains, zero dependencies)
├── pyengine.py           # thin bridge the API routes shell into
├── sample.txt            # built-in demo text
├── package.json
├── next.config.js
├── app/
│   ├── layout.js         # nav, footer, fonts, scripts
│   ├── page.js           # home — compress / decompress tool
│   ├── globals.css       # the whole white minimal design system
│   ├── docs/page.js
│   ├── animations/page.js
│   └── api/
│       ├── compress/route.js
│       ├── decompress/route.js
│       ├── sample/route.js
│       └── download/[token]/route.js
├── lib/engine.js         # spawn-python / temp-token helpers
└── public/js/            # main.js (tool logic) · anim.js (tree animation)
```

*Every bit counts.* ✦
