# HuffX — Lossless Huffman Data Compression System
> *Every bit counts.* ✦

---

### Project Overview
- **Project Title:** HuffX — Lossless Data Compression System with Multi-Symbol Widths
- **Domain:** Data Structures & Algorithms (DSA), Information Theory, Systems Programming
- **Core Engine:** Pure Python 3 (Zero external dependencies, standard-library DSA)
- **Web Interface:** Next.js (App Router, Modular CSS, HTML5 Canvas)
- **Contributors:** **Animesh Gupta** & **Vikrant Krishna**
- **Status:** Complete, Lossless Verified

---

## 1. What is HuffX?

**HuffX** is a complete, lossless data compression system built upon **Huffman Coding** (David A. Huffman, 1952), a greedy algorithm that produces optimal, minimum-redundancy prefix codes.

While standard textbook implementations are limited to compressing single characters (8 bits / 1 byte at a time), HuffX introduces **variable-width symbol chunking (8, 32, 64, and 128 bits)**. By treating multi-byte words, programming keywords, and recurring phrase patterns as single symbols, HuffX achieves compression ratios of up to **87%+ space saved** on repetitive text and source code.

---

## 2. Multi-Symbol Widths: The Innovation

Standard 8-bit Huffman treats every character in isolation. HuffX allows configuring the symbol chunk width:

| Symbol Width | Chunk Size | Output Extension | Best For | Why It Excels |
|---|---|---|---|---|
| **8-bit** | 1 byte | `.hoff8` | General prose, literature | Optimal for natural language character distribution |
| **32-bit** | 4 bytes | `.hoff32` | Repeated words, server logs | Encodes frequent 4-letter words and timestamps as 1 symbol |
| **64-bit** | 8 bytes | `.hoff64` | Source code, tab indentation | Captures language keywords (`function`, `return `) and spaces |
| **128-bit** | 16 bytes | `.hoff128` | Boilerplate code, templates | Encodes long recurring phrases into ultra-compact bit codes |

### Why Multi-Widths Outperform Single-Byte Encoding
In repetitive text or programming code, patterns like `    return ` (11 bytes) repeat continuously. Under 8-bit compression, this sequence requires 11 separate Huffman lookups. Under 64-bit or 128-bit chunking, common phrases are treated as individual symbols, receiving a single short binary code that dramatically outperforms single-byte compression.

---

## 3. The Huffman Coding Algorithm (5 Steps)

