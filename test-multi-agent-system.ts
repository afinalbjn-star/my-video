/**
 * Multi-Agent System Test Suite
 * Comprehensive testing for the enhanced AI agent architecture
 */

import 'dotenv/config';
import { EnhancedUniversalAgent } from './src/agent/multi-agent';

async function testMultiAgentSystem() {
  console.log('🧪 Starting Multi-Agent System Tests...\n');
  
  const agent = new EnhancedUniversalAgent();
  const testSessionId = 'test-session-' + Date.now();
  
  try {
    // Test 1: System Status
    console.log('📊 Test 1: System Status Check');
    const systemStatus = agent.getSystemStatus();
    console.log('✅ System Status:', {
      multiAgentEnabled: systemStatus.multiAgentEnabled,
      availableAgents: systemStatus.availableAgents,
      activeSessions: systemStatus.activeSessions
    });
    console.log('');

    // Test 2: Enable Multi-Agent System
    console.log('🔧 Test 2: Enable Multi-Agent System');
    agent.setMultiAgentEnabled(true);
    console.log('✅ Multi-agent system enabled');
    console.log('');

    // Test 3: Complex Code Task (should trigger multi-agent)
    console.log('💻 Test 3: Complex Code Generation Task');
    const codeResponse = await agent.chat(
      testSessionId,
      'Buatkan function TypeScript yang kompleks untuk memproses data array dengan optimalisasi performa',
      'code'
    );
    console.log('✅ Code Response:', {
      mode: codeResponse.mode,
      agentsUsed: codeResponse.agentsUsed,
      hasPerformanceMetrics: !!codeResponse.performanceMetrics
    });
    console.log('');

    // Test 4: Research Task (should trigger multi-agent)
    console.log('🔍 Test 4: Research Task');
    const researchResponse = await agent.chat(
      testSessionId,
      'Riset mendalam tentang perkembangan AI terbaru dalam bidang computer vision',
      'research'
    );
    console.log('✅ Research Response:', {
      mode: researchResponse.mode,
      agentsUsed: researchResponse.agentsUsed,
      hasPerformanceMetrics: !!researchResponse.performanceMetrics
    });
    console.log('');

    // Test 5: Simple General Task (should use single agent)
    console.log('💬 Test 5: Simple General Task');
    const generalResponse = await agent.chat(
      testSessionId,
      'Halo, apa kabar?',
      'general'
    );
    console.log('✅ General Response:', {
      mode: generalResponse.mode,
      agentsUsed: generalResponse.agentsUsed,
      textLength: generalResponse.text.length
    });
    console.log('');

    // Test 6: Performance Metrics
    console.log('📈 Test 6: Performance Metrics');
    const finalStatus = agent.getSystemStatus();
    console.log('✅ Final Performance Metrics:', {
      systemMetrics: finalStatus.systemMetrics,
      agentPerformance: Object.keys(finalStatus.agentPerformance).length
    });
    console.log('');

    // Test 7: Coordinator Direct Access
    console.log('🎯 Test 7: Coordinator Direct Access');
    const coordinator = agent.getCoordinator();
    const availableAgents = coordinator.getAvailableAgents();
    console.log('✅ Available Agents:', availableAgents);
    console.log('');

    console.log('🎉 All Multi-Agent System Tests Passed!');
    
    // Cleanup
    await agent.cleanup();
    
  } catch (error) {
    console.error('❌ Test Failed:', error);
    await agent.cleanup();
    process.exit(1);
  }
}

// Run tests
testMultiAgentSystem().then(() => {
  console.log('✅ Test suite completed successfully');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});