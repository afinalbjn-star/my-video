/**
 * Contoh penggunaan Bluesmind API untuk coding assistant
 * File ini hanya untuk referensi dan testing
 * Bluesmind menggunakan format OpenAI-compatible dengan endpoint /chat/completions
 */

import {
  bluesmindGenerateCode,
  bluesmindCodeCompletion,
  bluesmindExplainCode,
  bluesmindChatCompletion
} from './bluesmind';

// Contoh 1: Generate code dari prompt
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function exampleGenerateCode() {
  const result = await bluesmindGenerateCode({
    prompt: 'Buat fungsi TypeScript untuk memvalidasi email dengan regex',
    language: 'typescript',
    model: 'meta/llama-3.1-70b-instruct'
  });

  if (result.success && result.data?.choices?.[0]) {
    console.log('Generated code:', result.data.choices[0].message.content);
  } else {
    console.error('Error:', result.error);
  }
}

// Contoh 2: Code completion
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function exampleCodeCompletion() {
  const result = await bluesmindCodeCompletion({
    code: 'function calculateSum(a: number, b: number) {',
    language: 'typescript'
  });

  if (result.success && result.data?.choices?.[0]) {
    console.log('Completion:', result.data.choices[0].message.content);
  } else {
    console.error('Error:', result.error);
  }
}

// Contoh 3: Explain code
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function exampleExplainCode() {
  const result = await bluesmindExplainCode({
    code: `
      const fibonacci = (n: number): number => {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
      };
    `,
    language: 'typescript'
  });

  if (result.success && result.data?.choices?.[0]) {
    console.log('Explanation:', result.data.choices[0].message.content);
  } else {
    console.error('Error:', result.error);
  }
}

// Contoh 4: Chat completion langsung (untuk general AI tasks)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function exampleChatCompletion() {
  const result = await bluesmindChatCompletion({
    model: 'meta/llama-3.1-70b-instruct',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful AI assistant specialized in video production and coding.'
      },
      {
        role: 'user',
        content: 'What are the best practices for optimizing Remotion video rendering performance?'
      }
    ],
    temperature: 0.7,
    max_tokens: 2000000
  });

  if (result.success && result.data?.choices?.[0]) {
    console.log('AI Response:', result.data.choices[0].message.content);
    console.log('Tokens used:', result.data.usage);
  } else {
    console.error('Error:', result.error);
  }
}

// Contoh integrasi dalam Remotion composition
export async function useBluesmindForCodeGeneration(prompt: string) {
  const result = await bluesmindGenerateCode({
    prompt,
    language: 'typescript'
  });

  if (result.success && result.data?.choices?.[0]) {
    return result.data.choices[0].message.content;
  }
  return null;
}

// Contoh untuk AI assistant dalam workflow video production
export async function useBluesmindForVideoIdeas(topic: string) {
  const result = await bluesmindChatCompletion({
    messages: [
      {
        role: 'system',
        content: 'You are a creative video production assistant. Suggest creative video ideas and concepts.'
      },
      {
        role: 'user',
        content: `Give me 3 creative video ideas for: ${topic}`
      }
    ]
  });

  if (result.success && result.data?.choices?.[0]) {
    return result.data.choices[0].message.content;
  }
  return null;
}