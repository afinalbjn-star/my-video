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
const DEFAULT_MODEL = 'meta/llama-3.1-70b-instruct';

if (!BLUESMIND_API_KEY) {
  console.warn('BLUESMIND_API_KEY tidak ditemukan di environment variables');
}

export interface BluesmindRequestOptions {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
}

export interface BluesmindResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Fungsi umum untuk memanggil Bluesmind API
 */
export async function callBluesmindAPI<T = unknown>(
  options: BluesmindRequestOptions
): Promise<BluesmindResponse<T>> {
  const {
    endpoint,
    method = 'GET',
    body,
    headers = {}
  } = options;

  try {
    const url = `${BLUESMIND_API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BLUESMIND_API_KEY}`,
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `API Error: ${response.status} - ${errorText}`
      };
    }

    const data = await response.json();
    return {
      success: true,
      data
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
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
 * Fungsi utama untuk chat completions (OpenAI-compatible) dengan retry logic
 */
export async function bluesmindChatCompletion(
  request: ChatCompletionRequest,
  maxRetries: number = 3
): Promise<BluesmindResponse<ChatCompletionResponse>> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await callBluesmindAPI<ChatCompletionResponse>({
      endpoint: '/chat/completions',
      method: 'POST',
      body: {
        model: request.model || DEFAULT_MODEL,
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.max_tokens || 500, // Default lower token limit for faster response
        stream: request.stream || false
      }
    });

    // Jika sukses, return result
    if (result.success) {
      return result;
    }

    // Jika error 504 atau timeout, retry dengan delay
    if (result.error?.includes('504') || result.error?.includes('timeout')) {
      console.warn(`⚠️  Attempt ${attempt}/${maxRetries} failed: ${result.error}. Retrying in ${attempt * 2} seconds...`);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, attempt * 2000)); // Exponential backoff
        continue;
      }
    }

    // Untuk error lain, return immediately
    return result;
  }

  return {
    success: false,
    error: `Failed after ${maxRetries} attempts`
  };
}

/**
 * Contoh fungsi khusus untuk text generation (jika Bluesmind mendukung)
 */
export async function bluesmindGenerateText(prompt: string, model?: string) {
  return callBluesmindAPI({
    endpoint: '/generate', // Sesuaikan dengan endpoint yang sebenarnya
    method: 'POST',
    body: { prompt, model }
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