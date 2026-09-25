import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'tokens.dart';

/// Mettlo ana marka modu DARK'tır.
ThemeData buildMettloTheme() {
  final base = ThemeData(brightness: Brightness.dark, useMaterial3: true);
  final text = GoogleFonts.interTextTheme(base.textTheme).apply(
    bodyColor: MettloColors.textPrimary,
    displayColor: MettloColors.textPrimary,
  );

  return base.copyWith(
    scaffoldBackgroundColor: MettloColors.bg,
    colorScheme: const ColorScheme.dark(
      primary: MettloColors.primary,
      secondary: MettloColors.secondary,
      tertiary: MettloColors.accent,
      surface: MettloColors.surface1,
      error: MettloColors.error,
      onPrimary: Colors.white,
      onSurface: MettloColors.textPrimary,
    ),
    textTheme: text.copyWith(
      // Mobil ölçek: Display 38/44, H1 32/40, H2 26/34, H3 22/30, Body 15/23
      displayLarge: text.displayLarge?.copyWith(fontSize: 38, height: 44 / 38, fontWeight: FontWeight.w800),
      headlineLarge: text.headlineLarge?.copyWith(fontSize: 32, height: 40 / 32, fontWeight: FontWeight.w700),
      headlineMedium: text.headlineMedium?.copyWith(fontSize: 26, height: 34 / 26, fontWeight: FontWeight.w700),
      headlineSmall: text.headlineSmall?.copyWith(fontSize: 22, height: 30 / 22, fontWeight: FontWeight.w700),
      bodyLarge: text.bodyLarge?.copyWith(fontSize: 15, height: 23 / 15),
      bodyMedium: text.bodyMedium?.copyWith(fontSize: 15, height: 23 / 15),
      bodySmall: text.bodySmall?.copyWith(fontSize: 12, height: 18 / 12),
    ),
    cardTheme: CardThemeData(
      color: MettloColors.surface1,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(MettloRadius.card),
        side: const BorderSide(color: MettloColors.borderSubtle),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: MettloColors.surface1,
      hintStyle: const TextStyle(color: MettloColors.textMuted),
      contentPadding: const EdgeInsets.symmetric(horizontal: MettloSpace.s16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(MettloRadius.md),
        borderSide: const BorderSide(color: MettloColors.borderSubtle),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(MettloRadius.md),
        borderSide: const BorderSide(color: MettloColors.borderSubtle),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(MettloRadius.md),
        borderSide: const BorderSide(color: MettloColors.primary),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      height: 72,
      backgroundColor: const Color(0xEB0B1220), // rgba(11,18,32,.92)
      indicatorColor: Colors.transparent,
      iconTheme: WidgetStateProperty.resolveWith((s) => IconThemeData(
            color: s.contains(WidgetState.selected) ? MettloColors.primary : MettloColors.textMuted,
          )),
      labelTextStyle: WidgetStateProperty.resolveWith((s) => TextStyle(
            fontSize: 12,
            color: s.contains(WidgetState.selected) ? MettloColors.secondary : MettloColors.textMuted,
          )),
    ),
  );
}
