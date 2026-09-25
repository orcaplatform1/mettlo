import 'package:flutter/material.dart';

/// Sunrise Vitality tasarım token'ları (docs/design/mettlo-design-system.txt).
/// Yeni renk/font/radius üretme; hepsi buradan gelir.
class MettloColors {
  MettloColors._();

  static const primary = Color(0xFFF97316);
  static const primaryHover = Color(0xFFEA580C);
  static const primaryPressed = Color(0xFFC2410C);
  static const secondary = Color(0xFFFB7185);
  static const accent = Color(0xFFEC4899);
  static const highlight = Color(0xFFFDE047);

  static const bg = Color(0xFF0B1220);
  static const surface1 = Color(0xFF111827);
  static const surface2 = Color(0xFF1F2937);
  static const surface3 = Color(0xFF374151);

  static const textPrimary = Color(0xFFF9FAFB);
  static const textSecondary = Color(0xB8F9FAFB); // %72
  static const textTertiary = Color(0x80F9FAFB); // %50
  static const textMuted = Color(0xFF6B7280);

  /// İSTİSNA: yalnızca doğrulama rozeti (marka rengi değildir)
  static const verified = Color(0xFF0095F6);

  static const success = Color(0xFF34D399);
  static const warning = Color(0xFFFDE047);
  static const error = Color(0xFFF87171);

  static const borderSubtle = Color(0x14FFFFFF); // %8
  static const borderHover = Color(0x59F97316); // %35

  static const gradientSunrise = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primary, secondary, accent],
    stops: [0.0, 0.55, 1.0],
  );
  static const gradientSunriseHorizontal = LinearGradient(
    colors: [primary, secondary, accent],
    stops: [0.0, 0.5, 1.0],
  );
  /// Sadece oyunlaştırma (XP, streak, rozet)
  static const gradientGoldenMorning = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primary, highlight],
  );
}

class MettloRadius {
  MettloRadius._();
  static const double sm = 8, md = 12, lg = 16, xl = 20, xxl = 24, card = 20, hero = 28;
  static const double pill = 9999;
}

/// 4px taban grid
class MettloSpace {
  MettloSpace._();
  static const double s4 = 4, s8 = 8, s12 = 12, s16 = 16, s20 = 20, s24 = 24, s32 = 32, s40 = 40, s48 = 48, s56 = 56, s64 = 64;
}

class MettloMotion {
  MettloMotion._();
  static const fast = Duration(milliseconds: 150);
  static const normal = Duration(milliseconds: 180);
  static const slow = Duration(milliseconds: 300);
  static const curve = Cubic(0.22, 1, 0.36, 1);
}
