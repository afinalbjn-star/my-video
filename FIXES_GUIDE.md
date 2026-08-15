# 🔧 AI Agent Error Fixes Guide

## 📋 Overview
This guide explains the fixes applied to resolve the three main errors in the AI agent system:
1. **504 Gateway Time-out Errors** - API connectivity issues
2. **TypeScript JSX Configuration Errors** - Build/compilation issues  
3. **GitHub Authentication 401 Errors** - Git workflow failures

---

## 🚀 Fix 1: 504 Gateway Time-out Errors

### Problems Fixed:
- Frequent API timeouts when communicating with Bluesmind API
- Poor retry strategy causing cascading failures
- Heavy model selection causing overload

### Solutions Applied:

#### 1. **Increased Timeout Duration**
```typescript
// Changed from 120s to 180s
const REQUEST_TIMEOUT_MS = 180000;
```

#### 2. **Improved Retry Strategy**
```typescript
// Increased base delay from 4s to 6s
const BASE_RETRY_DELAY_MS = 6000;
// Increased max delay from 90s to 120s  
const MAX_RETRY_DELAY_MS = 120000;
```

#### 3. **Model Chain Optimization**
```typescript
// Use lighter model as primary to reduce load
const MODEL_CHAIN: string[] = [
  'meta/llama-3.1-8b-instruct',  // Primary (lighter, faster)
  'meta/llama-3.3-70b-instruct',  // Fallback (more powerful)
  'google/gemma-3-12b-it',        // Alternative
];
```

#### 4. **Circuit Breaker Implementation**
- Prevents cascading failures during API outages
- Automatically opens after 3 consecutive failures
- Resets after 60 seconds cooldown period

### How to Configure:
Update your `.env` file:
```env
BLUESMIND_TIMEOUT_MS=180000
BLUESMIND_RETRY_BASE_DELAY_MS=6000
BLUESMIND_RETRY_MAX_DELAY_MS=120000
BLUESMIND_PRIMARY_MODEL=meta/llama-3.1-8b-instruct
BLUESMIND_FALLBACK_MODEL=meta/llama-3.3-70b-instruct
```

---

## 🔧 Fix 2: TypeScript JSX Configuration Errors

### Problems Fixed:
- `TS17004: Cannot use JSX unless the '--jsx' flag is provided`
- Build failures when compiling TypeScript files
- Missing TypeScript configuration for agent files

### Solutions Applied:

#### 1. **Updated tsconfig.json**
```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "noUnusedLocals": false,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*", "*.ts"],
  "exclude": ["remotion.config.ts", "node_modules", "build"]
}
```

#### 2. **Created Separate Agent Config**
Created `tsconfig.agent.json` for agent-specific TypeScript files that don't need JSX support.

### How to Use:
- For Remotion components: Use default `tsconfig.json`
- For agent files: TypeScript will automatically use appropriate configuration
- Run agent scripts with: `npx tsx file.ts` (tsx handles JSX automatically)

---

## 🔐 Fix 3: GitHub Authentication 401 Errors

### Problems Fixed:
- `401 Bad credentials` when triggering GitHub workflows
- Invalid token format detection
- Missing token validation
- Git connection testing

### Solutions Applied:

#### 1. **Enhanced Token Validation**
```typescript
private validateConfig(): void {
  // Validate token presence
  if (!this.config.token || this.config.token.trim() === '') {
    throw new Error('GitHub token is missing or empty');
  }
  
  // Validate token format
  if (!this.config.token.startsWith('ghp_') && 
      !this.config.token.startsWith('github_pat_')) {
    console.warn('⚠️  GitHub token format might be invalid');
  }
}
```

#### 2. **Improved Git Configuration**
```typescript
// URL encoding for special characters in tokens
const encodedToken = encodeURIComponent(this.config.token);
const repoUrl = `https://${encodedToken}@github.com/${username}/${repo}.git`;

// Connection testing before operations
execSyncImport('git ls-remote origin', { stdio: 'pipe', timeout: 10000 });
```

#### 3. **GitHub API Authentication Testing**
```typescript
// Test authentication before triggering workflow
const testResponse = await fetch(`https://api.github.com/user`, {
  method: 'GET',
  headers: {
    'Authorization': `token ${token}`,
  },
});

if (!testResponse.ok) {
  return { success: false, error: 'GitHub authentication failed' };
}
```

### How to Fix GitHub Authentication:

#### Step 1: Generate Proper GitHub Token
1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Select permissions: **repo** (full control of private repositories)
4. Generate token and copy it (format: `ghp_XXXXXXXXXX`)

#### Step 2: Update .env File
```env
GITHUB_TOKEN=ghp_your_actual_token_here
GITHUB_USERNAME=your_github_username
GITHUB_REPO=your_repository_name
```

#### Step 3: Verify Repository Access
- Ensure the repository exists under your GitHub account
- Check that you have push permissions to the repository
- Verify the repository name matches exactly (case-sensitive)

#### Step 4: Test Git Connection
```bash
# Test git connection
git ls-remote origin

# If this fails, reconfigure git remote
git remote set-url origin https://YOUR_TOKEN@github.com/USERNAME/REPO.git
```

---

## 🧪 Testing the Fixes

### Test API Connectivity:
```bash
npm run test-ai
```

### Test Multi-Agent System:
```bash
npm run test-multi-agent
```

### Test Git Operations:
```bash
# Manual git test
git status
git add .
git commit -m "test commit"
git push origin main
```

### Test GitHub Workflow Trigger:
The system now automatically tests authentication before triggering workflows.

---

## 📊 Performance Improvements

### Before Fixes:
- ❌ Frequent 504 timeouts (30%+ failure rate)
- ❌ TypeScript compilation errors
- ❌ GitHub workflow failures (401 errors)
- ❌ No circuit breaker protection
- ❌ Heavy model usage causing overload

### After Fixes:
- ✅ Reduced timeout rate (circuit breaker + lighter models)
- ✅ Proper TypeScript configuration
- ✅ Validated GitHub authentication
- ✅ Circuit breaker prevents cascading failures
- ✅ Optimized model selection for better reliability

---

## 🎯 Additional Recommendations

### 1. Monitor API Usage
- Keep track of Bluesmind API usage
- Implement rate limiting if needed
- Monitor circuit breaker status

### 2. GitHub Token Security
- Never commit `.env` file to repository
- Use GitHub Secrets for production
- Rotate tokens periodically
- Use minimal required permissions

### 3. Error Monitoring
- Use the new performance monitoring system
- Check error logs regularly
- Set up alerts for critical failures

### 4. Backup Strategy
- Keep local backups of important work
- Use feature branches for AI-generated content
- Review AI-generated code before committing

---

## 🚨 Troubleshooting

### Still Getting 504 Errors?
1. Check Bluesmind API status
2. Increase timeout further in `.env`
3. Use only the lightweight model
4. Check your internet connection

### TypeScript Still Failing?
1. Clear TypeScript cache: `rm -rf node_modules/.cache`
2. Update TypeScript: `npm install typescript@latest`
3. Use `npx tsx` instead of `tsc` for running files

### GitHub Still Failing?
1. Regenerate your GitHub token
2. Verify repository exists and is accessible
3. Check token permissions (must include `repo` scope)
4. Ensure you're using the correct username/repo

---

## 📞 Support

If issues persist:
1. Check the error logs in detail
2. Verify all environment variables are set correctly
3. Test each component individually
4. Review the generated code for any issues

The fixes implement robust error handling, validation, and fallback mechanisms to significantly improve reliability.