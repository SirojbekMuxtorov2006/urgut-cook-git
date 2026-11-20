import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../db/database.dart';
import 'api_client.dart';

/// Holat indikatori: 🟢 Online / 🟡 Sinxron (N ta) / 🔴 Internet yo'q (hub ishlayapti) / ⚫ Mustaqil rejim.
enum NetStatus { online, syncing, offlineHub, standalone }

class NetState {
  const NetState(this.status, {this.pending = 0});
  final NetStatus status;
  final int pending;
}

final netStatusProvider = StreamProvider<NetState>((ref) async* {
  final api = ref.watch(apiClientProvider);
  final db = ref.watch(databaseProvider);
  final connectivity = Connectivity();

  var pending = 0;
  var serverReachable = false;
  final controller = StreamController<NetState>();

  NetState compute() {
    if (serverReachable) return NetState(pending > 0 ? NetStatus.syncing : NetStatus.online, pending: pending);
    // Lokal hub 4-bosqichda ulanadi; hozircha internetsiz holat — mustaqil rejim.
    return NetState(NetStatus.standalone, pending: pending);
  }

  Future<void> check() async {
    final url = api.baseUrl;
    serverReachable = url != null && await api.ping(url);
    controller.add(compute());
  }

  final subs = <StreamSubscription<dynamic>>[
    connectivity.onConnectivityChanged.listen((_) => check()),
    db.watchPendingCount().listen((n) {
      pending = n;
      controller.add(compute());
    }),
  ];
  final timer = Timer.periodic(const Duration(seconds: 20), (_) => check());
  ref.onDispose(() {
    timer.cancel();
    for (final s in subs) {
      s.cancel();
    }
    controller.close();
  });
  unawaited(check());
  yield* controller.stream;
});
