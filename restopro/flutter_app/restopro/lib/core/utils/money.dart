import 'package:intl/intl.dart';

/// Pul summasi tiyinsiz butun son ko'rinishida saqlanadi (Decimal(14,2) * 100 => int).
/// Float ishlatilmaydi.
class Money {
  const Money._();

  /// "92400.00" -> 9240000 (tiyin)
  static int parse(String value) {
    final v = value.trim().replaceAll(' ', '').replaceAll(',', '.');
    if (v.isEmpty) return 0;
    final negative = v.startsWith('-');
    final parts = (negative ? v.substring(1) : v).split('.');
    final whole = int.parse(parts[0].isEmpty ? '0' : parts[0]);
    var frac = parts.length > 1 ? parts[1] : '0';
    frac = '${frac}00'.substring(0, 2);
    final result = whole * 100 + int.parse(frac);
    return negative ? -result : result;
  }

  /// 9240000 -> "92400.00" (API'ga yuborish uchun)
  static String toApi(int tiyin) {
    final negative = tiyin < 0;
    final abs = tiyin.abs();
    final s = '${abs ~/ 100}.${(abs % 100).toString().padLeft(2, '0')}';
    return negative ? '-$s' : s;
  }

  /// 9240000 -> "92 400 so'm"
  static String format(int tiyin, {String currency = "so'm"}) {
    final negative = tiyin < 0;
    final abs = tiyin.abs();
    final whole = abs ~/ 100;
    final frac = abs % 100;
    final grouped = NumberFormat('#,##0', 'en').format(whole).replaceAll(',', ' ');
    final body = frac == 0 ? grouped : '$grouped,${frac.toString().padLeft(2, '0')}';
    return '${negative ? '-' : ''}$body${currency.isEmpty ? '' : ' $currency'}';
  }

  /// Foizni qo'llash (xizmat haqi): yarmi yuqoriga yaxlitlanadi.
  static int percent(int tiyin, num percent) {
    final basisPoints = (percent * 100).round(); // 10% -> 1000
    return ((tiyin * basisPoints) + 5000) ~/ 10000;
  }
}

class AppDate {
  static final _date = DateFormat('dd.MM.yyyy');
  static final _dateTime = DateFormat('dd.MM.yyyy HH:mm');

  static String date(DateTime d) => _date.format(d.toLocal());
  static String dateTime(DateTime d) => _dateTime.format(d.toLocal());
}
