import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// 4 xonali PIN klaviaturasi: sensorli ekran (katta tugmalar) va jismoniy klaviatura bilan ishlaydi.
class PinPad extends StatefulWidget {
  const PinPad({super.key, required this.onCompleted, this.length = 4, this.enabled = true, this.error});

  final Future<void> Function(String pin) onCompleted;
  final int length;
  final bool enabled;
  final String? error;

  @override
  State<PinPad> createState() => _PinPadState();
}

class _PinPadState extends State<PinPad> {
  String _pin = '';
  final _focus = FocusNode();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _focus.requestFocus());
  }

  @override
  void dispose() {
    _focus.dispose();
    super.dispose();
  }

  Future<void> _add(String d) async {
    if (!widget.enabled || _pin.length >= widget.length) return;
    setState(() => _pin += d);
    if (_pin.length == widget.length) {
      final pin = _pin;
      await widget.onCompleted(pin);
      if (mounted) setState(() => _pin = '');
    }
  }

  void _backspace() {
    if (_pin.isNotEmpty) setState(() => _pin = _pin.substring(0, _pin.length - 1));
  }

  KeyEventResult _onKey(FocusNode node, KeyEvent e) {
    if (e is! KeyDownEvent) return KeyEventResult.ignored;
    final ch = e.character;
    if (ch != null && RegExp(r'^\d$').hasMatch(ch)) {
      _add(ch);
      return KeyEventResult.handled;
    }
    if (e.logicalKey == LogicalKeyboardKey.backspace) {
      _backspace();
      return KeyEventResult.handled;
    }
    if (e.logicalKey == LogicalKeyboardKey.escape) {
      setState(() => _pin = '');
      return KeyEventResult.handled;
    }
    return KeyEventResult.ignored;
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Focus(
      focusNode: _focus,
      onKeyEvent: _onKey,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisSize: MainAxisSize.min,
            children: List.generate(widget.length, (i) {
              final filled = i < _pin.length;
              return AnimatedContainer(
                duration: const Duration(milliseconds: 120),
                margin: const EdgeInsets.symmetric(horizontal: 10),
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: filled ? scheme.primary : Colors.transparent,
                  border: Border.all(color: widget.error != null ? scheme.error : scheme.outline, width: 2),
                ),
              );
            }),
          ),
          SizedBox(
            height: 32,
            child: Center(
              child: widget.error == null
                  ? null
                  : Text(widget.error!, style: TextStyle(color: scheme.error, fontWeight: FontWeight.w600)),
            ),
          ),
          for (final row in const [
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            ['C', '0', '<'],
          ])
            Row(
              mainAxisSize: MainAxisSize.min,
              children: row.map((k) {
                final isAction = k == 'C' || k == '<';
                return Padding(
                  padding: const EdgeInsets.all(6),
                  child: SizedBox(
                    width: 84,
                    height: 72,
                    child: FilledButton.tonal(
                      onPressed: !widget.enabled
                          ? null
                          : () {
                              if (k == '<') {
                                _backspace();
                              } else if (k == 'C') {
                                setState(() => _pin = '');
                              } else {
                                _add(k);
                              }
                            },
                      style: FilledButton.styleFrom(
                        minimumSize: const Size(84, 72),
                        padding: EdgeInsets.zero,
                        textStyle: const TextStyle(fontSize: 28, fontWeight: FontWeight.w600),
                      ),
                      child: k == '<'
                          ? const Icon(Icons.backspace_outlined, size: 28)
                          : Text(k, style: isAction ? const TextStyle(fontSize: 22) : null),
                    ),
                  ),
                );
              }).toList(),
            ),
        ],
      ),
    );
  }
}
