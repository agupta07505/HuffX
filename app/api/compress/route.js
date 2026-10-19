/* POST /api/compress — form: file (txt) + width → .hoffX download token + stats */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import {
  TMP_DIR, MAX_BYTES,
  ensureTmp, sweep, fail, parseWidth, secureBase, runEngine,
} from '../../../lib/engine.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  await sweep();
  const form = await request.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string' || !file.name) {
    return fail('Attach a .txt file first.');
  }
  const width = parseWidth(form.get('width'));
  if (width == null) {
    return fail('Width must be one of 8 / 32 / 64 / 128.');
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length === 0) return fail('That file is empty — nothing to compress.');
  if (buf.length > MAX_BYTES) return fail('File too large — 16 MB max.', 413);

  await ensureTmp();
  const token = crypto.randomBytes(16).toString('hex');
  const src = path.join(TMP_DIR, `in-${token}`);
  const dst = path.join(TMP_DIR, token);

  await fs.writeFile(src, buf);
  const meta = await runEngine('compress', src, dst, width);
  await fs.unlink(src).catch(() => {});
  if (!meta.ok) return fail(meta.error || 'Compression failed.');

  const filename = `${secureBase(file.name)}.hoff${width}`;
  await fs.writeFile(path.join(TMP_DIR, `${token}.json`), JSON.stringify({ name: filename }));

  return NextResponse.json({
    ...meta, ok: true, token, filename,
    download: `/api/download/${token}`,
  });
}
