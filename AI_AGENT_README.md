# 🤖 AI Agent untuk Remotion Video Creation

Sistem AI agent yang menggunakan Bluesmind API untuk membuat video Remotion secara mandiri dan melakukan git operations otomatis.

## 🚀 Fitur

- **Automatic Video Planning**: AI merencanakan konsep video berdasarkan prompt user
- **Component Generation**: Generate komponen Remotion secara otomatis
- **Code Generation**: Menghasilkan TypeScript code untuk React components
- **Git Automation**: Otomatis git add, commit, dan push ke GitHub
- **Smart Commit Messages**: AI generate commit messages yang deskriptif

## 📋 Prerequisites

1. **Bluesmind API Key**
   - Base URL: `https://api.bluesminds.com/v1`
   - Model: `meta/llama-3.1-70b-instruct`

2. **GitHub Personal Access Token**
   - Buat token di GitHub Settings → Developer settings → Personal access tokens
   - Permissions: `repo` (full control of private repositories)

3. **Environment Variables**
   - Setup file `.env` di root project

## 🔧 Setup

### 1. Environment Variables

Buat atau update file `.env`:

```env
# Bluesmind API Configuration
BLUESMIND_API_BASE_URL=https://api.bluesminds.com/v1
BLUESMIND_API_KEY=sk-your_bluesmind_api_key_here

# GitHub Configuration
GITHUB_TOKEN=ghp_your_github_token_here
GITHUB_USERNAME=your_github_username
GITHUB_REPO=your_repository_name
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Verify Setup

```bash
# Test Bluesmind API connection
npm run test-ai
```

## 🎯 Cara Menggunakan

### Basic Usage

```bash
npm run ai-agent "Create a 30-second kinetic typography video about AI technology"
```

### Examples

```bash
# Video promosi produk
npm run ai-agent "Create a promotional video for a tech startup with modern animations"

# Video edukasi
npm run ai-agent "Create an educational video about climate change with data visualization"

# Video branding
npm run ai-agent "Create a brand intro video with minimalist design and smooth transitions"
```

## 🏗️ Workflow AI Agent

```
User Prompt → AI Planning → Component Generation → Config Update → Git Operations → GitHub
     ↓            ↓               ↓                    ↓              ↓            ↓
  "Video idea"   Concept        React Components    Root.tsx     Commit/Push   Deployed
```

### Step-by-Step Process

1. **🧠 Planning**: AI menganalisis prompt dan membuat video concept
2. **⚙️ Generation**: Generate komponen Remotion yang lengkap
3. **🔧 Configuration**: Update project configuration dan Root.tsx
4. **📦 Git Operations**: Otomatis add, commit, dan push ke GitHub
5. **✅ Completion**: Video siap untuk rendering

## 📁 Struktur File

```
src/
├── agent/
│   ├── agent-controller.ts    # Main AI agent logic
│   └── git-operations.ts      # Git automation utilities
├── lib/
│   ├── bluesmind.ts           # Bluesmind API client
│   └── bluesmind-examples.ts  # Usage examples
└── [generated components]     # AI-generated Remotion components
```

## 🔒 Security Notes

- **Jangan commit** file `.env` ke repository
- **Gunakan GitHub Secrets** untuk production environment
- **Limit permissions** pada GitHub token (hanya `repo` scope)
- **Monitor API usage** untuk mengontrol cost Bluesmind

## 🛠️ Advanced Configuration

### Custom Git Branch

Untuk push ke branch berbeda:

```typescript
// Di agent-controller.ts
await this.gitOps.completeWorkflow(commitMessage, 'feature/ai-video');
```

### Custom Model

Untuk menggunakan model Bluesmind berbeda:

```typescript
// Di bluesmind.ts
const DEFAULT_MODEL = 'meta/llama-3.1-405b-instruct'; // atau model lain
```

### Component Customization

Edit system prompt di `agent-controller.ts` untuk mengubah style komponen yang di-generate:

```typescript
const systemPrompt = `You are a Remotion expert. Generate components with:
- 3D animations using Three.js
- Advanced shader effects
- Post-processing bloom
- Your custom requirements...`;
```

## 🧪 Testing

### Test Individual Components

```typescript
// Test planning only
const agent = new AIAgentController();
await agent.planVideoConcept("your prompt");

// Test component generation only
await agent.generateRemotionComponents();

// Test git operations only
await agent.performGitOperations();
```

### Full Workflow Test

```bash
npm run ai-agent "Test prompt for AI agent"
```

## 🐛 Troubleshooting

### Bluesmind API Error

**Error**: `Invalid token`
- **Solution**: Cek API key di `.env` dan pastikan valid

### Git Push Failed

**Error**: `Authentication failed`
- **Solution**: Verifikasi GitHub token dan permissions
- Pastikan repository URL benar

### Component Generation Failed

**Error**: `Failed to parse AI response`
- **Solution**: Bluesmind response tidak valid JSON
- Coba prompt yang lebih spesifik

### No Changes to Commit

**Error**: `No changes to commit`
- **Solution**: Agent tidak meng-generate file baru
- Cek prompt dan AI response

## 📊 Monitoring

### Bluesmind API Usage

Monitor token usage di Bluesmind dashboard untuk mengontrol cost.

### Git History

Lihat commit history:

```bash
git log --oneline
```

Commit messages akan di-generate oleh AI dengan format yang deskriptif.

## 🎨 Customization Examples

### Video Style Templates

```bash
# Minimalist style
npm run ai-agent "Create minimalist white space video with clean typography"

# Cyberpunk style
npm run ai-agent "Create cyberpunk video with neon colors and glitch effects"

# Corporate style
npm run ai-agent "Create corporate video with professional transitions and branding"
```

### Duration Control

Prompt dengan durasi spesifik:

```bash
npm run ai-agent "Create 15-second quick intro video"
npm run ai-agent "Create 60-second detailed product showcase"
```

## 🚀 Production Deployment

Untuk production usage:

1. **GitHub Actions Setup**: Configure secrets di repository
2. **Error Handling**: Implement retry logic untuk API failures
3. **Rate Limiting**: Add rate limiting untuk Bluesmind API
4. **Code Review**: Setup process untuk review AI-generated code
5. **Testing**: Automated testing untuk generated components

## 📝 Next Steps

- [ ] Add automated video rendering setelah git push
- [ ] Implement multi-language support
- [ ] Add quality checks untuk generated code
- [ ] Create dashboard untuk monitoring agent activity
- [ ] Add rollback capabilities untuk failed generations

## 🤝 Contributing

Untuk improvement atau bug fixes, edit files di `src/agent/` directory.

## 📄 License

Private project - all rights reserved.