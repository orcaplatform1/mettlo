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
    scaffoldBackgroundColor: Colors.transparent,
    colorScheme: const ColorScheme.dark(
      primary: MettloColors.primary,
      onPrimary: Colors.white,
      secondary: MettloColors.secondary,
      onSecondary: Colors.white,
      tertiary: MettloColors.accent,
      surface: MettloColors.surface1,
      onSurface: MettloColors.textPrimary,
      surfaceTint: Colors.transparent, // Material 3 tint kapalı
      error: MettloColors.error,
      onError: Colors.white,
      outline: MettloColors.borderSubtle,
      shadow: Colors.black,
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
    appBarTheme: const AppBarTheme(
      backgroundColor: MettloColors.bg,
      foregroundColor: MettloColors.textPrimary,
      elevation: 0,
      scrolledUnderElevation: 0,
      surfaceTintColor: Colors.transparent,
      titleTextStyle: TextStyle(color: MettloColors.textPrimary, fontSize: 17, fontWeight: FontWeight.w700),
      iconTheme: IconThemeData(color: MettloColors.textPrimary),
    ),
    cardTheme: CardThemeData(
      color: MettloColors.surface1,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(MettloRadius.card),
        side: const BorderSide(color: MettloColors.borderSubtle),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: MettloColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        shadowColor: Colors.transparent,
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(MettloRadius.md)),
        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: MettloColors.primary,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(MettloRadius.md)),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: MettloColors.textPrimary,
        side: const BorderSide(color: MettloColors.borderSubtle),
        backgroundColor: Color(0x0FFFFFFF), // rgba(255,255,255,.06)
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(MettloRadius.md)),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(foregroundColor: MettloColors.primary),
    ),
    dividerTheme: const DividerThemeData(color: MettloColors.borderSubtle, space: 1, thickness: 1),
    dialogTheme: DialogThemeData(
      backgroundColor: MettloColors.surface1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(MettloRadius.xxl)),
    ),
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: MettloColors.surface1,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(MettloRadius.xxl)),
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
        borderSide: const BorderSide(color: MettloColors.primary, width: 1.5),
      ),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: const Color(0x0AFFFFFF),
      side: const BorderSide(color: MettloColors.borderSubtle),
      labelStyle: const TextStyle(color: MettloColors.textSecondary, fontSize: 13),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(MettloRadius.pill)),
    ),
    navigationBarTheme: NavigationBarThemeData(
      height: 72,
      backgroundColor: const Color(0xEB0B1220),
      surfaceTintColor: Colors.transparent,
      shadowColor: Colors.transparent,
      indicatorColor: Colors.transparent,
      iconTheme: WidgetStateProperty.resolveWith((s) => IconThemeData(
            color: s.contains(WidgetState.selected) ? MettloColors.primary : MettloColors.textMuted,
            size: 22,
          )),
      labelTextStyle: WidgetStateProperty.resolveWith((s) => TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: s.contains(WidgetState.selected) ? MettloColors.secondary : MettloColors.textMuted,
          )),
    ),
    listTileTheme: const ListTileThemeData(
      tileColor: Colors.transparent,
      textColor: MettloColors.textPrimary,
      iconColor: MettloColors.textSecondary,
    ),
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? Colors.white : MettloColors.textMuted),
      trackColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? MettloColors.primary : MettloColors.surface3),
    ),
  );
}
