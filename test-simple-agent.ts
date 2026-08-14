/**
 * Simple test for AI agent without full workflow
 */

import 'dotenv/config';
import { bluesmindChatCompletion } from './src/lib/bluesmind';

async function testSimplePlanning() {
  console.log('🧪 Testing simple AI planning...');
  
  const systemPrompt = `You are an expert Remotion video developer. Plan a video project based on the user's prompt.
  Return a JSON response with:
  {
    "name": "project_name",
    "concept": "brief description", 
    "duration": 30,
    "style": "minimalist, kinetic typography, 3D, etc",
    "components": ["Component1", "Component2"],
    "technical_notes": "implementation details"
  }`;

  const result = await bluesmindChatCompletion({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Create a 10-second test video with simple text animation' }
    ],
    temperature: 0.7,
    max_tokens: 300 // Lower token limit for faster response
  });

  if (result.success && result.data?.choices?.[0]) {
    console.log('✅ AI Response received');
    console.log('Content:', result.data.choices[0].message.content);
  } else {
    console.log('❌ Error:', result.error);
  }
}

testSimplePlanning();