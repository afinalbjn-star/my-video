/**
 * Test script untuk Bluesmind API
 * Jalankan dengan: npx tsx test-bluesmind.ts
 */

import 'dotenv/config';
import { bluesmindChatCompletion } from './src/lib/bluesmind';

async function testBluesmind() {
  console.log('🧪 Testing Bluesmind API...');
  console.log('API Base URL:', process.env.BLUESMIND_API_BASE_URL);
  console.log('API Key:', process.env.BLUESMIND_API_KEY ? '✅ Set' : '❌ Not set');
  
  const result = await bluesmindChatCompletion({
    messages: [
      {
        role: 'system',
        content: 'You are a helpful AI assistant.'
      },
      {
        role: 'user',
        content: 'Hello! Can you introduce yourself?'
      }
    ],
    temperature: 0.7,
    max_tokens: 150
  });

  if (result.success && result.data?.choices?.[0]) {
    console.log('✅ Success!');
    console.log('AI Response:', result.data.choices[0].message.content);
    console.log('Tokens used:', result.data.usage);
  } else {
    console.log('❌ Error:', result.error);
  }
}

testBluesmind();