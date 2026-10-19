#!/usr/bin/env python3
"""
pyengine.py — bridge between the Next.js API routes and the HuffX engine
=========================================================================

Invoked by the route handlers in ``app/api/*``:

    python3 pyengine.py compress   <src> <dst> <width>
    python3 pyengine.py decompress <src> <dst>

Reads ``src``, writes the transformed bytes to ``dst`` and prints a small
JSON stats object on stdout.  Errors come back as
``{"ok": false, "error": "..."}`` so Node never has to parse a traceback.

All real work happens in ``huffman.py`` — the engine stays 100% Python.

Team HuffX — Animesh Gupta & Vikrant Krishna.
"""

import json
import sys

import huffman as hx


def main() -> None:
    try:
        action, src, dst = sys.argv[1], sys.argv[2], sys.argv[3]

        with open(src, "rb") as f:
            data = f.read()

        if action == "compress":
            blob, meta = hx.compress_bytes(data, int(sys.argv[4]))
        elif action == "decompress":
            blob, meta = hx.decompress_bytes(data)
        else:
            raise hx.HuffXError(f"unknown action {action!r}")

        with open(dst, "wb") as f:
            f.write(blob)

        meta["ok"] = True
        json.dump(meta, sys.stdout)

    except hx.HuffXError as exc:
        json.dump({"ok": False, "error": str(exc)}, sys.stdout)
    except (FileNotFoundError, PermissionError) as exc:
        json.dump({"ok": False, "error": f"file error: {exc}"}, sys.stdout)


if __name__ == "__main__":
    main()
