import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../main.dart';

/// 학습 플랜 화면
/// 오늘의 학습 계획, 완료율, 약점 분석, 태스크 체크리스트, 7일 이력
class StudyPlanScreen extends StatefulWidget {
  const StudyPlanScreen({super.key});

  @override
  State<StudyPlanScreen> createState() => _StudyPlanScreenState();
}

class _StudyPlanScreenState extends State<StudyPlanScreen> {
  Map<String, dynamic>? _plan;
  List<Map<String, dynamic>> _history = [];
  bool _loading = true;
  bool _generating = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      late final Map<String, dynamic> plan;
      try {
        plan = Map<String, dynamic>.from(await ApiService.get('/study-plan/today'));
      } on ApiException catch (e) {
        if (e.statusCode == 404) {
          setState(() => _generating = true);
          plan = Map<String, dynamic>.from(await ApiService.post('/study-plan/generate', {}));
          setState(() => _generating = false);
        } else {
          rethrow;
        }
      }

      final historyData = await ApiService.get('/study-plan/history');

      setState(() {
        _plan = plan;
        _history = List<Map<String, dynamic>>.from(historyData);
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _loading = false;
        _generating = false;
      });
    }
  }

  Future<void> _toggleTask(int taskId, bool completed) async {
    try {
      await ApiService.put('/study-plan/tasks/$taskId/complete', {
        'is_completed': completed,
      });
      // 로컬 상태 업데이트
      setState(() {
        final tasks = List<Map<String, dynamic>>.from(_plan!['tasks']);
        final idx = tasks.indexWhere((t) => t['id'] == taskId);
        if (idx != -1) {
          tasks[idx]['is_completed'] = completed;
          _plan!['tasks'] = tasks;
          // 완료율 재계산
          final completedCount = tasks.where((t) => t['is_completed'] == true).length;
          _plan!['completion_rate'] = tasks.isEmpty
              ? 0
              : (completedCount / tasks.length * 100).round();
        }
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('업데이트 실패: $e')),
        );
      }
    }
  }

  String _taskIcon(String? type) {
    switch (type) {
      case 'exam':
        return '\u{1F4DD}'; // 📝
      case 'script':
        return '\u{1F4C4}'; // 📄
      case 'review':
        return '\u{1F504}'; // 🔄
      case 'srs':
        return '\u{1F0CF}'; // 🃏
      case 'vocabulary':
        return '\u{1F4DA}'; // 📚
      case 'grammar':
        return '\u{1F4D6}'; // 📖
      case 'listening':
        return '\u{1F3A7}'; // 🎧
      case 'speaking':
        return '\u{1F3A4}'; // 🎤
      default:
        return '\u{2705}'; // ✅
    }
  }

  Color _priorityColor(String? priority, AppColors colors, ThemeData theme) {
    switch (priority) {
      case 'high':
        return theme.colorScheme.error;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.textMuted;
      default:
        return colors.textMuted;
    }
  }

  String _priorityLabel(String? priority) {
    switch (priority) {
      case 'high':
        return '높음';
      case 'medium':
        return '보통';
      case 'low':
        return '낮음';
      default:
        return '';
    }
  }

  String _todayFormatted() {
    final now = DateTime.now();
    final weekdays = ['월', '화', '수', '목', '금', '토', '일'];
    final wd = weekdays[now.weekday - 1];
    return '${now.year}년 ${now.month}월 ${now.day}일 ($wd)';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.extension<AppColors>()!;

    if (_loading || _generating) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(),
            if (_generating) ...[
              const SizedBox(height: 16),
              Text('학습 플랜을 생성하고 있습니다...', style: theme.textTheme.bodySmall),
            ],
          ],
        ),
      );
    }

    if (_plan == null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('\u{1F4CB}', style: TextStyle(fontSize: 48)), // 📋
            const SizedBox(height: 12),
            Text('학습 플랜을 불러올 수 없습니다', style: theme.textTheme.bodyMedium),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadData,
              child: const Text('다시 시도'),
            ),
          ],
        ),
      );
    }

    final tasks = List<Map<String, dynamic>>.from(_plan!['tasks'] ?? []);
    final completionRate = (_plan!['completion_rate'] ?? 0).toDouble();
    final weaknessAnalysis = _plan!['weakness_analysis'] as Map<String, dynamic>?;

    return RefreshIndicator(
      onRefresh: _loadData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 오늘 날짜 + 새로고침
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(_todayFormatted(), style: theme.textTheme.titleLarge),
                IconButton(
                  icon: const Icon(Icons.refresh_rounded),
                  onPressed: _loadData,
                  tooltip: '새로고침',
                ),
              ],
            ),
            const SizedBox(height: 16),

            // 완료율 링
            _CompletionRing(
              rate: completionRate,
              theme: theme,
              colors: colors,
            ),
            const SizedBox(height: 20),

            // 약점 분석
            if (weaknessAnalysis != null && weaknessAnalysis.isNotEmpty) ...[
              Text('약점 분석', style: theme.textTheme.titleMedium),
              const SizedBox(height: 12),
              _WeaknessAnalysis(
                analysis: weaknessAnalysis,
                theme: theme,
                colors: colors,
              ),
              const SizedBox(height: 20),
            ],

            // 태스크 체크리스트
            Text('오늘의 학습 과제', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            if (tasks.isEmpty)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Center(
                    child: Text(
                      '오늘의 학습 과제가 없습니다',
                      style: theme.textTheme.bodySmall,
                    ),
                  ),
                ),
              )
            else
              ...tasks.map((task) => _TaskCard(
                    task: task,
                    taskIcon: _taskIcon(task['type']),
                    priorityColor: _priorityColor(task['priority'], colors, theme),
                    priorityLabel: _priorityLabel(task['priority']),
                    onToggle: (completed) => _toggleTask(task['id'], completed),
                    theme: theme,
                    colors: colors,
                  )),

            // 7일 이력
            if (_history.isNotEmpty) ...[
              const SizedBox(height: 24),
              Text('최근 7일 이력', style: theme.textTheme.titleMedium),
              const SizedBox(height: 12),
              _HistorySection(
                history: _history,
                theme: theme,
                colors: colors,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// 완료율 원형 인디케이터
class _CompletionRing extends StatelessWidget {
  final double rate;
  final ThemeData theme;
  final AppColors colors;

  const _CompletionRing({
    required this.rate,
    required this.theme,
    required this.colors,
  });

  @override
  Widget build(BuildContext context) {
    final percentage = rate.clamp(0.0, 100.0);
    final ringColor = percentage >= 80
        ? colors.success
        : percentage >= 50
            ? colors.warning
            : theme.colorScheme.primary;

    return Center(
      child: SizedBox(
        width: 140,
        height: 140,
        child: Stack(
          alignment: Alignment.center,
          children: [
            SizedBox(
              width: 140,
              height: 140,
              child: CircularProgressIndicator(
                value: percentage / 100,
                strokeWidth: 10,
                strokeCap: StrokeCap.round,
                valueColor: AlwaysStoppedAnimation(ringColor),
                backgroundColor: theme.colorScheme.outline.withValues(alpha: 0.3),
              ),
            ),
            Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '${percentage.toInt()}%',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.w800,
                    color: ringColor,
                  ),
                ),
                Text(
                  '완료율',
                  style: theme.textTheme.bodySmall,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// 약점 분석 바 차트
class _WeaknessAnalysis extends StatelessWidget {
  final Map<String, dynamic> analysis;
  final ThemeData theme;
  final AppColors colors;

  const _WeaknessAnalysis({
    required this.analysis,
    required this.theme,
    required this.colors,
  });

  @override
  Widget build(BuildContext context) {
    final entries = analysis.entries.toList();
    // 최대 5개 표시
    final displayEntries = entries.take(5).toList();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          children: displayEntries.map((entry) {
            final score = (entry.value is num) ? entry.value.toDouble() : 0.0;
            final normalized = (score / 100).clamp(0.0, 1.0);
            final barColor = score >= 70
                ? colors.success
                : score >= 40
                    ? colors.warning
                    : theme.colorScheme.error;

            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                children: [
                  SizedBox(
                    width: 72,
                    child: Text(
                      entry.key,
                      style: theme.textTheme.bodySmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: normalized,
                        backgroundColor: theme.colorScheme.outline.withValues(alpha: 0.3),
                        valueColor: AlwaysStoppedAnimation(barColor),
                        minHeight: 10,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  SizedBox(
                    width: 36,
                    child: Text(
                      '${score.toInt()}',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: barColor,
                      ),
                      textAlign: TextAlign.right,
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

/// 태스크 카드
class _TaskCard extends StatelessWidget {
  final Map<String, dynamic> task;
  final String taskIcon;
  final Color priorityColor;
  final String priorityLabel;
  final ValueChanged<bool> onToggle;
  final ThemeData theme;
  final AppColors colors;

  const _TaskCard({
    required this.task,
    required this.taskIcon,
    required this.priorityColor,
    required this.priorityLabel,
    required this.onToggle,
    required this.theme,
    required this.colors,
  });

  @override
  Widget build(BuildContext context) {
    final isCompleted = task['is_completed'] == true;
    final title = task['title'] ?? '';
    final description = task['description'] ?? '';

    return Card(
      margin: const EdgeInsets.only(bottom: 6),
      color: isCompleted
          ? colors.success.withValues(alpha: 0.05)
          : null,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => onToggle(!isCompleted),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          child: Row(
            children: [
              // 체크박스
              SizedBox(
                width: 24,
                height: 24,
                child: Checkbox(
                  value: isCompleted,
                  onChanged: (val) => onToggle(val ?? false),
                  activeColor: colors.success,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // 아이콘
              Text(taskIcon, style: const TextStyle(fontSize: 20)),
              const SizedBox(width: 10),
              // 제목 + 설명
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        decoration: isCompleted
                            ? TextDecoration.lineThrough
                            : null,
                        color: isCompleted
                            ? colors.textMuted
                            : theme.colorScheme.onSurface,
                      ),
                    ),
                    if (description.isNotEmpty)
                      Text(
                        description,
                        style: theme.textTheme.bodySmall?.copyWith(fontSize: 11),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              // 우선순위 뱃지
              if (priorityLabel.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: priorityColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    priorityLabel,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: priorityColor,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// 7일 이력 섹션
class _HistorySection extends StatelessWidget {
  final List<Map<String, dynamic>> history;
  final ThemeData theme;
  final AppColors colors;

  const _HistorySection({
    required this.history,
    required this.theme,
    required this.colors,
  });

  @override
  Widget build(BuildContext context) {
    final displayHistory = history.take(7).toList();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          children: displayHistory.map((entry) {
            final date = entry['date'] ?? '';
            final rate = (entry['completion_rate'] ?? 0).toDouble();
            final normalized = (rate / 100).clamp(0.0, 1.0);
            final barColor = rate >= 80
                ? colors.success
                : rate >= 50
                    ? colors.warning
                    : theme.colorScheme.error;

            // 날짜 포맷: yyyy-mm-dd → mm/dd
            String shortDate = date;
            if (date.length >= 10) {
              shortDate = '${date.substring(5, 7)}/${date.substring(8, 10)}';
            }

            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  SizedBox(
                    width: 48,
                    child: Text(
                      shortDate,
                      style: theme.textTheme.bodySmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: normalized,
                        backgroundColor: theme.colorScheme.outline.withValues(alpha: 0.3),
                        valueColor: AlwaysStoppedAnimation(barColor),
                        minHeight: 8,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  SizedBox(
                    width: 40,
                    child: Text(
                      '${rate.toInt()}%',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: barColor,
                      ),
                      textAlign: TextAlign.right,
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}
