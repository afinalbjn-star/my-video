/**
 * GitHub Authentication Diagnostic Tool
 * Untuk mendiagnosa dan memperbaiki masalah GitHub authentication
 */

import 'dotenv/config';
import * as https from 'https';

console.log('🔍 GitHub Authentication Diagnostic Tool\n');

// Get environment variables
const token = process.env.GITHUB_TOKEN;
const username = process.env.GITHUB_USERNAME;
const repo = process.env.GITHUB_REPO;

console.log('📋 Environment Variables:');
console.log(`Token: ${token ? token.substring(0, 8) + '...' + token.substring(token.length - 4) : 'MISSING'}`);
console.log(`Username: ${username || 'MISSING'}`);
console.log(`Repository: ${repo || 'MISSING'}`);
console.log('');

// Validation functions
function validateTokenFormat(token: string): { valid: boolean; message: string } {
  if (!token) {
    return { valid: false, message: 'Token is missing' };
  }
  
  if (token === 'your_github_personal_access_token' || token === 'your_api_key_here') {
    return { valid: false, message: 'Token is still using placeholder value' };
  }
  
  if (token.startsWith('ghp_')) {
    return { valid: true, message: 'Classic Personal Access Token (valid format)' };
  }
  
  if (token.startsWith('github_pat_')) {
    return { valid: true, message: 'Fine-grained Personal Access Token (valid format)' };
  }
  
  return { valid: false, message: 'Invalid token format. Expected: ghp_XXXXXXXXXX or github_pat_XXXXXXXXXX' };
}

// Test GitHub API connection
async function testGitHubAPI(token: string): Promise<{ success: boolean; message: string; data?: any }> {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: '/user',
      method: 'GET',
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'AI-Agent-Diagnostic-Tool',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const userData = JSON.parse(data);
            resolve({ 
              success: true, 
              message: 'Authentication successful',
              data: userData
            });
          } catch {
            resolve({ success: true, message: 'Authentication successful (could not parse user data)' });
          }
        } else if (res.statusCode === 401) {
          resolve({ 
            success: false, 
            message: `Authentication failed (401): ${data}` 
          });
        } else if (res.statusCode === 403) {
          resolve({ 
            success: false, 
            message: `Forbidden (403): ${data}` 
          });
        } else {
          resolve({ 
            success: false, 
            message: `Unexpected status code ${res.statusCode}: ${data}` 
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ 
        success: false, 
        message: `Network error: ${error.message}` 
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ success: false, message: 'Request timeout after 10 seconds' });
    });

    req.end();
  });
}

// Test repository access
async function testRepositoryAccess(token: string, username: string, repo: string): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${username}/${repo}`,
      method: 'GET',
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'AI-Agent-Diagnostic-Tool',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const repoData = JSON.parse(data);
            resolve({ 
              success: true, 
              message: `Repository accessible: ${repoData.full_name}`,
            });
          } catch {
            resolve({ success: true, message: 'Repository accessible' });
          }
        } else if (res.statusCode === 404) {
          resolve({ 
            success: false, 
            message: `Repository not found: ${username}/${repo}. Please check the repository name and ensure it exists.` 
          });
        } else if (res.statusCode === 403) {
          resolve({ 
            success: false, 
            message: `Access forbidden (403): ${data}. Token may not have sufficient permissions.` 
          });
        } else if (res.statusCode === 401) {
          resolve({ 
            success: false, 
            message: `Authentication failed (401): ${data}` 
          });
        } else {
          resolve({ 
            success: false, 
            message: `Unexpected status code ${res.statusCode}: ${data}` 
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ 
        success: false, 
        message: `Network error: ${error.message}` 
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ success: false, message: 'Request timeout after 10 seconds' });
    });

    req.end();
  });
}

// Test workflow file existence
async function testWorkflowFile(token: string, username: string, repo: string): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${username}/${repo}/contents/.github/workflows/render.yml`,
      method: 'GET',
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'AI-Agent-Diagnostic-Tool',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ 
            success: true, 
            message: 'Workflow file render.yml exists' 
          });
        } else if (res.statusCode === 404) {
          resolve({ 
            success: false, 
            message: 'Workflow file render.yml not found in .github/workflows/' 
          });
        } else {
          resolve({ 
            success: false, 
            message: `Unexpected status code ${res.statusCode}: ${data}` 
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ 
        success: false, 
        message: `Network error: ${error.message}` 
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ success: false, message: 'Request timeout after 10 seconds' });
    });

    req.end();
  });
}

