import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/topic.dart';
import '../main.dart';

/// 서베이 설정 화면 (FR-001~004)
/// 10개 주제 카드 그리드 표시, 3~5개 선택/저장/로드
class SurveyScreen extends StatefulWidget {
  const SurveyScreen({super.key});

  @override
  State<SurveyScreen> createState() => _SurveyScreenState();
}

class _SurveyScreenState extends State<SurveyScreen> {
  List<Topic> _topics = [];
  Set<int> _selectedIds = {};
  bool _loading = true;
  String? _error;
  Map<String, dynamic>? _recommendations;
  List<Map<String, dynamic>> _tips = [];

  @override
  void initState() {
    super.initState();
    _loadTopics();
  }

  /// 서버에서 주제 목록 로드
  Future<void> _loadTopics() async {
    setState(() { _loading = true; _error = null; });
    try {
      final results = await Future.wait([
        ApiService.get('/topics'),
        ApiService.get('/topics/recommendations').catchError((_) => null),
        ApiService.get('/topics/tips').catchError((_) => {'tips': []}),
      ]);
      final topics = (results[0] as List).map((j) => Topic.fromJson(j)).toList();
      setState(() {
        _topics = topics;
        _selectedIds = topics.where((t) => t.isSelected).map((t) => t.id).toSet();
        _recommendations = results[1] as Map<String, dynamic>?;
        final tipsData = results[2];
        if (tipsData is Map<String, dynamic> && tipsData['tips'] != null) {
          _tips = List<Map<String, dynamic>>.from(tipsData['tips']);
        }
        _loading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  /// 주제 선택/해제 토글
  void _toggleTopic(int id) {
    setState(() {
      if (_selectedIds.contains(id)) {
        _selectedIds.remove(id);
      } else {
        if (_selectedIds.length >= 5) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('최대 5개까지 선택할 수 있습니다'),
              backgroundColor: Color(0xFFFBBF24),
            ),
          );
          return;
        }
        _selectedIds.add(id);
      }
    });
  }

  /// 선택 저장
  Future<void> _saveSelection() async {
    try {
      await ApiService.put('/topics/selection', {
        'selected_ids': _selectedIds.toList(),
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('주제 선택이 저장되었습니다'),
            backgroundColor: Theme.of(context).extension<AppColors>()!.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('저장에 실패했습니다: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('📡', style: TextStyle(fontSize: 48)),
            const SizedBox(height: 12),
            Text('주제 목록을 불러올 수 없습니다', style: theme.textTheme.bodyMedium),
            const SizedBox(height: 8),
            ElevatedButton(onPressed: _loadTopics, child: const Text('다시 시도')),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 헤더
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('서베이 주제 선택', style: theme.textTheme.titleLarge),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: theme.colorScheme.primary.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  '${_selectedIds.length}/5개 선택',
                  style: TextStyle(
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'OPIc 시험에 출제되는 주제 중 관심 있는 3~5개를 선택하세요.',
            style: theme.textTheme.labelMedium,
          ),
          const SizedBox(height: 16),

          // 주제 카드 그리드
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _topics.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 1.3,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
            ),
            itemBuilder: (context, index) {
              final topic = _topics[index];
              final isSelected = _selectedIds.contains(topic.id);
              return _TopicCard(
                topic: topic,
                isSelected: isSelected,
                onTap: () => _toggleTopic(topic.id),
              );
            },
          ),

          // 안내 메시지
          if (_selectedIds.length < 3)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Text(
                '${3 - _selectedIds.length}개 더 선택해주세요 (최소 3개)',
                style: TextStyle(color: theme.extension<AppColors>()!.warning, fontSize: 13),
                textAlign: TextAlign.center,
              ),
            ),
          if (_selectedIds.length >= 5)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Text(
                '최대 선택 개수에 도달했습니다',
                style: theme.textTheme.bodySmall,
                textAlign: TextAlign.center,
              ),
            ),

          // 저장 버튼
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _selectedIds.length >= 3 ? _saveSelection : null,
              child: const Text('선택 저장'),
            ),
          ),

          // 서베이 추천 & 꼼팁
          if (_recommendations != null || _tips.isNotEmpty)
            _buildTipsSection(theme),

