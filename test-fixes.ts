/**
 * Test script to validate the fixes applied to the AI agent
 */

import 'dotenv/config';

console.log('🧪 Testing AI Agent Fixes...\n');

// Test 1: Environment Variables
console.log('📋 Test 1: Environment Variables Check');
const requiredEnvVars = [
  'BLUESMIND_API_KEY',
  'GITHUB_TOKEN', 
  'GITHUB_USERNAME',
  'GITHUB_REPO'
];

let allEnvPresent = true;
for (const envVar of requiredEnvVars) {
  const value = process.env[envVar];
  if (!value || value === 'your_api_key_here' || value === 'your_github_personal_access_token') {
    console.log(`❌ ${envVar}: Missing or using placeholder value`);
    allEnvPresent = false;
  } else {
    // Partially mask sensitive values
    const masked = value.length > 8 ? value.substring(0, 4) + '****' + value.substring(value.length - 4) : '****';
    console.log(`✅ ${envVar}: ${masked}`);
  }
}

if (allEnvPresent) {
  console.log('✅ All required environment variables are set\n');
} else {
  console.log('⚠️  Some environment variables are missing. Please update your .env file\n');
}

// Test 2: GitHub Token Format Validation
console.log('🔐 Test 2: GitHub Token Format Validation');
const githubToken = process.env.GITHUB_TOKEN;
if (githubToken) {
  if (githubToken.startsWith('ghp_') || githubToken.startsWith('github_pat_')) {
    console.log('✅ GitHub token format is valid');
  } else {
    console.log('⚠️  GitHub token format might be invalid. Expected format: ghp_XXXXXXXXXX or github_pat_XXXXXXXXXX');
  }
} else {
  console.log('❌ GitHub token is missing');
}

// Test 3: Bluesmind API Configuration
console.log('\n🔧 Test 3: Bluesmind API Configuration');
const timeout = parseInt(process.env.BLUESMIND_TIMEOUT_MS || '180000', 10);
const retryDelay = parseInt(process.env.BLUESMIND_RETRY_BASE_DELAY_MS || '6000', 10);
const primaryModel = process.env.BLUESMIND_PRIMARY_MODEL || 'meta/llama-3.1-8b-instruct';

console.log(`✅ Timeout: ${timeout}ms (${timeout/1000}s)`);
console.log(`✅ Retry Delay: ${retryDelay}ms (${retryDelay/1000}s)`);
console.log(`✅ Primary Model: ${primaryModel}`);

if (timeout >= 180000) {
  console.log('✅ Timeout is properly configured for reliability');
} else {
  console.log('⚠️  Timeout might be too short, consider increasing to 180000ms');
}

// Test 4: TypeScript Configuration
console.log('\n📝 Test 4: TypeScript Configuration');
const fs = require('fs');
const path = require('path');

try {
  const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  if (tsconfig.compilerOptions.jsx === 'react-jsx') {
    console.log('✅ TypeScript JSX configuration is correct');
  } else {
    console.log('⚠️  TypeScript JSX configuration might need attention');
  }
  
  if (tsconfig.compilerOptions.moduleResolution === 'node') {
    console.log('✅ TypeScript module resolution is configured');
  }
} catch (error) {
  console.log('❌ Failed to read tsconfig.json');
}

// Test 5: Import Multi-Agent System
console.log('\n🤖 Test 5: Multi-Agent System Import');
try {
  const { EnhancedUniversalAgent } = require('./src/agent/multi-agent');
  console.log('✅ Multi-agent system imports successfully');
  
  const agent = new EnhancedUniversalAgent();
  const systemStatus = agent.getSystemStatus();
  console.log('✅ Agent system status:', {
    multiAgentEnabled: systemStatus.multiAgentEnabled,
    availableAgents: systemStatus.availableAgents.length,
  });
} catch (error) {
  console.log('❌ Multi-agent system import failed:', error.message);
}

console.log('\n🎉 Fix validation complete!');
console.log('\n📖 For detailed information about the fixes, see FIXES_GUIDE.md');