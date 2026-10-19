/* POST /api/sample — form: width → compress the bundled sample.txt instantly */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import {
  TMP_DIR,
  ensureTmp, sweep, fail, parseWidth, runEngine,
} from '../../../lib/engine.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  await sweep();
  const form = await request.formData();
  const width = parseWidth(form.get('width'));
  if (width == null) {
    return fail('Width must be one of 8 / 32 / 64 / 128.');
  }

  await ensureTmp();
  const token = crypto.randomBytes(16).toString('hex');
  const src = path.join(process.cwd(), 'sample.txt');
  const dst = path.join(TMP_DIR, token);

  const meta = await runEngine('compress', src, dst, width);
  if (!meta.ok) return fail(meta.error || 'Compression failed.');

  const filename = `sample.hoff${width}`;
  await fs.writeFile(path.join(TMP_DIR, `${token}.json`), JSON.stringify({ name: filename }));

  return NextResponse.json({
    ...meta, ok: true, token, filename, sample: true,
    download: `/api/download/${token}`,
  });
}
