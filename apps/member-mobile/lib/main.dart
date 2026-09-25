import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'core/presence/presence.dart';
import 'core/router/app_router.dart';
import 'core/theme/theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('tr');
  runApp(const ProviderScope(child: MettloApp()));
}

class MettloApp extends ConsumerWidget {
  const MettloApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      title: 'Mettlo',
      debugShowCheckedModeBanner: false,
      theme: buildMettloTheme(),
      darkTheme: buildMettloTheme(),
      themeMode: ThemeMode.dark, // ana marka modu DARK
      locale: const Locale('tr'),
      supportedLocales: const [Locale('tr'), Locale('en')],
      localizationsDelegates: const [GlobalMaterialLocalizations.delegate, GlobalWidgetsLocalizations.delegate, GlobalCupertinoLocalizations.delegate],
      routerConfig: ref.watch(routerProvider),
      builder: (context, child) => PresenceKeeper(child: child ?? const SizedBox.shrink()),
    );
  }
}
