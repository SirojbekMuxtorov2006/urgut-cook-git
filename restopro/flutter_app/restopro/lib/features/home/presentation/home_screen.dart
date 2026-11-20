import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/device_mode.dart';
import '../../../app/l10n.dart';
import '../../../app/theme.dart';
import '../../../core/widgets/status_chip.dart';
import '../../auth/application/session_controller.dart';

class _Module {
  const _Module(this.title, this.icon, this.stage, [this.permission]);
  final String title;
  final IconData icon;
  final int stage; // qaysi bosqichda ishga tushadi
  final String? permission;
}

const _modules = <DeviceMode, List<_Module>>{
  DeviceMode.pos: [
    _Module('Stollar xaritasi', Icons.table_restaurant, 2),
    _Module('Tez sotuv', Icons.flash_on, 3, 'order.create'),
    _Module('Olib ketish', Icons.shopping_bag, 3, 'order.create'),
    _Module('Yetkazib berish', Icons.delivery_dining, 8, 'delivery.manage'),
    _Module('Smena / X-Z hisobot', Icons.receipt_long, 3, 'shift.manage'),
    _Module('Stop-list', Icons.block, 2, 'stoplist.manage'),
  ],
  DeviceMode.waiter: [
    _Module('Mening stollarim', Icons.table_restaurant, 5, 'order.create'),
    _Module('Yangi buyurtma', Icons.add_circle, 5, 'order.create'),
    _Module('Tayyor taomlar', Icons.notifications_active, 5),
  ],
  DeviceMode.kds: [
    _Module('Oshxona chiptalari', Icons.soup_kitchen, 5, 'kitchen.view'),
    _Module('Guruhlangan ko\'rinish', Icons.view_agenda, 5, 'kitchen.view'),
    _Module('Stop-list', Icons.block, 2, 'stoplist.manage'),
  ],
  DeviceMode.manager: [
    _Module('Dashboard', Icons.insights, 7, 'reports.view'),
    _Module('Menyu va narxlar', Icons.restaurant_menu, 2, 'menu.manage'),
    _Module('Stop-list', Icons.block, 2, 'stoplist.manage'),
    _Module('Ombor: kirim', Icons.inventory, 6, 'inventory.manage'),
    _Module('Inventarizatsiya', Icons.fact_check, 6, 'inventory.manage'),
    _Module('Hisobotlar', Icons.bar_chart, 7, 'reports.view'),
  ],
  DeviceMode.courier: [
    _Module('Buyurtmalarim', Icons.list_alt, 8, 'delivery.courier'),
    _Module('Xarita', Icons.map, 8, 'delivery.courier'),
  ],
};

/// Rejim bo'yicha bosh ekran. 1-bosqichda modullar ro'yxati va bosqich belgisi ko'rsatiladi;
/// har bir bosqichda tegishli ekran shu yerga ulanadi.
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionProvider);
    final device = session.device!;
    final user = session.user!;
    final modeKey = device.mode == DeviceMode.hub ? DeviceMode.pos : device.mode;
    final modules = _modules[modeKey]!.where((m) => m.permission == null || user.can(m.permission!)).toList();
    final isKds = device.mode == DeviceMode.kds;

    return CallbackShortcuts(
      bindings: {
        const SingleActivator(LogicalKeyboardKey.f12): () => ref.read(sessionProvider.notifier).lock(),
      },
      child: Focus(
        autofocus: true,
        child: Theme(
          data: isKds ? AppTheme.dark().copyWith(scaffoldBackgroundColor: AppColors.kdsBackground) : Theme.of(context),
          child: Scaffold(
            appBar: AppBar(
              title: Text('${ref.tr(device.mode.labelKey)}${device.mode == DeviceMode.hub ? ' (hub)' : ''} · '
                  '${device.branch.name}'),
              actions: [
                const NetStatusChip(),
                const SizedBox(width: 12),
                Center(child: Text('${user.fullName} · ${user.roleName ?? ''}')),
                const SizedBox(width: 8),
                IconButton(
                  tooltip: '${ref.tr('lock')} (F12)',
                  iconSize: 28,
                  onPressed: () => ref.read(sessionProvider.notifier).lock(),
                  icon: const Icon(Icons.lock),
                ),
                const SizedBox(width: 8),
              ],
            ),
            body: Padding(
              padding: const EdgeInsets.all(20),
              child: GridView.builder(
                gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                    maxCrossAxisExtent: 260, mainAxisExtent: 160, crossAxisSpacing: 16, mainAxisSpacing: 16),
                itemCount: modules.length,
                itemBuilder: (_, i) => _ModuleTile(module: modules[i]),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ModuleTile extends StatelessWidget {
  const _ModuleTile({required this.module});
  final _Module module;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("${module.title}: ${module.stage}-bosqichda ishga tushadi")),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Icon(module.icon, size: 40, color: scheme.primary),
            const Spacer(),
            Text(module.title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 4),
            Text('${module.stage}-bosqich', style: Theme.of(context).textTheme.bodySmall),
          ]),
        ),
      ),
    );
  }
}
