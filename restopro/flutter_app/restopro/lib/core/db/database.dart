import 'package:drift/drift.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'connection.dart';

part 'database.g.dart';

/// Sinxronlash navbati (outbox): offline yozuvlar shu yerda kutadi va bulutga push qilinadi.
/// Append-only: yozuv faqat qo'shiladi; yuborilgandan keyin status o'zgaradi.
class SyncOutbox extends Table {
  TextColumn get id => text()(); // UUID v7 — serverda idempotentlik kaliti
  TextColumn get entity => text()(); // masalan: order, order_item, payment
  TextColumn get entityId => text()();
  TextColumn get op => text()(); // create | update | append
  TextColumn get payload => text()(); // JSON
  IntColumn get attempts => integer().withDefault(const Constant(0))();
  TextColumn get status => text().withDefault(const Constant('pending'))(); // pending | sent | failed
  TextColumn get lastError => text().nullable()();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get sentAt => dateTime().nullable()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

/// PIN ekranida offline ko'rsatish uchun xodimlar keshi (PIN o'zi saqlanmaydi).
class CachedStaff extends Table {
  TextColumn get id => text()();
  TextColumn get fullName => text()();
  TextColumn get role => text().nullable()();
  TextColumn get roleCode => text().nullable()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

/// Kalit-qiymat sozlamalar (oxirgi sinxron vaqti, printer sozlamalari va h.k.).
class LocalSettings extends Table {
  TextColumn get key => text()();
  TextColumn get value => text()();

  @override
  Set<Column<Object>> get primaryKey => {key};
}

@DriftDatabase(tables: [SyncOutbox, CachedStaff, LocalSettings])
class AppDatabase extends _$AppDatabase {
  AppDatabase([QueryExecutor? executor]) : super(executor ?? openConnection());

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) => m.createAll(),
        beforeOpen: (details) async {
          // WAL: elektr o'chsa ham oxirgi tranzaksiya saqlanib qoladi; o'qish yozishni bloklamaydi.
          await customStatement('PRAGMA journal_mode=WAL');
          await customStatement('PRAGMA synchronous=FULL');
          await customStatement('PRAGMA foreign_keys=ON');
        },
      );

  // ---------- Outbox ----------
  Future<void> enqueue({
    required String id,
    required String entity,
    required String entityId,
    required String op,
    required String payload,
  }) =>
      into(syncOutbox).insert(
        SyncOutboxCompanion.insert(
          id: id,
          entity: entity,
          entityId: entityId,
          op: op,
          payload: payload,
          createdAt: DateTime.now().toUtc(),
        ),
        mode: InsertMode.insertOrIgnore, // bir xil ID ikki marta qo'shilmaydi
      );

  Future<List<SyncOutboxData>> pendingBatch([int limit = 200]) => (select(syncOutbox)
        ..where((t) => t.status.isIn(['pending', 'failed']))
        ..orderBy([(t) => OrderingTerm.asc(t.createdAt), (t) => OrderingTerm.asc(t.id)])
        ..limit(limit))
      .get();

  Stream<int> watchPendingCount() {
    final count = syncOutbox.id.count();
    final q = selectOnly(syncOutbox)
      ..addColumns([count])
      ..where(syncOutbox.status.isIn(['pending', 'failed']));
    return q.map((r) => r.read(count) ?? 0).watchSingle();
  }

  Future<void> markSent(List<String> ids) => (update(syncOutbox)..where((t) => t.id.isIn(ids)))
      .write(SyncOutboxCompanion(status: const Value('sent'), sentAt: Value(DateTime.now().toUtc())));

  Future<void> markFailed(String id, String error) => customUpdate(
        'UPDATE sync_outbox SET status = ?, attempts = attempts + 1, last_error = ? WHERE id = ?',
        variables: [Variable.withString('failed'), Variable.withString(error), Variable.withString(id)],
        updates: {syncOutbox},
      );

  // ---------- Xodimlar keshi ----------
  Future<void> replaceStaff(List<CachedStaffCompanion> rows) => transaction(() async {
        await delete(cachedStaff).go();
        await batch((b) => b.insertAll(cachedStaff, rows));
      });

  Future<List<CachedStaffData>> staff() =>
      (select(cachedStaff)..orderBy([(t) => OrderingTerm.asc(t.fullName)])).get();

  // ---------- Sozlamalar ----------
  Future<String?> getSetting(String key) async =>
      (await (select(localSettings)..where((t) => t.key.equals(key))).getSingleOrNull())?.value;

  Future<void> setSetting(String key, String value) =>
      into(localSettings).insertOnConflictUpdate(LocalSettingsCompanion.insert(key: key, value: value));
}

final databaseProvider = Provider<AppDatabase>((ref) {
  final db = AppDatabase();
  ref.onDispose(db.close);
  return db;
});
