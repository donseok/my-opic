import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../main.dart';

/// SRS 복습 화면
/// 간격 반복 복습 시스템 — 통계, 카드 복습, 완료 뷰
class SrsReviewScreen extends StatefulWidget {
  const SrsReviewScreen({super.key});

  @override
  State<SrsReviewScreen> createState() => _SrsReviewScreenState();
}

class _SrsReviewScreenState extends State<SrsReviewScreen> {
  // 뷰 상태: main, review, complete
  String _view = 'main';

  // 통계
  Map<String, dynamic> _stats = {};
  bool _loading = true;
  bool _seeding = false;

  // 복습 모드
  List<Map<String, dynamic>> _dueItems = [];
  int _currentIndex = 0;
  bool _revealed = false;

  // 완료 통계
  int _reviewedCount = 0;
  int _successCount = 0;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  /// 통계 로드
  Future<void> _loadStats() async {
    setState(() => _loading = true);
    try {
      final data = await ApiService.get('/srs/stats');
      setState(() {
        _stats = Map<String, dynamic>.from(data);
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  /// 시드 데이터 추가
  Future<void> _seedItems() async {
    setState(() => _seeding = true);
    try {
      await ApiService.post('/srs/seed', {});
      await _loadStats();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('학습 데이터에서 카드를 추가했습니다')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('시드 실패: $e')),
        );
      }
    } finally {
      setState(() => _seeding = false);
    }
  }

  /// 복습 시작
  Future<void> _startReview() async {
    setState(() => _loading = true);
    try {
      final data = await ApiService.get('/srs/due');
      final items = List<Map<String, dynamic>>.from(data);
      if (items.isEmpty) {
        setState(() => _loading = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('복습할 카드가 없습니다')),
          );
        }
        return;
      }
      setState(() {
        _dueItems = items;
        _currentIndex = 0;
        _revealed = false;
        _reviewedCount = 0;
        _successCount = 0;
        _view = 'review';
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('복습 카드 로드 실패: $e')),
        );
      }
    }
  }

  /// 카드 뒤집기
  void _revealCard() {
    setState(() => _revealed = true);
  }

  /// 품질 응답 제출
  Future<void> _submitQuality(int quality) async {
    final item = _dueItems[_currentIndex];
    try {
      await ApiService.post('/srs/review', {
        'item_id': item['id'],
        'quality': quality,
      });
    } catch (_) {
      // 네트워크 오류 시에도 다음으로 진행
    }

    _reviewedCount++;
    if (quality >= 3) _successCount++;

    if (_currentIndex < _dueItems.length - 1) {
      setState(() {
        _currentIndex++;
        _revealed = false;
      });
    } else {
      setState(() => _view = 'complete');
    }
  }

  /// 메인으로 돌아가기
  void _goBackToMain() {
    setState(() => _view = 'main');
    _loadStats();
  }

  @override
  Widget build(BuildContext context) {
    switch (_view) {
      case 'review':
        return _buildReviewView(context);
      case 'complete':
        return _buildCompleteView(context);
      default:
        return _buildMainView(context);
    }
  }

  /// ─── 메인 뷰 ───
  Widget _buildMainView(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.extension<AppColors>()!;

    if (_loading) return const Center(child: CircularProgressIndicator());

    final total = (_stats['total'] ?? 0) as int;
    final dueToday = (_stats['due_today'] ?? 0) as int;
    final mastered = (_stats['mastered'] ?? 0) as int;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 헤더
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('SRS 복습', style: theme.textTheme.titleLarge),
              // 시드 버튼
              OutlinedButton.icon(
                onPressed: _seeding ? null : _seedItems,
                icon: _seeding
                    ? SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: theme.colorScheme.primary,
                        ),
                      )
                    : const Icon(Icons.add_circle_outline, size: 16),
                label: const Text('자동 추가'),
                style: OutlinedButton.styleFrom(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  textStyle: const TextStyle(fontSize: 12),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // 통계 카드
          Row(
            children: [
              Expanded(
                child: _SrsStatCard(
                  icon: '\u{1F0CF}', // 🃏
                  label: '전체 카드',
                  value: '$total',
                  color: theme.colorScheme.primary,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _SrsStatCard(
                  icon: '\u{1F4C5}', // 📅
                  label: '오늘 복습',
                  value: '$dueToday',
                  color: dueToday > 0 ? colors.warning : colors.textMuted,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _SrsStatCard(
                  icon: '\u{2705}', // ✅
                  label: '완료',
                  value: '$mastered',
                  color: colors.success,
                ),
              ),
            ],
          ),
          const SizedBox(height: 32),

          // 상태별 메시지 + 액션
          if (total == 0) ...[
            // 카드 없음
            Center(
              child: Column(
                children: [
                  const Text('\u{1F4E6}',
                      style: TextStyle(fontSize: 48)), // 📦
                  const SizedBox(height: 12),
                  Text('아직 복습 카드가 없습니다',
                      style: theme.textTheme.bodyMedium),
                  const SizedBox(height: 4),
                  Text(
                    '학습 데이터에서 자동으로 카드를 추가해보세요',
                    style: theme.textTheme.bodySmall,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton.icon(
                    onPressed: _seeding ? null : _seedItems,
                    icon: const Icon(Icons.add_circle_outline, size: 18),
                    label: const Text('자동 추가'),
                  ),
                ],
              ),
            ),
          ] else if (dueToday > 0) ...[
            // 복습할 카드 있음
            Center(
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: colors.warning.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(16),
                      border:
                          Border.all(color: colors.warning.withValues(alpha: 0.3)),
                    ),
                    child: Column(
                      children: [
                        Text(
                          '$dueToday',
                          style: TextStyle(
                            fontSize: 48,
                            fontWeight: FontWeight.w800,
                            color: colors.warning,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '개의 카드를 복습해야 합니다',
                          style: theme.textTheme.bodyMedium,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _startReview,
                      child: const Text('복습 시작'),
                    ),
                  ),
                ],
              ),
            ),
          ] else ...[
            // 오늘 복습 완료
            Center(
              child: Column(
                children: [
                  const Text('\u{1F389}',
                      style: TextStyle(fontSize: 48)), // 🎉
                  const SizedBox(height: 12),
                  Text(
                    '오늘의 복습을 모두 완료했습니다!',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '내일 다시 복습할 카드가 준비됩니다',
                    style: theme.textTheme.bodySmall,
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  /// ─── 복습 뷰 ───
  Widget _buildReviewView(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.extension<AppColors>()!;
    final item = _dueItems[_currentIndex];
    final frontText = item['front_text'] ?? item['phrase'] ?? '';
    final backText = item['back_text'] ?? item['meaning'] ?? '';
    final example = item['example'] ?? '';
    final progress = (_currentIndex + 1) / _dueItems.length;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: _goBackToMain,
        ),
        title: Text('${_currentIndex + 1} / ${_dueItems.length}'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // 진행 바
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: progress,
                backgroundColor:
                    theme.colorScheme.outline.withValues(alpha: 0.3),
                valueColor: AlwaysStoppedAnimation(theme.colorScheme.primary),
                minHeight: 6,
              ),
            ),
            const SizedBox(height: 24),

            // 카드
            Expanded(
              child: GestureDetector(
                onTap: _revealed ? null : _revealCard,
                child: Card(
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // 앞면
                        Text(
                          frontText,
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w700,
                            color: theme.colorScheme.onSurface,
                          ),
                          textAlign: TextAlign.center,
                        ),

                        if (_revealed) ...[
                          const SizedBox(height: 20),
                          Divider(color: theme.colorScheme.outline),
                          const SizedBox(height: 20),

                          // 뒷면
                          Text(
                            backText,
                            style: TextStyle(
                              fontSize: 18,
                              color: theme.colorScheme.primary,
                              fontWeight: FontWeight.w600,
                            ),
                            textAlign: TextAlign.center,
                          ),

                          // 예문
                          if (example.isNotEmpty) ...[
                            const SizedBox(height: 16),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: colors.bgSecondary,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                example,
                                style: theme.textTheme.bodySmall?.copyWith(
                                  fontStyle: FontStyle.italic,
                                  height: 1.5,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ],
                        ] else ...[
                          const SizedBox(height: 32),
                          Text(
                            '탭하여 정답 보기',
                            style: TextStyle(
                              fontSize: 13,
                              color: colors.textMuted,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            ),

            // 품질 버튼 (뒤집은 후에만 표시)
            if (_revealed) ...[
              const SizedBox(height: 16),
              Row(
                children: [
                  // 모름 (1)
                  Expanded(
                    child: _QualityButton(
                      label: '모름',
                      quality: 1,
                      color: theme.colorScheme.error,
                      onPressed: () => _submitQuality(1),
                    ),
                  ),
                  const SizedBox(width: 8),
                  // 어려움 (2)
                  Expanded(
                    child: _QualityButton(
                      label: '어려움',
                      quality: 2,
                      color: colors.warning,
                      onPressed: () => _submitQuality(2),
                    ),
                  ),
                  const SizedBox(width: 8),
                  // 보통 (3)
                  Expanded(
                    child: _QualityButton(
                      label: '보통',
                      quality: 3,
                      color: theme.colorScheme.primary,
                      onPressed: () => _submitQuality(3),
                    ),
                  ),
                  const SizedBox(width: 8),
                  // 쉬움 (5)
                  Expanded(
                    child: _QualityButton(
                      label: '쉬움',
                      quality: 5,
                      color: colors.success,
                      onPressed: () => _submitQuality(5),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
            ],
          ],
        ),
      ),
    );
  }

  /// ─── 완료 뷰 ───
  Widget _buildCompleteView(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.extension<AppColors>()!;
    final successRate = _reviewedCount > 0
        ? (_successCount / _reviewedCount * 100).round()
        : 0;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('\u{1F389}', style: TextStyle(fontSize: 64)), // 🎉
            const SizedBox(height: 16),
            Text('복습 완료!', style: theme.textTheme.headlineMedium),
            const SizedBox(height: 24),

            // 통계
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    _CompleteStat(
                      label: '복습한 카드',
                      value: '$_reviewedCount개',
                      theme: theme,
                    ),
                    const SizedBox(height: 12),
                    Divider(color: theme.colorScheme.outline),
                    const SizedBox(height: 12),
                    _CompleteStat(
                      label: '정답률 (보통 이상)',
                      value: '$successRate%',
                      theme: theme,
                      valueColor: successRate >= 70
                          ? colors.success
                          : successRate >= 40
                              ? colors.warning
                              : theme.colorScheme.error,
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _goBackToMain,
                child: const Text('돌아가기'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// SRS 통계 카드
class _SrsStatCard extends StatelessWidget {
  final String icon;
  final String label;
  final String value;
  final Color color;

  const _SrsStatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Text(icon, style: const TextStyle(fontSize: 20)),
            const SizedBox(height: 4),
            Text(
              value,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: color,
              ),
            ),
            Text(label, style: theme.textTheme.bodySmall?.copyWith(fontSize: 11)),
          ],
        ),
      ),
    );
  }
}

/// 품질 응답 버튼
class _QualityButton extends StatelessWidget {
  final String label;
  final int quality;
  final Color color;
  final VoidCallback onPressed;

  const _QualityButton({
    required this.label,
    required this.quality,
    required this.color,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 56,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          foregroundColor: color,
          side: BorderSide(color: color.withValues(alpha: 0.5)),
          backgroundColor: color.withValues(alpha: 0.06),
          padding: const EdgeInsets.symmetric(vertical: 8),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
            Text(
              '$quality',
              style: TextStyle(
                fontSize: 10,
                color: color.withValues(alpha: 0.7),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// 완료 화면 통계 행
class _CompleteStat extends StatelessWidget {
  final String label;
  final String value;
  final ThemeData theme;
  final Color? valueColor;

  const _CompleteStat({
    required this.label,
    required this.value,
    required this.theme,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: theme.textTheme.bodyMedium),
        Text(
          value,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: valueColor ?? theme.colorScheme.onSurface,
          ),
        ),
      ],
    );
  }
}
