import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../network/api_client.dart';

@pragma('vm:entry-point')
Future<void> _bgHandler(RemoteMessage message) async {}

class FcmService {
  static Future<void> init(Ref ref) async {
    final messaging = FirebaseMessaging.instance;

    await messaging.requestPermission(alert: true, badge: true, sound: true);

    FirebaseMessaging.onBackgroundMessage(_bgHandler);

    final token = await messaging.getToken();
    if (token != null) await _registerToken(ref, token);

    messaging.onTokenRefresh.listen((t) => _registerToken(ref, t));
  }

  static Future<void> _registerToken(Ref ref, String token) async {
    try {
      await ref.read(apiClientProvider).post('/me/fcm-token', body: {'token': token});
    } catch (_) {}
  }
}