// Main diagnostic flow
async function runDiagnostics() {
  let allPassed = true;

  // Test 1: Token Format
  console.log('🔧 Test 1: Token Format Validation');
  const tokenValidation = validateTokenFormat(token || '');
  console.log(`${tokenValidation.valid ? '✅' : '❌'} ${tokenValidation.message}`);
  if (!tokenValidation.valid) allPassed = false;
  console.log('');

  // Test 2: GitHub API Authentication
  console.log('🔐 Test 2: GitHub API Authentication');
  if (token) {
    const authResult = await testGitHubAPI(token);
    console.log(`${authResult.success ? '✅' : '❌'} ${authResult.message}`);
    if (authResult.data) {
      console.log(`   Authenticated as: ${authResult.data.login}`);
      console.log(`   Account type: ${authResult.data.type}`);
    }
    if (!authResult.success) allPassed = false;
  } else {
    console.log('❌ Cannot test authentication - token is missing');
    allPassed = false;
  }
  console.log('');

  // Test 3: Repository Access
  console.log('📁 Test 3: Repository Access');
  if (token && username && repo) {
    const repoResult = await testRepositoryAccess(token, username, repo);
    console.log(`${repoResult.success ? '✅' : '❌'} ${repoResult.message}`);
    if (!repoResult.success) allPassed = false;
  } else {
    console.log('❌ Cannot test repository access - missing credentials');
    allPassed = false;
  }
  console.log('');

  // Test 4: Workflow File
  console.log('📄 Test 4: Workflow File Existence');
  if (token && username && repo) {
    const workflowResult = await testWorkflowFile(token, username, repo);
    console.log(`${workflowResult.success ? '✅' : '❌'} ${workflowResult.message}`);
    if (!workflowResult.success) {
      console.log('   ⚠️  This will cause workflow trigger to fail');
      allPassed = false;
    }
  } else {
    console.log('❌ Cannot test workflow file - missing credentials');
    allPassed = false;
  }
  console.log('');

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (allPassed) {
    console.log('✅ All diagnostic tests passed!');
    console.log('GitHub authentication should work correctly.');
  } else {
    console.log('❌ Some diagnostic tests failed.');
    console.log('Please fix the issues above before using the AI agent.');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Recommendations
  if (!allPassed) {
    console.log('\n📋 Recommendations:');
    console.log('1. Generate a new GitHub Personal Access Token:');
    console.log('   - Go to: https://github.com/settings/tokens');
    console.log('   - Click: "Generate new token" → "Generate new token (classic)"');
    console.log('   - Select permissions: repo (full control of private repositories)');
    console.log('   - Generate and copy the token');
    console.log('');
    console.log('2. Update your .env file:');
    console.log('   GITHUB_TOKEN=ghp_your_new_token_here');
    console.log('   GITHUB_USERNAME=your_actual_username');
    console.log('   GITHUB_REPO=your_actual_repository_name');
    console.log('');
    console.log('3. Ensure the repository exists and you have access:');
    console.log('   - Visit: https://github.com/YOUR_USERNAME/YOUR_REPO');
    console.log('   - Create it if it doesn\'t exist');
    console.log('   - Ensure you have push permissions');
    console.log('');
    console.log('4. Verify workflow file exists:');
    console.log('   - Check: .github/workflows/render.yml');
    console.log('   - Create it if missing');
  }
}

// Run diagnostics
runDiagnostics().catch(error => {
  console.error('❌ Diagnostic tool error:', error);
  process.exit(1);
});