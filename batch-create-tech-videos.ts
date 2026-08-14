/**
 * Batch AI Agent to create 10 complex technology background videos
 * 4K 60fps 15 seconds seamless loop
 */

import 'dotenv/config';
import { AIAgentController } from './src/agent/agent-controller';

const technologyPrompts = [
  "Create a complex neural network visualization with glowing nodes and connections, 4K 60fps 15 seconds seamless loop",
  "Create a cyberpunk city data stream animation with falling matrix code and neon lights, 4K 60fps 15 seconds seamless loop", 
  "Create a quantum computing particle system with entangled particles and wave functions, 4K 60fps 15 seconds seamless loop",
  "Create a blockchain network visualization with transaction blocks and hash chains, 4K 60fps 15 seconds seamless loop",
  "Create a holographic interface animation with floating panels and data visualizations, 4K 60fps 15 seconds seamless loop",
  "Create a server room data center cooling animation with heat maps and airflow visualization, 4K 60fps 15 seconds seamless loop",
  "Create a satellite network global connectivity animation with orbital paths and signal beams, 4K 60fps 15 seconds seamless loop",
  "Create a biotechnology DNA helix animation with genetic sequences and molecular bonds, 4K 60fps 15 seconds seamless loop",
  "Create a virtual reality metaverse grid animation with digital terrain and avatars, 4K 60fps 15 seconds seamless loop",
  "Create a artificial intelligence neural pathway animation with synaptic connections and learning visualization, 4K 60fps 15 seconds seamless loop"
];

async function createBatchVideos() {
  console.log('🚀 Starting Batch AI Agent for 10 Technology Background Videos');
  console.log('⚙️  Specifications: 4K resolution, 60fps, 15 seconds, seamless loop');
  console.log('=' .repeat(80));

  const agent = new AIAgentController();
  const results = {
    successful: 0,
    failed: 0,
    errors: [] as string[]
  };

  for (let i = 0; i < technologyPrompts.length; i++) {
    const prompt = technologyPrompts[i];
    console.log(`\n🎬 Video ${i + 1}/10: ${prompt.substring(0, 50)}...`);
    console.log('-'.repeat(80));

    try {
      const result = await agent.createRemotionVideo(prompt);
      
      if (result.success) {
        results.successful++;
        console.log(`✅ Video ${i + 1} completed successfully`);
      } else {
        results.failed++;
        results.errors.push(`Video ${i + 1}: ${result.message}`);
        console.log(`❌ Video ${i + 1} failed: ${result.message}`);
      }

      // Wait between videos to avoid API rate limiting
      if (i < technologyPrompts.length - 1) {
        console.log('⏳ Waiting 5 seconds before next video...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

    } catch (error) {
      results.failed++;
      results.errors.push(`Video ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log(`💥 Video ${i + 1} crashed: ${error}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 BATCH COMPLETION SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Successful: ${results.successful}/10`);
  console.log(`❌ Failed: ${results.failed}/10`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }

  console.log('\n🎉 Batch process completed!');
  console.log('📦 All generated videos have been committed to git');
  console.log('🚀 Ready for GitHub push and rendering');
}

createBatchVideos().catch(error => {
  console.error('💥 Fatal batch error:', error);
  process.exit(1);
});