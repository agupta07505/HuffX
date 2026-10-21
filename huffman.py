#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HuffX — Huffman Coding Engine (8 / 32 / 64 / 128-bit Symbol Widths)
===================================================================

A clean, pure-Python implementation of Huffman Coding for text compression.
Designed to be simple, well-structured, and easy to explain for academic vivas
and project demonstrations.

How Huffman Coding Works (The 5 Steps):
---------------------------------------
1. Frequency Counting:
   Count the occurrences of each symbol in the input data.
2. Build Huffman Tree:
   Place all leaf nodes into a min-heap priority queue. Repeatedly extract
   the two nodes with the lowest frequencies, merge them into a parent node
   with frequency equal to their sum, and push the parent back into the heap.
   Repeat until only 1 root node remains.
3. Generate Prefix Codes:
   Traverse the tree from the root to each leaf. Assign '0' for each left
   branch and '1' for each right branch. Every symbol gets a unique, prefix-free
   variable-length binary code (frequent symbols get short codes).
4. Bit-Packing & Container Serialization:
   Replace each symbol with its Huffman code, pack the variable-length bits
   into standard 8-bit bytes, and prepend a file header and codebook table.
5. Decompression:
   Read the header and codebook, then read the compressed bitstream bit by bit
   to restore the exact original bytes losslessly.
