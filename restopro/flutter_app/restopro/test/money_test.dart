import 'package:flutter_test/flutter_test.dart';
import 'package:restopro/core/utils/money.dart';

void main() {
  test('format', () {
    expect(Money.format(9240000), "92 400 so'm");
    expect(Money.format(123456750), "1 234 567,50 so'm");
    expect(Money.format(0), "0 so'm");
    expect(Money.format(-840000), "-8 400 so'm");
  });

  test('parse va toApi', () {
    expect(Money.parse('92400.00'), 9240000);
    expect(Money.parse('92 400,5'), 9240050);
    expect(Money.parse('-10.01'), -1001);
    expect(Money.toApi(9240050), '92400.50');
  });

  test('xizmat haqi 10%', () {
    expect(Money.percent(8400000, 10), 840000); // 84 000 -> 8 400
    expect(Money.percent(333, 10), 33);
    expect(Money.percent(335, 10), 34); // yarmi yuqoriga
  });
}
