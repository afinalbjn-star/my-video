import 'desa.dart';

class Siswa {
  final String nama;
  final String desa;
  final String kelompok;
  final String jenisKelamin;
  final String pin;
  final String foto;

  const Siswa({
    required this.nama,
    required this.desa,
    required this.kelompok,
    required this.jenisKelamin,
    this.pin = '',
    this.foto = '',
  });

  bool get lengkap =>
      nama.trim().isNotEmpty &&
      desaValid(desa) &&
      kelompokValid(desa, kelompok) &&
      jenisKelamin.isNotEmpty &&
      pin.trim().isNotEmpty;

  Map<String, String> toMap() => {
        'nama': nama.trim(),
        'desa': desa,
        'kelompok': kelompok,
        'jenis_kelamin': jenisKelamin,
      };
}