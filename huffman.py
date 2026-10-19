#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HuffX core — Huffman coding engine (8 / 32 / 64 / 128-bit symbols)
====================================================================

Pure-Python, dependency-free compressor used by the HuffX web app.

Symbol widths
-------------
A *symbol* is a fixed-width chunk of the input:

==========  ==========  ================
width       chunk       output file
==========  ==========  ================
8-bit       1 byte      ``*.hoff8``
32-bit      4 bytes     ``*.hoff32``
64-bit      8 bytes     ``*.hoff64``
128-bit     16 bytes    ``*.hoff128``
==========  ==========  ================

.hoffX container layout (big-endian)
------------------------------------
::

    offset  size  field
    ------  ----  --------------------------------------------------
    0       4     magic ``b"HFX1"``
    4       1     symbol width in bits: 8 | 32 | 64 | 128
    5       1     pad_bits: unused bits in the last payload byte (0-7)
    6       8     n_symbols: encoded symbol count (tail is \\x00-padded)
    14      8     orig_size: exact original byte length
    22      4     n_codes: number of codebook entries
    26      var.  codebook x n_codes, each entry:
                      symbol bytes (width/8)
                      code_len (2 B)
                      code bits (ceil(code_len/8) B, left-aligned)
    ...     var.  payload bitstream

Round-trip guarantee:  decompress_bytes(compress_bytes(d, w)[0])[0] == d

