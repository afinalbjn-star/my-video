/**
 * Universal AI Agent - dapat menerima perintah apapun
 * Bukan hanya untuk video, tapi untuk segala kebutuhan
 */
import 'dotenv/config';
import { bluesmindChatCompletion, ChatMessage } from '../lib/bluesmind';
import { AIAgentController } from './agent-controller';

export type AgentMode = 'general' | 'video' | 'script' | 'research' | 'code';

const MODE_PROMPTS: Record<AgentMode, string> = {
  general: `Kamu adalah asisten AI serba bisa milik pribadi pengguna bernama AI Agent. 
Jawab dalam bahasa yang sama dengan pengguna (Indonesia atau Inggris). 
Berikan jawaban yang informatif, ramah, dan membantu. 
Gunakan format markdown untuk jawaban yang panjang.`,

  video: `Kamu adalah pakar pembuatan video animasi menggunakan Remotion.js.
Bantu pengguna merencanakan, mendeskripsikan, atau membuat prompt untuk video animasi profesional.
Jawab dalam bahasa Indonesia. Format jawaban dengan baik.`,

  script: `Kamu adalah penulis skrip profesional untuk konten digital.
Bantu pengguna menulis skrip YouTube, TikTok, konten sosmed, narasi video, atau artikel.
Jawab dalam bahasa Indonesia. Buat konten yang menarik, engaging, dan sesuai platform.`,

  research: `Kamu adalah peneliti dan analis konten profesional.
Bantu pengguna mencari fakta, merangkum topik, membuat outline konten, atau menganalisis tren.
Jawab dalam bahasa Indonesia. Berikan informasi yang akurat dan terstruktur.`,

  code: `Kamu adalah developer senior yang ahli di TypeScript, React, Node.js, dan Remotion.
Bantu pengguna menulis kode, debug masalah, atau menjelaskan konsep teknis.
Gunakan format markdown dengan code block untuk jawaban kode.`,
};

export interface ChatSession {
  messages: ChatMessage[];
  mode: AgentMode;
}

export interface UniversalAgentResponse {
  text: string;
  mode: AgentMode;
  isVideoTask: boolean;
  videoTaskStarted?: boolean;
}

export class UniversalAgent {
  private sessions: Map<string, ChatSession> = new Map();

  /**
   * Deteksi apakah perintah adalah untuk membuat video
   */
  private detectVideoIntent(message: string): boolean {
    const videoKeywords = [
      'buat video', 'create video', 'generate video', 'render video',
      'bikin video', 'video animasi', 'animation video', 'background video',
      'adobe stock', 'remotion', 'buatkan video'
    ];
    const lower = message.toLowerCase();
    return videoKeywords.some(kw => lower.includes(kw));
  }

  /**
   * Otomatis deteksi mode berdasarkan isi pesan
   */
  private autoDetectMode(message: string): AgentMode {
    const lower = message.toLowerCase();
    if (this.detectVideoIntent(lower)) return 'video';
    if (lower.includes('skrip') || lower.includes('script') || lower.includes('konten') || lower.includes('caption') || lower.includes('naskah')) return 'script';
    if (lower.includes('riset') || lower.includes('research') || lower.includes('cari') || lower.includes('fakta') || lower.includes('informasi tentang')) return 'research';
    if (lower.includes('kode') || lower.includes('code') || lower.includes('debug') || lower.includes('typescript') || lower.includes('javascript') || lower.includes('function')) return 'code';
    return 'general';
  }

  /**
   * Kirim pesan ke AI dan dapatkan respons
   */
  async chat(
    sessionId: string,
    userMessage: string,
    forceMode?: AgentMode
  ): Promise<UniversalAgentResponse> {
    // Ambil atau buat sesi baru
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, { messages: [], mode: 'general' });
    }
    const session = this.sessions.get(sessionId)!;

    // Tentukan mode
    const mode = forceMode || this.autoDetectMode(userMessage);
    session.mode = mode;

    // Cek apakah ini perintah video langsung
    const isVideoTask = this.detectVideoIntent(userMessage) && (mode === 'video' || mode === 'general');

    // Tambahkan pesan user ke history
    session.messages.push({ role: 'user', content: userMessage });

    // Bangun context messages dengan system prompt
    const contextMessages: ChatMessage[] = [
      { role: 'system', content: MODE_PROMPTS[mode] },
      ...session.messages.slice(-10) // Ambil 10 pesan terakhir untuk konteks
    ];

    // Panggil AI
    const result = await bluesmindChatCompletion({
      messages: contextMessages,
      temperature: 0.8,
      max_tokens: 2000,
    });

    let responseText = '';
    if (result.success && result.data?.choices?.[0]) {
      responseText = result.data.choices[0].message.content;
    } else {
      responseText = `❌ Maaf, terjadi kesalahan saat menghubungi AI: ${result.error || 'Unknown error'}`;
    }

    // Tambahkan respons AI ke history
    session.messages.push({ role: 'assistant', content: responseText });

    return {
      text: responseText,
      mode,
      isVideoTask,
      videoTaskStarted: false,
    };
  }

  /**
   * Jalankan video generation task secara async
   */
  async runVideoTask(prompt: string): Promise<{ success: boolean; message: string }> {
    const agent = new AIAgentController();
    return agent.createRemotionVideo(prompt);
  }

  /**
   * Reset sesi percakapan
   */
  resetSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * Ambil history percakapan
   */
  getHistory(sessionId: string): ChatMessage[] {
    return this.sessions.get(sessionId)?.messages || [];
  }
}
