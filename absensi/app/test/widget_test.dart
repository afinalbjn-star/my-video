import 'package:flutter_test/flutter_test.dart';

import 'package:absensi_siswa/main.dart';

void main() {
  testWidgets('App renders profil screen', (WidgetTester tester) async {
    await tester.pumpWidget(const AbsensiApp());
    expect(find.text('DATA DIRI MUMI BOJONEGORO TIMUR'), findsOneWidget);
  });
}