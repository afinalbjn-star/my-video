# 🔐 GitHub Token Update Guide

## 🆕 Token Baru Anda
```
github_pat_XXXX_REVOKED
```

Ini adalah **Fine-grained Personal Access Token** (format `github_pat_`).

---

## 📝 Langkah 1: Update .env File

Edit file `.env` di root project Anda dan update GITHUB_TOKEN:

```env
# GitHub Configuration
GITHUB_TOKEN=github_pat_XXXX_REVOKED
GITHUB_USERNAME=afinalbjn-star
GITHUB_REPO=my-video
```

---

## 🔧 Langkah 2: Setup GitHub Secrets

### ⚠️ PENTING: Nama Secret yang Valid
GitHub secret names harus:
- Hanya berisi alphanumeric characters (a-z, A-Z, 0-9) dan underscores (_)
- Tidak boleh ada spasi
- Harus dimulai dengan letter (a-z, A-Z) atau underscore (_)
- Tidak boleh diawali dengan `GITHUB_` (reserved prefix)

**✅ Secret yang sudah dibuat:** `NANDO_SECRET`

### Status: Secret sudah berhasil dibuat!
Anda sudah berhasil membuat repository secret dengan nama `NANDO_SECRET`. Workflow file sudah diupdate untuk menggunakan secret ini.

### Option A: Via GitHub Web UI (Jika perlu update/verify)

1. **Buka Repository Settings**
   - Kunjungi: https://github.com/afinalbjn-star/my-video/settings/secrets/actions

2. **Verify Secret**
   - Pastikan secret `NANDO_SECRET` sudah ada di list
   - Jika perlu update, klik "Update" pada secret tersebut

### Option B: Via GitHub CLI (Jika perlu update)

```bash
# Install GitHub CLI jika belum ada
# Windows: winget install GitHub.cli

# Login ke GitHub
gh auth login

# Update secret jika perlu
gh secret set NANDO_SECRET -b afinalbjn-star/my-video
# Paste token ketika diminta
```

---

## 🚀 Langkah 3: Update Additional Secrets (Optional)

Jika ingin setup complete untuk Bluesmind API juga:

1. **Buka Repository Secrets**
   - https://github.com/afinalbjn-star/my-video/settings/secrets/actions

2. **Add Bluesmind Secrets**
   - Name: `BLUESMIND_API_BASE_URL`
   - Secret: `https://api.bluesminds.com/v1`
   
   - Name: `BLUESMIND_API_KEY`
   - Secret: `your_bluesmind_api_key_here`

---

## 🧪 Langkah 4: Test Token Baru

Setelah update .env file, jalankan diagnostic:

```bash
npm run diagnose-github
```

Expected output:
```
✅ Token Format Validation
✅ Classic Personal Access Token (valid format) 
✅ GitHub API Authentication
✅ Repository Access
✅ Workflow File Existence
```

---

## 📋 Langkah 5: Test GitHub Actions Workflow

### Manual Trigger:

1. **Buka GitHub Actions Tab**
   - https://github.com/afinalbjn-star/my-video/actions

2. **Pilih Workflow**
   - Klik "Render Remotion Video"

3. **Trigger Manual**
   - Klik "Run workflow"
   - Pilih composition ID
   - Set CRF quality
   - Klik "Run workflow" (green button)

4. **Monitor Progress**
   - Lihat workflow run di tab Actions
   - Tunggu sampai selesai

---

## ⚠️ Important Notes untuk Fine-grained Tokens

### Permissions yang Diperlukan:
Karena ini adalah fine-grained token, pastikan token Anda memiliki permissions:

1. **Contents** - Read dan Write
2. **Actions** - Read dan Write  
3. **Pull Requests** - Read dan Write (jika perlu)
4. **Workflows** - Read dan Write

### Cek Token Permissions:
1. Kunjungi: https://github.com/settings/tokens
2. Cari token Anda (github_pat_...)
3. Klik "Configure" atau "Edit"
4. Pastikan permissions mencakup:
   - ✅ Repository permissions: Contents (Read/Write)
   - ✅ Workflow permissions: Actions (Read/Write)

---

## 🔍 Troubleshooting

### Jika Test Masih Gagal:

**Error**: "Token lacks required permissions"
- **Solution**: Edit token di GitHub settings dan tambahkan permissions yang diperlukan

**Error**: "Resource not found"  
- **Solution**: Pastikan repository URL benar: `afinalbjn-star/my-video`

**Error**: "Fine-grained token not supported for this operation"
- **Solution**: Beberapa operations mungkin butuh classic token. Pertimbangkan generate classic token juga.

### Jika Workflow Gagal:

**Error**: "Secret not found"
- **Solution**: Pastikan secret `GITHUB_TOKEN` sudah di-add di repository settings

**Error**: "Permission denied"  
- **Solution**: Cek token permissions dan repository access

---

## ✅ Verification Checklist

Setelah setup:

- [ ] `.env` file updated dengan token baru
- [ ] GitHub Secret `GITHUB_TOKEN` ditambah
- [ ] Diagnostic test passes: `npm run diagnose-github`
- [ ] GitHub Actions workflow file updated
- [ ] Manual workflow trigger berhasil
- [ ] Video rendering berhasil

---

## 🎯 Setelah Setup Selesai

Agent AI akan bisa:
- ✅ Push ke GitHub secara otomatis
- ✅ Trigger GitHub Actions workflow
- ✅ Render video di cloud
- ✅ Upload artifacts ke GitHub

---

## 📞 Need Help?

Jika masih mengalami issues:
1. Run diagnostic: `npm run diagnose-github`
2. Check GitHub Actions logs untuk detailed error messages
3. Verify token permissions di GitHub settings
4. Pastikan repository access dan ownership benar