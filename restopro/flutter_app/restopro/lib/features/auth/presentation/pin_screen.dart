import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/l10n.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/utils/money.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/pin_pad.dart';
import '../../../core/widgets/status_chip.dart';
import '../application/session_controller.dart';
import '../data/auth_repository.dart';
import '../domain/models.dart';

final pinUsersProvider = FutureProvider.autoDispose<List<PinUser>>(
  (ref) => ref.watch(authRepositoryProvider).pinUsers(),
);

/// Bloklangan qurilma ekrani: xodim tanlanadi (ixtiyoriy) va 4 xonali PIN kiritiladi.
/// Boshqaruv rejimida — telefon + parol.
class PinScreen extends ConsumerStatefulWidget {
  const PinScreen({super.key});

  @override
  ConsumerState<PinScreen> createState() => _PinScreenState();
}

class _PinScreenState extends ConsumerState<PinScreen> {
  PinUser? _selected;
  String? _error;
  bool _busy = false;

  Future<void> _submitPin(String pin) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(sessionProvider.notifier).pinLogin(pin, userId: _selected?.id);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionProvider);
    final device = session.device!;
    if (device.mode.usesPasswordLogin) return const _PasswordLock();
    final users = ref.watch(pinUsersProvider);
    final now = DateTime.now();

    return Scaffold(
      appBar: AppBar(
        title: Text('${ref.tr(device.mode.labelKey)} · ${device.branch.name} · ${device.code}'),
        actions: [
          const NetStatusChip(),
          const SizedBox(width: 8),
          PopupMenuButton<String>(
            onSelected: (v) {
              if (v == 'unlink') _confirmUnlink();
            },
            itemBuilder: (_) => [PopupMenuItem(value: 'unlink', child: Text(ref.trRead('logout_device')))],
          ),
        ],
      ),
      body: Row(children: [
        Expanded(
          flex: 3,
          child: users.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Text(e.toString()),
                const SizedBox(height: 12),
                OutlinedButton(onPressed: () => ref.invalidate(pinUsersProvider), child: Text(ref.tr('retry'))),
              ]),
            ),
            data: (list) => Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(ref.tr('choose_user'), style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 12),
                Expanded(
                  child: GridView.builder(
                    gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                        maxCrossAxisExtent: 180, mainAxisExtent: 130, crossAxisSpacing: 12, mainAxisSpacing: 12),
                    itemCount: list.length,
                    itemBuilder: (_, i) => _UserTile(
                      user: list[i],
                      selected: _selected?.id == list[i].id,
                      onTap: () => setState(() {
                        _selected = _selected?.id == list[i].id ? null : list[i];
                        _error = null;
                      }),
                    ),
                  ),
                ),
              ]),
            ),
          ),
        ),
        const VerticalDivider(width: 1),
        Expanded(
          flex: 2,
          child: Center(
            child: SingleChildScrollView(
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Text(AppDate.dateTime(now), style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                Text(_selected?.fullName ?? ref.tr('enter_pin'), style: Theme.of(context).textTheme.headlineSmall),
                if (session.licenseExpired) ...[
                  const SizedBox(height: 12),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 24),
                    child: ErrorBanner("Offline litsenziya muddati tugadi. Qurilmani internetga ulang."),
                  ),
                ],
                const SizedBox(height: 24),
                PinPad(onCompleted: _submitPin, enabled: !_busy && !session.licenseExpired, error: _error),
              ]),
            ),
          ),
        ),
      ]),
    );
  }

  Future<void> _confirmUnlink() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: Text(ref.trRead('logout_device')),
        content: const Text("Qurilma tizimdan uziladi. Qayta ulash uchun ega yoki menejer paroli kerak bo'ladi."),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Bekor')),
          FilledButton(onPressed: () => Navigator.pop(c, true), child: const Text('Uzish')),
        ],
      ),
    );
    if (ok == true) await ref.read(sessionProvider.notifier).unlinkDevice();
  }
}

class _UserTile extends StatelessWidget {
  const _UserTile({required this.user, required this.selected, required this.onTap});
  final PinUser user;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Material(
      color: selected ? scheme.primaryContainer : scheme.surfaceContainerHighest,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            CircleAvatar(radius: 26, child: Text(user.initials, style: const TextStyle(fontSize: 18))),
            const SizedBox(height: 8),
            Text(user.fullName, maxLines: 1, overflow: TextOverflow.ellipsis, textAlign: TextAlign.center),
            Text(user.role ?? '', style: Theme.of(context).textTheme.bodySmall),
          ]),
        ),
      ),
    );
  }
}

class _PasswordLock extends ConsumerStatefulWidget {
  const _PasswordLock();

  @override
  ConsumerState<_PasswordLock> createState() => _PasswordLockState();
}

class _PasswordLockState extends ConsumerState<_PasswordLock> {
  final _phone = TextEditingController(text: '+998');
  final _password = TextEditingController();
  String? _error;
  bool _busy = false;

  Future<void> _login() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(sessionProvider.notifier).passwordLogin(_phone.text, _password.text);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              Text(ref.tr('mode_manager'), style: Theme.of(context).textTheme.headlineSmall, textAlign: TextAlign.center),
              const SizedBox(height: 24),
              TextField(controller: _phone, decoration: InputDecoration(labelText: ref.tr('phone'))),
              const SizedBox(height: 12),
              TextField(
                controller: _password,
                obscureText: true,
                decoration: InputDecoration(labelText: ref.tr('password')),
                onSubmitted: (_) => _login(),
              ),
              const SizedBox(height: 16),
              if (_error != null) ...[ErrorBanner(_error!), const SizedBox(height: 16)],
              FilledButton(onPressed: _busy ? null : _login, child: Text(ref.tr('login'))),
            ]),
          ),
        ),
      ),
    );
  }
}
