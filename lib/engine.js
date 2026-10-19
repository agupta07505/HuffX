/* ==========================================================================
   HuffX — lib/engine.js
   Shared helpers for the API route handlers: spawn the Python engine,
   manage temp download tokens, sanitise filenames.
   ========================================================================== */

import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

const run = promisify(execFile);

export const TMP_DIR = path.join(process.cwd(), 'instance', 'tmp');
export const MAX_BYTES = 16 * 1024 * 1024; // 16 MB uploads

const VALID_WIDTHS = new Set([8, 32, 64, 128]);
const ENGINE = path.join(process.cwd(), 'pyengine.py');

export async function ensureTmp() {
  await fs.mkdir(TMP_DIR, { recursive: true });
}

export function fail(message, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function parseWidth(raw) {
  const w = Number.parseInt(String(raw ?? ''), 10);
  return VALID_WIDTHS.has(w) ? w : null;
}

/* werkzeug-style secure filename, then strip the final extension */
export function secureBase(raw) {
  const tail = String(raw || 'file.txt').split(/[\\/]/).pop() || 'file.txt';
  const clean = tail.replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^\.+/, '') || 'file';
  const i = clean.lastIndexOf('.');
  return i > 0 ? clean.slice(0, i) : clean;
}

/* Call the Python engine; it always answers with one JSON object. */
export async function runEngine(action, src, dst, width = null) {
  const args = [ENGINE, action, src, dst];
  if (width != null) args.push(String(width));
  try {
    const { stdout } = await run('python3', args, {
      cwd: process.cwd(),
      timeout: 120_000,
      maxBuffer: 4 * 1024 * 1024,
    });
    return JSON.parse(stdout);
  } catch (err) {
    // Engine printed JSON but exited oddly? Prefer its own error message.
    if (err && typeof err === 'object' && 'stdout' in err && err.stdout) {
      try { return JSON.parse(err.stdout); } catch { /* fall through */ }
    }
    return { ok: false, error: 'Python engine crashed mid-flight.' };
  }
}

/* Best-effort cleanup of temp files older than ~30 minutes. */
export async function sweep(maxAgeMs = 30 * 60 * 1000) {
  try {
    const now = Date.now();
    for (const f of await fs.readdir(TMP_DIR)) {
      const p = path.join(TMP_DIR, f);
      try {
        const st = await fs.stat(p);
        if (now - st.mtimeMs > maxAgeMs) await fs.unlink(p);
      } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
}
