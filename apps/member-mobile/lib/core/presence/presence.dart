import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../auth/auth_controller.dart';

/// Giriş yapmış kullanıcı için 45 sn'de bir çevrimiçi nabzı gönderir (uygulama açık/ön plandayken).
class PresenceKeeper extends ConsumerStatefulWidget {
  const PresenceKeeper({super.key, required this.child});
  final Widget child;
  @override
  ConsumerState<PresenceKeeper> createState() => _PresenceKeeperState();
}

class _PresenceKeeperState extends ConsumerState<PresenceKeeper> with WidgetsBindingObserver {
  Timer? _timer;
  bool _foreground = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _timer = Timer.periodic(const Duration(seconds: 45), (_) => _ping());
    _ping();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    _foreground = state == AppLifecycleState.resumed;
    if (_foreground) _ping();
  }

  Future<void> _ping() async {
    if (!_foreground || ref.read(authControllerProvider).status != AuthStatus.signedIn) return;
    try {
      await ref.read(apiClientProvider).post('/presence/ping');
    } catch (_) {/* nabız kaybolabilir */}
  }

  @override
  void dispose() {
    _timer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => widget.child;
}

/// Kullanıcının çevrimiçi (yeşil) / çevrimdışı (kırmızı) durumu. Gizliyse veya bilinmiyorsa hiçbir şey çizmez.
final presenceStatusProvider = FutureProvider.autoDispose.family<String?, String>((ref, username) async {
  final timer = Timer(const Duration(seconds: 30), ref.invalidateSelf);
  ref.onDispose(timer.cancel);
  final res = await ref.watch(apiClientProvider).get('/presence/status', query: {'usernames': username});
  return (res as Map?)?[username] as String?;
});

class OnlineDot extends ConsumerWidget {
  const OnlineDot(this.username, {super.key, this.label = false});
  final String username;
  final bool label;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status = ref.watch(presenceStatusProvider(username)).value;
    if (status == null) return const SizedBox.shrink();
    final on = status == 'online';
    final color = on ? const Color(0xFF22C55E) : const Color(0xFFEF4444);
    return Row(mainAxisSize: MainAxisSize.min, children: [
      Container(width: 10, height: 10, decoration: BoxDecoration(color: color, shape: BoxShape.circle, boxShadow: [BoxShadow(color: color.withValues(alpha: .25), spreadRadius: 3)])),
      if (label) ...[const SizedBox(width: 6), Text(on ? 'Çevrimiçi' : 'Çevrimdışı', style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600))],
    ]);
  }
}
