import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:share_plus/share_plus.dart';

import '../models/desa.dart';
import '../models/siswa.dart';
import '../services/absen_api.dart';
import '../services/siswa_service.dart';

class ProfilScreen extends StatefulWidget {
  const ProfilScreen({super.key});

  @override
  State<ProfilScreen> createState() => _ProfilScreenState();
}

class _ProfilScreenState extends State<ProfilScreen> {
  final _form = GlobalKey<FormState>();
  final _nama = TextEditingController();
  final _pin = TextEditingController();
  String _desa = 'SELATAN';
  String? _kelompok;
  String _jk = 'Laki-laki';
  final _service = SiswaService();
  Siswa? _tersimpan;
  bool _editMode = false;
  String _foto = '';

  @override
  void initState() {
    super.initState();
    _muat();
  }

  Future<void> _muat() async {
    final s = await _service.load();
    if (s != null) {
      setState(() {
        _tersimpan = s;
        _nama.text = s.nama;
        _desa = s.desa;
        _kelompok = s.kelompok;
        _jk = s.jenisKelamin;
        _foto = s.foto;
      });
    }
  }

  Future<void> _ambilFotoDiri() async {
    final picker = ImagePicker();
    final shot = await picker.pickImage(
      source: ImageSource.camera,
      preferredCameraDevice: CameraDevice.front,
      imageQuality: 60,
      maxWidth: 800,
      maxHeight: 800,
    );
    if (shot == null) return;
    final bytes = await shot.readAsBytes();
    if (!mounted) return;
    setState(() => _foto = base64Encode(bytes));
  }

  Widget _fotoPlaceholder() => Container(
        width: 120,
        height: 120,
        color: const Color(0xFFE2E8F0),
        child: const Icon(Icons.face, size: 56, color: Color(0xFF94A3B8)),
      );

