import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/device_mode.dart';
import '../../../app/l10n.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/widgets/error_view.dart';
import '../application/session_controller.dart';
import '../data/auth_repository.dart';
import '../domain/models.dart';

/// Qurilmani ulash: 1) ega/menejer kiradi  2) filial va rejim tanlanadi  3) ro'yxatdan o'tadi.
class DeviceSetupScreen extends ConsumerStatefulWidget {
  const DeviceSetupScreen({super.key});

  @override
  ConsumerState<DeviceSetupScreen> createState() => _DeviceSetupScreenState();
}

class _DeviceSetupScreenState extends ConsumerState<DeviceSetupScreen> {
  final _phone = TextEditingController(text: '+998');
  final _password = TextEditingController();
  final _name = TextEditingController();

  AuthResult? _auth;
  BranchRef? _branch;
  DeviceMode _mode = DeviceMode.pos;
  bool _isHub = true;
  bool _isBackupHub = false;
  bool _busy = false;
  String? _error;

  Future<void> _run(Future<void> Function() action) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await action();
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _login() => _run(() async {
        final auth = await ref.read(authRepositoryProvider).passwordLogin(_phone.text, _password.text);
        if (!auth.user.can('device.manage')) {
          throw ApiException("Qurilmani faqat ega yoki menejer ulay oladi");
        }
        if (auth.user.branches.isEmpty) throw ApiException('Sizga biriktirilgan filial yo\'q');
        setState(() {
          _auth = auth;
          _branch = auth.user.branches.first;
        });
      });

  Future<void> _register() => _run(() async {
        final mode = _mode == DeviceMode.pos && _isHub ? DeviceMode.hub : _mode;
        await ref.read(sessionProvider.notifier).registerDevice(
              ownerAuth: _auth!,
              branch: _branch!,
              mode: mode,
              name: _name.text.trim(),
              isBackupHub: _mode == DeviceMode.pos && !_isHub && _isBackupHub,
            );
      });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(ref.tr('device_setup')),
        actions: [
          TextButton.icon(
            onPressed: () => ref.read(sessionProvider.notifier).setServerPrompt(),
            icon: const Icon(Icons.cloud),
            label: Text(ref.watch(sessionProvider).serverUrl ?? ''),
          ),
        ],
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 640),
            child: _auth == null ? _loginForm() : _deviceForm(),
          ),
        ),
      ),
    );
  }

  Widget _loginForm() => Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Text(ref.tr('owner_login_hint'), style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 20),
        TextField(
          controller: _phone,
          keyboardType: TextInputType.phone,
          decoration: InputDecoration(labelText: ref.tr('phone'), prefixIcon: const Icon(Icons.phone)),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _password,
          obscureText: true,
          decoration: InputDecoration(labelText: ref.tr('password'), prefixIcon: const Icon(Icons.lock)),
          onSubmitted: (_) => _login(),
        ),
        const SizedBox(height: 16),
        if (_error != null) ...[ErrorBanner(_error!), const SizedBox(height: 16)],
        FilledButton(onPressed: _busy ? null : _login, child: Text(ref.tr('login'))),
      ]);

  Widget _deviceForm() {
    final branches = _auth!.user.branches;
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Text('${_auth!.user.companyName ?? ''} · ${_auth!.user.fullName}', style: Theme.of(context).textTheme.titleMedium),
      const SizedBox(height: 20),
      DropdownButtonFormField<String>(
        value: _branch?.id,
        decoration: InputDecoration(labelText: ref.tr('branch')),
        items: branches.map((b) => DropdownMenuItem(value: b.id, child: Text(b.name))).toList(),
        onChanged: (id) => setState(() => _branch = branches.firstWhere((b) => b.id == id)),
      ),
      const SizedBox(height: 20),
      Text(ref.tr('device_mode'), style: Theme.of(context).textTheme.titleMedium),
      const SizedBox(height: 12),
      Wrap(
        spacing: 12,
        runSpacing: 12,
        children: DeviceMode.selectable.map((m) {
          final selected = m == _mode;
          return SizedBox(
            width: 150,
            height: 110,
            child: selected
                ? FilledButton(onPressed: () {}, child: _modeLabel(m))
                : OutlinedButton(onPressed: () => setState(() => _mode = m), child: _modeLabel(m)),
          );
        }).toList(),
      ),
      if (_mode == DeviceMode.pos) ...[
        const SizedBox(height: 12),
        SwitchListTile(
          value: _isHub,
          onChanged: (v) => setState(() => _isHub = v),
          title: Text(ref.tr('is_hub')),
          subtitle: const Text("Restorandagi boshqa qurilmalar internetsiz shu kassa orqali ishlaydi"),
        ),
        if (!_isHub)
          SwitchListTile(
            value: _isBackupHub,
            onChanged: (v) => setState(() => _isBackupHub = v),
            title: Text(ref.tr('is_backup_hub')),
            subtitle: const Text("Asosiy kassa o'chsa, hub vazifasini oladi"),
          ),
      ],
      const SizedBox(height: 12),
      TextField(
        controller: _name,
        decoration: InputDecoration(labelText: ref.tr('device_name'), hintText: 'Masalan: Kassa 1, Bar planshet'),
      ),
      const SizedBox(height: 16),
      if (_error != null) ...[ErrorBanner(_error!), const SizedBox(height: 16)],
      FilledButton.icon(
        onPressed: _busy || _branch == null ? null : _register,
        icon: const Icon(Icons.check),
        label: Text(ref.tr('register_device')),
      ),
    ]);
  }

  Widget _modeLabel(DeviceMode m) => Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(m.icon, size: 36),
        const SizedBox(height: 8),
        Text(ref.tr(m.labelKey)),
      ]);
}
