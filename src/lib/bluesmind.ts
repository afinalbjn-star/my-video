/**
 * Bluesmind API Client Utility
 * Untuk integrasi dengan Bluesmind API dalam proyek Remotion
 * Bluesmind menggunakan format OpenAI-compatible
 */

// Load environment variables for non-Remotion contexts
if (typeof process !== 'undefined' && process.env && !process.env.BLUESMIND_API_KEY) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('dotenv').config();
  } catch {
    // dotenv not available, that's okay for Remotion bundling
  }
}

const BLUESMIND_API_BASE_URL = process.env.BLUESMIND_API_BASE_URL || 'https://api.bluesminds.com/v1';
const BLUESMIND_API_KEY = process.env.BLUESMIND_API_KEY;

/**
 * Model chain: dicoba berurutan dari paling capable ke paling ringan.
 * Jika model utama timeout/504, otomatis fallback ke model berikutnya.
 * Override via env: BLUESMIND_PRIMARY_MODEL dan BLUESMIND_FALLBACK_MODEL
 */
const MODEL_CHAIN: string[] = [
  process.env.BLUESMIND_PRIMARY_MODEL || 'meta/llama-3.1-8b-instruct', // Use lighter model as primary to reduce 504 errors
  process.env.BLUESMIND_FALLBACK_MODEL || 'meta/llama-3.3-70b-instruct', // Fallback to more powerful model
  'google/gemma-3-12b-it',                                               // Fallback 2
];

const DEFAULT_MODEL = MODEL_CHAIN[0];

/** Timeout per request dalam milidetik (default: 180 detik untuk mengurangi 504 errors) */
const REQUEST_TIMEOUT_MS = parseInt(process.env.BLUESMIND_TIMEOUT_MS || '180000', 10);

/** Delay dasar antar retry dalam milidetik */
const BASE_RETRY_DELAY_MS = parseInt(process.env.BLUESMIND_RETRY_BASE_DELAY_MS || '6000', 10);

/** Delay maksimal antar retry dalam milidetik */
const MAX_RETRY_DELAY_MS = parseInt(process.env.BLUESMIND_RETRY_MAX_DELAY_MS || '120000', 10);

/**
 * Untuk error gateway/timeout, lebih baik cepat pindah model daripada
 * menghabiskan semua retry di model besar yang sedang overload.
 */
const RETRIES_PER_MODEL_ON_GATEWAY_ERROR = parseInt(
  process.env.BLUESMIND_GATEWAY_RETRIES_PER_MODEL || '2',
  10
);

const ERROR_BODY_PREVIEW_LENGTH = 500;

/** Status HTTP yang layak di-retry */
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

/** Circuit breaker state untuk mencegah cascading failures */
let circuitBreakerOpen = false;
let circuitBreakerOpenTime = 0;
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute
const CONSECUTIVE_FAILURES_THRESHOLD = 3;
let consecutiveFailures = 0;

if (!BLUESMIND_API_KEY) {
  console.warn('BLUESMIND_API_KEY tidak ditemukan di environment variables');
}

export interface BluesmindRequestOptions {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  /** Jumlah maksimal percobaan (default: 3) */
  maxRetries?: number;
}

export interface BluesmindResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

function getRetryAfterMs(response: Response): number | null {
  const retryAfter = response.headers.get('retry-after');
  if (!retryAfter) {
    return null;
  }

  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds)) {
    return Math.max(0, seconds * 1000);
  }

  const dateMs = Date.parse(retryAfter);
  if (Number.isFinite(dateMs)) {
    return Math.max(0, dateMs - Date.now());
  }

  return null;
}

function compactErrorBody(errorText: string): string {
  const withoutHtml = errorText
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const compact = withoutHtml || errorText.replace(/\s+/g, ' ').trim();
  return compact.length > ERROR_BODY_PREVIEW_LENGTH
    ? `${compact.slice(0, ERROR_BODY_PREVIEW_LENGTH)}...`
    : compact;
}

function isGatewayOrTimeoutError(error: string): boolean {
  const normalized = error.toLowerCase();
  return (
    normalized.includes('504') ||
    normalized.includes('gateway') ||
    normalized.includes('timeout') ||
    normalized.includes('timed out') ||
    normalized.includes('502') ||
    normalized.includes('503')
  );
}

/**
 * Hitung delay dengan exponential backoff + jitter untuk menghindari thundering herd
 * delay = BASE * 2^(attempt-1) + random jitter (0–1000ms)
 */
function calcBackoffMs(attempt: number): number {
  const exponential = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1); // 3s, 6s, 12s, …
  const jitter = Math.random() * 1000;
  return Math.min(exponential + jitter, MAX_RETRY_DELAY_MS);
}

