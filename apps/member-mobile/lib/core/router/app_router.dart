import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'badge_counts_provider.dart';

import '../../features/admin/moderation_page.dart';
import '../../features/advertising/advertising_page.dart';
import '../../features/coaching/alerts_page.dart';
import '../../features/coaching/assessments_page.dart';
import '../../features/community/community_page.dart';
import '../../features/community/community_detail_page.dart';
import '../../features/earnings/bank_account_page.dart';
import '../../features/jobs/job_applications_page.dart';
import '../../features/live/live_sessions_page.dart';
import '../../features/business/business_checkin_page.dart';
import '../../features/earnings/earnings_page.dart';
import '../../features/ai/ai_matching_page.dart';
import '../../features/events/events_page.dart';
import '../../features/events/my_events_page.dart';
import '../../features/food/food_menu_page.dart';
import '../../features/jobs/jobs_page.dart';
import '../../features/business/business_list_page.dart';
import '../../features/business/business_profile_page.dart';
import '../../features/business/coach_workplace_page.dart';
import '../../features/coaching/subscriber_history_page.dart';
import '../../features/coaching/clients_page.dart';
import '../../features/coaching/client_workspace_page.dart';
import '../../features/video_sessions/video_sessions_page.dart';
import '../../features/auth/login_page.dart';
import '../../features/auth/register_page.dart';
import '../../features/bookings/bookings_page.dart';
import '../../features/challenges/challenges_page.dart';
import '../../features/discover/coach_profile_page.dart';
import '../../features/discover/discover_page.dart';
import '../../features/discover/member_profile_page.dart';
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
import '../../features/store/store_page.dart';
import '../../features/support/support_pages.dart';
import '../auth/auth_controller.dart';
import '../theme/tokens.dart';
import '../widgets/hamburger_menu.dart';

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
          GoRoute(path: '/notifications', builder: (_, _) => const NotificationsPage()),
          GoRoute(path: '/settings', builder: (_, _) => const SettingsPage()),
        ],
      ),
      GoRoute(path: '/coach/:username', builder: (_, s) => CoachProfilePage(username: s.pathParameters['username']!)),
      GoRoute(path: '/profile/:username', builder: (_, s) => MemberProfilePage(username: s.pathParameters['username']!)),
      GoRoute(path: '/program/:slug', builder: (_, s) => ProgramContentPage(slug: s.pathParameters['slug']!)),
      GoRoute(path: '/messages/:id', builder: (_, s) => ThreadPage(id: s.pathParameters['id']!)),
      GoRoute(path: '/support', builder: (_, _) => const SupportListPage()),
      GoRoute(path: '/support/new', builder: (_, _) => const NewTicketPage()),
      GoRoute(path: '/support/:id', builder: (_, s) => TicketPage(id: s.pathParameters['id']!)),
      GoRoute(path: '/health', builder: (_, _) => const HealthPage()),
      GoRoute(path: '/bookings', builder: (_, _) => const BookingsPage()),
      GoRoute(path: '/my-events', builder: (_, _) => const MyEventsPage()),
      GoRoute(path: '/challenges', builder: (_, _) => const ChallengesPage()),
      // /notifications artık ShellRoute içinde (bottom nav)

      GoRoute(path: '/challenges/:slug', builder: (_, s) => ChallengeDetailPage(slug: s.pathParameters['slug']!)),
      GoRoute(path: '/sports/running', builder: (_, _) => const RunningPage()),
      GoRoute(path: '/sports/boxing', builder: (_, _) => const BoxingPage()),
      GoRoute(path: '/sports/nutrition', builder: (_, _) => const NutritionPage()),
      GoRoute(path: '/sports/yoga', builder: (_, _) => const PracticeLogPage(branch: 'yoga-mobility', title: 'Yoga & Esneklik Günlüğü')),
      GoRoute(path: '/sports/meditation', builder: (_, _) => const PracticeLogPage(branch: 'meditation-mindfulness', title: 'Meditasyon Günlüğü')),
      GoRoute(path: '/sports/hiit', builder: (_, _) => const PracticeLogPage(branch: 'hiit-cardio', title: 'HIIT & Kardiyo Günlüğü')),
      GoRoute(path: '/sports/dance', builder: (_, _) => const PracticeLogPage(branch: 'dance-aerobics', title: 'Dans & Aerobik Günlüğü')),
      GoRoute(path: '/sports/pilates', builder: (_, _) => const PracticeLogPage(branch: 'pilates-core', title: 'Pilates & Core Günlüğü')),
      GoRoute(path: '/business', builder: (_, s) => BusinessListPage(initialCategory: s.uri.queryParameters['category'] ?? '')),
      GoRoute(path: '/restaurants', builder: (_, _) => const BusinessListPage(initialCategory: 'HEALTHY_FOOD')),
      GoRoute(path: '/business/checkin', builder: (_, _) => const BusinessCheckInPage()),
      GoRoute(path: '/business/:slug', builder: (_, s) => BusinessProfilePage(slug: s.pathParameters['slug']!)),
      GoRoute(path: '/coach/workplaces', builder: (_, _) => const CoachWorkplacePage()),
      GoRoute(path: '/moderation', builder: (_, _) => const ModerationPage()),
      GoRoute(path: '/subscribers', builder: (_, _) => const SubscriberHistoryPage()),
      GoRoute(path: '/coaching/clients', builder: (_, _) => const ClientsPage()),
      GoRoute(path: '/coaching/clients/:memberId', builder: (_, s) => ClientWorkspacePage(memberId: s.pathParameters['memberId']!)),
      GoRoute(path: '/video-sessions', builder: (_, _) => const VideoSessionsPage()),
      GoRoute(path: '/earnings', builder: (_, _) => const EarningsPage()),
      GoRoute(path: '/events', builder: (_, _) => const EventsPage()),
      GoRoute(path: '/jobs', builder: (_, _) => const JobsPage()),
      GoRoute(path: '/business/:slug/menu', builder: (_, s) => FoodMenuPage(businessId: s.pathParameters['slug']!, businessName: 'Menü')),
      GoRoute(path: '/ai/matching', builder: (_, _) => const AiMatchingPage()),
      GoRoute(path: '/advertising', builder: (_, _) => const AdvertisingPage()),
      GoRoute(path: '/advertising/new', builder: (_, s) => NewAdPage(businessId: s.uri.queryParameters['businessId'])),
      GoRoute(path: '/community', builder: (_, _) => const CommunityPage()),
      GoRoute(path: '/community/:slug', builder: (_, s) => CommunityDetailPage(slug: s.pathParameters['slug']!)),
      GoRoute(path: '/live', builder: (_, _) => const LiveSessionsPublicPage()),
      GoRoute(path: '/store', builder: (_, _) => const StorePage()),
      GoRoute(path: '/alerts', builder: (_, _) => const AlertsPage()),
      GoRoute(path: '/assessments', builder: (_, _) => const AssessmentsPage()),
      GoRoute(path: '/earnings/bank-account', builder: (_, _) => const BankAccountPage()),
      GoRoute(path: '/job-applications', builder: (_, _) => const JobApplicationsPage()),
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

