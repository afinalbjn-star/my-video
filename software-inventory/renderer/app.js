const state = {
  softwares: [],
  licenses: [],
  sortKey: 'name',
  sortDir: 'asc',
  filterCategory: '',
  filterStatus: '',
  theme: 'light',
  undoStack: [],
  chatHistory: [],
  pendingAction: null,
};

const CATEGORIES = ['Produktivitas', 'Pengembangan', 'Desain', 'Multimedia', 'Komunikasi', 'Keamanan', 'Utilitas', 'Lainnya'];

let currentModal = null; // 'software' | 'license'
let editingId = null;
let assistantBusy = false;
let ollamaModels = [];
let selectedModel = '';

/* ================= Boot ================= */
async function init() {
  const res = await fetch('/api/data');
  const data = await res.json();
  state.softwares = data.softwares || [];
  state.licenses = data.licenses || [];
  state.theme = localStorage.getItem('nando-theme') || 'light';
  applyTheme(state.theme);
  populateCategoryFilter();
  renderAll();
  bindEvents();
  initAssistant();
  initBackups();
}

async function persist(silent = false) {
  await fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ softwares: state.softwares, licenses: state.licenses }),
  });
  renderAll();
  if (!silent) loadBackups();
}

/* ================= Navigation / Events ================= */
function populateCategoryFilter() {
  const used = new Set(state.softwares.map((s) => s.category));
  const cats = [...CATEGORIES, ...[...used].filter((c) => !CATEGORIES.includes(c))];
  document.getElementById('filter-category').innerHTML =
    '<option value="">Semua kategori</option>' + cats.map((c) => `<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join('');
}

function bindEvents() {
  document.querySelectorAll('.nav-btn[data-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn[data-view]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
      document.getElementById('view-' + btn.dataset.view).classList.add('active');
    });
  });

  document.getElementById('btn-add-software').addEventListener('click', () => openModal('software'));
  document.getElementById('btn-add-license').addEventListener('click', () => openModal('license'));
  document.getElementById('btn-modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', (e) => { if (e.target.id === 'modal-overlay') closeModal(); });
  document.getElementById('modal-form').addEventListener('submit', onFormSubmit);

  document.getElementById('search-software').addEventListener('input', () => renderSoftware());
  document.getElementById('filter-category').addEventListener('change', (e) => { state.filterCategory = e.target.value; renderSoftware(); });
  document.getElementById('filter-status').addEventListener('change', (e) => { state.filterStatus = e.target.value; renderSoftware(); });

  document.querySelectorAll('th[data-sort]').forEach((th) => {
    th.addEventListener('click', () => {
      const k = th.dataset.sort;
      if (state.sortKey === k) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      else { state.sortKey = k; state.sortDir = 'asc'; }
      renderSoftware();
    });
  });

  document.getElementById('btn-settings').addEventListener('click', openSettings);
  document.getElementById('btn-settings-close').addEventListener('click', closeSettings);
  document.getElementById('settings-overlay').addEventListener('click', (e) => { if (e.target.id === 'settings-overlay') closeSettings(); });
  document.getElementById('btn-darkmode').addEventListener('click', toggleTheme);
  document.getElementById('btn-export-excel').addEventListener('click', () => exportReport('excel'));
  document.getElementById('btn-export-pdf').addEventListener('click', () => exportReport('pdf'));
  document.getElementById('btn-ai-summary').addEventListener('click', aiMonthlySummary);

  document.getElementById('btn-backup-download').addEventListener('click', downloadBackup);
  document.getElementById('btn-backup-import').addEventListener('click', () => document.getElementById('import-file').click());
  document.getElementById('import-file').addEventListener('change', importData);
  document.getElementById('btn-backup-clear').addEventListener('click', clearAllData);

  document.getElementById('btn-undo').addEventListener('click', undoLast);
  document.getElementById('btn-undo-close').addEventListener('click', () => hideUndo());

  document.getElementById('btn-action-cancel').addEventListener('click', () => { state.pendingAction = null; document.getElementById('action-overlay').classList.add('hidden'); });
  document.getElementById('btn-action-apply').addEventListener('click', applyPendingAction);

  document.getElementById('btn-new-chat').addEventListener('click', newChat);
}

/* ================= Undo / Redo ================= */
function pushUndo(desc, softwares, licenses) {
  state.undoStack.push({ desc, softwares: JSON.parse(JSON.stringify(softwares)), licenses: JSON.parse(JSON.stringify(licenses)) });
  if (state.undoStack.length > 30) state.undoStack.shift();
  showUndo(desc);
}

function undoLast() {
  const snap = state.undoStack.pop();
  if (!snap) return;
  state.softwares = snap.softwares;
  state.licenses = snap.licenses;
  persist();
  hideUndo();
  showToast('Undo berhasil: ' + snap.desc, 'info');
}

function showUndo(desc) {
  const bar = document.getElementById('undo-bar');
  document.getElementById('undo-text').textContent = desc;
  bar.classList.remove('hidden');
  clearTimeout(bar._t);
  bar._t = setTimeout(hideUndo, 8000);
}
function hideUndo() { document.getElementById('undo-bar').classList.add('hidden'); }

/* ================= Software CRUD ================= */
function renderSoftware() {
  const tbody = document.getElementById('software-list');
  const empty = document.getElementById('software-empty');
  const q = (document.getElementById('search-software').value || '').toLowerCase();

  let list = state.softwares.filter((s) =>
    s.name.toLowerCase().includes(q) || s.vendor.toLowerCase().includes(q)
  );

  if (state.filterCategory) list = list.filter((s) => s.category === state.filterCategory);

  if (state.filterStatus) {
    list = list.filter((s) => {
      const lic = state.licenses.filter((l) => l.softwareId === s.id);
      if (state.filterStatus === 'none') return lic.length === 0;
      return lic.some((l) => licenseStatus(l) === state.filterStatus);
    });
  }

  list.sort((a, b) => {
    let va = a[state.sortKey], vb = b[state.sortKey];
    if (state.sortKey === 'completeness') { va = completenessScore(a); vb = completenessScore(b); }
    if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
    if (va < vb) return state.sortDir === 'asc' ? -1 : 1;
    if (va > vb) return state.sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  tbody.innerHTML = '';
  if (list.length === 0) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  list.forEach((s) => {
    const lic = state.licenses.filter((l) => l.softwareId === s.id);
    const score = completenessScore(s);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHtml(s.name)}</strong></td>
      <td>${escapeHtml(s.version)}</td>
      <td>${escapeHtml(s.category)}</td>
      <td>${escapeHtml(s.vendor)}</td>
      <td>
        <span class="score-bar"><span class="score-fill" style="width:${score}%;background:${scoreColor(score)}"></span></span>
        <span class="score-label">${score}%</span>
      </td>
      <td>
        ${lic.length ? licenseBadge(latestLicense(lic)) : '<span class="badge unknown">Tidak ada lisensi</span>'}
        <button class="btn sm" data-act="edit" data-id="${s.id}">Edit</button>
        <button class="btn sm danger" data-act="delete" data-id="${s.id}">Hapus</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('button').forEach((b) => {
    b.addEventListener('click', () => {
      if (b.dataset.act === 'edit') openModal('software', b.dataset.id);
      else deleteSoftware(b.dataset.id);
    });
  });
}

function completenessScore(s) {
  let n = 0, t = 4;
  if (s.version) n++;
  if (s.vendor) n++;
  if (s.category) n++;
  const lic = state.licenses.filter((l) => l.softwareId === s.id);
  if (lic.length) {
    t++;
    n++;
    if (lic.some((l) => l.expiry)) { t++; n++; }
    if (lic.some((l) => l.price)) { t++; n++; }
  }
  return Math.round((n / t) * 100);
}
function scoreColor(s) { return s >= 80 ? '#22c55e' : s >= 50 ? '#f59e0b' : '#ef4444'; }

function addOrUpdateSoftware(fields) {
  if (editingId) {
    const idx = state.softwares.findIndex((s) => s.id === editingId);
    state.softwares[idx] = { ...state.softwares[idx], ...fields };
  } else {
    state.softwares.push({ id: makeId(), ...fields });
  }
}

function deleteSoftware(id) {
  const item = state.softwares.find((s) => s.id === id);
  pushUndo('Hapus software "' + item.name + '"', state.softwares, state.licenses);
  state.softwares = state.softwares.filter((s) => s.id !== id);
  state.licenses = state.licenses.filter((l) => l.softwareId !== id);
  persist();
  showToast('Software dihapus', 'info');
}

/* ================= License CRUD ================= */
function renderLicenses() {
  const tbody = document.getElementById('license-list');
  const empty = document.getElementById('license-empty');

  tbody.innerHTML = '';
  if (state.licenses.length === 0) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  state.licenses.forEach((l) => {
    const sw = state.softwares.find((s) => s.id === l.softwareId);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHtml(sw ? sw.name : 'Software dihapus')}</strong></td>
      <td>${escapeHtml(l.type)}</td>
      <td>${escapeHtml(String(l.quantity))}</td>
      <td>${formatRupiah(l.price)}</td>
      <td>${escapeHtml(l.expiry || 'Selamanya')}</td>
      <td>${licenseBadge(licenseStatus(l))}</td>
      <td>
        <button class="btn sm" data-id="${l.id}">Edit</button>
        <button class="btn sm danger" data-id="${l.id}">Hapus</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('button').forEach((b) => {
    b.addEventListener('click', () => {
      if (b.textContent === 'Edit') openModal('license', b.dataset.id);
      else deleteLicense(b.dataset.id);
    });
  });
}

function addOrUpdateLicense(fields) {
  if (editingId) {
    const idx = state.licenses.findIndex((l) => l.id === editingId);
    state.licenses[idx] = { ...state.licenses[idx], ...fields };
  } else {
    state.licenses.push({ id: makeId(), ...fields });
  }
}

function deleteLicense(id) {
  pushUndo('Hapus lisensi', state.softwares, state.licenses);
  state.licenses = state.licenses.filter((l) => l.id !== id);
  persist();
  showToast('Lisensi dihapus', 'info');
}

/* ================= Dashboard ================= */
function renderDashboard() {
  document.getElementById('stat-total').textContent = state.softwares.length;

  let valid = 0, expiring = 0, expired = 0;
  state.licenses.forEach((l) => {
    const st = licenseStatus(l);
    if (st === 'valid') valid++;
    else if (st === 'expiring') expiring++;
    else if (st === 'expired') expired++;
  });
  document.getElementById('stat-valid').textContent = valid;
  document.getElementById('stat-expiring').textContent = expiring;
  document.getElementById('stat-expired').textContent = expired;

  const totalBudget = state.licenses.reduce((sum, l) => sum + (l.price || 0) * (l.quantity || 1), 0);
  document.getElementById('stat-budget').textContent = formatRupiah(totalBudget);

  // count per category
  const counts = {};
  state.softwares.forEach((s) => { counts[s.category] = (counts[s.category] || 0) + 1; });
  renderBarChart('chart-category', counts);

  // cost per category
  const costs = {};
  state.licenses.forEach((l) => {
    const sw = state.softwares.find((s) => s.id === l.softwareId);
    const cat = sw ? sw.category : 'Lainnya';
    costs[cat] = (costs[cat] || 0) + (l.price || 0) * (l.quantity || 1);
  });
  renderBarChart('chart-cost', costs, true);

  // recent
  const recent = [...state.softwares].slice(-5).reverse();
  const tbody = document.getElementById('recent-software');
  tbody.innerHTML = '';
  recent.forEach((s) => {
    const lic = state.licenses.filter((l) => l.softwareId === s.id);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHtml(s.name)}</strong></td>
      <td>${escapeHtml(s.version)}</td>
      <td>${escapeHtml(s.category)}</td>
      <td>${lic.length ? licenseBadge(latestLicense(lic)) : '<span class="badge unknown">-</span>'}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderBarChart(elId, entries, currency = false) {
  const chart = document.getElementById(elId);
  chart.innerHTML = '';
  const arr = Object.entries(entries).sort((a, b) => b[1] - a[1]);
  if (arr.length === 0) { chart.innerHTML = '<p class="empty">Belum ada data.</p>'; return; }
  const max = Math.max(...arr.map((e) => e[1]));
  arr.forEach(([label, val]) => {
    const group = document.createElement('div');
    group.className = 'chart-bar-group';
    const h = Math.max(6, (val / max) * 130);
    const disp = currency ? shortRupiah(val) : val;
    group.innerHTML = `
      <span class="chart-value" title="${currency ? formatRupiah(val) : ''}">${disp}</span>
      <div class="chart-bar" style="height:${h}px"></div>
      <span class="chart-label">${escapeHtml(label)}</span>
    `;
    chart.appendChild(group);
  });
}

/* ================= Modal ================= */
function openModal(type, id = null) {
  currentModal = type;
  editingId = id;
  const overlay = document.getElementById('modal-overlay');
  const title = document.getElementById('modal-title');
  const fields = document.getElementById('modal-fields');

  if (type === 'software') {
    title.textContent = id ? 'Edit Software' : 'Tambah Software';
    const s = id ? state.softwares.find((x) => x.id === id) : {};
    fields.innerHTML = `
      <div class="form-row"><label>Nama</label><input name="name" required value="${escapeAttr(s.name || '')}" placeholder="mis. Microsoft Office" /></div>
      <div class="form-row"><label>Versi</label><input name="version" value="${escapeAttr(s.version || '')}" placeholder="mis. 2021" /></div>
      <div class="form-row"><label>Kategori</label>
        <select name="category">${CATEGORIES.map((c) => `<option ${c === (s.category || 'Produktivitas') ? 'selected' : ''}>${c}</option>`).join('')}</select>
      </div>
      <div class="form-row"><label>Vendor / Pengembang</label><input name="vendor" value="${escapeAttr(s.vendor || '')}" /></div>
    `;
  } else {
    title.textContent = id ? 'Edit Lisensi' : 'Tambah Lisensi';
    const l = id ? state.licenses.find((x) => x.id === id) : {};
    fields.innerHTML = `
      <div class="form-row"><label>Software</label>
        <select name="softwareId" required>
          ${state.softwares.map((s) => `<option value="${s.id}" ${l && l.softwareId === s.id ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}
        </select>
      </div>
      <div class="form-row"><label>Jenis Lisensi</label>
        <select name="type">
          ${['Perpetual', 'Subscription', 'Open Source', 'Trial', 'Freeware'].map((t) => `<option ${l && l.type === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="form-row"><label>Jumlah Lisensi</label><input name="quantity" type="number" min="1" required value="${l ? l.quantity : 1}" /></div>
      <div class="form-row"><label>Harga per Unit (Rp)</label><input name="price" type="number" min="0" value="${l?.price || ''}" placeholder="mis. 1500000" /></div>
      <div class="form-row"><label>Tanggal Kedaluwarsa (kosongkan jika selamanya)</label><input name="expiry" type="date" value="${escapeAttr(l?.expiry || '')}" /></div>
    `;
  }
  overlay.classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  currentModal = null;
  editingId = null;
}

function onFormSubmit(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  if (currentModal === 'software') {
    addOrUpdateSoftware({ name: data.name.trim(), version: data.version.trim(), category: data.category, vendor: data.vendor.trim() });
  } else {
    addOrUpdateLicense({
      softwareId: data.softwareId,
      type: data.type,
      quantity: parseInt(data.quantity, 10) || 1,
      price: parseInt(data.price, 10) || 0,
      expiry: data.expiry || '',
    });
  }
  closeModal();
  persist();
  showToast('Data tersimpan', 'success');
}

/* ================= Export ================= */
async function exportReport(kind) {
  try {
    const res = await fetch(kind === 'excel' ? '/api/export/excel' : '/api/export/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ softwares: state.softwares, licenses: state.licenses }),
    });
    if (!res.ok) throw new Error('Gagal export');
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'nando-inventory-' + (kind === 'excel' ? 'xlsx' : 'pdf');
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
    showToast('Laporan ' + kind.toUpperCase() + ' diunduh', 'success');
  } catch (err) {
    showToast('Gagal export: ' + err.message, 'error');
  }
}

/* ================= Backups & Settings ================= */
function openSettings() {
  document.getElementById('settings-overlay').classList.remove('hidden');
  loadBackups();
}
function closeSettings() { document.getElementById('settings-overlay').classList.add('hidden'); }

async function loadBackups() {
  try {
    const res = await fetch('/api/backups');
    const list = await res.json();
    const box = document.getElementById('backup-list');
    if (!list.length) { box.innerHTML = '<p class="sub">Belum ada cadangan otomatis.</p>'; return; }
    box.innerHTML = '';
    list.forEach((b) => {
      const div = document.createElement('div');
      div.className = 'backup-item';
      const stamp = b.file.replace('backup-', '').replace('.json', '').replace(/[T]/g, ' ').replace(/-/g, ':');
      div.innerHTML = `
        <span class="bname">${escapeHtml(stamp)}</span>
        <span class="bsize">${(b.size / 1024).toFixed(1)} KB</span>
        <button class="btn sm" data-restore="${b.file}">Pulihkan</button>
      `;
      box.appendChild(div);
    });
    box.querySelectorAll('button[data-restore]').forEach((btn) => {
      btn.addEventListener('click', () => restoreBackup(btn.dataset.restore));
    });
  } catch (e) { /* ignore */ }
}

async function restoreBackup(file) {
  if (!confirm('Pulihkan data dari cadangan ini? Data saat ini akan diganti.')) return;
  const res = await fetch('/api/backups/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file }),
  });
  const r = await res.json();
  if (r.ok) {
    state.softwares = r.data.softwares || [];
    state.licenses = r.data.licenses || [];
    renderAll();
    closeSettings();
    showToast('Data dipulihkan dari cadangan', 'success');
  } else showToast('Gagal memulihkan cadangan', 'error');
}

function downloadBackup() {
  const blob = new Blob([JSON.stringify({ softwares: state.softwares, licenses: state.licenses }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'nando-inventory-backup.json';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(a.href);
  showToast('Cadangan diunduh', 'success');
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const data = JSON.parse(reader.result);
      if (Array.isArray(data.softwares) && Array.isArray(data.licenses)) {
        if (!confirm('Import data ini? Data saat ini akan diganti.')) return;
        state.softwares = data.softwares;
        state.licenses = data.licenses;
        await persist();
        closeSettings();
        showToast('Data berhasil diimport', 'success');
      } else showToast('Format file tidak valid', 'error');
    } catch (err) { showToast('File tidak valid', 'error'); }
  };
  reader.readAsText(file);
  e.target.value = '';
}

async function clearAllData() {
  if (!confirm('Hapus SEMUA data? Tindakan ini tidak bisa dibatalkan (kecuali lewat cadangan).')) return;
  state.softwares = [];
  state.licenses = [];
  await persist();
  showToast('Semua data dihapus', 'info');
}

/* ================= AI Assistant ================= */
async function initAssistant() {
  try {
    const res = await fetch('/api/ollama');
    const info = await res.json();
    const statusEl = document.getElementById('ollama-status');
    const select = document.getElementById('model-select');
    if (info.available && info.models.length) {
      ollamaModels = info.models;
      selectedModel = ollamaModels[0];
      statusEl.className = 'badge valid';
      statusEl.textContent = 'Ollama terhubung';
      select.innerHTML = ollamaModels.map((m) => `<option value="${m}">${m}</option>`).join('');
      select.addEventListener('change', () => { selectedModel = select.value; });
      appendChat('bot', 'Halo! Saya asisten NANDO INVENTORY AI. Tanya data, atau minta saya menambah/mengedit software & lisensi. Contoh: "Berapa total anggaran?", "Tambahkan Microsoft 365 dengan 5 lisensi."');
    } else {
      statusEl.className = 'badge expired';
      statusEl.textContent = 'Ollama tidak terhubung';
      select.innerHTML = '<option>Ollama offline</option>';
      appendChat('error', 'Ollama belum terhubung. Instal & jalankan Ollama (lihat README), lalu buka kembali app.');
    }
  } catch (e) {
    document.getElementById('ollama-status').textContent = 'Gagal memeriksa Ollama';
  }

  document.getElementById('btn-send-chat').addEventListener('click', sendChat);
  document.getElementById('chat-text').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
  });
}

function newChat() {
  state.chatHistory = [];
  document.getElementById('chat-messages').innerHTML = '';
  appendChat('bot', 'Percakapan baru dimulai. Apa yang bisa saya bantu?');
}

async function sendChat() {
  if (assistantBusy) return;
  const input = document.getElementById('chat-text');
  const text = input.value.trim();
  if (!text || !selectedModel) return;

  appendChat('user', text);
  input.value = '';
  state.chatHistory.push({ role: 'user', content: text });

  const typing = appendChat('bot', 'Sedang berpikir...');
  typing.classList.add('typing');
  assistantBusy = true;

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: text, model: selectedModel, history: state.chatHistory.slice(0, -1) }),
  });

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let answer = '';
  typing.classList.remove('typing');

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') continue;
        try {
          const j = JSON.parse(payload);
          if (j.delta) { answer += j.delta; typing.textContent = answer; }
          if (j.error) { typing.textContent = j.error; typing.classList.add('error'); }
        } catch (e) {}
      }
    }
  } catch (e) {
    typing.textContent = 'Gagal terhubung ke Ollama: ' + e.message;
    typing.classList.add('error');
  } finally {
    assistantBusy = false;
    typing.classList.remove('typing');
  }

  // strip action marker for display, parse action
  const markerIdx = answer.indexOf('###ACTION###');
  let displayText = answer;
  if (markerIdx !== -1) {
    displayText = answer.slice(0, markerIdx).trim();
    const jsonPart = answer.slice(markerIdx + '###ACTION###'.length).trim();
    try {
      const action = JSON.parse(jsonPart);
      state.pendingAction = action;
      showActionConfirm(action);
    } catch (e) {
      appendChat('error', 'AI ingin melakukan aksi tetapi format aksinya tidak valid.');
    }
  }
  typing.textContent = displayText || '(Tidak ada jawaban.)';
  if (displayText) state.chatHistory.push({ role: 'assistant', content: displayText });

  // keep chat history bounded
  if (state.chatHistory.length > 20) state.chatHistory = state.chatHistory.slice(-20);
  scrollChat();
}

function showActionConfirm(action) {
  const body = document.getElementById('action-body');
  body.innerHTML = '<p class="sub">AI ingin menjalankan aksi berikut:</p><div style="margin:10px 0;padding:10px;background:#f1f5f9;border-radius:8px;font-size:13px;white-space:pre-wrap"></div>';
  body.querySelector('div').textContent = JSON.stringify(action, null, 2);
  document.getElementById('action-overlay').classList.remove('hidden');
}

function applyPendingAction() {
  const a = state.pendingAction;
  if (!a) return;
  document.getElementById('action-overlay').classList.add('hidden');
  state.pendingAction = null;
  try {
    applyAction(a);
    persist();
    showToast('Aksi AI diterapkan', 'success');
  } catch (err) {
    showToast('Gagal menerapkan aksi: ' + err.message, 'error');
  }
}

function applyAction(a) {
  const d = a.data || {};
  switch (a.action) {
    case 'add_software':
      state.softwares.push({ id: makeId(), name: d.name, version: d.version || '', category: CATEGORIES.includes(d.category) ? d.category : 'Lainnya', vendor: d.vendor || '' });
      break;
    case 'add_license': {
      const sw = state.softwares.find((s) => s.name.toLowerCase() === String(d.softwareName || '').toLowerCase());
      if (!sw) throw new Error('Software "' + d.softwareName + '" tidak ditemukan');
      state.licenses.push({ id: makeId(), softwareId: sw.id, type: d.type || 'Perpetual', quantity: parseInt(d.quantity, 10) || 1, price: parseInt(d.price, 10) || 0, expiry: d.expiry || '' });
      break;
    }
    case 'delete_software': {
      const sw = state.softwares.find((s) => s.name.toLowerCase() === String(d.name || '').toLowerCase());
      if (!sw) throw new Error('Software "' + d.name + '" tidak ditemukan');
      state.softwares = state.softwares.filter((s) => s.id !== sw.id);
      state.licenses = state.licenses.filter((l) => l.softwareId !== sw.id);
      break;
    }
    case 'delete_license': {
      state.licenses = state.licenses.filter((l) => l.id !== d.id);
      break;
    }
    default:
      throw new Error('Aksi tidak dikenal: ' + a.action);
  }
}

async function aiMonthlySummary() {
  if (!selectedModel) { showToast('Ollama tidak terhubung', 'error'); return; }
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: selectedModel, history: [], message: 'Buat ringkasan bulanan inventaris perangkat lunak: total software, status lisensi, total anggaran per kategori, dan saran penghematan. Jangan jalankan aksi.' }),
  });
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let out = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      chunk.split('\n').forEach((line) => {
        if (line.startsWith('data: ') && line.slice(6).trim() !== '[DONE]') {
          try { const j = JSON.parse(line.slice(6).trim()); if (j.delta) out += j.delta; } catch (e) {}
        }
      });
    }
  } catch (e) { showToast('Gagal: ' + e.message, 'error'); return; }
  document.getElementById('view-assistant').classList.add('active');
  document.querySelectorAll('.nav-btn[data-view]').forEach((b) => b.classList.toggle('active', b.dataset.view === 'assistant'));
  appendChat('bot', out || '(Tidak ada ringkasan.)');
}

/* ================= Theme ================= */
function applyTheme(t) {
  document.body.dataset.theme = t;
  localStorage.setItem('nando-theme', t);
  document.getElementById('darkmode-label').textContent = t === 'dark' ? 'Mode Gelap' : 'Mode Terang';
}
function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(state.theme);
}

/* ================= Chat helpers ================= */
function appendChat(role, text) {
  const box = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'msg ' + role;
  div.innerHTML = `<div class="bubble"></div>`;
  div.querySelector('.bubble').textContent = text;
  box.appendChild(div);
  scrollChat();
  return div.querySelector('.bubble');
}
function scrollChat() {
  const box = document.getElementById('chat-messages');
  box.scrollTop = box.scrollHeight;
}

/* ================= Toast ================= */
function showToast(msg, type = 'info') {
  const box = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  box.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 3500);
}

/* ================= Helpers ================= */
function makeId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function licenseStatus(l) {
  if (!l.expiry) return 'valid';
  const exp = new Date(l.expiry + 'T00:00:00');
  const now = new Date();
  const days = Math.floor((exp - now) / (1000 * 60 * 60 * 24));
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring';
  return 'valid';
}

function licenseBadge(st) {
  const map = {
    valid: ['valid', 'Valid'],
    expiring: ['expiring', 'Hampir Kedaluwarsa'],
    expired: ['expired', 'Kedaluwarsa'],
  };
  const [cls, label] = map[st] || ['unknown', 'Tidak diketahui'];
  return `<span class="badge ${cls}">${label}</span>`;
}

function latestLicense(list) {
  const withExpiry = list.filter((l) => l.expiry).sort((a, b) => new Date(b.expiry) - new Date(a.expiry));
  return withExpiry.length ? withExpiry[0] : list[0];
}

function formatRupiah(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }
function shortRupiah(n) {
  n = Number(n || 0);
  if (n >= 1000000000) return 'Rp' + (n / 1000000000).toFixed(1) + ' M';
  if (n >= 1000000) return 'Rp' + (n / 1000000).toFixed(1) + ' jt';
  if (n >= 1000) return 'Rp' + (n / 1000).toFixed(0) + ' rb';
  return 'Rp' + n;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }

function renderAll() {
  renderSoftware();
  renderLicenses();
  renderDashboard();
}

init();