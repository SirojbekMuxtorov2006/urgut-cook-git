import 'package:flutter_test/flutter_test.dart';
import 'package:restopro/core/utils/uuid7.dart';

void main() {
  test('UUID v7 formati va tartibi', () {
    final ids = List.generate(1000, (_) => Uuid7.generate());
    final re = RegExp(r'^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');
    expect(ids.every(re.hasMatch), isTrue);
    final sorted = [...ids]..sort();
    expect(sorted, ids);
    expect(ids.toSet().length, ids.length);
  });
}
