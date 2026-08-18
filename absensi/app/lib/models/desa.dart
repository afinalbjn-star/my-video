// Data desa dan kelompoknya (sama dengan server)

// QR gabungan yang menerima semua desa & kelompok (acara pengajian daerah)
const String desaBebas = 'PENGAJIAN MUMI DAERAH';

const Map<String, List<String>> desaKelompok = {
  'SELATAN': [
    'KUNCI 1',
    'KUNCI 2',
    'PENGANTEN',
    'BOMO 1',
    'BOMO 2',
    'GEGER',
    'PACING 1',
    'PACING 2',
    'PACING 3',
  ],
  'TIMUR': [
    'TA BARAT',
    'TA TENGAH',
    'TA TIMUR',
    'KALIPAN',
    'TA 5',
    'TA 6',
    'TA 7',
    'JATICILIK',
  ],
  'DAMPET': [
    'DAMPET 1',
    'DAMPET 2',
    'DAMPET 3',
    'BALONGREJO',
    'NGUJUNG',
    'KALICILIK',
  ],
  'BAURENO': [
    'SUMBEREJO',
    'BAURENO',
    'SUGIHWARAS',
    'SUMBERAGUNG',
    'KRANGKONG',
    'PEJOK',
  ],
};

List<String> kelompokDesa(String desa) => desaKelompok[desa] ?? const [];

bool desaBebasValid(String desa) => desa == desaBebas;

bool desaValid(String desa) => desaKelompok.containsKey(desa) || desa == desaBebas;

bool kelompokValid(String desa, String kelompok) {
  if (desa == desaBebas) return true;
  return desaKelompok[desa]?.contains(kelompok) ?? false;
}