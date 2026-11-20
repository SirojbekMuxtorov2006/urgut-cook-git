import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/application/session_controller.dart';
import '../features/auth/presentation/device_setup_screen.dart';
import '../features/auth/presentation/pin_screen.dart';
import '../features/auth/presentation/server_setup_screen.dart';
import '../features/home/presentation/home_screen.dart';

class Routes {
  static const splash = '/';
  static const server = '/setup/server';
  static const device = '/setup/device';
  static const pin = '/pin';
  static const home = '/home';
}

/// Sessiya holati o'zgarganda router redirect'ni qayta hisoblaydi.
class _SessionListenable extends ChangeNotifier {
  _SessionListenable(Ref ref) {
    ref.listen<SessionState>(sessionProvider, (_, __) => notifyListeners());
  }
}

final routerProvider = Provider<GoRouter>((ref) {
  final refresh = _SessionListenable(ref);
  ref.onDispose(refresh.dispose);
  return GoRouter(
    initialLocation: Routes.splash,
    refreshListenable: refresh,
    redirect: (context, state) {
      final s = ref.read(sessionProvider);
      final target = switch (s.stage) {
        SessionStage.loading => Routes.splash,
        SessionStage.needsServer => Routes.server,
        SessionStage.needsDevice => Routes.device,
        SessionStage.locked => Routes.pin,
        SessionStage.active => Routes.home,
      };
      return state.matchedLocation == target ? null : target;
    },
    routes: [
      GoRoute(
        path: Routes.splash,
        builder: (_, __) => const Scaffold(body: Center(child: CircularProgressIndicator())),
      ),
      GoRoute(path: Routes.server, builder: (_, __) => const ServerSetupScreen()),
      GoRoute(path: Routes.device, builder: (_, __) => const DeviceSetupScreen()),
      GoRoute(path: Routes.pin, builder: (_, __) => const PinScreen()),
      GoRoute(path: Routes.home, builder: (_, __) => const HomeScreen()),
    ],
  );
});
