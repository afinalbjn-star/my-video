import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';
import { EnhancedUniversalAgent, AgentMode } from './src/agent/multi-agent';

const PORT = 3000;
const agent = new EnhancedUniversalAgent();

// In-memory chat history per session (simple)
const chatHistory: Record<string, Array<{ role: string; content: string; mode: string; time: string }>> = {};

function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

function sendJson(res: http.ServerResponse, status: number, data: any) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = req.url || '/';

  // ── Serve Control Panel HTML
  if (req.method === 'GET' && (url === '/' || url === '/index.html')) {
    const htmlPath = path.join(process.cwd(), 'control-panel.html');
    if (fs.existsSync(htmlPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(htmlPath));
    } else {
      res.writeHead(404); res.end('Control panel not found');
    }
    return;
  }

  // ── POST /api/chat — General AI Chat
  if (req.method === 'POST' && url === '/api/chat') {
    const body = await parseBody(req);
    const { message, sessionId = 'default', mode } = body;

    if (!message) { sendJson(res, 400, { error: 'Message is required' }); return; }

    console.log(`\n[CHAT] (${mode || 'auto'}) "${message}"`);

    try {
      const response = await agent.chat(sessionId, message, mode as AgentMode);

      // Simpan ke history
      if (!chatHistory[sessionId]) chatHistory[sessionId] = [];
      chatHistory[sessionId].push({
        role: 'user', content: message, mode: response.mode,
        time: new Date().toLocaleTimeString('id-ID')
      });
      chatHistory[sessionId].push({
        role: 'assistant', content: response.text, mode: response.mode,
        time: new Date().toLocaleTimeString('id-ID')
      });

      // Jika terdeteksi sebagai video task, jalankan agent video di background
      if (response.isVideoTask) {
        console.log('[VIDEO] Video task terdeteksi, menjalankan AI Agent Video...');
        agent.runVideoTask(message).then(result => {
          console.log('[VIDEO] Selesai:', result.message);
        }).catch(err => console.error('[VIDEO] Error:', err));
      }

      sendJson(res, 200, {
        text: response.text,
        mode: response.mode,
        isVideoTask: response.isVideoTask,
        sessionId,
      });
    } catch (err: any) {
      console.error('[ERROR]', err);
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  // ── POST /api/generate-video — Langsung trigger video
  if (req.method === 'POST' && url === '/api/generate-video') {
    const body = await parseBody(req);
    const { prompt } = body;
    if (!prompt) { sendJson(res, 400, { error: 'Prompt is required' }); return; }

    console.log(`\n[VIDEO] Menjalankan AI Agent Video: "${prompt}"`);
    sendJson(res, 202, { status: 'started', message: 'Agent video berjalan di background...' });

    agent.runVideoTask(prompt).then(result => {
      console.log('[VIDEO] Selesai:', result.message);
    }).catch(err => console.error('[VIDEO] Error:', err));
    return;
  }

  // ── GET /api/history — Riwayat chat
  if (req.method === 'GET' && url.startsWith('/api/history')) {
    const params = new URL(url, `http://localhost:${PORT}`).searchParams;
    const sessionId = params.get('sessionId') || 'default';
    sendJson(res, 200, { history: chatHistory[sessionId] || [] });
    return;
  }

  // ── POST /api/reset — Reset sesi
  if (req.method === 'POST' && url === '/api/reset') {
    const body = await parseBody(req);
    const { sessionId = 'default' } = body;
    agent.resetSession(sessionId);
    chatHistory[sessionId] = [];
    sendJson(res, 200, { message: 'Sesi berhasil direset' });
    return;
  }

  // ── GET /api/system-status — Multi-agent system status
  if (req.method === 'GET' && url === '/api/system-status') {
    const systemStatus = agent.getSystemStatus();
    sendJson(res, 200, systemStatus);
    return;
  }

  // ── POST /api/toggle-multiagent — Toggle multi-agent system
  if (req.method === 'POST' && url === '/api/toggle-multiagent') {
    const body = await parseBody(req);
    const { enabled } = body;
    agent.setMultiAgentEnabled(enabled);
    sendJson(res, 200, { 
      multiAgentEnabled: enabled,
      message: enabled ? 'Multi-agent system enabled' : 'Multi-agent system disabled'
    });
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => {
  console.log('='.repeat(55));
  console.log(`🤖 AI Agent Control Panel AKTIF!`);
  console.log(`📡 Buka browser: http://localhost:${PORT}`);
  console.log('='.repeat(55));
});
