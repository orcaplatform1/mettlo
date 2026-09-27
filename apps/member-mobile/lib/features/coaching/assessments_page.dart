import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/common.dart';

final assessmentTemplatesProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final res = await ref.watch(apiClientProvider).get('/coaching/assessments');
  return (res as List?) ?? [];
});

class AssessmentsPage extends ConsumerWidget {
  const AssessmentsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(assessmentTemplatesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Değerlendirme Formları')),
      body: data.when(
        loading: () => const Center(child: CircularProgressIndicator(color: MettloColors.primary)),
        error: (e, _) => Center(child: Padding(padding: const EdgeInsets.all(24), child: InfoBanner(e is ApiException ? e.message : 'Formlar yüklenemedi.', error: true))),
        data: (items) {
          if (items.isEmpty) {
            return const Center(
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.assignment_outlined, size: 52, color: MettloColors.textMuted),
                SizedBox(height: 16),
                Text('Henüz form şablonu yok', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
                SizedBox(height: 8),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 40),
                  child: Text('Müşterilerinize gönderebileceğiniz değerlendirme formları web panelinden oluşturun.', style: TextStyle(color: MettloColors.textSecondary, height: 1.5), textAlign: TextAlign.center),
                ),
              ]),
            );
          }
          return RefreshIndicator(
            color: MettloColors.primary,
            onRefresh: () async => ref.invalidate(assessmentTemplatesProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (_, _) => const SizedBox(height: 10),
              itemBuilder: (_, i) => _TemplateCard(items[i] as Map<String, dynamic>),
            ),
          );
        },
      ),
    );
  }
}

class _TemplateCard extends StatelessWidget {
  const _TemplateCard(this.template);
  final Map<String, dynamic> template;

  @override
  Widget build(BuildContext context) {
    final title = template['title'] as String? ?? '';
    final desc = template['description'] as String?;
    final isRecurring = template['isRecurring'] == true;
    final questions = template['questions'] as List? ?? [];
    final createdAt = DateTime.tryParse(template['createdAt'] as String? ?? '')?.toLocal();
    final dateFmt = createdAt != null ? '${createdAt.day.toString().padLeft(2, '0')}.${createdAt.month.toString().padLeft(2, '0')}.${createdAt.year}' : '';

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      decoration: BoxDecoration(
        color: MettloColors.surface1,
        borderRadius: BorderRadius.circular(MettloRadius.card),
        border: Border.all(color: MettloColors.borderSubtle),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15.5)),
        if (desc != null && desc.isNotEmpty) ...[
          const SizedBox(height: 4),
          Text(desc, style: const TextStyle(color: MettloColors.textSecondary, fontSize: 13.5, height: 1.4)),
        ],
        const SizedBox(height: 10),
        Row(children: [
          _Chip('${questions.length} soru'),
          const SizedBox(width: 8),
          if (isRecurring) _Chip('Periyodik', color: const Color(0xFF3b82f6)),
          const Spacer(),
          Text(dateFmt, style: const TextStyle(color: MettloColors.textMuted, fontSize: 12)),
        ]),
      ]),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip(this.label, {this.color});
  final String label;
  final Color? color;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
        decoration: BoxDecoration(
          color: (color ?? MettloColors.textMuted).withValues(alpha: .12),
          borderRadius: BorderRadius.circular(MettloRadius.pill),
        ),
        child: Text(label, style: TextStyle(color: color ?? MettloColors.textSecondary, fontSize: 11.5, fontWeight: FontWeight.w600)),
      );
}
