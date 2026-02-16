import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../services/api_service.dart';
import '../models/dashboard_stats.dart';
import '../models/exam_session.dart';
import '../main.dart';

/// 대시보드 화면 (FR-027~030)
/// 통계 카드, 점수 추이 차트, 레벨 진행률, 시험 이력
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  DashboardStats? _stats;
  List<Map<String, dynamic>> _trends = [];
  List<ExamSession> _sessions = [];
  bool _loading = true;

  // 레벨 순서
  final List<String> _levelOrder = const ['NL', 'NM', 'NH', 'IL', 'IM1', 'IM2', 'IM3', 'IH', 'AL'];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final statsData = await ApiService.get('/dashboard/stats');
      final trendsData = await ApiService.get('/dashboard/trends');
      final sessionsData = await ApiService.get('/exam/sessions');

      setState(() {
        _stats = DashboardStats.fromJson(statsData);
        _trends = List<Map<String, dynamic>>.from(trendsData);
        _sessions = (sessionsData as List).map((j) => ExamSession.fromJson(j)).toList();
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

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('학습 대시보드', style: theme.textTheme.titleLarge),
          const SizedBox(height: 16),

          // 통계 요약 카드
          Row(
            children: [
              Expanded(child: _StatCard(
                icon: '📝', label: '총 시험', value: '${_stats!.totalExams}회',
              )),
              const SizedBox(width: 8),
              Expanded(child: _StatCard(
                icon: '🎯', label: '최근 등급',
                value: _stats!.latestPredictedLevel ?? '-',
              )),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(child: _StatCard(
                icon: '📖', label: '문법', value: '${_stats!.avgGrammar.toStringAsFixed(0)}점',
              )),
              const SizedBox(width: 8),
              Expanded(child: _StatCard(
                icon: '🗣️', label: '유창성', value: '${_stats!.avgFluency.toStringAsFixed(0)}점',
              )),
              const SizedBox(width: 8),
              Expanded(child: _StatCard(
                icon: '📚', label: '어휘', value: '${_stats!.avgVocabulary.toStringAsFixed(0)}점',
              )),
            ],
          ),

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
                    // 범례
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        _Legend(color: const Color(0xFF818CF8), label: '문법'),
                        const SizedBox(width: 16),
                        _Legend(color: theme.colorScheme.primary, label: '유창성'),
                        const SizedBox(width: 16),
                        _Legend(color: colors.warning, label: '어휘'),
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
                  color: theme.colorScheme.primary.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
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
        ],
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
        // 레벨 라벨 행
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
        // 진행 바
        Stack(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: targetIdx >= 0 ? (targetIdx + 1) / _levelOrder.length : 0,
                backgroundColor: theme.colorScheme.outline,
                valueColor: AlwaysStoppedAnimation(colors.success.withValues(alpha: 0.3)),
                minHeight: 12,
              ),
            ),
            if (predictedIdx >= 0)
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: (predictedIdx + 1) / _levelOrder.length,
                  backgroundColor: Colors.transparent,
                  valueColor: AlwaysStoppedAnimation(colors.warning.withValues(alpha: 0.5)),
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

  /// fl_chart 라인 차트
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
              FlLine(color: theme.colorScheme.outline.withValues(alpha: 0.3), strokeWidth: 1),
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
          _lineData(grammarSpots, const Color(0xFF818CF8)),
          _lineData(fluencySpots, theme.colorScheme.primary),
          _lineData(vocabSpots, colors.warning),
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
        color: color.withValues(alpha: 0.08),
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
