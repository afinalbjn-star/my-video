const http = require('http');
const path = require('path');
const fs = require('fs');
const url = require('url');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const PORT = process.env.PORT || 3456;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const RENDERER_DIR = path.join(__dirname, 'renderer');

// ---- data file ----
let dataFile;
try {
  const { app } = require('electron');
  dataFile = path.join(app.getPath('userData'), 'software-inventory.json');
} catch (e) {
  dataFile = path.join(__dirname, 'data.json');
}

const defaultData = () => ({ softwares: [], licenses: [] });

function backupsDir() {
  const d = path.join(path.dirname(dataFile), 'backups');
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  return d;
}

function loadData() {
  try {
    if (fs.existsSync(dataFile)) {
      const parsed = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
      return { ...defaultData(), ...parsed };
    }
  } catch (e) { console.error('load error:', e); }
  return defaultData();
}

function saveData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf-8');
  // auto-backup (keep last 20)
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const b = path.join(backupsDir(), `backup-${stamp}.json`);
    fs.writeFileSync(b, JSON.stringify(data, null, 2), 'utf-8');
    const all = fs.readdirSync(backupsDir()).filter((f) => f.startsWith('backup-'));
    all.sort();
    while (all.length > 20) fs.unlinkSync(path.join(backupsDir(), all.shift()));
  } catch (e) { console.error('backup error:', e); }
}

function listBackups() {
  try {
    return fs.readdirSync(backupsDir())
      .filter((f) => f.startsWith('backup-') && f.endsWith('.json'))
      .sort()
      .reverse()
      .map((f) => ({ file: f, size: fs.statSync(path.join(backupsDir(), f)).size }));
  } catch (e) { return []; }
}

// ---- static helpers ----
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res, pathname) {
  let rel = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.normalize(path.join(RENDERER_DIR, rel));
  if (!filePath.startsWith(RENDERER_DIR)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

// ---- Ollama helpers ----
function fetchOllamaTags() {
  return new Promise((resolve) => {
    const req = http.get(`${OLLAMA_URL}/api/tags`, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try { resolve(JSON.parse(body).models || []); }
        catch (e) { resolve([]); }
      });
    });
    req.on('error', () => resolve([]));
    req.setTimeout(3000, () => { req.destroy(); resolve([]); });
  });
}

function buildPrompt(data) {
  const soft = data.softwares.map((s) => `- id:${s.id} ${s.name} v${s.version} (${s.category}, vendor: ${s.vendor || '-'})`).join('\n') || '  (tidak ada)';
  const lic = data.licenses.map((l) => {
    const sw = data.softwares.find((s) => s.id === l.softwareId);
    return `- id:${l.id} ${sw ? sw.name : '?'}: ${l.type}, qty ${l.quantity}, harga Rp${l.price || 0}, kedaluwarsa ${l.expiry || 'selamanya'}`;
  }).join('\n') || '  (tidak ada)';

  return `Kamu adalah asisten AI untuk aplikasi "NANDO INVENTORY AI" (inventaris perangkat lunak). Bahasamu Bahasa Indonesia. Saat ini ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}.

DATA INVENTARIS SAAT INI (gunakan id jika ada):
Software:
${soft}

Lisensi:
${lic}

KAMU BISA MELAKUKAN AKSI. Jika pengguna meminta menambah/mengubah/menghapus software atau lisensi, maka AKHIRI jawabanmu dengan blok persis seperti ini (satu baris JSON):
###ACTION###{"action":"...","data":{...}}

Jenis action yang didukung:
- add_software: data = {name, version, category, vendor}
- add_license: data = {softwareName, type, quantity, price, expiry} (softwareName harus cocok dengan data yang ada)
- delete_software: data = {name}
- delete_license: data = {id}
Berikan versi/kategori/harga dari yang diminta. Jika pengguna hanya minta saran/jawaban, cukup jawab teks biasa tanpa blok ACTION.

Tugasmu: bantu pengguna mengelola inventaris (menjawab pertanyaan, memberi saran, rekomendasi, dan menjalankan aksi). Jawab ringkas dan jelas. Gunakan rupiah untuk harga.`;
}