The pure-Python engine in [`huffman.py`](file:///a:/HuffX/huffman.py) implements the classical 5-step algorithm:

```mermaid
graph TD
    A["1. Input Data"] --> B["2. Frequency Counter (Linear Scan)"]
    B --> C["3. Min-Heap Priority Queue"]
    C --> D["4. Build Binary Tree (Greedy Merge)"]
    D --> E["5. Generate Prefix Codes"]
    E --> F["6. Bitstream Packing & .hoffX Container"]
```

### Step 1: Frequency Analysis
The data is divided into chunks according to the chosen symbol width ($8, 32, 64,$ or $128$ bits). A linear pass counts the occurrence frequency of each unique symbol.

### Step 2: Min-Heap Priority Queue
Each distinct symbol is wrapped in a leaf `HuffmanNode` containing `(symbol, frequency)`. All leaf nodes are pushed into a **min-heap priority queue** using Python's standard `heapq`.

### Step 3: Greedy Tree Construction
1. Extract the two nodes with the lowest frequencies from the heap.
2. Create a new internal parent node whose frequency is the sum of both children.
3. Assign the first extracted node as the left child (representing bit `0`) and the second as the right child (representing bit `1`).
4. Push the parent node back into the min-heap.
5. Repeat until exactly one root node remains. This node is the root of the **Huffman Tree**.

```mermaid
graph TD
    Root((Root: 100)) -->|0| LeftChild((Freq: 40))
    Root -->|1| RightChild((Freq: 60))
    LeftChild -->|0| LeafA["'A' (Code: 00)"]
    LeftChild -->|1| LeafB["'B' (Code: 01)"]
    RightChild -->|0| LeafC["'C' (Code: 10)"]
    RightChild -->|1| LeafD["'D' (Code: 11)"]
```

### Step 4: Prefix-Free Code Generation
A recursive depth-first traversal walks from the root to every leaf:
- Branching left shifts the current code left and appends `0`.
- Branching right shifts the current code left and appends `1`.

> **The Prefix-Free Property:** No valid code word is a prefix of any other code word. Because every symbol sits exclusively at a leaf node, the decoder can parse an incoming bitstream from left to right unambiguously without requiring delimiters.

### Step 5: Bit Packing & Binary Serialization
Because filesystems only write complete 8-bit bytes, variable-length codes (e.g., 3-bit or 7-bit codes) are accumulated into an integer buffer and flushed in 8-bit chunks to disk.

---

## 4. Custom Binary Container Format (`.hoffX`)

Every compressed file starts with a standardized 26-byte big-endian binary header, followed by the serialized codebook, and ends with the compressed payload bitstream:

| Byte Offset | Size | Field Name | Description |
|---|---|---|---|
| `0x00 - 0x03` | 4 B | `MAGIC` | File signature identification: `b"HFX1"` |
| `0x04` | 1 B | `width` | Symbol width in bits (8, 32, 64, or 128) |
| `0x05` | 1 B | `pad_bits` | Unused trailing bits in the last payload byte (0 to 7) |
| `0x06 - 0x0D` | 8 B | `n_symbols` | Total count of encoded symbols |
| `0x0E - 0x15` | 8 B | `orig_size` | Exact byte count of the uncompressed file |
| `0x16 - 0x19` | 4 B | `n_codes` | Number of distinct codebook entries |
| `0x1A ...` | Variable | `codebook` | Serialized lookup table: `symbol` + `code_len` + `code_bits` |
| `...` | Variable | `payload` | The compressed bitstream |

### Exact Lossless Reconstruction
During decompression:
1. The header validates the `HFX1` magic bytes.
2. The codebook is loaded into a prefix lookup table.
3. The payload bitstream is parsed bit-by-bit. As soon as accumulated bits match a codebook entry, the original symbol is output.
4. The output is trimmed to `orig_size`, discarding any padding bytes. The output matches the original input byte-for-byte.

---

## 5. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                          │
│   Web Browser (localhost:5000)   │   Terminal / CLI         │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌───────────────────────────────┐   ┌───────────────────────────┐
│     Next.js Web Server        │   │ Standalone Terminal Usage │
│ - Compression Workspace       │   │ python huffman.py compress│
│ - API Routes (/api/*)         │   │ python huffman.py decompress
│                               │   │ python huffman.py selftest│
└───────────────┬───────────────┘   └─────────────┬─────────────┘
                │ JSON / execFile                 │
                ▼                                 │
┌───────────────────────────────┐                 │
│      Engine Bridge            │                 │
│      (pyengine.py)            │                 │
└───────────────┬───────────────┘                 │
                │                                 │
                ▼                                 ▼
┌───────────────────────────────────────────────────────────────┐
│              HuffX Core Compression Engine                    │
│                       (huffman.py)                            │
│ 1. Frequency Counter      │ 4. Bit Accumulator / Packer       │
│ 2. Min-Heap Priority Queue│ 5. Big-Endian Container Serializer│
│ 3. Huffman Binary Tree    │ 6. Bitstream Decoder              │
└───────────────────────────────────────────────────────────────┘
```

The system strictly decouples the web layer from the compression logic:
- **Presentation:** Next.js handles drag-and-drop file uploads, progress feedback, and stat calculations.
- **Engine Bridge ([`pyengine.py`](file:///a:/HuffX/pyengine.py)):** Calls the pure Python engine and outputs clean JSON metadata (entropy, compression ratio, savings %, execution time).
- **Core Engine ([`huffman.py`](file:///a:/HuffX/huffman.py)):** A standalone, zero-dependency Python script containing all Data Structures & Algorithms.

---

## 6. Algorithmic Complexity

| Operation | Time Complexity | Space Complexity | Explanation |
|---|---|---|---|
| **Frequency Counting** | $O(N)$ | $O(K)$ | Single linear scan of $N$ symbols into a hash table of $K$ unique symbols. |
| **Heap Construction** | $O(K)$ | $O(K)$ | Linear-time heapification of $K$ leaf nodes. |
| **Tree Building** | $O(K \log K)$ | $O(K)$ | Exactly $K-1$ merges, each performing two `heappop` and one `heappush` ($O(\log K)$). |
| **Code Generation** | $O(K)$ | $O(K)$ | Single depth-first traversal visiting all $2K - 1$ tree nodes. |
| **Bitstream Encoding** | $O(N)$ | $O(N)$ | Constant-time dictionary lookup and bit-accumulation per symbol. |
| **Decoding** | $O(N)$ | $O(N)$ | Direct bit-by-bit tree traversal producing $N$ original symbols. |

*$N$ = total number of symbols in data, $K$ = number of distinct symbols ($K \le 256$ for 8-bit).*

---

## 7. Experimental Verification & Test Results

The built-in self-test suite (`python huffman.py selftest`) validates lossless round-trip compression across diverse test cases:

| Test Case | Width | Original Size | Compressed Size | Space Saved | Status |
|---|---|---|---|---|---|
| `empty` | 8-bit | 0 B | 26 B | 0.0% | **PASS** |
| `single-char` | 8-bit | 24 B | 33 B | -37.5% | **PASS** |
| `pangram` | 8-bit | 352 B | 328 B | 6.8% | **PASS** |
| `pangram` | 32-bit | 352 B | 142 B | **59.7%** | **PASS** |
| `repeated` | 8-bit | 520 B | 408 B | 21.5% | **PASS** |
| `repeated` | 32-bit | 520 B | 179 B | **65.6%** | **PASS** |
| `code-sample` | 8-bit | 720 B | 483 B | 32.9% | **PASS** |
| `code-sample` | 32-bit | 720 B | 193 B | 73.2% | **PASS** |
| `code-sample` | 64-bit | 720 B | 122 B | 83.1% | **PASS** |
| `code-sample` | 128-bit | 720 B | 93 B | **87.1%** | **PASS** |

### Benchmark Takeaways:
1. **Container Overhead on Small Files:** Very small files (< 50 bytes) can experience negative savings due to storing the 26-byte header and codebook. This is standard across all container-based formats (ZIP, GZIP, PNG).
2. **Multi-Byte Scaling:** On structured source code, scaling from 8-bit to 128-bit increases compression efficiency from **32.9% up to 87.1%**.
3. **Lossless Verification:** Every test reconstructs the exact original file with a 100% byte-for-byte SHA/MD5 match.

---

## 8. Standalone CLI Usage (Zero Dependencies)

The core engine can be run directly from any terminal without Node.js or third-party libraries:

```bash
# 1. Run all round-trip unit tests across all symbol widths
python huffman.py selftest

# 2. Compress a file (default 8-bit)
python huffman.py compress essay.txt

# 3. Compress using 32, 64, or 128-bit symbol widths
python huffman.py compress code.py --width 64

# 4. Decompress any .hoffX file back to original plain text
python huffman.py decompress code.hoff64 -o restored_code.py
```

---

## 9. Project File Layout

```
huffx/
├── huffman.py            # Core Huffman compression engine (DSA implementation)
├── pyengine.py           # Bridge CLI communicating with Next.js via JSON
├── Dockerfile            # Multi-runtime production container (Node 20 + Python 3)
├── render.yaml           # Cloud deployment blueprint
├── package.json          # Next.js workspace definition
├── next.config.js        # Next.js configuration
├── jsconfig.json         # Root path alias configuration (@/*)
├── app/
│   ├── layout.js         # Root HTML layout, navigation, and footer
│   ├── page.js           # Interactive compression workspace
│   ├── page.module.css   # Scoped CSS module for the tool workspace
│   ├── animations/       # Step-by-step interactive Huffman visualizer
│   │   ├── page.js       # Dynamic SVG tree builder & step controller
│   │   └── page.module.css # Scoped styles for tree animation
│   ├── globals.css       # Global design tokens and theme styles
│   └── api/
│       ├── compress/route.js        # File upload & compression handler
│       ├── decompress/route.js      # File decompression handler
│       └── download/[token]/route.js # Temporary tokenized download stream
├── components/
│   └── ParticlesBackground.js       # Offline Canvas particle network
├── lib/
│   └── engine.js         # Cross-platform Python spawner & /tmp manager
└── public/
    ├── icon.svg          # Unified brand mark and browser tab favicon
    └── js/
        ├── gsap.min.js   # Bundled animation library (100% offline)
        └── main.js       # Client workspace UI interactions
```

---

## 10. Viva / Interview Questions & Answers

### Q1: Why is Huffman Coding called a "greedy" algorithm?
> **Answer:** At each step of building the tree, the algorithm greedily selects the two nodes with the lowest frequencies to merge. It makes this locally optimal choice without backtracking or looking ahead, which is mathematically proven to produce a globally optimal prefix-free code.

### Q2: What is the purpose of the Min-Heap?
> **Answer:** A min-heap provides $O(1)$ access to the smallest element and $O(\log K)$ insertion and extraction. Without a min-heap, finding the two smallest frequencies in an unsorted list takes $O(K)$ time per merge, raising tree construction complexity from $O(K \log K)$ to $O(K^2)$.

### Q3: Why must the codes be prefix-free?
> **Answer:** If code `'A'` were `01` and code `'B'` were `011`, the decoder reading `01` could not determine whether to output `'A'` immediately or wait for another bit to decode `'B'`. Prefix-free codes place every symbol exclusively at a tree leaf, guaranteeing unambiguous left-to-right decoding without delimiters.

### Q4: Why did you implement 32, 64, and 128-bit symbol widths?
> **Answer:** Standard 8-bit compression treats every character separately. In real-world data like source code or logs, words and syntax blocks repeat constantly. By chunking data into 4-byte (32-bit), 8-byte (64-bit), or 16-byte (128-bit) blocks, common phrases receive a single short Huffman code, boosting compression efficiency up to 87%+.

### Q5: How are leftover bits handled during bit-packing?
> **Answer:** Variable-length codes rarely end on an exact 8-bit byte boundary. Any leftover bits in the final byte are zero-padded to fill 8 bits, and the number of unused padding bits (0 to 7) is saved in byte 5 (`pad_bits`) of the 26-byte `.hoffX` header. The decoder reads `pad_bits` and the original byte size `orig_size` to discard padding cleanly.
