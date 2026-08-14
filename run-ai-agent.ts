/**
 * Main script to run the AI Agent for Remotion video creation
 * Usage: npx tsx run-ai-agent.ts "your video prompt"
 */

import 'dotenv/config';
import { AIAgentController } from './src/agent/agent-controller';

async function main() {
  // Get prompt from command line
  const prompt = process.argv[2];
  
  if (!prompt) {
    console.error('❌ Error: Please provide a video prompt');
    console.log('Usage: npx tsx run-ai-agent.ts "your video prompt"');
    console.log('Example: npx tsx run-ai-agent.ts "Create a 30-second kinetic typography video about AI technology"');
    process.exit(1);
  }

  // Check environment variables
  if (!process.env.BLUESMIND_API_KEY) {
    console.error('❌ Error: BLUESMIND_API_KEY not found in environment variables');
    console.log('Please set up your .env file with Bluesmind API credentials');
    process.exit(1);
  }

  if (!process.env.GITHUB_TOKEN) {
    console.warn('⚠️  Warning: GITHUB_TOKEN not found. Git operations may fail.');
    console.log('Please add GITHUB_TOKEN to your .env file for automated git operations');
  }

  console.log('🚀 Starting AI Agent for Remotion Video Creation');
  console.log('=' .repeat(50));

  // Initialize agent controller
  const agent = new AIAgentController();

  // Run the agent
  const result = await agent.createRemotionVideo(prompt);

  console.log('=' .repeat(50));
  if (result.success) {
    console.log('✅', result.message);
    console.log('🎉 Your AI-generated Remotion video is ready!');
  } else {
    console.log('❌', result.message);
    console.log('Please check the error and try again.');
  }

  process.exit(result.success ? 0 : 1);
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});