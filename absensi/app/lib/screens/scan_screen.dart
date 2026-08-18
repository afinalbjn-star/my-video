import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../models/desa.dart';
import '../services/absen_api.dart';
import '../services/siswa_service.dart';

class ScanScreen extends StatefulWidget {
  const ScanScreen({super.key});

  @override
  State<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen> {
  final _scannerController = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
    formats: const [BarcodeFormat.qrCode],
  );
  final _service = SiswaService();
  bool _memproses = false;

  @override
  void dispose() {
    _scannerController.dispose();
    super.dispose();
  }

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_memproses) return;
    final barcode = capture.barcodes.firstOrNull;
    if (barcode?.rawValue == null) return;

    final siswa = await _service.load();
    if (siswa == null || !siswa.lengkap) {
      _showSnack('Lengkapi profil dulu di tab Profil.', isError: true);
      return;
    }

    final desa = barcode!.rawValue!.trim().toUpperCase();
    if (!desaValid(desa)) {
      _showSnack('QR tidak dikenal: "$desa"', isError: true);
      return;
    }
    setState(() => _memproses = true);

    try {
      // Jeda scanner sementara agar kamera selfie bisa dipakai
      await _scannerController.stop();

      final foto = await _ambilSelfie();
      if (foto == null) {
        // Siswa batal foto -> tidak dicatat sebagai absen
        return;
      }

      final res = await AbsenApi.absen(siswa: siswa, desa: desa, fotoBytes: foto);
      _showDialog(res);
    } catch (e) {
      _showSnack('Gagal kirim: $e', isError: true);
    } finally {
      setState(() => _memproses = false);
      await _scannerController.start();
    }
  }

  Future<Uint8List?> _ambilSelfie() async {
    final picker = ImagePicker();
    final shot = await picker.pickImage(
      source: ImageSource.camera,
      preferredCameraDevice: CameraDevice.front,
      imageQuality: 60,
      maxWidth: 800,
      maxHeight: 800,
    );
    if (shot == null) return null;
    return shot.readAsBytes();
  }

  void _showDialog(Map<String, dynamic> res) {
    final ok = res['ok'] == true;
    final cocok = res['cocok_wajah'];
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => AlertDialog(
        icon: Icon(ok ? Icons.check_circle : Icons.cancel, color: ok ? Colors.green : Colors.red, size: 48),
        title: Text(ok ? 'Absen Berhasil' : 'Gagal'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(res['pesan']?.toString() ?? ''),
            if (cocok != null) ...[
              const SizedBox(height: 12),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    cocok == 'COCOK' ? Icons.verified_user : Icons.warning_amber,
                    color: cocok == 'COCOK' ? Colors.green : Colors.orange,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    cocok == 'COCOK'
                        ? 'Wajah sesuai foto profil'
                        : 'Wajah TIDAK sesuai foto profil!',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: cocok == 'COCOK' ? Colors.green.shade800 : Colors.orange.shade900,
                    ),
                  ),
                ],
              ),
            ],
            if (res['telat'] == true) ...[
              const SizedBox(height: 12),
              Container(
                width: double.maxFinite,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.red.shade200),
                ),
                child: const Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.warning_amber_rounded, color: Colors.red, size: 28),
                    SizedBox(height: 6),
                    Text(
                      'ANDA TELAT',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                        color: Colors.red,
                      ),
                    ),
                    SizedBox(height: 6),
                    Text(
                      'Amal sholih kafaroh (tanya petugas kafarohnya apa) dan lain kali jangan sampai telat lagi.\n\nAlhamdulillahi jazakallahu/jazakillahu khoiro',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 12, color: Color(0xFF7F1D1D), height: 1.5),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void _showSnack(String msg, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: isError ? Colors.red.shade700 : null,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Scan QR Desa')),
      body: Column(
        children: [
          Expanded(
            child: MobileScanner(
              controller: _scannerController,
              onDetect: _onDetect,
              overlayBuilder: (context, constraints) => const Center(
                child: _ScannerOverlay(),
              ),
              errorBuilder: (context, error) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.no_photography,
                          size: 56, color: Colors.redAccent),
                      const SizedBox(height: 12),
                      const Text(
                        'Kamera tidak tersedia atau izin kamera belum diberikan.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.redAccent),
                      ),
                      const SizedBox(height: 8),
                      Text(error.errorCode.name, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                      const SizedBox(height: 12),
                      FilledButton(
                        onPressed: () async {
                          await _scannerController.start();
                        },
                        child: const Text('Coba Lagi'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: _memproses
                ? const Center(child: CircularProgressIndicator())
                : Column(
                    children: [
                      const Icon(Icons.info_outline, color: Colors.blueGrey),
                      const SizedBox(height: 4),
                      const Text(
                        'Arahkan kamera ke QR code desa di lokasi masuk.\nSetelah terbaca, kamu akan diminta foto selfie.\nSistem mencatat jam kedatangan + fotomu sebagai bukti.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.blueGrey),
                      ),
                      const SizedBox(height: 12),
                      FilledButton.tonalIcon(
                        onPressed: () => _scannerController.toggleTorch(),
                        icon: const Icon(Icons.flashlight_on),
                        label: const Text('Sentol (Lampu)'),
                      ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}

class _ScannerOverlay extends StatelessWidget {
  const _ScannerOverlay();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 240,
      height: 240,
      decoration: BoxDecoration(
        border: Border.all(color: Colors.white, width: 3),
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Icon(Icons.qr_code_scanner, color: Colors.white70, size: 80),
    );
  }
}