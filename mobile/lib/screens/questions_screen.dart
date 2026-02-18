import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/question.dart';
import '../models/topic.dart';

/// 문제은행 화면 (FR-005~008)
/// 주제별 탭, 유형 태그, 답변 가이드 표시
class QuestionsScreen extends StatefulWidget {
  const QuestionsScreen({super.key});

  @override
  State<QuestionsScreen> createState() => _QuestionsScreenState();
}

class _QuestionsScreenState extends State<QuestionsScreen> with TickerProviderStateMixin {
  List<Topic> _selectedTopics = [];
  Map<int, List<Question>> _questionsByTopic = {};
  bool _loading = true;
  TabController? _tabController;
  String? _filterType;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _tabController?.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final topicsData = await ApiService.get('/topics');
      final topics = (topicsData as List)
          .map((j) => Topic.fromJson(j))
          .where((t) => t.isSelected)
          .toList();

      Map<int, List<Question>> map = {};
      for (var topic in topics) {
        final qData = await ApiService.get('/questions?topic_id=${topic.id}');
        map[topic.id] = (qData as List).map((j) => Question.fromJson(j)).toList();
      }

      setState(() {
        _selectedTopics = topics;
        _questionsByTopic = map;
        _tabController?.dispose();
        _tabController = TabController(length: topics.length, vsync: this);
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Color _typeColor(String type) {
    switch (type) {
      case 'survey': return const Color(0xFF0284C7);
      case 'combo': return const Color(0xFFF59E0B);
      case 'roleplay': return const Color(0xFF7C3AED);
      case 'unexpected': return const Color(0xFFEF4444);
      default: return const Color(0xFF94A3B8);
    }
  }

  String _typeLabel(String type) {
    switch (type) {
      case 'survey': return '서베이';
      case 'combo': return '콤보';
      case 'roleplay': return '롤플레이';
      case 'unexpected': return '돌발';
      default: return type;
    }
  }

  void _showGuide(Question question) async {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => _GuideBottomSheet(question: question),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_loading) return const Center(child: CircularProgressIndicator());

    if (_selectedTopics.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('📚', style: TextStyle(fontSize: 48)),
            const SizedBox(height: 12),
            Text('선택된 주제가 없습니다', style: theme.textTheme.bodyMedium),
            const SizedBox(height: 4),
            Text('서베이 탭에서 주제를 먼저 선택하세요', style: theme.textTheme.bodySmall),
          ],
        ),
      );
    }

    return Column(
      children: [
        // 주제별 탭
        Container(
          color: theme.colorScheme.surface,
          child: TabBar(
            controller: _tabController,
            isScrollable: true,
            indicatorColor: theme.colorScheme.primary,
            labelColor: theme.colorScheme.primary,
            unselectedLabelColor: theme.textTheme.bodySmall?.color,
            tabs: _selectedTopics.map((t) => Tab(text: '${t.icon} ${t.name}')).toList(),
          ),
        ),

        // 유형 필터
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _FilterChip(label: '전체', selected: _filterType == null, onTap: () => setState(() => _filterType = null)),
                for (var type in ['survey', 'combo', 'roleplay', 'unexpected'])
                  Padding(
                    padding: const EdgeInsets.only(left: 8),
                    child: _FilterChip(
                      label: _typeLabel(type),
                      selected: _filterType == type,
                      color: _typeColor(type),
                      onTap: () => setState(() => _filterType = _filterType == type ? null : type),
                    ),
                  ),
              ],
            ),
          ),
        ),

        // 질문 목록
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: _selectedTopics.map((topic) {
              var questions = _questionsByTopic[topic.id] ?? [];
              if (_filterType != null) {
                questions = questions.where((q) => q.type == _filterType).toList();
              }

              if (questions.isEmpty) {
                return Center(
                  child: Text('해당 유형의 질문이 없습니다', style: theme.textTheme.bodySmall),
                );
              }

              return ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: questions.length,
                itemBuilder: (context, index) {
                  final q = questions[index];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      title: Text(q.questionText, style: const TextStyle(fontSize: 14)),
                      subtitle: Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: _typeColor(q.type).withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Text(
                            _typeLabel(q.type),
                            style: TextStyle(color: _typeColor(q.type), fontSize: 11, fontWeight: FontWeight.w600),
                          ),
                        ),
                      ),
                      trailing: Icon(Icons.chevron_right, color: theme.colorScheme.outline),
                      onTap: () => _showGuide(q),
                    ),
                  );
                },
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}

/// 유형 필터 칩
class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final Color? color;
  final VoidCallback onTap;

  const _FilterChip({required this.label, required this.selected, this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final c = color ?? Theme.of(context).colorScheme.primary;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? c.withValues(alpha: 0.2) : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: selected ? c : Theme.of(context).colorScheme.outline),
        ),
        child: Text(label, style: TextStyle(
          color: selected ? c : Theme.of(context).colorScheme.onSurface,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        )),
      ),
    );
  }
}

/// 답변 가이드 바텀시트
class _GuideBottomSheet extends StatefulWidget {
  final Question question;

  const _GuideBottomSheet({required this.question});

  @override
  State<_GuideBottomSheet> createState() => _GuideBottomSheetState();
}

class _GuideBottomSheetState extends State<_GuideBottomSheet> {
  AnswerGuide? _guide;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadGuide();
  }

  Future<void> _loadGuide() async {
    try {
      final settingsData = await ApiService.get('/settings');
      final levelCode = settingsData['target_level'] ?? 'IM1';
      final data = await ApiService.get('/questions/${widget.question.id}/guide?level_code=$levelCode');
      setState(() {
        _guide = AnswerGuide.fromJson(data);
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      maxChildSize: 0.9,
      minChildSize: 0.3,
      expand: false,
      builder: (_, scrollCtrl) => Padding(
        padding: const EdgeInsets.all(20),
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : ListView(
                controller: scrollCtrl,
                children: [
                  // 질문
                  Text(widget.question.questionText, style: theme.textTheme.titleMedium),
                  const SizedBox(height: 16),

                  if (_guide != null) ...[
                    // 답변 구조
                    Text('📝 추천 답변 구조', style: theme.textTheme.titleMedium),
                    const SizedBox(height: 8),
                    Text(_guide!.structure.isNotEmpty ? _guide!.structure : '가이드 정보가 없습니다',
                        style: theme.textTheme.bodyMedium),
                    const SizedBox(height: 16),

                    // 핵심 표현
                    if (_guide!.keyPhrases.isNotEmpty) ...[
                      Text('💡 핵심 표현', style: theme.textTheme.titleMedium),
                      const SizedBox(height: 8),
                      ..._guide!.keyPhrases.map((p) => Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('• ', style: TextStyle(color: theme.colorScheme.primary)),
                            Expanded(child: Text(p, style: theme.textTheme.bodyMedium)),
                          ],
                        ),
                      )),
                    ],

                    // 목표 단어 수
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text('🎯 '),
                          Text('목표 단어 수: ${_guide!.targetWords}단어',
                              style: TextStyle(
                                color: theme.colorScheme.primary,
                                fontWeight: FontWeight.w600,
                              )),
                        ],
                      ),
                    ),
                  ] else
                    Text('답변 가이드가 없습니다', style: theme.textTheme.bodySmall),
                ],
              ),
      ),
    );
  }
}
