import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/theme/tokens.dart';

const _fitnessLevels = {'BEGINNER': 'Başlangıç', 'INTERMEDIATE': 'Orta', 'ADVANCED': 'İleri'};
const _branches = {
  'fitness': 'Fitness', 'yoga-mobility': 'Yoga & Mobility', 'pilates': 'Pilates',
  'hiit-cardio': 'HIIT & Kardiyo', 'nutrition': 'Beslenme', 'meditation': 'Meditasyon',
  'boxing-kickboxing': 'Boks', 'running': 'Koşu', 'dance': 'Dans',
};
const _workModes = {'ONLINE': 'Online', 'IN_PERSON': 'Yüz yüze', 'HYBRID': 'Hibrit'};
const _expTr = {'beginner': 'Başlangıç', 'intermediate': 'Orta', 'advanced': 'İleri'};

class AiMatchingPage extends ConsumerStatefulWidget {
  const AiMatchingPage({super.key});
  @override
  ConsumerState<AiMatchingPage> createState() => _AiMatchingPageState();
}

class _AiMatchingPageState extends ConsumerState<AiMatchingPage> {
  final _goalCtrl = TextEditingController();
  final _noteCtrl = TextEditingController();
  final List<String> _goals = [];
  String? _fitnessLevel;
  final Set<String> _selectedBranches = {};
  String? _workMode;
  bool _loading = false;
  String? _error;
  Map<String, dynamic>? _result;

  @override
  void dispose() {
    _goalCtrl.dispose();
    _noteCtrl.dispose();
    super.dispose();
  }

  void _addGoal() {
    final g = _goalCtrl.text.trim();
    if (g.isEmpty || _goals.contains(g)) return;
    setState(() { _goals.add(g); _goalCtrl.clear(); });
  }

