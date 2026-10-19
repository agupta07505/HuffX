/* GET /api/download/<token> — fetch a file produced by compress/decompress/sample */

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { TMP_DIR, fail } from '../../../../lib/engine.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { token } = await params;
  if (!/^[a-f0-9]{32}$/.test(token || '')) {
    return fail('Not found.', 404);
  }

  const filePath = path.join(TMP_DIR, token);
  let data;
  try {
    data = await fs.readFile(filePath);
  } catch {
    return fail('That file expired — run it again.', 404);
  }

  let name = 'download.bin';
  try {
    const meta = JSON.parse(await fs.readFile(`${filePath}.json`, 'utf8'));
    if (meta && typeof meta.name === 'string') name = meta.name;
  } catch { /* keep default */ }

  const safeName = name.replace(/["\\]/g, '') || 'download.bin';
  return new NextResponse(data, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${safeName}"`,
      'Cache-Control': 'no-store',
    },
  });
}
