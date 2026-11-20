import 'dart:math';

/// UUID v7 (RFC 9562): 48 bit millisekund + tasodifiy bitlar.
/// Offline qurilmada yaratilgan ID'lar server bilan to'qnashmaydi va vaqt bo'yicha tartiblanadi.
class Uuid7 {
  static final Random _rng = Random.secure();
  static int _lastMs = 0;
  static int _counter = 0;

  static String generate([DateTime? now]) {
    var ms = (now ?? DateTime.now()).millisecondsSinceEpoch;
    // Bir millisekund ichida monoton bo'lishi uchun 12 bitli hisoblagich
    if (ms <= _lastMs) {
      ms = _lastMs;
      _counter++;
      if (_counter > 0xFFF) {
        ms = ++_lastMs;
        _counter = 0;
      }
    } else {
      _counter = _rng.nextInt(0x800);
    }
    _lastMs = ms;

    final bytes = List<int>.filled(16, 0);
    for (var i = 0; i < 6; i++) {
      bytes[i] = (ms >> (8 * (5 - i))) & 0xFF;
    }
    bytes[6] = 0x70 | ((_counter >> 8) & 0x0F);
    bytes[7] = _counter & 0xFF;
    bytes[8] = 0x80 | _rng.nextInt(0x40);
    for (var i = 9; i < 16; i++) {
      bytes[i] = _rng.nextInt(256);
    }
    final hex = bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
    return '${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-'
        '${hex.substring(16, 20)}-${hex.substring(20)}';
  }
}