// ---- chat handler (proxy streaming to Ollama, SSE to client) ----
function handleChat(req, res, body) {
  const { message, model, history } = JSON.parse(body || '{}');
  const data = loadData();

  const messages = [{ role: 'system', content: buildPrompt(data) }];
  (history || []).forEach((h) => messages.push({ role: h.role, content: h.content }));
  messages.push({ role: 'user', content: message });

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const ollamaReq = http.request(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, (or) => {
    or.on('data', (chunk) => {
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const j = JSON.parse(line);
          if (j.message && j.message.content) {
            res.write(`data: ${JSON.stringify({ delta: j.message.content })}\n\n`);
          }
          if (j.done) {
            res.write('data: [DONE]\n\n');
            res.end();
          }
        } catch (e) { /* partial json, ignore */ }
      }
    });
    or.on('error', () => {
      res.write(`data: ${JSON.stringify({ error: 'Terjadi kesalahan koneksi ke Ollama.' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    });
  });

  ollamaReq.on('error', () => {
    res.write(`data: ${JSON.stringify({ error: 'Ollama tidak terhubung. Pastikan Ollama berjalan di port 11434.' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  });

  ollamaReq.write(JSON.stringify({
    model,
    stream: true,
    messages,
  }));
  ollamaReq.end();
}

// ---- export helpers (work for web + desktop) ----
function currency(n) {
  return 'Rp ' + Number(n || 0).toLocaleString('id-ID');
}

async function buildExcelBuffer(data) {
  const wb = new ExcelJS.Workbook();
  const wsSoft = wb.addWorksheet('Software');
  wsSoft.columns = [
    { header: 'Nama', key: 'name', width: 25 },
    { header: 'Versi', key: 'version', width: 15 },
    { header: 'Kategori', key: 'category', width: 18 },
    { header: 'Vendor', key: 'vendor', width: 20 },
  ];
  data.softwares.forEach((s) => wsSoft.addRow(s));
  wsSoft.getRow(1).font = { bold: true };

  const wsLic = wb.addWorksheet('Lisensi');
  wsLic.columns = [
    { header: 'Software', key: 'software', width: 25 },
    { header: 'Jenis', key: 'type', width: 15 },
    { header: 'Jumlah', key: 'quantity', width: 10 },
    { header: 'Kedaluwarsa', key: 'expiry', width: 15 },
    { header: 'Harga / Unit', key: 'price', width: 18 },
    { header: 'Total', key: 'total', width: 18 },
  ];
  data.licenses.forEach((l) => {
    const sw = data.softwares.find((s) => s.id === l.softwareId);
    wsLic.addRow({
      software: sw ? sw.name : '-',
      type: l.type,
      quantity: l.quantity,
      expiry: l.expiry || 'Selamanya',
      price: l.price || 0,
      total: (l.price || 0) * (l.quantity || 1),
    });
  });
  wsLic.getRow(1).font = { bold: true };

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

function buildPdfBuffer(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text('Laporan Software Inventory', { align: 'center' });
    doc.moveDown();

    const totalBudget = data.licenses.reduce((sum, l) => sum + (l.price || 0) * (l.quantity || 1), 0);

    doc.fontSize(12).text('Ringkasan:');
    doc.fontSize(11).text(`- Total Software : ${data.softwares.length}`);
    doc.fontSize(11).text(`- Total Lisensi  : ${data.licenses.length}`);
    doc.fontSize(11).text(`- Total Anggaran : ${currency(totalBudget)}`);
    doc.moveDown();

    doc.fontSize(12).text('Daftar Lisensi:');
    doc.moveDown(0.5);
    const headers = ['Software', 'Jenis', 'Jumlah', 'Kedaluwarsa', 'Total'];
    const colWidths = [150, 80, 50, 80, 80];
    let x = 40;
    doc.font('Helvetica-Bold');
    headers.forEach((h, i) => {
      doc.text(h, x, doc.y, { width: colWidths[i], continued: false });
      x += colWidths[i];
    });
    doc.moveDown(0.3);
    doc.font('Helvetica');
    data.licenses.forEach((l) => {
      const sw = data.softwares.find((s) => s.id === l.softwareId);
      x = 40;
      const row = [sw ? sw.name : '-', l.type, String(l.quantity), l.expiry || 'Selamanya', currency((l.price || 0) * (l.quantity || 1))];
      const startY = doc.y;
      row.forEach((cell, i) => {
        doc.text(cell, x, startY, { width: colWidths[i], continued: false });
        x += colWidths[i];
      });
      doc.moveDown(0.3);
    });

    doc.end();
  });
}

function sendDownload(res, buffer, filename, mime) {
  res.writeHead(200, {
    'Content-Type': mime,
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length': buffer.length,
  });
  res.end(buffer);
}

// ---- main server ----
const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  const cors = { 'Access-Control-Allow-Origin': '*' };

  // API: data
  if (pathname === '/api/data' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json', ...cors });
    res.end(JSON.stringify(loadData()));
    return;
  }
  if (pathname === '/api/data' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try { saveData(JSON.parse(body)); } catch (e) {}
      res.writeHead(200, { 'Content-Type': 'application/json', ...cors });
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }

  // API: backups
  if (pathname === '/api/backups' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json', ...cors });
    res.end(JSON.stringify(listBackups()));
    return;
  }
  if (pathname === '/api/backups/restore' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        const { file } = JSON.parse(body);
        const b = path.join(backupsDir(), path.basename(file));
        if (fs.existsSync(b)) {
          const data = JSON.parse(fs.readFileSync(b, 'utf-8'));
          saveData({ ...defaultData(), ...data });
          res.writeHead(200, { 'Content-Type': 'application/json', ...cors });
          res.end(JSON.stringify({ ok: true, data }));
          return;
        }
      } catch (e) {}
      res.writeHead(400, { 'Content-Type': 'application/json', ...cors });
      res.end(JSON.stringify({ ok: false }));
    });
    return;
  }

  // API: ollama status
  if (pathname === '/api/ollama' && req.method === 'GET') {
    fetchOllamaTags().then((models) => {
      res.writeHead(200, { 'Content-Type': 'application/json', ...cors });
      res.end(JSON.stringify({ available: models.length > 0, models: models.map((m) => m.name) }));
    });
    return;
  }

  // API: chat
  if (pathname === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => handleChat(req, res, body));
    return;
  }

  // API: export
  if (pathname === '/api/export/excel' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', async () => {
      const data = JSON.parse(body || '{}');
      const buf = await buildExcelBuffer(data);
      sendDownload(res, buf, 'software-inventory.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });
    return;
  }
  if (pathname === '/api/export/pdf' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', async () => {
      const data = JSON.parse(body || '{}');
      const buf = await buildPdfBuffer(data);
      sendDownload(res, buf, 'software-inventory.pdf', 'application/pdf');
    });
    return;
  }

  // API: health
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json', ...cors });
    res.end(JSON.stringify({ ok: true, name: 'NANDO INVENTORY AI' }));
    return;
  }

  // static
  serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log(`NANDO INVENTORY AI berjalan di http://localhost:${PORT}`);
  console.log(`(Ollama: ${OLLAMA_URL})`);
});

module.exports = { server, PORT, loadData, saveData };