  void _showSnack(String msg, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: isError ? Colors.red.shade700 : null,
      ),
    );
  }

  Future<void> _simpan() async {
    if (!(_form.currentState?.validate() ?? false)) return;
    if (_kelompok == null) {
      _showSnack('Pilih kelompok dulu.', isError: true);
      return;
    }

    // PIN minimum 4 digit
    final pin = _pin.text.trim();
    if (pin.length < 4) {
      _showSnack('PIN harus minimal 4 angka.', isError: true);
      return;
    }

    // Foto diri wajib (untuk cocokkan wajah saat absen)
    if (_foto.isEmpty) {
      _showSnack('Ambil foto diri dulu (kamera depan).', isError: true);
      return;
    }

    final s = Siswa(
      nama: _nama.text,
      desa: _desa,
      kelompok: _kelompok!,
      jenisKelamin: _jk,
      pin: pin,
      foto: _foto,
    );
    await _service.save(s);
    if (!mounted) return;
    setState(() {
      _tersimpan = s;
      _editMode = false;
    });
    _pin.clear();
    _showSnack('Profil tersimpan. Mengirim foto referensi...');

    // Kirim foto referensi wajah ke server (dipakai untuk cocokkan saat absen)
    try {
      final res = await AbsenApi.kirimFotoProfil(s);
      if (mounted) {
        _showSnack(
          res['ok'] == true
              ? 'Profil tersimpan + foto referensi terkirim.'
              : 'Profil tersimpan, tapi foto referensi gagal: ${res['pesan'] ?? ''}',
          isError: res['ok'] != true,
        );
      }
    } catch (e) {
      if (mounted) {
        _showSnack('Profil tersimpan, tapi foto referensi gagal: $e', isError: true);
      }
    }
  }

  Future<void> _mulaiUbah() async {
    final pinController = TextEditingController();
    final benar = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Masukkan PIN untuk ubah profil'),
        content: TextField(
          controller: pinController,
          keyboardType: TextInputType.number,
          obscureText: true,
          maxLength: 6,
          decoration: const InputDecoration(
            labelText: 'PIN',
            prefixIcon: Icon(Icons.lock),
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Batal'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Cek'),
          ),
        ],
      ),
    );

    if (benar != true) return;
    if (pinController.text.trim() != _tersimpan!.pin) {
      _showSnack('PIN salah.', isError: true);
      return;
    }
    if (!mounted) return;
    setState(() => _editMode = true);
  }

  Future<void> _bagikanLink() async {
    if (_tersimpan == null) return;
    _showSnack('Membuat link...');
    try {
      final res = await AbsenApi.buatLinkPantau(_tersimpan!);
      if (res['ok'] != true) {
        _showSnack('Gagal: ${res['pesan'] ?? 'tidak diketahui'}', isError: true);
        return;
      }
      final link = res['link'].toString();
      await Share.share(
        'Bismillah, Bapak/Ibu, ini link untuk memantau kehadiran ${_tersimpan!.nama} '
        '(${_tersimpan!.kelompok} - ${_tersimpan!.desa}) di Pengajian MUMI Bojonegoro Timur.\n\n'
        'Buka link ini kapan saja untuk melihat status kehadiran hari ini:\n$link',
        subject: 'Pantau Kehadiran ${_tersimpan!.nama}',
      );
    } catch (e) {
      _showSnack('Gagal membuat link: $e', isError: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final terkunci = _tersimpan != null && !_editMode;
    final kelompokList = kelompokDesa(_desa);
    if (!terkunci && _kelompok != null && !kelompokList.contains(_kelompok)) {
      _kelompok = null;
    }

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _form,
          child: ListView(
            children: [
              const SizedBox(height: 8),
              const Icon(Icons.badge, size: 56, color: Color(0xFF2563EB)),
              const SizedBox(height: 8),
              Text(
                'DATA DIRI MUMI BOJONEGORO TIMUR',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 24),
              Center(
                child: InkWell(
                  onTap: terkunci ? null : _ambilFotoDiri,
                  borderRadius: BorderRadius.circular(80),
                  child: Column(
                    children: [
                      ClipOval(
                        child: _foto.isNotEmpty
                            ? Image.memory(
                                base64Decode(_foto),
                                width: 120,
                                height: 120,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => _fotoPlaceholder(),
                              )
                            : _fotoPlaceholder(),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        terkunci
                            ? (_foto.isNotEmpty ? 'Foto Diri ✓' : 'Belum ada foto')
                            : 'Ambil Foto Diri (Kamera Depan)',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: terkunci
                              ? (_foto.isNotEmpty ? Colors.green : Colors.grey)
                              : const Color(0xFF2563EB),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _nama,
                enabled: !terkunci,
                decoration: const InputDecoration(
                  labelText: 'Nama',
                  prefixIcon: Icon(Icons.person),
                  border: OutlineInputBorder(),
                ),
                validator: (v) =>
                    (v == null || v.trim().isEmpty) ? 'Nama wajib diisi' : null,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                initialValue: _desa,
                decoration: const InputDecoration(
                  labelText: 'Desa',
                  prefixIcon: Icon(Icons.location_city),
                  border: OutlineInputBorder(),
                ),
                items: desaKelompok.keys.map((d) {
                  return DropdownMenuItem(value: d, child: Text(d));
                }).toList(),
                onChanged: terkunci
                    ? null
                    : (v) => setState(() {
                          _desa = v!;
                          _kelompok = null;
                        }),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                initialValue: _kelompok,
                decoration: const InputDecoration(
                  labelText: 'Kelompok',
                  prefixIcon: Icon(Icons.group),
                  border: OutlineInputBorder(),
                ),
                items: kelompokList
                    .map((k) => DropdownMenuItem(value: k, child: Text(k)))
                    .toList(),
                onChanged:
                    terkunci ? null : (v) => setState(() => _kelompok = v),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                initialValue: _jk,
                decoration: const InputDecoration(
                  labelText: 'Jenis Kelamin',
                  prefixIcon: Icon(Icons.people),
                  border: OutlineInputBorder(),
                ),
                items: const [
                  DropdownMenuItem(value: 'Laki-laki', child: Text('Laki-laki')),
                  DropdownMenuItem(value: 'Perempuan', child: Text('Perempuan')),
                ],
                onChanged: terkunci ? null : (v) => setState(() => _jk = v!),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _pin,
                enabled: !terkunci,
                keyboardType: TextInputType.number,
                obscureText: true,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                maxLength: 6,
                decoration: const InputDecoration(
                  labelText: 'PIN Kunci (4-6 angka)',
                  helperText:
                      'PIN untuk mengunci profil. Tanpa PIN, profil tidak bisa diubah.',
                  prefixIcon: Icon(Icons.lock),
                  border: OutlineInputBorder(),
                ),
                validator: (v) =>
                    (v == null || v.trim().length < 4) ? 'PIN minimal 4 angka' : null,
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: terkunci ? _mulaiUbah : _simpan,
                icon: Icon(terkunci ? Icons.edit : Icons.save),
                label: Text(terkunci ? 'Ubah Profil (PIN)' : 'Simpan Profil'),
                style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16)),
              ),
              if (_tersimpan != null) ...[
                const SizedBox(height: 16),
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.check_circle, color: Colors.green),
                    title: Text(_tersimpan!.nama),
                    subtitle: Text(
                        '${_tersimpan!.desa} · ${_tersimpan!.kelompok} · ${_tersimpan!.jenisKelamin}'),
                    trailing: const Icon(Icons.lock, size: 18),
                  ),
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: _bagikanLink,
                  icon: const Icon(Icons.share),
                  label: const Text('Bagikan Link ke Orang Tua'),
                  style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14)),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}