Team HuffX — Animesh Gupta & Vikrant Krishna.
"""

from __future__ import annotations

import heapq
import math
import struct
import time
from collections import Counter

MAGIC = b"HFX1"
VALID_WIDTHS = (8, 32, 64, 128)

_HEADER = struct.Struct(">4sBBQQI")  # magic, width, pad_bits, n_symbols, orig_size, n_codes
_U16 = struct.Struct(">H")           # code length per codebook entry


class HuffXError(Exception):
    """Raised for anything the engine refuses to crunch (or un-crunch)."""


def _sps(width: int) -> int:
    """Bytes per symbol for a bit width, validating it on the way."""
    if width not in VALID_WIDTHS:
        raise HuffXError(f"width must be one of {VALID_WIDTHS}, got {width!r}")
    return width // 8


def _build_codes(freqs: Counter) -> dict:
    """Frequencies -> prefix codes: {symbol_bytes: (code_int, code_len_bits)}.

    Classic Huffman: repeatedly pop the two lightest nodes from a min-heap
    and merge them, then read codes off the resulting tree (left=0, right=1).
    """
    heap = [(f, i, ("leaf", sym)) for i, (sym, f) in enumerate(freqs.items())]
    heapq.heapify(heap)
    uid = len(heap)  # tiebreaker so tree nodes are never compared

    if len(heap) == 1:  # single distinct symbol -> artificial 1-bit code
        return {heap[0][2][1]: (0, 1)}

    while len(heap) > 1:
        f1, _, t1 = heapq.heappop(heap)
        f2, _, t2 = heapq.heappop(heap)
        heapq.heappush(heap, (f1 + f2, uid, ("node", t1, t2)))
        uid += 1

    codes = {}
    stack = [(heap[0][2], 0, 0)]  # (subtree, code-so-far, depth)
    while stack:
        node, code, depth = stack.pop()
        if node[0] == "leaf":
            codes[node[1]] = (code, max(depth, 1))
        else:
            _, left, right = node
            stack.append((left, code << 1, depth + 1))
            stack.append((right, (code << 1) | 1, depth + 1))
    return codes


def compress_bytes(data: bytes, width: int = 8):
    """Compress ``data`` -> ``(hoffX_blob, meta_dict)``."""
    t0 = time.perf_counter()
    sps = _sps(width)

    n_symbols = (len(data) + sps - 1) // sps
    padded = data
    if n_symbols and len(data) % sps:
        padded = data + b"\x00" * (sps - len(data) % sps)  # zero-pad tail chunk

    freqs: Counter = (
        Counter(padded[i:i + sps] for i in range(0, n_symbols * sps, sps))
        if n_symbols else Counter()
    )
    codes = _build_codes(freqs) if freqs else {}

    # ---- payload bitstream ------------------------------------------------
    payload = bytearray()
    acc = nbits = 0
    for i in range(0, len(padded), sps):
        code, length = codes[padded[i:i + sps]]
        acc = (acc << length) | code
        nbits += length
        while nbits >= 8:
            nbits -= 8
            payload.append((acc >> nbits) & 0xFF)
        acc &= (1 << nbits) - 1  # drop bits we already flushed
    pad_bits = 0
    if nbits:  # flush final partial byte
        pad_bits = 8 - nbits
        payload.append((acc << pad_bits) & 0xFF)

    # ---- header + codebook ------------------------------------------------
    blob = bytearray()
    blob += _HEADER.pack(MAGIC, width, pad_bits, n_symbols, len(data), len(codes))
    codebook_bytes = 0
    for sym in sorted(codes):
        code, length = codes[sym]
        nbytes = (length + 7) // 8
        blob += sym
        blob += _U16.pack(length)
        blob += (code << (nbytes * 8 - length)).to_bytes(nbytes, "big")
        codebook_bytes += sps + 2 + nbytes
    blob += payload

    # ---- stats ------------------------------------------------------------
    ms = (time.perf_counter() - t0) * 1000
    total = sum(freqs.values()) or 1
    entropy = -sum((f / total) * math.log2(f / total) for f in freqs.values()) if freqs else 0.0
    avg_len = sum(freqs[s] * codes[s][1] for s in freqs) / total if freqs else 0.0
    meta = {
        "width": width,
        "original_size": len(data),
        "compressed_size": len(blob),
        "payload_size": len(payload),
        "overhead": _HEADER.size + codebook_bytes,
        "ratio": round(len(data) / len(blob), 3) if blob else 0.0,
        "saved_pct": round((1 - len(blob) / len(data)) * 100, 1) if data else 0.0,
        "symbols": n_symbols,
        "distinct_symbols": len(codes),
        "avg_len": round(avg_len, 3),
        "entropy": round(entropy, 3),
        "ms": round(ms, 2),
    }
    return bytes(blob), meta


def decompress_bytes(blob: bytes):
    """Expand a ``.hoffX`` blob -> ``(original_bytes, meta_dict)``.

    The width is auto-detected from the container header.
    """
    t0 = time.perf_counter()
    try:
        if len(blob) < _HEADER.size:
            raise HuffXError("File too small to be a .hoffX container.")
        magic, width, pad_bits, n_symbols, orig_size, n_codes = _HEADER.unpack_from(blob)
        if magic != MAGIC:
            raise HuffXError("Not a HuffX file — bad magic bytes. Pick a .hoff8/.hoff32/.hoff64/.hoff128 file.")
        sps = _sps(width)
        off = _HEADER.size

        table = {}
        for _ in range(n_codes):
            sym = bytes(blob[off:off + sps])
            off += sps
            if len(sym) != sps:
                raise HuffXError("Corrupt codebook — file is truncated.")
            (length,) = _U16.unpack_from(blob, off)
            off += 2
            nbytes = (length + 7) // 8
            raw = int.from_bytes(blob[off:off + nbytes], "big")
            off += nbytes
            table[(length, raw >> (nbytes * 8 - length))] = sym

        payload = blob[off:]
        total_bits = len(payload) * 8 - pad_bits

        out = bytearray()
        acc = length = i = 0
        for _ in range(n_symbols):
            while True:
                if i >= total_bits:
                    raise HuffXError("Corrupt payload — ran out of bits mid-decode.")
                acc = (acc << 1) | ((payload[i >> 3] >> (7 - (i & 7))) & 1)
                i += 1
                length += 1
                sym = table.get((length, acc))
                if sym is not None:
                    out += sym
                    acc = length = 0
                    break
                if length > 8192:  # defensive — should never trigger
                    raise HuffXError("Corrupt payload — implausible code length.")
    except HuffXError:
        raise
    except Exception as exc:  # struct.error & friends -> friendly message
        raise HuffXError("Corrupt or unsupported .hoffX file.") from exc

    if n_symbols and not table:
        raise HuffXError("Corrupt file — symbols encoded but empty codebook.")

    ms = (time.perf_counter() - t0) * 1000
    meta = {
        "width": width,
        "orig_size": orig_size,
        "symbols": n_symbols,
        "codes": n_codes,
        "compressed_size": len(blob),
        "ms": round(ms, 2),
    }
    return bytes(out[:orig_size]), meta  # truncation drops the zero-pad tail


# --------------------------------------------------------------------------
# CLI — handy for demos & viva:  python huffman.py ...
# --------------------------------------------------------------------------

def _fmt(n: float) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024 or unit == "GB":
            return f"{int(n)} {unit}" if unit == "B" else f"{n:.1f} {unit}"
        n /= 1024
    return f"{n} B"


def _selftest() -> None:
    texts = {
        "empty": b"",
        "one-char": b"aaaaaaaaaaaaaaaa",
        "pangram": b"the quick brown fox jumps over the lazy dog " * 12,
        "code-ish": b"def compress(data, width):\n    return huffman.pack(data, width)\n" * 30,
        "utf8": ("नमस्ते HuffX — every bit counts! ¡olé! ".encode("utf-8")) * 25,
    }
    print(f"{'text':<9} {'width':>5} {'in':>7} {'out':>7} {'saved':>8}  result")
    all_ok = True
    for name, data in texts.items():
        for w in VALID_WIDTHS:
            blob, m = compress_bytes(data, w)
            back, _ = decompress_bytes(blob)
            ok = back == data
            all_ok &= ok
            print(f"{name:<9} {w:>4}  {len(data):>6}  {len(blob):>6} "
                  f"{m['saved_pct']:>7.1f}%  {'PASS' if ok else 'FAIL'}")
    print("\nAll round-trips " + ("passed ✓" if all_ok else "FAILED ✗"))
    raise SystemExit(0 if all_ok else 1)


def _cli(argv=None) -> None:
    import argparse
    ap = argparse.ArgumentParser(
        prog="huffman",
        description="HuffX — Huffman text compressor (8/32/64/128-bit symbols)")
    sub = ap.add_subparsers(dest="cmd", required=True)

    c = sub.add_parser("compress", help="file -> .hoffX")
    c.add_argument("src")
    c.add_argument("dst", nargs="?")
    c.add_argument("--width", type=int, default=8, choices=VALID_WIDTHS)

    d = sub.add_parser("decompress", help=".hoffX -> original file")
    d.add_argument("src")
    d.add_argument("dst", nargs="?")

    sub.add_parser("selftest", help="run round-trip tests at every width")
    args = ap.parse_args(argv)

    if args.cmd == "selftest":
        _selftest()

    if args.cmd == "compress":
        data = open(args.src, "rb").read()
        blob, meta = compress_bytes(data, args.width)
        dst = args.dst or f"{args.src.rsplit('.', 1)[0]}.hoff{args.width}"
        open(dst, "wb").write(blob)
        print(f"{_fmt(meta['original_size'])} -> {_fmt(meta['compressed_size'])} "
              f"({meta['saved_pct']}% saved, {meta['ratio']}x)  ->  {dst}")
    else:
        blob = open(args.src, "rb").read()
        raw, meta = decompress_bytes(blob)
        dst = args.dst or args.src.rsplit(".", 1)[0] + ".txt"
        open(dst, "wb").write(raw)
        print(f"{_fmt(len(blob))} -> {_fmt(len(raw))} restored  ->  {dst}")


if __name__ == "__main__":
    _cli()
