# Mettlo Mobile (Flutter / Dart)

iOS + Android tek kod tabanı. Tasarım: `docs/design/mettlo-design-system.txt` (token'lar: `lib/core/theme/tokens.dart`).
Durum: `flutter analyze` temiz, `flutter test` geçiyor. **Bu makinede cihazda/emülatörde çalıştırılmadı** — ilk çalıştırmada görsel kontrol gerekir.

## Çalıştırma
    cd apps/member-mobile
    flutter pub get
    flutter run --dart-define=API_URL=https://mettlo.tr/api       # SITE_URL de tanımlanabilir

- iOS derlemesi macOS + Xcode gerektirir (Linux VPS'te yapılamaz).
- Android sürüm derlemesi için imzalama anahtarı (`android/key.properties`) gerekir; git'e girmez.

## Neler var
Giriş (KULLANICI ADI + göz ikonlu şifre 6–20, 2FA kodu), kayıt (kullanıcı adı, e-posta @, telefon +90 + 10 rakam, doğum tarihi 18+),
ana sayfa (XP/seviye/seri, abonelikler), koç keşfi ve koç profili (mavi rozet, kıdem rozeti, istatistikler, hakkında,
neden beni seçmelisiniz, planlar, ders takvimi + rezervasyon, değerlendirmeler — yorum/yıldız/mesaj yalnızca abonelere),
programlarım + içerik + antrenman kaydı, mesajlar, destek merkezi (bilet: açık/yanıtlandı/kapatıldı/48 sa zaman aşımı),
sağlık girişi, ayarlar (gizlilik, sağlık paylaşımı rızası, hesap silme, çıkış).

## Bilerek sonraya bırakılanlar (harici yapılandırma gerekir)
- Push bildirimi (Firebase: `google-services.json` / `GoogleService-Info.plist`), Apple Health / Health Connect otomatik senkronu (`health` paketi + izin metinleri),
  canlı ders (LiveKit), uygulama içi satın alma (Apple/Google), abonelik ödemesi (şimdilik web'e yönlendirir), koç içerik üretimi (web panelinde).
- Uygulama ikonu / açılış ekranı üretimi (`assets/images/app_icon.png` hazır).

## Güvenlik
Token'lar Keychain/Keystore'da (`flutter_secure_storage`). Refresh token döndürme ve tekrar kullanım tespiti sunucudadır.
