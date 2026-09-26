import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../auth/auth_controller.dart';

class BadgeCounts {
  const BadgeCounts({this.unreadMessages = 0, this.unreadNotifications = 0});
  final int unreadMessages;
  final int unreadNotifications;

  factory BadgeCounts.fromJson(Map<String, dynamic> j) => BadgeCounts(
        unreadMessages: (j['unreadMessages'] as int?) ?? 0,
        unreadNotifications: (j['unreadNotifications'] as int?) ?? 0,
      );
}

class BadgeCountsNotifier extends AutoDisposeAsyncNotifier<BadgeCounts> {
  Timer? _timer;

  @override
  Future<BadgeCounts> build() async {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 30), (_) => _refresh());
    ref.onDispose(() => _timer?.cancel());
    return _fetch();
  }

  Future<BadgeCounts> _fetch() async {
    try {
      final data = await ref.read(apiClientProvider).get('/me/badge-counts') as Map<String, dynamic>;
      return BadgeCounts.fromJson(data);
    } catch (_) {
      return const BadgeCounts();
    }
  }

  Future<void> _refresh() async {
    state = await AsyncValue.guard(() => _fetch());
  }
}

final badgeCountsProvider = AsyncNotifierProvider.autoDispose<BadgeCountsNotifier, BadgeCounts>(BadgeCountsNotifier.new);
