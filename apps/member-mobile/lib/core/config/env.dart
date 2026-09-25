/// Derleme zamanı: flutter run --dart-define=API_URL=https://mettlo.tr/api
/// Sır burada tutulmaz; sadece herkese açık adresler.
class Env {
  Env._();
  static const apiUrl = String.fromEnvironment('API_URL', defaultValue: 'https://mettlo.tr/api');
  static const apiVersion = 'v1';
  static const siteUrl = String.fromEnvironment('SITE_URL', defaultValue: 'https://mettlo.tr');
  static String get apiBase => '$apiUrl/$apiVersion';
}