"""

from __future__ import annotations

import heapq
import math
import struct
import time
from collections import Counter

# File container constants
MAGIC = b"HFX1"                     # 4-byte container signature
VALID_WIDTHS = (8, 32, 64, 128)      # Supported symbol bit widths

# Header format (26 bytes total, big-endian):
# - 4s: Magic signature b"HFX1" (4 bytes)
# - B : Symbol bit width (1 byte: 8, 32, 64, or 128)
# - B : Padding bits in the final payload byte (1 byte: 0-7)
# - Q : Total symbol count (8 bytes unsigned int)
# - Q : Original data size in bytes (8 bytes unsigned int)
# - I : Number of codebook entries (4 bytes unsigned int)
_HEADER = struct.Struct(">4sBBQQI")
_U16 = struct.Struct(">H")          # 2-byte code length per codebook entry


class HuffXError(Exception):
    """Custom exception raised for compression/decompression errors."""
    pass


class HuffmanNode:
    """Represents a node in the Huffman binary tree.

    Attributes:
        symbol: The raw byte-sequence for this leaf (None for internal nodes).
        freq: Frequency of occurrence in the input data.
        left: Left child node (represents binary '0').
        right: Right child node (represents binary '1').
    """

    def __init__(self, symbol: bytes | None = None, freq: int = 0,
                 left: HuffmanNode | None = None, right: HuffmanNode | None = None):
        self.symbol = symbol
        self.freq = freq
        self.left = left
        self.right = right

    def is_leaf(self) -> bool:
        """Returns True if this node is a leaf (contains an actual symbol)."""
        return self.left is None and self.right is None

    def __lt__(self, other: HuffmanNode) -> bool:
        """Enables min-heap (heapq) to compare nodes based on frequency."""
        return self.freq < other.freq


def get_bytes_per_symbol(width: int) -> int:
    """Validate symbol width and return bytes per symbol (e.g., 8-bit -> 1 byte)."""
    if width not in VALID_WIDTHS:
        raise HuffXError(f"Invalid width {width}. Must be one of {VALID_WIDTHS}")
    return width // 8


# --------------------------------------------------------------------------
# Step 1 & 2: Building the Tree & Generating Prefix Codes
# --------------------------------------------------------------------------

def build_huffman_tree(freqs: Counter) -> HuffmanNode | None:
    """Build the Huffman Tree using a Min-Heap priority queue.

    Algorithm:
    1. Wrap every unique symbol and its frequency into a HuffmanNode.
    2. Add all nodes into a min-heap.
    3. While more than 1 node remains:
       a. Extract the two lightest nodes (smallest frequencies).
       b. Create a parent node with sum of their frequencies.
       c. Push the parent node back into the min-heap.
    4. The remaining single node is the root of our Huffman Tree.
    """
    if not freqs:
        return None

    # We store a unique counter as tie-breaker so Python never compares nodes directly
    heap: list[tuple[int, int, HuffmanNode]] = []
    tie_breaker = 0

    for symbol, count in freqs.items():
        heapq.heappush(heap, (count, tie_breaker, HuffmanNode(symbol=symbol, freq=count)))
        tie_breaker += 1

    # Edge case: only one unique symbol in the entire input
    if len(heap) == 1:
        return heap[0][2]

    while len(heap) > 1:
        freq1, _, node1 = heapq.heappop(heap)
        freq2, _, node2 = heapq.heappop(heap)

        parent = HuffmanNode(symbol=None, freq=freq1 + freq2, left=node1, right=node2)
        heapq.heappush(heap, (parent.freq, tie_breaker, parent))
        tie_breaker += 1

    return heap[0][2]


def generate_codes(root: HuffmanNode | None) -> dict[bytes, tuple[int, int]]:
    """Traverse the Huffman Tree recursively to assign binary prefix codes.

    Returns:
        dict mapping: symbol_bytes -> (code_integer, code_length_in_bits)
        Going LEFT appends bit 0; going RIGHT appends bit 1.
    """
    if root is None:
        return {}

    codes: dict[bytes, tuple[int, int]] = {}

    def _walk(node: HuffmanNode, current_code: int, depth: int):
        if node.is_leaf():
            # If the tree has only 1 symbol at the root, give it a 1-bit code '0'
            codes[node.symbol] = (current_code, max(depth, 1))
            return

        if node.left is not None:
            _walk(node.left, current_code << 1, depth + 1)
        if node.right is not None:
            _walk(node.right, (current_code << 1) | 1, depth + 1)

    _walk(root, 0, 0)
    return codes


# --------------------------------------------------------------------------
# Step 3: Compression
# --------------------------------------------------------------------------

def compress_bytes(data: bytes, width: int = 8) -> tuple[bytes, dict]:
    """Compress input bytes using Huffman coding.

    Parameters:
        data: The raw input bytes to compress.
        width: Symbol width in bits (8, 32, 64, or 128).

    Returns:
        tuple: (compressed_blob, meta_statistics_dictionary)
    """
    t0 = time.perf_counter()
    sps = get_bytes_per_symbol(width)

    # Pad data tail with null bytes if total length is not a multiple of symbol size
    n_symbols = (len(data) + sps - 1) // sps
    padded = data
    if n_symbols and (len(data) % sps):
        padded = data + b"\x00" * (sps - (len(data) % sps))

    # 1. Frequency counting
    freqs: Counter = Counter(padded[i:i + sps] for i in range(0, n_symbols * sps, sps)) if n_symbols else Counter()

    # 2. Build Huffman tree and prefix codes
    tree_root = build_huffman_tree(freqs)
    codes = generate_codes(tree_root)

    # 3. Bit-pack encoded symbols into bytes
    payload = bytearray()
    bit_buffer = 0
    bits_in_buffer = 0

    for i in range(0, len(padded), sps):
        sym = padded[i:i + sps]
        code, length = codes[sym]
        bit_buffer = (bit_buffer << length) | code
        bits_in_buffer += length

        # Flush full 8-bit bytes
        while bits_in_buffer >= 8:
            bits_in_buffer -= 8
            payload.append((bit_buffer >> bits_in_buffer) & 0xFF)
        bit_buffer &= (1 << bits_in_buffer) - 1

    # 4. Flush any remaining bits as the final byte
    pad_bits = 0
    if bits_in_buffer > 0:
        pad_bits = 8 - bits_in_buffer
        payload.append((bit_buffer << pad_bits) & 0xFF)

    # 5. Pack container header and codebook table
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

    # 6. Calculate statistics for project presentation
    elapsed_ms = (time.perf_counter() - t0) * 1000
    total_freq = sum(freqs.values()) or 1
    entropy = -sum((f / total_freq) * math.log2(f / total_freq) for f in freqs.values()) if freqs else 0.0
    avg_len = sum(freqs[s] * codes[s][1] for s in freqs) / total_freq if freqs else 0.0

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
        "ms": round(elapsed_ms, 2),
    }
    return bytes(blob), meta


# --------------------------------------------------------------------------
# Step 4: Decompression
# --------------------------------------------------------------------------

def decompress_bytes(blob: bytes) -> tuple[bytes, dict]:
    """Decompress a .hoffX binary blob back to original uncompressed bytes.

    Parameters:
        blob: The binary compressed data containing Header + Codebook + Payload.

    Returns:
        tuple: (restored_bytes, meta_statistics_dictionary)
    """
    t0 = time.perf_counter()
    try:
        if len(blob) < _HEADER.size:
            raise HuffXError("File is too small to be a valid .hoffX container.")

        magic, width, pad_bits, n_symbols, orig_size, n_codes = _HEADER.unpack_from(blob)
        if magic != MAGIC:
            raise HuffXError("Invalid file header signature. Expected HuffX format.")

        sps = get_bytes_per_symbol(width)
        offset = _HEADER.size

        # 1. Read Codebook
        lookup_table: dict[tuple[int, int], bytes] = {}
        for _ in range(n_codes):
            sym = bytes(blob[offset:offset + sps])
            offset += sps
            if len(sym) != sps:
                raise HuffXError("Corrupt codebook: truncated symbol bytes.")

            (length,) = _U16.unpack_from(blob, offset)
            offset += 2
            nbytes = (length + 7) // 8
            raw_int = int.from_bytes(blob[offset:offset + nbytes], "big")
            offset += nbytes
            code_int = raw_int >> (nbytes * 8 - length)
            lookup_table[(length, code_int)] = sym

        # 2. Decode Bitstream Payload
        payload = blob[offset:]
        total_bits = len(payload) * 8 - pad_bits

        out = bytearray()
        current_bits = 0
        current_len = 0
        bit_idx = 0

        for _ in range(n_symbols):
            while True:
                if bit_idx >= total_bits:
                    raise HuffXError("Corrupt payload: unexpected end of bitstream.")

                byte_val = payload[bit_idx >> 3]
                bit = (byte_val >> (7 - (bit_idx & 7))) & 1
                bit_idx += 1

                current_bits = (current_bits << 1) | bit
                current_len += 1

                sym = lookup_table.get((current_len, current_bits))
                if sym is not None:
                    out += sym
                    current_bits = 0
                    current_len = 0
                    break

                if current_len > 4096:
                    raise HuffXError("Corrupt payload: code length exceeded reasonable limit.")

    except HuffXError:
        raise
    except Exception as exc:
        raise HuffXError(f"Failed to decompress: {exc}") from exc

    if n_symbols and not lookup_table:
        raise HuffXError("Corrupt file: symbols present but empty codebook.")

    elapsed_ms = (time.perf_counter() - t0) * 1000
    meta = {
        "width": width,
        "orig_size": orig_size,
        "symbols": n_symbols,
        "codes": n_codes,
        "compressed_size": len(blob),
        "ms": round(elapsed_ms, 2),
    }

    # Slice out to original byte length to discard any trailing padding
    return bytes(out[:orig_size]), meta


# --------------------------------------------------------------------------
# CLI & Self-Testing for Project Demos
# --------------------------------------------------------------------------

def _format_size(num_bytes: float) -> str:
    """Format byte size into human-readable string (e.g. 1.2 KB)."""
    for unit in ("B", "KB", "MB", "GB"):
        if num_bytes < 1024 or unit == "GB":
            return f"{int(num_bytes)} {unit}" if unit == "B" else f"{num_bytes:.1f} {unit}"
        num_bytes /= 1024
    return f"{num_bytes} B"


def _selftest() -> None:
    """Run built-in verification tests to prove correctness."""
    test_cases = {
        "empty": b"",
        "single-char": b"A" * 24,
        "pangram": b"the quick brown fox jumps over the lazy dog " * 8,
        "repeated": b"Huffman Coding Project - Lossless Data Compression. " * 10,
        "code-sample": b"def compress(data): return huffman.encode(data)\n" * 15,
    }

    print(f"{'Test Case':<14} {'Width':>6} {'Input':>8} {'Output':>8} {'Saved':>8}  Result")
    print("-" * 55)
    all_passed = True

    for name, data in test_cases.items():
        for width in VALID_WIDTHS:
            compressed, meta = compress_bytes(data, width)
            restored, _ = decompress_bytes(compressed)
            is_valid = (restored == data)
            all_passed = all_passed and is_valid
            result_str = "PASS" if is_valid else "FAIL"
            print(f"{name:<14} {width:>5}b {len(data):>7}B {len(compressed):>7}B "
                  f"{meta['saved_pct']:>7.1f}%  {result_str}")

    print("\nSelftest status: " + ("ALL TESTS PASSED" if all_passed else "TESTS FAILED"))
    raise SystemExit(0 if all_passed else 1)


def _cli(argv=None) -> None:
    """Command-line interface for the Huffman compression engine."""
    import argparse
    parser = argparse.ArgumentParser(
        prog="huffman",
        description="HuffX: Huffman Text Compressor (8 / 32 / 64 / 128-bit symbols)"
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Compress subcommand
    c_parser = subparsers.add_parser("compress", help="Compress a text file into .hoffX")
    c_parser.add_argument("source", help="Path to input text file")
    c_parser.add_argument("destination", nargs="?", help="Optional path to output file")
    c_parser.add_argument("--width", type=int, default=8, choices=VALID_WIDTHS,
                          help="Symbol width in bits (8, 32, 64, or 128)")

    # Decompress subcommand
    d_parser = subparsers.add_parser("decompress", help="Decompress a .hoffX file back to text")
    d_parser.add_argument("source", help="Path to .hoffX file")
    d_parser.add_argument("destination", nargs="?", help="Optional path to restored output file")

    # Selftest subcommand
    subparsers.add_parser("selftest", help="Run automated round-trip tests across all widths")

    args = parser.parse_args(argv)

    if args.command == "selftest":
        _selftest()

    elif args.command == "compress":
        with open(args.source, "rb") as f:
            data = f.read()
        blob, meta = compress_bytes(data, args.width)
        dst = args.destination or f"{args.source.rsplit('.', 1)[0]}.hoff{args.width}"
        with open(dst, "wb") as f:
            f.write(blob)
        print(f"Compressed {_format_size(meta['original_size'])} -> {_format_size(meta['compressed_size'])} "
              f"({meta['saved_pct']}% saved, {meta['ratio']}x) -> {dst}")

    elif args.command == "decompress":
        with open(args.source, "rb") as f:
            blob = f.read()
        restored, meta = decompress_bytes(blob)
        dst = args.destination or (args.source.rsplit(".", 1)[0] + ".txt")
        with open(dst, "wb") as f:
            f.write(restored)
        print(f"Decompressed {_format_size(len(blob))} -> {_format_size(len(restored))} restored -> {dst}")


if __name__ == "__main__":
    _cli()