  Future<void> _match() async {
    if (_goals.isEmpty) { setState(() => _error = 'En az bir hedef ekleyin.'); return; }
    setState(() { _loading = true; _error = null; _result = null; });
    try {
      final res = await ref.read(apiClientProvider).post('/ai/matching/coach', {
        'goals': _goals,
        if (_fitnessLevel != null) 'fitnessLevel': _fitnessLevel,
        if (_selectedBranches.isNotEmpty) 'branchPreferences': _selectedBranches.toList(),
        if (_workMode != null) 'preferredWorkMode': _workMode,
        if (_noteCtrl.text.trim().isNotEmpty) 'additionalContext': _noteCtrl.text.trim(),
      });
      if (mounted) setState(() { _result = (res as Map<String, dynamic>)['result'] as Map<String, dynamic>?; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('AI Koç Eşleştirme')),
      body: _result != null ? _buildResult() : _buildForm(),
    );
  }

  Widget _buildForm() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Hedeflerinizi ve tercihlerinizi girerek size en uygun koç profilini yapay zeka ile bulun.', style: TextStyle(color: Colors.grey, fontSize: 13)),
          const SizedBox(height: 20),

          // Hedefler
          _SectionLabel('Hedefleriniz *'),
          Row(children: [
            Expanded(child: TextField(
              controller: _goalCtrl,
              decoration: const InputDecoration(hintText: 'Örn: 10 kg kilo vermek…', border: OutlineInputBorder()),
              onSubmitted: (_) => _addGoal(),
            )),
            const SizedBox(width: 8),
            ElevatedButton(onPressed: _addGoal, child: const Text('Ekle')),
          ]),
          const SizedBox(height: 8),
          Wrap(spacing: 6, runSpacing: 6, children: _goals.map((g) => Chip(
            label: Text(g),
            onDeleted: () => setState(() => _goals.remove(g)),
            backgroundColor: MettloColors.primary,
            labelStyle: const TextStyle(color: Colors.white, fontSize: 12),
            deleteIconColor: Colors.white70,
          )).toList()),
          const SizedBox(height: 16),

          // Fitness seviyesi
          _SectionLabel('Fitness Seviyeniz'),
          Wrap(spacing: 8, children: _fitnessLevels.entries.map((e) => _Chip(
            label: e.value,
            active: _fitnessLevel == e.key,
            onTap: () => setState(() => _fitnessLevel = _fitnessLevel == e.key ? null : e.key),
          )).toList()),
          const SizedBox(height: 16),

          // Branşlar
          _SectionLabel('Branş Tercihleri'),
          Wrap(spacing: 6, runSpacing: 6, children: _branches.entries.map((e) => _Chip(
            label: e.value,
            active: _selectedBranches.contains(e.key),
            onTap: () => setState(() => _selectedBranches.contains(e.key) ? _selectedBranches.remove(e.key) : _selectedBranches.add(e.key)),
          )).toList()),
          const SizedBox(height: 16),

          // Çalışma şekli
          _SectionLabel('Çalışma Şekli'),
          Wrap(spacing: 8, children: _workModes.entries.map((e) => _Chip(
            label: e.value,
            active: _workMode == e.key,
            onTap: () => setState(() => _workMode = _workMode == e.key ? null : e.key),
          )).toList()),
          const SizedBox(height: 16),

          // Ek bilgi
          _SectionLabel('Ek Bilgi'),
          TextField(
            controller: _noteCtrl,
            maxLines: 3,
            decoration: const InputDecoration(hintText: 'Sağlık durumunuz, bütçeniz vb…', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 20),

          if (_error != null) Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 13)),
          ),

          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _loading ? null : _match,
              icon: const Icon(Icons.auto_awesome),
              label: Text(_loading ? 'Yapay zeka analiz ediyor…' : 'AI ile Koç Eşleştir'),
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildResult() {
    final profile = _result?['idealCoachProfile'] as Map<String, dynamic>?;
    final keywords = (_result?['searchKeywords'] as List?)?.cast<String>() ?? [];
    final qualities = (profile?['keyQualities'] as List?)?.cast<String>() ?? [];
    final recBranches = (profile?['recommendedBranches'] as List?)?.cast<String>() ?? [];
    final reasoning = _result?['reasoning'] as String?;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            const Icon(Icons.auto_awesome, color: MettloColors.primary),
            const SizedBox(width: 8),
            const Text('Size Özel Koç Profili', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
          ]),
          const SizedBox(height: 16),

          if (profile?['experienceLevel'] != null) ...[
            const _SectionLabel('Deneyim Seviyesi'),
            Chip(label: Text(_expTr[profile!['experienceLevel']] ?? profile['experienceLevel'] as String), backgroundColor: MettloColors.primary, labelStyle: const TextStyle(color: Colors.white)),
            const SizedBox(height: 12),
          ],

          if (profile?['coachingStyle'] != null) ...[
            const _SectionLabel('Koçluk Stili'),
            Text(profile!['coachingStyle'] as String, style: const TextStyle(fontSize: 14)),
            const SizedBox(height: 12),
          ],

          if (qualities.isNotEmpty) ...[
            const _SectionLabel('Temel Özellikler'),
            Wrap(spacing: 6, runSpacing: 6, children: qualities.map((q) => Chip(label: Text(q, style: const TextStyle(fontSize: 12)), materialTapTargetSize: MaterialTapTargetSize.shrinkWrap)).toList()),
            const SizedBox(height: 12),
          ],

          if (recBranches.isNotEmpty) ...[
            const _SectionLabel('Önerilen Branşlar'),
            Wrap(spacing: 6, runSpacing: 6, children: recBranches.map((b) => Chip(label: Text(b, style: const TextStyle(fontSize: 12, color: Colors.white)), backgroundColor: MettloColors.primary, materialTapTargetSize: MaterialTapTargetSize.shrinkWrap)).toList()),
            const SizedBox(height: 12),
          ],

          if (reasoning != null) ...[
            const _SectionLabel('AI Analizi'),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
              child: Text(reasoning, style: const TextStyle(fontSize: 13, height: 1.6)),
            ),
            const SizedBox(height: 16),
          ],

          if (keywords.isNotEmpty) ...[
            const Text('Arama önerileri:', style: TextStyle(fontSize: 13, color: Colors.grey)),
            const SizedBox(height: 6),
            Wrap(spacing: 6, runSpacing: 6, children: keywords.map((kw) => ActionChip(label: Text(kw, style: const TextStyle(fontSize: 12)), onPressed: () {}, avatar: const Icon(Icons.search, size: 14))).toList()),
            const SizedBox(height: 20),
          ],

          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () => setState(() => _result = null),
              child: const Text('Yeniden Ara'),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);
  final String text;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Text(text, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
  );
}

class _Chip extends StatelessWidget {
  const _Chip({required this.label, required this.active, required this.onTap});
  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: BoxDecoration(
            color: active ? MettloColors.primary : Colors.grey.shade200,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(label, style: TextStyle(fontSize: 12, color: active ? Colors.white : Colors.black87)),
        ),
      );
}
