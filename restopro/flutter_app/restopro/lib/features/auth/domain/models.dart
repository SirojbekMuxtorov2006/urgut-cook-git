import '../../../app/device_mode.dart';

class BranchRef {
  const BranchRef({required this.id, required this.name, required this.code});
  final String id;
  final String name;
  final String code;

  factory BranchRef.fromJson(Map<String, dynamic> j) =>
      BranchRef(id: j['id'].toString(), name: j['name'] as String, code: (j['code'] ?? '') as String);

  Map<String, dynamic> toJson() => {'id': id, 'name': name, 'code': code};
}

class AppUser {
  const AppUser({
    required this.id,
    required this.fullName,
    required this.roleCode,
    required this.roleName,
    required this.permissions,
    required this.branches,
    this.companyName,
    this.discountLimit = '0',
  });

  final String id;
  final String fullName;
  final String? roleCode;
  final String? roleName;
  final Set<String> permissions;
  final List<BranchRef> branches;
  final String? companyName;
  final String discountLimit;

  bool can(String perm) => permissions.contains(perm);

  factory AppUser.fromJson(Map<String, dynamic> j) {
    final role = j['role'] as Map<String, dynamic>?;
    final company = j['company'] as Map<String, dynamic>?;
    return AppUser(
      id: j['id'].toString(),
      fullName: (j['full_name'] ?? '') as String,
      roleCode: role?['code'] as String?,
      roleName: role?['name'] as String?,
      discountLimit: (role?['discount_limit_percent'] ?? '0').toString(),
      permissions: ((j['permissions'] ?? const []) as List).map((e) => e.toString()).toSet(),
      branches: ((j['branches'] ?? const []) as List)
          .map((e) => BranchRef.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList(),
      companyName: company?['name'] as String?,
    );
  }
}

class DeviceInfo {
  const DeviceInfo({required this.id, required this.code, required this.mode, required this.branch});

  final String id;
  final String code;
  final DeviceMode mode;
  final BranchRef branch;

  factory DeviceInfo.fromJson(Map<String, dynamic> j) => DeviceInfo(
        id: (j['device_id'] ?? j['id']).toString(),
        code: (j['device_code'] ?? j['code']) as String,
        mode: DeviceMode.fromCode(j['mode'] as String),
        branch: BranchRef.fromJson(Map<String, dynamic>.from(j['branch'] as Map)),
      );

  Map<String, dynamic> toJson() => {'device_id': id, 'device_code': code, 'mode': mode.code, 'branch': branch.toJson()};
}

class PinUser {
  const PinUser({required this.id, required this.fullName, this.role, this.roleCode});
  final String id;
  final String fullName;
  final String? role;
  final String? roleCode;

  factory PinUser.fromJson(Map<String, dynamic> j) => PinUser(
        id: j['id'].toString(),
        fullName: j['full_name'] as String,
        role: j['role'] as String?,
        roleCode: j['role_code'] as String?,
      );

  String get initials {
    final parts = fullName.trim().split(RegExp(r'\s+'));
    return parts.take(2).map((p) => p.isEmpty ? '' : p[0].toUpperCase()).join();
  }
}