          const SizedBox(height: 20),
        ],
      ),
    );
  }

  /// 서베이 추천 & 꼼팁 섹션
  Widget _buildTipsSection(ThemeData theme) {
    final colors = theme.extension<AppColors>()!;
    final targetLevel = _recommendations?['target_level'] ?? '';
    final recommended = _recommendations?['recommended'] as List<dynamic>? ?? [];
    final levelTips = _recommendations?['level_tips'] as List<dynamic>? ?? [];

    // 팁을 유형별로 분류
    final strategies = _tips.where((t) => t['tip_type'] == 'strategy').toList();
    final warnings = _tips.where((t) => t['tip_type'] == 'warning').toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 28),
        Divider(color: theme.colorScheme.outline.withValues(alpha: 0.3)),
        const SizedBox(height: 16),

        // AI 추천 조합
        if (recommended.isNotEmpty) ...[
          Text('🤖 AI 추천 서베이 조합', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [const Color(0xFFEFF6FF), const Color(0xFFDBEAFE)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF93C5FD)),
            ),
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (targetLevel.isNotEmpty)
                  Text('목표 레벨: $targetLevel',
                    style: TextStyle(color: theme.colorScheme.primary, fontWeight: FontWeight.w600, fontSize: 13)),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: recommended.map<Widget>((r) {
                    final topicId = r['id'];
                    final name = r['name'] ?? '';
                    final icon = r['icon'] ?? '📌';
                    return GestureDetector(
                      onTap: () {
                        if (!_selectedIds.contains(topicId) && _selectedIds.length < 5) {
                          _toggleTopic(topicId);
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text('$icon $name',
                          style: TextStyle(color: theme.colorScheme.primary, fontSize: 13, fontWeight: FontWeight.w600)),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: () {
                      final ids = recommended.map<int>((r) => r['id'] as int).toSet();
                      setState(() => _selectedIds = ids);
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: theme.colorScheme.primary,
                      side: BorderSide(color: theme.colorScheme.primary),
                    ),
                    child: const Text('추천 조합 적용'),
                  ),
                ),
              ],
            ),
          ),
        ],

        // 레벨별 팁
        if (levelTips.isNotEmpty) ...[
          const SizedBox(height: 20),
          Text('🎯 레벨별 전략', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          ...levelTips.map<Widget>((tip) => _buildTipCard(theme, colors, tip, 'strategy')),
        ],

        // 전략 팁
        if (strategies.isNotEmpty) ...[
          const SizedBox(height: 20),
          Text('💡 고득점 꼼팁', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          ...strategies.take(5).map<Widget>((tip) => _buildTipCard(theme, colors, tip, 'strategy')),
        ],

        // 경고 팁
        if (warnings.isNotEmpty) ...[
          const SizedBox(height: 20),
          Text('⚠️ 주의사항', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          ...warnings.map<Widget>((tip) => _buildTipCard(theme, colors, tip, 'warning')),
        ],
      ],
    );
  }

  /// 팁 카드 위젯
  Widget _buildTipCard(ThemeData theme, AppColors colors, dynamic tip, String type) {
    final title = tip['title'] ?? '';
    final content = tip['content'] ?? '';

    Color bgColor;
    Color borderColor;
    if (type == 'warning') {
      bgColor = const Color(0xFFFEF3C7);
      borderColor = const Color(0xFFFCD34D);
    } else {
      bgColor = theme.colorScheme.surface;
      borderColor = theme.colorScheme.outline.withValues(alpha: 0.3);
    }

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          Text(content, style: TextStyle(fontSize: 13, color: colors.textMuted, height: 1.5)),
        ],
      ),
    );
  }
}

/// 주제 카드 위젯
class _TopicCard extends StatelessWidget {
  final Topic topic;
  final bool isSelected;
  final VoidCallback onTap;

  const _TopicCard({
    required this.topic,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final accent = theme.colorScheme.primary;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color: isSelected ? accent.withValues(alpha: 0.12) : theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? accent : theme.colorScheme.outline,
            width: isSelected ? 2 : 1,
          ),
        ),
        padding: const EdgeInsets.all(12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(topic.icon, style: const TextStyle(fontSize: 28)),
            const SizedBox(height: 8),
            Text(
              topic.name,
              style: TextStyle(
                color: isSelected ? accent : theme.colorScheme.onSurface,
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 2),
            Text(
              topic.nameEn,
              style: theme.textTheme.bodySmall?.copyWith(fontSize: 11),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