// Alt nav sekmeleri: (path, ikonAsset veya null=profil)
const _kNavTabs = [
  ('/home',     'assets/icons/nav_home.svg'),
  ('/discover', 'assets/icons/nav_discover.svg'),
  ('/programs', 'assets/icons/nav_programs.svg'),
  ('/messages', 'assets/icons/nav_messages.svg'),
  ('/settings', null), // profil fotoğrafı
];

class _Shell extends ConsumerWidget {
  const _Shell({required this.location, required this.child});
  final String location;
  final Widget child;

  Widget _svgIcon(String asset, bool active) => SvgPicture.asset(
        asset,
        width: 26,
        height: 26,
        colorFilter: active
            ? null
            : const ColorFilter.mode(Color(0xFF5A5A6E), BlendMode.srcIn),
      );

  Widget _profileIcon(String? avatarUrl, String name, bool active) {
    final avatar = avatarUrl != null && avatarUrl.isNotEmpty
        ? CircleAvatar(backgroundImage: NetworkImage(avatarUrl), radius: 14)
        : CircleAvatar(
            radius: 14,
            backgroundColor: const Color(0xFF2A2A3F),
            child: Text(name.isNotEmpty ? name[0].toUpperCase() : '?',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white)),
          );
    if (!active) return Opacity(opacity: 0.45, child: avatar);
    return Container(
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: const Color(0xFFFF5A3D), width: 2),
      ),
      child: Padding(padding: const EdgeInsets.all(1.5), child: avatar),
    );
  }

  Widget _withDot(Widget icon, bool hasDot) {
    if (!hasDot) return icon;
    return Stack(clipBehavior: Clip.none, children: [
      icon,
      Positioned(
        right: -2,
        top: -2,
        child: Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: const Color(0xFFFF2F68),
            shape: BoxShape.circle,
            border: Border.all(color: const Color(0xFF0F1628), width: 1.5),
          ),
        ),
      ),
    ]);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final idx = _kNavTabs.indexWhere((t) => location.startsWith(t.$1));
    final activeIdx = idx < 0 ? 0 : idx;
    final counts = ref.watch(badgeCountsProvider).value ?? const BadgeCounts();
    final user = ref.watch(authControllerProvider).user;
    final avatarUrl = user?.avatarUrl;
    final userName = user?.name ?? '';

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        titleSpacing: 16,
        title: Row(mainAxisSize: MainAxisSize.min, children: [
          Image.asset('assets/images/logo.png', height: 28),
          const SizedBox(width: 8),
          ShaderMask(
            shaderCallback: (b) => MettloColors.gradientSunrise.createShader(b),
            child: const Text('METTLO', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, letterSpacing: 3, color: Colors.white)),
          ),
        ]),
        actions: [
          Builder(
            builder: (ctx) => Padding(
              padding: const EdgeInsets.only(right: 12),
              child: GestureDetector(
                onTap: () => showHamburgerMenu(ctx),
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: MettloColors.surface2,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.menu, color: MettloColors.textPrimary, size: 20),
                ),
              ),
            ),
          ),
        ],
      ),
      body: child,
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Color(0xFF0A0A15),
          border: Border(top: BorderSide(color: Color(0xFF1E1E2E), width: 1)),
        ),
        child: SafeArea(
          child: SizedBox(
            height: 58,
            child: Row(
              children: List.generate(_kNavTabs.length, (i) {
                final (path, asset) = _kNavTabs[i];
                final active = i == activeIdx;
                final hasMsg = path == '/messages' && counts.unreadMessages > 0;
                Widget icon;
                if (asset == null) {
                  icon = _profileIcon(avatarUrl, userName, active);
                } else {
                  icon = _svgIcon(asset, active);
                }
                return Expanded(
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () => context.go(path),
                    child: Center(child: _withDot(icon, hasMsg)),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}

