import 'package:flutter_test/flutter_test.dart';
import 'package:opic_master/main.dart';

void main() {
  testWidgets('App renders with title', (WidgetTester tester) async {
    await tester.pumpWidget(const OPIcMasterApp());
    expect(find.text('OPIc Master'), findsOneWidget);
  });
}
