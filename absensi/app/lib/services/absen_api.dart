import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;

import '../models/siswa.dart';

class AbsenApi {
  /// Ganti dengan URL server cloud/laptop.
  static const String baseUrl = 'https://absensi-server-gnmp.onrender.com';

  /// Harus sama dengan KODE_SEKOLAH saat server dijalankan.
  static const String kodeSekolah = 'SMAN1';

  /// Kunci akses API (harus sama dengan KUNCI_AKSES di server).
  static const String kunciAkses = 'mumi-bjn-2026';

  static Future<Map<String, dynamic>> absen({
    required Siswa siswa,
    required String desa,
    Uint8List? fotoBytes,
  }) async {
    final uri = Uri.parse('$baseUrl/api/absen?kunci=$kunciAkses');
    final resp = await http
        .post(
          uri,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'nama': siswa.nama,
            'desa': desa,
            'kelompok': siswa.kelompok,
            'jenis_kelamin': siswa.jenisKelamin,
            'kode_sekolah': kodeSekolah,
            if (fotoBytes != null) 'foto': base64Encode(fotoBytes),
          }),
        )
        .timeout(const Duration(seconds: 15));

    return jsonDecode(resp.body) as Map<String, dynamic>;
  }

  /// Simpan foto referensi wajah siswa (untuk cocokkan wajah saat absen).
  static Future<Map<String, dynamic>> kirimFotoProfil(Siswa siswa) async {
    if (siswa.foto.isEmpty) {
      return {'ok': false, 'pesan': 'Belum ada foto profil.'};
    }
    final uri = Uri.parse('$baseUrl/api/siswa/foto?kunci=$kunciAkses');
    final resp = await http
        .post(
          uri,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'nama': siswa.nama,
            'desa': siswa.desa,
            'kelompok': siswa.kelompok,
            'jenis_kelamin': siswa.jenisKelamin,
            'kode_sekolah': kodeSekolah,
            'foto': siswa.foto,
          }),
        )
        .timeout(const Duration(seconds: 20));

    return jsonDecode(resp.body) as Map<String, dynamic>;
  }

  /// Buat/ambil link pantau unik untuk siswa (untuk dibagikan ke orang tua).
  static Future<Map<String, dynamic>> buatLinkPantau(Siswa siswa) async {
    final uri = Uri.parse('$baseUrl/api/pantau/kode?kunci=$kunciAkses');
    final resp = await http
        .post(
          uri,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'nama': siswa.nama,
            'desa': siswa.desa,
            'kelompok': siswa.kelompok,
            'jenis_kelamin': siswa.jenisKelamin,
            'kode_sekolah': kodeSekolah,
          }),
        )
        .timeout(const Duration(seconds: 15));

    final j = jsonDecode(resp.body) as Map<String, dynamic>;
    if (j['ok'] == true) {
      j['link'] = '$baseUrl${j['link']}';
    }
    return j;
  }
}