import http from 'node:http';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.TUEK_DATA_DIR ? path.resolve(process.env.TUEK_DATA_DIR) : path.join(root, 'data');
const scoreFile = path.join(dataDir, 'scores.json');
await mkdir(dataDir, { recursive: true });
try { await writeFile(scoreFile, '[]\n', { flag: 'wx' }); } catch (error) { if (error.code !== 'EEXIST') throw error; }
const load = async () => {
  const rows = JSON.parse(await readFile(scoreFile, 'utf8'));
  if (!Array.isArray(rows)) throw new Error('Invalid score file');
  return rows;
};
await load(); // Never replace a corrupt score file with an empty history.
let queue = Promise.resolve();
const persist = run => {
  const task = queue.then(async () => {
    const rows = await load();
    if (rows.some(row => row.id === run.id)) return;
    rows.push(run);
    await writeFile(`${scoreFile}.tmp`, `${JSON.stringify(rows, null, 2)}\n`);
    await rename(`${scoreFile}.tmp`, scoreFile);
  });
  queue = task.catch(() => {});
  return task;
};
const valid = r => r && r.version === 1 &&
  ['id', 'playerId'].every(k => typeof r[k] === 'string' && /^[a-f0-9-]{36}$/i.test(r[k])) &&
  typeof r.playerName === 'string' && r.playerName.trim().length > 0 && r.playerName.length <= 24 &&
  ['score', 'floors', 'perfectDrops', 'durationMs'].every(k => Number.isSafeInteger(r[k]) && r[k] >= 0) &&
  r.perfectDrops <= r.floors && r.score === r.floors * 100 + r.perfectDrops * 50 &&
  typeof r.createdAt === 'string' && Number.isFinite(Date.parse(r.createdAt));
const vite = process.argv.includes('--dev') ? await (await import('vite')).createServer({ root, server: { middlewareMode: true }, appType: 'spa' }) : null;
const send = (res, code, body) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); };
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/runs') {
      if (req.method === 'GET') return send(res, 200, await load());
      if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
      if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}` && req.headers.origin !== `https://${req.headers.host}`) return send(res, 403, { error: 'Origin not allowed' });
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (Buffer.byteLength(body) > 4096) return send(res, 413, { error: 'Request too large' });
      }
      let run;
      try { run = JSON.parse(body); } catch { return send(res, 400, { error: 'Invalid JSON' }); }
      if (!valid(run)) return send(res, 400, { error: 'Invalid score data' });
      const { id, playerId, playerName, score, floors, perfectDrops, durationMs, createdAt, version } = run;
      await persist({ id, playerId, playerName, score, floors, perfectDrops, durationMs, createdAt, version });
      return send(res, 201, { saved: true });
    }
    if (vite) return vite.middlewares(req, res);
    if (!['GET', 'HEAD'].includes(req.method)) return send(res, 405, { error: 'Method not allowed' });
    const dist = path.join(root, 'dist');
    const file = path.resolve(dist, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!file.startsWith(dist + path.sep)) return send(res, 403, { error: 'Forbidden' });
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' };
    try {
      const bytes = await readFile(file);
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
      res.end(req.method === 'HEAD' ? undefined : bytes);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      send(res, 404, { error: 'Not found. Run npm run build first.' });
    }
  } catch (error) { console.error(error); if (!res.headersSent) send(res, 500, { error: 'Unable to access scores' }); else res.end(); }
});
server.listen(Number(process.env.PORT || 5173), '127.0.0.1', () => console.log(`TUEK.IO http://127.0.0.1:${server.address().port}`));
