import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../services/api_service.dart';
import '../models/dashboard_stats.dart';
import '../models/exam_session.dart';
import '../main.dart';

/// 대시보드 화면 — 통계, 레이더 차트, 스트릭, 학습시간, 히트맵, 시험 이력
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  DashboardStats? _stats;
  List<Map<String, dynamic>> _trends = [];
  List<ExamSession> _sessions = [];
  Map<String, dynamic>? _skills;
  Map<String, dynamic>? _streak;
  Map<String, dynamic>? _weekly;
  Map<String, dynamic>? _attendance;
  bool _loading = true;
  bool _checkingIn = false;

  final List<String> _levelOrder = const ['NL', 'NM', 'NH', 'IL', 'IM1', 'IM2', 'IM3', 'IH', 'AL'];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        ApiService.get('/dashboard/stats'),
        ApiService.get('/dashboard/trends'),
        ApiService.get('/exam/sessions'),
        ApiService.get('/dashboard/skills').catchError((_) => null),
        ApiService.get('/dashboard/streak').catchError((_) => null),
        ApiService.get('/dashboard/weekly').catchError((_) => null),
        ApiService.get('/attendance/status').catchError((_) => null),
      ]);

      setState(() {
        _stats = DashboardStats.fromJson(results[0]);
        _trends = List<Map<String, dynamic>>.from(results[1]);
        _sessions = (results[2] as List).map((j) => ExamSession.fromJson(j)).toList();
        _skills = results[3] as Map<String, dynamic>?;
        _streak = results[4] as Map<String, dynamic>?;
        _weekly = results[5] as Map<String, dynamic>?;
        _attendance = results[6] as Map<String, dynamic>?;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  int _levelIdx(String? code) {
    if (code == null) return -1;
    return _levelOrder.indexOf(code);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.extension<AppColors>()!;

    if (_loading) return const Center(child: CircularProgressIndicator());

    if (_stats == null || _stats!.totalExams == 0) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('📊', style: TextStyle(fontSize: 48)),
            const SizedBox(height: 12),
            Text('아직 학습 데이터가 없습니다', style: theme.textTheme.bodyMedium),
            const SizedBox(height: 4),
            Text('모의시험을 완료하면 통계가 표시됩니다', style: theme.textTheme.bodySmall),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('대시보드', style: theme.textTheme.titleLarge),
            const SizedBox(height: 16),

            // 출석 체크 카드
            _buildAttendanceCard(theme, colors),

            // 스트릭 + 주간 요약
            if (_streak != null) _buildStreakSection(theme, colors),

            // 통계 요약 카드 (5축)
            Row(
              children: [
                Expanded(child: _StatCard(icon: '📝', label: '총 시험', value: '${_stats!.totalExams}회')),
                const SizedBox(width: 8),
                Expanded(child: _StatCard(icon: '🎯', label: '최근 등급', value: _stats!.latestPredictedLevel ?? '-')),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(child: _StatCard(icon: '📖', label: '문법', value: '${_stats!.avgGrammar.toStringAsFixed(0)}점')),
                const SizedBox(width: 6),
                Expanded(child: _StatCard(icon: '🗣️', label: '유창성', value: '${_stats!.avgFluency.toStringAsFixed(0)}점')),
                const SizedBox(width: 6),
                Expanded(child: _StatCard(icon: '📚', label: '어휘', value: '${_stats!.avgVocabulary.toStringAsFixed(0)}점')),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(child: _StatCard(icon: '🎤', label: '발음', value: '${_stats!.avgPronunciation.toStringAsFixed(0)}점')),
                const SizedBox(width: 8),
                Expanded(child: _StatCard(icon: '📐', label: '구성력', value: '${_stats!.avgOrganization.toStringAsFixed(0)}점')),
              ],
            ),

            // 스킬 레이더 차트
            if (_skills != null) ...[
              const SizedBox(height: 20),
              _buildRadarSection(theme, colors),
            ],

            // 레벨 진행률
            const SizedBox(height: 20),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('레벨 진행률', style: theme.textTheme.titleMedium),
                    const SizedBox(height: 12),
                    _buildLevelProgress(theme, colors),
                  ],
                ),
              ),
            ),

            // 점수 추이 차트
            if (_trends.isNotEmpty) ...[
              const SizedBox(height: 20),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('점수 추이', style: theme.textTheme.titleMedium),
                      const SizedBox(height: 16),
                      SizedBox(
                        height: 200,
                        child: _buildTrendChart(theme, colors),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          _Legend(color: const Color(0xFF2563EB), label: '문법'),
                          const SizedBox(width: 12),
                          _Legend(color: theme.colorScheme.primary, label: '유창성'),
                          const SizedBox(width: 12),
                          _Legend(color: const Color(0xFF7C3AED), label: '어휘'),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],

            // 최근 시험 이력
            const SizedBox(height: 20),
            Text('최근 시험 이력', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            ..._sessions.take(5).map((s) => Card(
              margin: const EdgeInsets.only(bottom: 6),
              child: ListTile(
                dense: true,
                leading: Container(
                  width: 40, height: 40,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    s.predictedLevel ?? '-',
                    style: TextStyle(
                      color: theme.colorScheme.primary,
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                    ),
                  ),
                ),
                title: Text(s.startedAt.substring(0, 10), style: const TextStyle(fontSize: 13)),
                subtitle: Text(
                  '문법 ${s.grammarScore ?? '-'} · 유창성 ${s.fluencyScore ?? '-'} · 어휘 ${s.vocabularyScore ?? '-'}',
                  style: theme.textTheme.bodySmall?.copyWith(fontSize: 11),
                ),
                trailing: Text('${s.totalWords}단어', style: theme.textTheme.bodySmall),
              ),
            )),

            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  /// 출석 체크 & 포인트 카드
  Widget _buildAttendanceCard(ThemeData theme, AppColors colors) {
    final checkedToday = _attendance?['checked_today'] == true;
    final streak = _attendance?['current_streak'] ?? 0;
    final totalPoints = _attendance?['total_points'] ?? 0;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Container(
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF0284C7), Color(0xFF7C3AED)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF0284C7).withValues(alpha: 0.3),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        padding: const EdgeInsets.all(18),
        child: Column(
          children: [
            Row(
              children: [
                // 스트릭 아이콘
                Container(
                  width: 50, height: 50,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    checkedToday ? '✅' : '📅',
                    style: const TextStyle(fontSize: 24),
                  ),
                ),
                const SizedBox(width: 14),
                // 텍스트 정보
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        checkedToday ? '오늘 출석 완료! 🎉' : '오늘의 출석 체크',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '🔥 $streak일 연속 · 💎 ${totalPoints}P',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.85),
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
                // 체크인 버튼
                if (!checkedToday)
                  ElevatedButton(
                    onPressed: _checkingIn ? null : _doCheckIn,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: const Color(0xFF0284C7),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                    ),
                    child: _checkingIn
                        ? const SizedBox(
                            width: 16, height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('출석', style: TextStyle(fontWeight: FontWeight.w700)),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  /// 출석 체크인 처리
  Future<void> _doCheckIn() async {
    setState(() => _checkingIn = true);
    try {
      final result = await ApiService.post('/attendance/check-in', {});
      final earned = result['total_today'] ?? 10;
      setState(() {
        _attendance = {
          'checked_today': true,
          'current_streak': result['streak'] ?? ((_attendance?['current_streak'] ?? 0) + 1),
          'total_points': (_attendance?['total_points'] ?? 0) + earned,
          'checked_at': DateTime.now().toIso8601String(),
        };
      });
      if (mounted) {
        final c = Theme.of(context).extension<AppColors>()!;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('출석 완료! +${earned}P 적립 🎉'),
            backgroundColor: c.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('출석 체크 실패: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } finally {
      setState(() => _checkingIn = false);
    }
  }

  /// 스트릭 + 주간 요약 섹션
  Widget _buildStreakSection(ThemeData theme, AppColors colors) {
    final streakCount = _streak?['streak_count'] ?? 0;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // 스트릭 카운터
              Container(
                width: 60, height: 60,
                decoration: BoxDecoration(
                  color: streakCount > 0
                    ? colors.warning.withValues(alpha: 0.12)
                    : colors.textMuted.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '🔥',
                      style: TextStyle(fontSize: streakCount > 0 ? 20 : 16),
                    ),
                    Text(
                      '$streakCount',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: streakCount > 0 ? colors.warning : colors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              // 주간 요약
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      streakCount > 0 ? '연속 $streakCount일 학습 중!' : '오늘부터 시작하세요!',
                      style: theme.textTheme.titleMedium,
                    ),
                    if (_weekly != null)
                      Text(
                        '이번 주: 시험 ${_weekly!['exams'] ?? 0}회 · 학습 ${_weekly!['study_minutes'] ?? 0}분',
                        style: theme.textTheme.bodySmall,
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// 5축 레이더 차트
  Widget _buildRadarSection(ThemeData theme, AppColors colors) {
    final thisWeek = _skills?['this_week'] ?? {};
    final lastWeek = _skills?['last_week'] ?? {};

    final labels = ['문법', '어휘', '유창성', '발음', '구성력'];
    final keys = ['grammar', 'vocabulary', 'fluency', 'pronunciation', 'organization'];

    List<double> getData(Map<String, dynamic> data) {
      return keys.map((k) => (data[k] as num? ?? 0).toDouble()).toList();
    }

    final thisData = getData(thisWeek);
    final lastData = getData(lastWeek);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('스킬 레이더', style: theme.textTheme.titleMedium),
            const SizedBox(height: 16),
            SizedBox(
              height: 220,
              child: RadarChart(
                RadarChartData(
                  radarShape: RadarShape.polygon,
                  radarBorderData: BorderSide(color: theme.colorScheme.outline.withValues(alpha: 0.3)),
                  gridBorderData: BorderSide(color: theme.colorScheme.outline.withValues(alpha: 0.2), width: 1),
                  tickCount: 4,
                  ticksTextStyle: const TextStyle(fontSize: 0),
                  tickBorderData: BorderSide(color: theme.colorScheme.outline.withValues(alpha: 0.1)),
                  titlePositionPercentageOffset: 0.2,
                  getTitle: (index, _) => RadarChartTitle(
                    text: labels[index],
                    angle: 0,
                  ),
                  titleTextStyle: TextStyle(
                    fontSize: 11,
                    color: theme.textTheme.bodySmall?.color,
                    fontWeight: FontWeight.w500,
                  ),
                  dataSets: [
                    RadarDataSet(
                      dataEntries: thisData.map((v) => RadarEntry(value: v)).toList(),
                      borderColor: theme.colorScheme.primary,
                      fillColor: theme.colorScheme.primary.withValues(alpha: 0.15),
                      borderWidth: 2,
                      entryRadius: 3,
                    ),
                    RadarDataSet(
                      dataEntries: lastData.map((v) => RadarEntry(value: v)).toList(),
                      borderColor: colors.textMuted,
                      fillColor: colors.textMuted.withValues(alpha: 0.08),
                      borderWidth: 1,
                      entryRadius: 2,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _Legend(color: theme.colorScheme.primary, label: '이번 주'),
                const SizedBox(width: 16),
                _Legend(color: colors.textMuted, label: '지난 주'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  /// 레벨 진행률 바
  Widget _buildLevelProgress(ThemeData theme, AppColors colors) {
    final currentIdx = _levelIdx(_stats!.currentLevel);
    final targetIdx = _levelIdx(_stats!.targetLevel);
    final predictedIdx = _levelIdx(_stats!.latestPredictedLevel);

    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: _levelOrder.map((code) {
            Color textColor = theme.textTheme.bodySmall!.color!;
            FontWeight weight = FontWeight.normal;

            if (code == _stats!.currentLevel) { textColor = theme.colorScheme.primary; weight = FontWeight.w700; }
            if (code == _stats!.latestPredictedLevel) { textColor = colors.warning; weight = FontWeight.w700; }
            if (code == _stats!.targetLevel) { textColor = colors.success; weight = FontWeight.w700; }

            return Text(code, style: TextStyle(fontSize: 8, color: textColor, fontWeight: weight));
          }).toList(),
        ),
        const SizedBox(height: 4),
        Stack(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: targetIdx >= 0 ? (targetIdx + 1) / _levelOrder.length : 0,
                backgroundColor: theme.colorScheme.outline.withValues(alpha: 0.3),
                valueColor: AlwaysStoppedAnimation(colors.success.withValues(alpha: 0.2)),
                minHeight: 12,
              ),
            ),
            if (predictedIdx >= 0)
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: (predictedIdx + 1) / _levelOrder.length,
                  backgroundColor: Colors.transparent,
                  valueColor: AlwaysStoppedAnimation(colors.warning.withValues(alpha: 0.4)),
                  minHeight: 12,
                ),
              ),
            if (currentIdx >= 0)
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: (currentIdx + 1) / _levelOrder.length,
                  backgroundColor: Colors.transparent,
                  valueColor: AlwaysStoppedAnimation(theme.colorScheme.primary),
                  minHeight: 12,
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            _Legend(color: theme.colorScheme.primary, label: '현재'),
            _Legend(color: colors.warning, label: 'AI예상'),
            _Legend(color: colors.success, label: '목표'),
          ],
        ),
      ],
    );
  }

  /// 점수 추이 라인 차트
  Widget _buildTrendChart(ThemeData theme, AppColors colors) {
    final grammarSpots = <FlSpot>[];
    final fluencySpots = <FlSpot>[];
    final vocabSpots = <FlSpot>[];

    for (int i = 0; i < _trends.length; i++) {
      final t = _trends[i];
      grammarSpots.add(FlSpot(i.toDouble(), (t['grammar_score'] ?? 0).toDouble()));
      fluencySpots.add(FlSpot(i.toDouble(), (t['fluency_score'] ?? 0).toDouble()));
      vocabSpots.add(FlSpot(i.toDouble(), (t['vocabulary_score'] ?? 0).toDouble()));
    }

    return LineChart(
      LineChartData(
        minY: 0,
        maxY: 100,
        gridData: FlGridData(
          show: true,
          drawVerticalLine: false,
          horizontalInterval: 25,
          getDrawingHorizontalLine: (value) =>
              FlLine(color: theme.colorScheme.outline.withValues(alpha: 0.2), strokeWidth: 1),
        ),
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 30,
              interval: 25,
              getTitlesWidget: (v, _) => Text(
                v.toInt().toString(),
                style: TextStyle(fontSize: 10, color: theme.textTheme.bodySmall?.color),
              ),
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              interval: 1,
              getTitlesWidget: (v, _) => Text(
                '${v.toInt() + 1}',
                style: TextStyle(fontSize: 10, color: theme.textTheme.bodySmall?.color),
              ),
            ),
          ),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        borderData: FlBorderData(show: false),
        lineBarsData: [
          _lineData(grammarSpots, const Color(0xFF2563EB)),
          _lineData(fluencySpots, theme.colorScheme.primary),
          _lineData(vocabSpots, const Color(0xFF7C3AED)),
        ],
        lineTouchData: LineTouchData(
          touchTooltipData: LineTouchTooltipData(
            getTooltipColor: (_) => theme.colorScheme.surface,
          ),
        ),
      ),
    );
  }

  LineChartBarData _lineData(List<FlSpot> spots, Color color) {
    return LineChartBarData(
      spots: spots,
      isCurved: true,
      color: color,
      barWidth: 2,
      dotData: FlDotData(
        show: true,
        getDotPainter: (spot, percent, bar, index) =>
            FlDotCirclePainter(radius: 3, color: color, strokeWidth: 0),
      ),
      belowBarData: BarAreaData(
        show: true,
        color: color.withValues(alpha: 0.06),
      ),
    );
  }
}

/// 통계 카드
class _StatCard extends StatelessWidget {
  final String icon;
  final String label;
  final String value;

  const _StatCard({required this.icon, required this.label, required this.value});

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
            Text(value, style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: theme.colorScheme.onSurface,
            )),
            Text(label, style: theme.textTheme.bodySmall?.copyWith(fontSize: 11)),
          ],
        ),
      ),
    );
  }
}

/// 범례
class _Legend extends StatelessWidget {
  final Color color;
  final String label;

  const _Legend({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(width: 10, height: 10, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 4),
        Text(label, style: TextStyle(fontSize: 11, color: Theme.of(context).textTheme.bodySmall?.color)),
      ],
    );
  }
}
