import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/theme.dart';
import '../network/connectivity.dart';

/// 🟢 Online / 🟡 Sinxron (N ta) / 🔴 Internet yo'q (hub ishlayapti) / ⚫ Mustaqil rejim
class NetStatusChip extends ConsumerWidget {
  const NetStatusChip({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(netStatusProvider).valueOrNull ?? const NetState(NetStatus.online);
    final (color, label) = switch (s.status) {
      NetStatus.online => (AppColors.green, 'Online'),
      NetStatus.syncing => (AppColors.yellow, 'Sinxron (${s.pending} ta)'),
      NetStatus.offlineHub => (AppColors.red, "Internet yo'q (hub ishlayapti)"),
      NetStatus.standalone => (Colors.black87, 'Mustaqil rejim'),
    };
    return Chip(
      avatar: CircleAvatar(backgroundColor: color, radius: 6),
      label: Text(label),
      visualDensity: VisualDensity.compact,
    );
  }
}
