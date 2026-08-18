const DEFAULTS = {
  baseUrl: "https://absensi-server-gnmp.onrender.com",
  kunci: "mumi-bjn-2026",
  // baseUrl: "http://localhost:3000",  // untuk uji lokal
};

let currentData = [];
let baseUrl = DEFAULTS.baseUrl;

function el(id) {
  return document.getElementById(id);
}

function base() {
  return el("baseUrl").value.trim().replace(/\/+$/, "");
}

function kunci() {
  return el("kunci").value.trim();
}

function url(path) {
  const sep = path.includes("?") ? "&" : "?";
  return base() + path + sep + "kunci=" + encodeURIComponent(kunci());
}

async function apiGet(path) {
  const res = await fetch(url(path));
  if (!res.ok) throw new Error("HTTP " + res.status);
  const j = await res.json();
  if (j.ok !== true) throw new Error(j.pesan || "Gagal");
  return j;
}

async function apiPost(path, body) {
  const res = await fetch(url(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await res.json();
  if (j.ok !== true) throw new Error(j.pesan || "Gagal");
  return j;
}

function badge(cocok) {
  if (cocok === "COCOK") return '<span class="badge-cocok">✓ COCOK</span>';
  if (cocok === "TIDAK COCOK") return '<span class="badge-tidak">✗ TIDAK COCOK</span>';
  return '<span style="color:#94a3b8">-</span>';
}

function badgeTelat(telat) {
  if (telat) return '<span class="badge-telat">⚠ TELAT</span>';
  if (telat === false) return '<span class="badge-cocok">✓ TEPAT</span>';
  return '<span style="color:#94a3b8">-</span>';
}

function init() {
  el("baseUrl").value = localStorage.getItem("baseUrl") || DEFAULTS.baseUrl;
  el("kunci").value = localStorage.getItem("kunci") || DEFAULTS.kunci;
  el("baseUrl").addEventListener("change", () => localStorage.setItem("baseUrl", el("baseUrl").value));
  el("kunci").addEventListener("change", () => localStorage.setItem("kunci", el("kunci").value));
  const t = new Date();
  const to = t.toLocaleDateString("en-CA");
  const from = new Date(t.getFullYear(), t.getMonth(), 1).toLocaleDateString("en-CA");
  el("dari").value = from;
  el("sampai").value = to;
  el("r-tanggal").value = to;
  el("b-bulan").value = to.slice(0, 7);

  el("btn-load").addEventListener("click", load);
  el("btn-export").addEventListener("click", doExport);
  el("btn-pdf").addEventListener("click", doPdf);
  el("btn-rekap").addEventListener("click", loadRekap);
  el("btn-bulanan").addEventListener("click", loadBulanan);
  el("btn-manual").addEventListener("click", doManual);
  el("m-desa").addEventListener("change", muatKelompok);
  el("btn-admin-muat").addEventListener("click", muatAdmin);
  el("btn-toleransi").addEventListener("click", simpanToleransi);

  document.querySelectorAll("#tabs button").forEach((b) => {
    b.addEventListener("click", () => {
      document.querySelectorAll("#tabs button").forEach((x) => x.classList.remove("active"));
      document.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      el("tab-" + b.dataset.tab).classList.add("active");
      if (b.dataset.tab === "admin") muatAdmin();
    });
  });

  muatDesa();

  // Anti-tidur: ping server tiap 10 menit agar Render tidak "tidur"
  function ping() {
    fetch(base() + "/api/health").catch(() => {});
  }
  ping();
  setInterval(ping, 10 * 60 * 1000);
}

// ---------------- Laporan (export) ----------------
async function load() {
  const alamat = base();
  if (!alamat) return setStatus("Isi alamat server dulu.", true);
  localStorage.setItem("baseUrl", alamat);

  const dari = el("dari").value;
  const sampai = el("sampai").value;
  if (!dari || !sampai) return setStatus("Pilih rentang tanggal.", true);

  el("loading").textContent = "Memuat data...";
  try {
    const res = await fetch(url(`/api/export?dari=${dari}&sampai=${sampai}`));
    if (!res.ok) throw new Error("Server menolak (HTTP " + res.status + ")");
    const json = await res.json();
    currentData = json.data || [];
    render();
    setStatus(`Berhasil memuat ${currentData.length} catatan.`, false);
  } catch (e) {
    setStatus("Gagal memuat: " + e.message + ". Pastikan server & URL benar.", true);
  } finally {
    el("loading").textContent = "";
  }
}

function render() {
  const tbody = el("rows");
  tbody.innerHTML = "";
  if (!currentData.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#94a3b8;">Belum ada data</td></tr>';
    el("sum").textContent = "";
    return;
  }
  currentData.forEach((a, i) => {
    const tr = document.createElement("tr");
    const fotoHtml = a.foto
      ? `<img src="data:image/jpeg;base64,${a.foto}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;cursor:pointer" onclick="window.open(this.src)" title="Klik untuk perbesar" />`
      : '<span style="color:#94a3b8">-</span>';
    tr.innerHTML = `<td>${i + 1}</td><td>${a.tanggal}</td><td>${a.jam_masuk}</td>
      <td>${a.nama}</td><td>${a.kelompok}</td><td>${a.desa || '-'}</td><td>${badge(a.cocok_wajah)}</td>
      <td>${badgeTelat(a.telat)}</td><td>${fotoHtml}</td>`;
    tbody.appendChild(tr);
  });
  const jmlTelat = currentData.filter((a) => a.telat === true).length;
  el("sum").textContent = `Total: ${currentData.length} catatan absensi. Telat: ${jmlTelat}.`;
}

async function doExport() {
  if (!currentData.length) return setStatus("Tidak ada data untuk diexport.", true);
  const hasil = await window.api.exportExcel({
    data: currentData,
    dari: el("dari").value,
    sampai: el("sampai").value,
  });
  setStatus(hasil.ok ? "✅ " + hasil.pesan : "❌ " + hasil.pesan, !hasil.ok);
}

async function doPdf() {
  if (!currentData.length) return setStatus("Tidak ada data untuk diexport.", true);
  const hasil = await window.api.exportPdf({
    data: currentData,
    dari: el("dari").value,
    sampai: el("sampai").value,
  });
  setStatus(hasil.ok ? "✅ " + hasil.pesan : "❌ " + hasil.pesan, !hasil.ok);
}

// ---------------- Rekap Harian per desa ----------------
async function loadRekap() {
  el("status-rekap").textContent = "";
  el("loading-rekap").textContent = "Memuat rekap...";
  try {
    const j = await apiGet(`/api/rekap?tanggal=${el("r-tanggal").value}`);
    el("sum-rekap").textContent = `Tanggal ${j.tanggal} — Total: ${j.total} catatan, ${j.data.length} desa.`;
    const box = el("rekap-box");
    box.innerHTML = "";
    if (!j.data.length) {
      box.innerHTML = '<p style="color:#94a3b8">Belum ada data pada tanggal ini.</p>';
      return;
    }
    j.data.forEach((d) => {
      const div = document.createElement("div");
      div.className = "card";
      const k = d.per_kelompok.map((x) => `${x.kelompok}: ${x.jumlah}`).join(" · ");
      const t = d.telat ? ` <span class="badge-telat">— ${d.telat} TELAT</span>` : "";
      div.innerHTML = `<h3>${d.desa} <span style="font-weight:400;color:#64748b">— ${d.total} hadir</span>${t}</h3>
        <p style="margin:6px 0;font-size:13px;color:#475569;">${k}</p>
        <table><thead><tr><th>No</th><th>Nama</th><th>Kelompok</th><th>Jam</th><th>Wajah</th><th>Telat</th></tr></thead>
        <tbody>${d.siswa.map((s, i) =>
          `<tr><td>${i + 1}</td><td>${s.nama}</td><td>${s.kelompok}</td><td>${s.jam_masuk}</td><td>${badge(s.cocok_wajah)}</td><td>${badgeTelat(s.telat)}</td></tr>`
        ).join("")}</tbody></table>`;
      box.appendChild(div);
    });
    el("status-rekap").textContent = "Rekap harian berhasil dimuat.";
  } catch (e) {
    el("status-rekap").textContent = "Gagal: " + e.message;
    el("status-rekap").style.color = "#dc2626";
  } finally {
    el("loading-rekap").textContent = "";
  }
}

// ---------------- Rekap Bulanan per siswa ----------------
async function loadBulanan() {
  el("status-bulanan").textContent = "";
  el("loading-bulanan").textContent = "Memuat rekap bulanan...";
  try {
    const j = await apiGet(`/api/rekap-bulanan?bulan=${el("b-bulan").value}`);
    const tbody = el("rows-bulanan");
    tbody.innerHTML = "";
    el("sum-bulanan").textContent = `Bulan ${j.bulan} — ${j.total_siswa} siswa hadir.`;
    if (!j.data.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#94a3b8;">Belum ada data bulan ini.</td></tr>';
      return;
    }
    j.data.forEach((s, i) => {
      const tr = document.createElement("tr");
      const t = s.hariTelat && s.hariTelat.length > 0
        ? `<span class="badge-telat">${s.hariTelat.length} hari</span>`
        : '0';
      tr.innerHTML = `<td>${i + 1}</td><td>${s.nama}</td><td>${s.kelompok}</td><td>${s.desa}</td>
        <td>${s.hariHadir.join(", ")}</td><td>${s.catatan}</td>
        <td>${s.cocokWajah > 0 ? `<span class="badge-tidak">${s.cocokWajah} kali</span>` : '0'}</td>
        <td>${t}</td>`;
      tbody.appendChild(tr);
    });
  } catch (e) {
    el("status-bulanan").textContent = "Gagal: " + e.message;
    el("status-bulanan").style.color = "#dc2626";
  } finally {
    el("loading-bulanan").textContent = "";
  }
}

// ---------------- Entry Manual ----------------
async function muatDesa() {
  try {
    const j = await apiGet("/api/desa");
    const sel = el("m-desa");
    sel.innerHTML = "";
    Object.keys(j.data).forEach((d) => {
      const o = document.createElement("option");
      o.value = d;
      o.textContent = d;
      sel.appendChild(o);
    });
    const bebas = document.createElement("option");
    bebas.value = j.desa_bebas;
    bebas.textContent = j.desa_bebas;
    sel.appendChild(bebas);
    muatKelompok();
  } catch (e) {
    el("status-manual").textContent = "Gagal memuat desa: " + e.message;
  }
}

async function muatKelompok() {
  try {
    const j = await apiGet("/api/desa");
    const desa = el("m-desa").value;
    const sel = el("m-kelompok");
    sel.innerHTML = "";
    const list = j.data[desa] || [];
    list.forEach((k) => {
      const o = document.createElement("option");
      o.value = k;
      o.textContent = k;
      sel.appendChild(o);
    });
    if (!list.length) {
      const o = document.createElement("option");
      o.value = "";
      o.textContent = "(semua kelompok)";
      sel.appendChild(o);
    }
  } catch (e) {
    /* abaikan */
  }
}

async function doManual() {
  const nama = el("m-nama").value.trim();
  if (!nama) {
    el("status-manual").textContent = "Isi nama siswa dulu.";
    return;
  }
  el("status-manual").textContent = "Menyimpan...";
  try {
    const body = {
      nama,
      desa: el("m-desa").value,
      kelompok: el("m-kelompok").value,
      jenis_kelamin: el("m-jk").value,
      kode_sekolah: "SMAN1",
    };
    const jam = el("m-jam").value.trim();
    if (jam) body.jam_manual = jam;
    const res = await fetch(base() + "/api/absen-manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await res.json();
    el("status-manual").textContent = (j.ok ? "✅ " : "❌ ") + (j.pesan || "Gagal");
    el("status-manual").style.color = j.ok ? "#16a34a" : "#dc2626";
    if (j.ok) el("m-nama").value = "";
  } catch (e) {
    el("status-manual").textContent = "Gagal: " + e.message;
    el("status-manual").style.color = "#dc2626";
  }
}

function setStatus(msg, isError) {
  const s = el("status");
  s.textContent = msg;
  s.style.color = isError ? "#dc2626" : "#16a34a";
}

// ---------------- Admin (statistik + jadwal + toleransi) ----------------
let daftarDesaAdmin = [];

async function muatAdmin() {
  const tgl = el("a-tanggal").value || new Date().toLocaleDateString("en-CA");
  el("a-tanggal").value = tgl;
  const st = el("status-admin");
  st.textContent = "";
  try {
    const [desa, jadwal, stat, abs, peng] = await Promise.all([
      apiGet("/api/desa"),
      apiGet(`/api/jadwal?tanggal=${tgl}`),
      apiGet(`/api/statistik?tanggal=${tgl}`),
      apiGet(`/api/absensi?tanggal=${tgl}`),
      apiGet("/api/pengaturan"),
    ]);

    daftarDesaAdmin.length = 0;
    daftarDesaAdmin.push(...Object.keys(desa.data), desa.desa_bebas);

    el("a-total").textContent = stat.total;
    el("a-telat").textContent = stat.total_telat || 0;
    el("a-wajah").textContent = abs.data.filter((a) => a.cocok_wajah === "TIDAK COCOK").length;
    el("a-toleransi").value = peng.toleransi_telat;

    const box = el("a-jadwal-ui");
    box.innerHTML = "";
    daftarDesaAdmin.forEach((d) => {
      const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;gap:10px;margin-bottom:8px;";
      const label = document.createElement("span");
      label.style.cssText = "flex:1;font-size:14px;font-weight:600;";
      label.textContent = d;
      const inp = document.createElement("input");
      inp.type = "time";
      inp.id = "a-jadwal-" + d;
      inp.style.cssText = "padding:6px 10px;border-radius:8px;border:1px solid #cbd5e1;font-size:14px;";
      const btn = document.createElement("button");
      btn.textContent = "Simpan";
      btn.className = "btn-primary";
      btn.onclick = async () => {
        try {
          await apiPost("/api/jadwal", {
            tanggal: el("a-jadwal-tanggal").value,
            desa: d,
            jam_mulai: inp.value,
          });
          el("status-admin").textContent = `Jam mulai ${d} disimpan.`;
          el("status-admin").style.color = "#16a34a";
          muatAdmin();
        } catch (e) {
          el("status-admin").textContent = "Gagal: " + e.message;
          el("status-admin").style.color = "#dc2626";
        }
      };
      row.appendChild(label);
      row.appendChild(inp);
      row.appendChild(btn);
      box.appendChild(row);
    });

    el("a-jadwal-tanggal").value = tgl;
    jadwal.data.forEach((x) => {
      const inp = document.getElementById("a-jadwal-" + x.desa);
      if (inp) inp.value = x.jam_mulai.slice(0, 5).replace(".", ":");
    });
  } catch (e) {
    st.textContent = "Gagal memuat data admin: " + e.message;
    st.style.color = "#dc2626";
  }
}

async function simpanToleransi() {
  const st = el("status-admin");
  try {
    const v = parseInt(el("a-toleransi").value, 10);
    const j = await apiPost("/api/pengaturan", { toleransi_telat: v });
    st.textContent = j.pesan;
    st.style.color = "#16a34a";
  } catch (e) {
    st.textContent = "Gagal: " + e.message;
    st.style.color = "#dc2626";
  }
}

window.addEventListener("DOMContentLoaded", init);