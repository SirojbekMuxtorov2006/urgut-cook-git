import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:restopro/core/db/database.dart';

void main() {
  late AppDatabase db;

  setUp(() => db = AppDatabase(NativeDatabase.memory()));
  tearDown(() => db.close());

  test('outbox: takror ID qo\'shilmaydi, sent bo\'lganlar navbatdan chiqadi', () async {
    await db.enqueue(id: 'a', entity: 'order', entityId: 'o1', op: 'create', payload: '{}');
    await db.enqueue(id: 'a', entity: 'order', entityId: 'o1', op: 'create', payload: '{}');
    await db.enqueue(id: 'b', entity: 'payment', entityId: 'p1', op: 'append', payload: '{}');
    expect((await db.pendingBatch()).map((e) => e.id), ['a', 'b']);

    await db.markSent(['a']);
    await db.markFailed('b', 'timeout');
    final pending = await db.pendingBatch();
    expect(pending.single.id, 'b');
    expect(pending.single.attempts, 1);
    expect(await db.watchPendingCount().first, 1);
  });

  test('sozlamalar', () async {
    await db.setSetting('printer', '192.168.1.50');
    await db.setSetting('printer', '192.168.1.51');
    expect(await db.getSetting('printer'), '192.168.1.51');
  });
}
