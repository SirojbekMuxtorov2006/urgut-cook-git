import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/l10n.dart';
import '../../../core/network/api_client.dart';
import '../../../core/widgets/error_view.dart';
import '../application/session_controller.dart';

class ServerSetupScreen extends ConsumerStatefulWidget {
  const ServerSetupScreen({super.key});

  @override
  ConsumerState<ServerSetupScreen> createState() => _ServerSetupScreenState();
}

class _ServerSetupScreenState extends ConsumerState<ServerSetupScreen> {
  final _url = TextEditingController(text: 'http://localhost:8000');
  bool _busy = false;
  String? _error;

  Future<void> _submit() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    final ok = await ref.read(apiClientProvider).ping(_url.text);
    if (!mounted) return;
    if (!ok) {
      setState(() {
        _busy = false;
        _error = 'Server javob bermadi. Manzilni va internetni tekshiring.';
      });
      return;
    }
    await ref.read(sessionProvider.notifier).setServer(_url.text);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              Icon(Icons.restaurant, size: 64, color: Theme.of(context).colorScheme.primary),
              const SizedBox(height: 12),
              Text('RestoPro', textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 4),
              Text(ref.tr('server_setup'), textAlign: TextAlign.center),
              const SizedBox(height: 24),
              TextField(
                controller: _url,
                keyboardType: TextInputType.url,
                decoration: InputDecoration(labelText: ref.tr('server_url'), prefixIcon: const Icon(Icons.cloud)),
                onSubmitted: (_) => _submit(),
              ),
              const SizedBox(height: 16),
              if (_error != null) ...[ErrorBanner(_error!), const SizedBox(height: 16)],
              FilledButton(
                onPressed: _busy ? null : _submit,
                child: _busy ? const CircularProgressIndicator() : Text(ref.tr('continue')),
              ),
            ]),
          ),
        ),
      ),
    );
  }
}
