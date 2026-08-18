import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/siswa.dart';

class SiswaService {
  static const _k = 'profil_siswa';

  Future<Siswa?> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_k);
    if (raw == null) return null;
    final parts = raw.split('\u0001');
    if (parts.length < 4) return null;
    return Siswa(
      nama: parts[0],
      desa: parts[1],
      kelompok: parts[2],
      jenisKelamin: parts[3],
      pin: parts.length > 4 ? parts[4] : '',
      foto: parts.length > 5 ? parts[5] : '',
    );
  }

  Future<void> save(Siswa s) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
        _k,
        '${s.nama}\u0001${s.desa}\u0001${s.kelompok}\u0001${s.jenisKelamin}\u0001${s.pin}\u0001${s.foto}');
  }

  String encodeFoto(List<int> bytes) => base64Encode(bytes);
}