/**
 * Fungsi umum untuk memanggil Bluesmind API dengan retry otomatis
 */
export async function callBluesmindAPI<T = unknown>(
  options: BluesmindRequestOptions
): Promise<BluesmindResponse<T>> {
  const {
    endpoint,
    method = 'GET',
    body,
    headers = {},
    maxRetries = 3,
  } = options;

  // Check circuit breaker
  if (circuitBreakerOpen) {
    const timeSinceOpen = Date.now() - circuitBreakerOpenTime;
    if (timeSinceOpen < CIRCUIT_BREAKER_TIMEOUT) {
      console.warn(`⚠️ Circuit breaker is open. Blocking requests for ${Math.round((CIRCUIT_BREAKER_TIMEOUT - timeSinceOpen) / 1000)}s`);
      return {
        success: false,
        error: 'Circuit breaker is open due to consecutive failures. Please try again later.'
      };
    } else {
      // Reset circuit breaker after timeout
      console.log('✅ Circuit breaker reset after timeout');
      circuitBreakerOpen = false;
      consecutiveFailures = 0;
    }
  }

  const url = `${BLUESMIND_API_BASE_URL}${endpoint}`;
  let lastError = '';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Buat AbortController untuk timeout per request
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BLUESMIND_API_KEY}`,
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errorText = await response.text();
        lastError = `API Error: ${response.status} - ${compactErrorBody(errorText)}`;

        // Track consecutive failures for circuit breaker
        if (RETRYABLE_STATUS_CODES.has(response.status)) {
          consecutiveFailures++;
          if (consecutiveFailures >= CONSECUTIVE_FAILURES_THRESHOLD) {
            console.error('🔴 Circuit breaker opened due to consecutive failures');
            circuitBreakerOpen = true;
            circuitBreakerOpenTime = Date.now();
          }
        }

        // Cek apakah status code layak di-retry
        if (RETRYABLE_STATUS_CODES.has(response.status) && attempt < maxRetries) {
          const retryAfterMs = getRetryAfterMs(response);
          const delay = Math.min(retryAfterMs ?? calcBackoffMs(attempt), MAX_RETRY_DELAY_MS);
          console.warn(
            `⚠️  Attempt ${attempt}/${maxRetries} failed: ${lastError}. ` +
            `Retrying in ${Math.round(delay / 1000)}s...`
          );
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        return { success: false, error: lastError };
      }

      // Reset consecutive failures on success
      consecutiveFailures = 0;
      const data = await response.json() as T;
      return { success: true, data };

    } catch (error) {
      clearTimeout(timer);

      const isAbort = error instanceof Error && error.name === 'AbortError';
      lastError = isAbort
        ? `Request timeout after ${REQUEST_TIMEOUT_MS / 1000}s`
        : error instanceof Error
          ? error.message
          : 'Unknown error occurred';

      // Track consecutive failures for circuit breaker
      consecutiveFailures++;
      if (consecutiveFailures >= CONSECUTIVE_FAILURES_THRESHOLD) {
        console.error('🔴 Circuit breaker opened due to consecutive failures');
        circuitBreakerOpen = true;
        circuitBreakerOpenTime = Date.now();
      }

      if (attempt < maxRetries) {
        const delay = calcBackoffMs(attempt);
        console.warn(
          `⚠️  Attempt ${attempt}/${maxRetries} failed: ${lastError}. ` +
          `Retrying in ${Math.round(delay / 1000)}s...`
        );
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  return {
    success: false,
    error: `Failed after ${maxRetries} attempts. Last error: ${lastError}`,
  };
}

/**
 * OpenAI-compatible Chat Completions
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  /** Jumlah maksimal percobaan retry (default: 3) */
  maxRetries?: number;
  /**
   * Jika true, gunakan model chain (fallback otomatis ke model lebih ringan jika 504).
   * Default: true
   */
  useModelFallback?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Panggil satu model secara langsung (tanpa fallback chain)
 */
async function callModel(
  model: string,
  request: ChatCompletionRequest,
  maxRetries: number
): Promise<BluesmindResponse<ChatCompletionResponse>> {
  return callBluesmindAPI<ChatCompletionResponse>({
    endpoint: '/chat/completions',
    method: 'POST',
    body: {
      model,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens ?? 800,
      stream: request.stream ?? false,
    },
    maxRetries,
  });
}

/**
 * Fungsi utama untuk chat completions dengan model fallback chain.
 *
 * Urutan percobaan:
 *  1. Gunakan model yang ditentukan (atau DEFAULT_MODEL)
 *  2. Jika gagal karena 504/timeout, coba model fallback berikutnya secara otomatis
 *
 * @param request  Parameter request chat completion
 * @param maxRetries  (legacy) gunakan request.maxRetries sebagai gantinya.
 *                    Jika keduanya diisi, request.maxRetries diprioritaskan.
 */
export async function bluesmindChatCompletion(
  request: ChatCompletionRequest,
  maxRetries: number = 3
): Promise<BluesmindResponse<ChatCompletionResponse>> {
  // request.maxRetries diprioritaskan, fallback ke parameter posisi ke-2
  const retries = request.maxRetries ?? maxRetries;
  const useFallback = request.useModelFallback !== false; // default true

  // Bangun daftar model yang akan dicoba
  const primaryModel = request.model || DEFAULT_MODEL;
  const modelsToTry: string[] = useFallback
    ? [primaryModel, ...MODEL_CHAIN.filter(m => m !== primaryModel)]
    : [primaryModel];

  let lastError = '';

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    const isLastModel = i === modelsToTry.length - 1;
    
    if (i > 0) {
      console.warn(`🔄 Switching to fallback model: ${model}`);
    }

    const perModelRetries = useFallback
      ? Math.max(1, Math.min(retries, RETRIES_PER_MODEL_ON_GATEWAY_ERROR))
      : retries;
    const result = await callModel(model, request, perModelRetries);

    if (result.success) {
      if (i > 0) {
        console.log(`✅ Success with fallback model: ${model}`);
      }
      return result;
    }

    lastError = result.error || 'Unknown error';

    // Hanya fallback ke model berikutnya jika error adalah server overload/gateway/timeout
    const isRetryableError = isGatewayOrTimeoutError(lastError) || lastError.includes('500');

    if (!isRetryableError || isLastModel) {
      // Error bukan karena server overload, atau sudah habis fallback
      return result;
    }

    console.warn(`⚠️  Model ${model} tidak tersedia (${lastError.substring(0, 80)}...). Mencoba fallback...`);
  }

  return {
    success: false,
    error: `All models failed. Last error: ${lastError}`,
  };
}

/**
 * Contoh fungsi khusus untuk text generation (jika Bluesmind mendukung)
 */
export async function bluesmindGenerateText(prompt: string, model?: string) {
  return callBluesmindAPI({
    endpoint: '/generate',
    method: 'POST',
    body: { prompt, model },
  });
}

/**
 * Coding Assistant Functions menggunakan Bluesmind Chat Completions
 */

export interface CodeGenerationRequest {
  prompt: string;
  language?: string;
  context?: string;
  model?: string;
}

export interface CodeCompletionRequest {
  code: string;
  cursorPosition?: number;
  language?: string;
  model?: string;
}

export interface CodeExplanationRequest {
  code: string;
  language?: string;
  model?: string;
}

/**
 * Generate code dari prompt menggunakan Chat Completions
 */
export async function bluesmindGenerateCode(request: CodeGenerationRequest) {
  const systemPrompt = `You are an expert coding assistant. Generate clean, efficient, and well-documented code. If a specific language is requested, use that language. Best practices and error handling should be included.`;
  
  let userPrompt = request.language 
    ? `Generate ${request.language} code for: ${request.prompt}`
    : `Generate code for: ${request.prompt}`;

  if (request.context) {
    userPrompt += `\n\nContext: ${request.context}`;
  }

  return bluesmindChatCompletion({
    model: request.model || DEFAULT_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  });
}

/**
 * Code completion / autocomplete menggunakan Chat Completions
 */
export async function bluesmindCodeCompletion(request: CodeCompletionRequest) {
  const systemPrompt = `You are an expert coding assistant. Complete the given code snippet with the most appropriate continuation. Return only the completion code, no explanations.`;
  
  const userPrompt = request.language
    ? `Complete this ${request.language} code:\n\`\`\`${request.language}\n${request.code}\n\`\`\``
    : `Complete this code:\n\`\`\`\n${request.code}\n\`\`\``;

  return bluesmindChatCompletion({
    model: request.model || DEFAULT_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  });
}

/**
 * Explain code menggunakan Chat Completions
 */
export async function bluesmindExplainCode(request: CodeExplanationRequest) {
  const systemPrompt = `You are an expert coding instructor. Explain code clearly and concisely, covering the purpose, logic, and any important patterns or best practices used.`;
  
  const userPrompt = request.language
    ? `Explain this ${request.language} code:\n\`\`\`${request.language}\n${request.code}\n\`\`\``
    : `Explain this code:\n\`\`\`\n${request.code}\n\`\`\``;

  return bluesmindChatCompletion({
    model: request.model || DEFAULT_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  });
}
