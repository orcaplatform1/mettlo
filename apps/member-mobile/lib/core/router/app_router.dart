import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/admin/moderation_page.dart';
import '../../features/coaching/subscriber_history_page.dart';
import '../../features/coaching/clients_page.dart';
import '../../features/coaching/client_workspace_page.dart';
import '../../features/auth/login_page.dart';
import '../../features/auth/register_page.dart';
import '../../features/bookings/bookings_page.dart';
import '../../features/challenges/challenges_page.dart';
import '../../features/discover/coach_profile_page.dart';
import '../../features/discover/discover_page.dart';
import '../../features/health/health_page.dart';
import '../../features/home/home_page.dart';
import '../../features/messages/messages_page.dart';
import '../../features/notifications/notifications_page.dart';
import '../../features/programs/program_content_page.dart';
import '../../features/programs/programs_page.dart';
import '../../features/settings/settings_page.dart';
import '../../features/sports/boxing_page.dart';
import '../../features/sports/nutrition_page.dart';
import '../../features/sports/practice_log_page.dart';
import '../../features/sports/running_page.dart';
import '../../features/support/support_pages.dart';
import '../auth/auth_controller.dart';
import '../theme/tokens.dart';

/// Oturum durumuna göre yönlendirme: girişsiz → /login, girişli → /home.
final routerProvider = Provider<GoRouter>((ref) {
  final refresh = ValueNotifier<int>(0);
  ref.listen(authControllerProvider, (_, _) => refresh.value++);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: refresh,
    redirect: (context, state) {
      final status = ref.read(authControllerProvider).status;
      final loc = state.matchedLocation;
      final isAuthPage = loc == '/login' || loc == '/register';
      if (status == AuthStatus.unknown) return loc == '/splash' ? null : '/splash';
      if (status == AuthStatus.signedOut) return isAuthPage ? null : '/login';
      if (isAuthPage || loc == '/splash') return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, _) => const _Splash()),
      GoRoute(path: '/login', builder: (_, _) => const LoginPage()),
      GoRoute(path: '/register', builder: (_, _) => const RegisterPage()),
      ShellRoute(
        builder: (context, state, child) => _Shell(location: state.matchedLocation, child: child),
        routes: [
          GoRoute(path: '/home', builder: (_, _) => const HomePage()),
          GoRoute(path: '/discover', builder: (_, _) => const DiscoverPage()),
          GoRoute(path: '/programs', builder: (_, _) => const ProgramsPage()),
          GoRoute(path: '/messages', builder: (_, _) => const MessagesPage()),
          GoRoute(path: '/settings', builder: (_, _) => const SettingsPage()),
        ],
      ),
      GoRoute(path: '/coach/:username', builder: (_, s) => CoachProfilePage(username: s.pathParameters['username']!)),
      GoRoute(path: '/program/:slug', builder: (_, s) => ProgramContentPage(slug: s.pathParameters['slug']!)),
      GoRoute(path: '/messages/:id', builder: (_, s) => ThreadPage(id: s.pathParameters['id']!)),
      GoRoute(path: '/support', builder: (_, _) => const SupportListPage()),
      GoRoute(path: '/support/new', builder: (_, _) => const NewTicketPage()),
      GoRoute(path: '/support/:id', builder: (_, s) => TicketPage(id: s.pathParameters['id']!)),
      GoRoute(path: '/health', builder: (_, _) => const HealthPage()),
      GoRoute(path: '/notifications', builder: (_, _) => const NotificationsPage()),
      GoRoute(path: '/bookings', builder: (_, _) => const BookingsPage()),
      GoRoute(path: '/challenges', builder: (_, _) => const ChallengesPage()),
      GoRoute(path: '/challenges/:slug', builder: (_, s) => ChallengeDetailPage(slug: s.pathParameters['slug']!)),
      GoRoute(path: '/sports/running', builder: (_, _) => const RunningPage()),
      GoRoute(path: '/sports/boxing', builder: (_, _) => const BoxingPage()),
      GoRoute(path: '/sports/nutrition', builder: (_, _) => const NutritionPage()),
      GoRoute(path: '/sports/yoga', builder: (_, _) => const PracticeLogPage(branch: 'yoga-mobility', title: 'Yoga & Esneklik Günlüğü')),
      GoRoute(path: '/sports/meditation', builder: (_, _) => const PracticeLogPage(branch: 'meditation-mindfulness', title: 'Meditasyon Günlüğü')),
      GoRoute(path: '/sports/hiit', builder: (_, _) => const PracticeLogPage(branch: 'hiit-cardio', title: 'HIIT & Kardiyo Günlüğü')),
      GoRoute(path: '/sports/dance', builder: (_, _) => const PracticeLogPage(branch: 'dance-aerobics', title: 'Dans & Aerobik Günlüğü')),
      GoRoute(path: '/sports/pilates', builder: (_, _) => const PracticeLogPage(branch: 'pilates-core', title: 'Pilates & Core Günlüğü')),
      GoRoute(path: '/moderation', builder: (_, _) => const ModerationPage()),
      GoRoute(path: '/subscribers', builder: (_, _) => const SubscriberHistoryPage()),
      GoRoute(path: '/coaching/clients', builder: (_, _) => const ClientsPage()),
      GoRoute(path: '/coaching/clients/:memberId', builder: (_, s) => ClientWorkspacePage(memberId: s.pathParameters['memberId']!)),
    ],
  );
});

class _Splash extends StatelessWidget {
  const _Splash();
  @override
  Widget build(BuildContext context) => Scaffold(
        body: Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Image.asset('assets/images/logo.png', width: 88),
            const SizedBox(height: 16),
            const Text('METTLO', style: TextStyle(letterSpacing: 6, fontWeight: FontWeight.w800, fontSize: 22)),
            const SizedBox(height: 24),
            const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: MettloColors.primary)),
          ]),
        ),
      );
}

class _Shell extends StatelessWidget {
  const _Shell({required this.location, required this.child});
  final String location;
  final Widget child;

  static const _tabs = [
    ('/home', 'Ana Sayfa', Icons.home_outlined, Icons.home),
    ('/discover', 'Keşfet', Icons.explore_outlined, Icons.explore),
    ('/programs', 'Programlarım', Icons.fitness_center_outlined, Icons.fitness_center),
    ('/messages', 'Mesajlar', Icons.chat_bubble_outline, Icons.chat_bubble),
    ('/settings', 'Profil', Icons.person_outline, Icons.person),
  ];

  @override
  Widget build(BuildContext context) {
    final idx = _tabs.indexWhere((t) => location.startsWith(t.$1));
    return Scaffold(
      body: SafeArea(bottom: false, child: child),
      bottomNavigationBar: NavigationBar(
        selectedIndex: idx < 0 ? 0 : idx,
        onDestinationSelected: (i) => context.go(_tabs[i].$1),
        destinations: [for (final t in _tabs) NavigationDestination(icon: Icon(t.$3), selectedIcon: Icon(t.$4, color: MettloColors.primary), label: t.$2)],
      ),
    );
  }
}
