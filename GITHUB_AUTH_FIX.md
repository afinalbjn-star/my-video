# 🔐 GitHub Authentication Fix Guide

## 🚨 Current Issue
AI agent mengalami error `401 Bad credentials` saat mencoba menghubungi GitHub API. Diagnostic tool menunjukkan:

- ✅ Token format valid (`ghp_*`)
- ❌ Authentication failed (401) pada semua GitHub API calls
- ❌ Repository access gagal
- ❌ Workflow trigger gagal

## 🔍 Root Cause Analysis

Berdasarkan diagnostic, kemungkinan penyebab:

1. **Token sudah expired** - GitHub Personal Access Tokens memiliki masa berlaku
2. **Token tidak memiliki permission yang cukup** - Missing `repo` scope
3. **Token di-generate tanpa permission yang benar** - Classic token vs Fine-grained token
4. **Repository tidak ada atau tidak accessible** - Wrong username/repo combination

## 🛠️ Immediate Solutions

### Option 1: Generate New GitHub Token (Recommended)

#### Step 1: Generate New Token
1. Buka https://github.com/settings/tokens
2. Klik **"Generate new token"** → **"Generate new token (classic)"**
3. Beri nama: "AI Agent Video Generation"
4. Pilih permissions:
   - ✅ **repo** (Full control of private repositories)
   - ✅ **workflow** (untuk GitHub Actions)
5. Set expiration: 90 days atau No expiration
6. Klik **"Generate token"**
7. **Copy token immediately** (hanya muncul sekali!)

#### Step 2: Update .env File
```env
GITHUB_TOKEN=ghp_your_new_token_here
GITHUB_USERNAME=your_actual_github_username
GITHUB_REPO=your_actual_repository_name
```

#### Step 3: Verify Repository
- Pastikan repository ada: https://github.com/YOUR_USERNAME/YOUR_REPO
- Jika tidak ada, create repository baru di GitHub
- Pastikan anda memiliki push permissions

#### Step 4: Test Authentication
```bash
npm run diagnose-github
```

### Option 2: Use AI Agent Without GitHub Automation

Jika Anda tidak ingin memperbaiki GitHub authentication sekarang, AI agent sudah di-update untuk tetap berfungsi:

#### ✅ Yang Masih Berfungsi:
- ✅ Video component generation
- ✅ Project configuration updates
- ✅ Local git commits
- ✅ Multi-agent system
- ✅ Performance monitoring

#### ⚠️ Yang Tidak Berfungsi:
- ❌ Automatic git push ke GitHub
- ❌ GitHub Actions workflow trigger
- ❌ Cloud rendering

#### 💡 Manual Workflow:
1. AI agent akan generate components dan commit locally
2. Anda bisa push manual:
   ```bash
   git push origin main
   ```
3. Trigger workflow manual dari GitHub Actions tab
4. Atau render locally:
   ```bash
   npm run render
   ```

## 🔧 Detailed Troubleshooting

### Check Token Permissions
```bash
# Test token dengan curl
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user
```

Expected response: User data JSON
Error 401: Token invalid atau expired
Error 403: Token permissions insufficient

### Verify Repository Access
```bash
# Test repository access
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/repos/YOUR_USERNAME/YOUR_REPO
```

Expected response: Repository data JSON
Error 404: Repository tidak ada
Error 403: No access permission

### Check Git Configuration
```bash
# Check current git remote
git remote -v

# Test git connection
git ls-remote origin
```

## 📋 Updated .env Template

```env
# Bluesmind API Configuration
BLUESMIND_API_BASE_URL=https://api.bluesminds.com/v1
BLUESMIND_API_KEY=your_bluesmind_api_key_here

# API Stability Settings
BLUESMIND_TIMEOUT_MS=180000
BLUESMIND_RETRY_BASE_DELAY_MS=6000
BLUESMIND_RETRY_MAX_DELAY_MS=120000
BLUESMIND_GATEWAY_RETRIES_PER_MODEL=2
BLUESMIND_PRIMARY_MODEL=meta/llama-3.1-8b-instruct
BLUESMIND_FALLBACK_MODEL=meta/llama-3.3-70b-instruct

# GitHub Configuration (Optional but Recommended)
# Generate token at: https://github.com/settings/tokens
# Required permissions: repo, workflow
GITHUB_TOKEN=ghp_generate_new_token_here
GITHUB_USERNAME=your_github_username
GITHUB_REPO=your_repository_name
```

## 🚀 Using AI Agent with Current Setup

### Full Automation (with fixed GitHub auth):
```bash
npm run ai-agent "Create a 30-second cyberpunk video"
```

### Partial Automation (without GitHub auth):
```bash
npm run ai-agent "Create a 30-second cyberpunk video"
# AI agent will:
# ✅ Generate video components
# ✅ Update project configuration  
# ✅ Commit locally
# ⚠️ Skip git push (requires manual action)
# ⚠️ Skip workflow trigger (requires manual action)
```

### Manual Workflow After Agent:
```bash
# 1. Check generated files
git status

# 2. Review changes
git diff

# 3. Commit (if agent didn't commit)
git add .
git commit -m "AI generated video components"

# 4. Push to GitHub (manual)
git push origin main

# 5. Trigger workflow manually from GitHub Actions tab
# or render locally:
npm run render
```

## 🎯 Recommendations

### Short Term:
1. **Generate new GitHub token** dengan instructions di atas
2. **Update .env file** dengan token baru
3. **Test dengan diagnostic tool**: `npm run diagnose-github`
4. **Verify repository access** di GitHub

### Long Term:
1. **Use GitHub Secrets** untuk production environment
2. **Implement token rotation** secara berkala
3. **Use fine-grained tokens** untuk better security
4. **Monitor token usage** di GitHub settings

## 🆘 Still Having Issues?

### Common Problems:

**Problem**: "Repository not found"
- **Solution**: Check username dan repo name di .env, pastikan repository ada di GitHub

**Problem**: "Permission denied"  
- **Solution**: Regenerate token dengan `repo` dan `workflow` permissions

**Problem**: "Token expired"
- **Solution**: Generate new token, tokens tidak bisa di-renew

**Problem**: "Connection timeout"
- **Solution**: Check internet connection, GitHub API mungkin down

### Get Help:
1. Run diagnostic: `npm run diagnose-github`
2. Check error logs di detail
3. Verify semua environment variables
4. Test GitHub API manually dengan curl

## ✅ What's Fixed in Agent Code

Agent sekarang lebih resilient terhadap GitHub authentication issues:

1. **Non-blocking git operations** - Agent tidak akan fail jika git gagal
2. **Local-first approach** - Components tetap di-generate dan di-commit locally
3. **Graceful degradation** - Automatic fallback ke manual workflow
4. **Better error messages** - Jelas instructions untuk manual action
5. **Connection testing** - Early detection dengan helpful warnings

Ini berarti AI agent tetap fully functional untuk core task (video generation) meskipun GitHub automation tidak bekerja.