const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    title: "Absensi MM BJN Timur",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile("index.html");
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Handler export ke Excel (.xlsx)
ipcMain.handle("export-excel", async (_e, { data, dari, sampai }) => {
  if (!data || !data.length) return { ok: false, pesan: "Tidak ada data untuk diexport." };

  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: "Simpan Laporan Excel",
    defaultPath: `Laporan-Absensi-${dari}_sd_${sampai}.xlsx`,
    filters: [{ name: "Excel Workbook", extensions: ["xlsx"] }],
  });
  if (canceled || !filePath) return { ok: false, pesan: "Dibatalkan." };

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Absensi");

  ws.columns = [
    { header: "No", key: "no", width: 6 },
    { header: "Tanggal", key: "tanggal", width: 14 },
    { header: "Jam Masuk", key: "jam_masuk", width: 12 },
    { header: "Nama", key: "nama", width: 24 },
    { header: "Kelompok", key: "kelompok", width: 12 },
    { header: "Jenis Kelamin", key: "jenis_kelamin", width: 14 },
    { header: "Desa", key: "desa", width: 14 },
    { header: "Cocok Wajah", key: "cocok_wajah", width: 14 },
    { header: "Telat", key: "telat", width: 10 },
    { header: "Foto", key: "foto", width: 12 },
  ];

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 22;

  data.forEach((a, i) => {
    const row = ws.addRow({
      no: i + 1,
      tanggal: a.tanggal,
      jam_masuk: a.jam_masuk,
      nama: a.nama,
      kelompok: a.kelompok,
      jenis_kelamin: a.jenis_kelamin,
      desa: a.desa,
      cocok_wajah: a.cocok_wajah || "-",
      telat: a.telat ? "TELAT" : a.telat === false ? "TEPAT" : "-",
      foto: a.foto ? "Lihat foto" : "-",
    });
    if (a.telat === true) {
      row.getCell("telat").font = { bold: true, color: { argb: "FFDC2626" } };
      row.getCell("telat").fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFEE2E2" },
      };
    }
  });

  ws.autoFilter = { from: "A1", to: "J1" };
  ws.eachRow((row) => {
    row.alignment = { vertical: "middle" };
  });

  // Sisipkan foto selfie sebagai gambar di kolom I (jika ada)
  data.forEach((a, i) => {
    if (!a.foto) return;
    try {
      const imgBuf = Buffer.from(a.foto, "base64");
      const imgId = wb.addImage({ buffer: imgBuf, extension: "jpeg" });
      ws.addImage(imgId, {
        tl: { col: 8, row: i + 1 },
        ext: { width: 60, height: 60 },
      });
    } catch (e) {
      // lewati foto yang rusak
    }
  });
  ws.eachRow((row, n) => {
    if (n > 1) row.height = 66; // beri ruang untuk foto
  });

  await wb.xlsx.writeFile(filePath);
  return { ok: true, pesan: `Tersimpan: ${filePath}` };
});

// Handler export ke PDF (pakai printToPDF bawaan Electron)
ipcMain.handle("export-pdf", async (_e, { data, dari, sampai }) => {
  if (!data || !data.length) return { ok: false, pesan: "Tidak ada data untuk diexport." };

  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: "Simpan Laporan PDF",
    defaultPath: `Laporan-Absensi-${dari}_sd_${sampai}.pdf`,
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });
  if (canceled || !filePath) return { ok: false, pesan: "Dibatalkan." };

  const rows = data
    .map(
      (a, i) => `<tr>
        <td>${i + 1}</td><td>${a.tanggal}</td><td>${a.jam_masuk}</td>
        <td>${a.nama}</td><td>${a.kelompok}</td><td>${a.desa || "-"}</td>
        <td>${a.cocok_wajah || "-"}</td>
        <td>${a.telat ? '<b style="color:#dc2626">TELAT</b>' : a.telat === false ? "TEPAT" : "-"}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
  <html><head><meta charset="utf-8"><style>
    body { font-family: sans-serif; margin: 24px; color: #0f172a; }
    h1 { font-size: 18px; margin-bottom: 2px; }
    .sub { color: #64748b; font-size: 12px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
    th { background: #e2e8f0; }
  </style></head><body>
    <h1>Laporan Absensi Pengajian MUMI Bojonegoro Timur</h1>
    <div class="sub">Periode: ${dari} s/d ${sampai} — Total: ${data.length} catatan</div>
    <table>
      <thead><tr><th>No</th><th>Tanggal</th><th>Jam Masuk</th><th>Nama</th><th>Kelompok</th><th>Desa</th><th>Cocok Wajah</th><th>Telat</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </body></html>`;

  const pdfWin = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
  try {
    await pdfWin.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));
    const pdf = await pdfWin.webContents.printToPDF({ pageSize: "A4", printBackground: true });
    fs.writeFileSync(filePath, pdf);
    return { ok: true, pesan: `Tersimpan: ${filePath}` };
  } finally {
    pdfWin.destroy();
  }
});