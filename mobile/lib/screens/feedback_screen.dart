import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/feedback.dart' as fb;
import '../models/exam_session.dart';
import '../main.dart';

/// AI 피드백 화면 (FR-022~026)
/// Gemini 평가, 점수 시각화, 강약점 카드
class FeedbackScreen extends StatefulWidget {
  const FeedbackScreen({super.key});

  @override
  State<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends State<FeedbackScreen> {
  List<ExamSession> _sessions = [];
  ExamSession? _selectedSession;
  fb.Feedback? _feedback;
  bool _loading = true;
  bool _evaluating = false;

  @override
  void initState() {
    super.initState();
    _loadSessions();
  }

  Future<void> _loadSessions() async {
    setState(() { _loading = true; });
    try {
      final data = await ApiService.get('/exam/sessions');
      setState(() {
        _sessions = (data as List).map((j) => ExamSession.fromJson(j)).toList();
        _loading = false;
      });
    } catch (e) {
      setState(() { _loading = false; });
    }
  }

  /// 세션 선택 → 기존 피드백 확인 또는 새로 요청
  Future<void> _selectSession(ExamSession session) async {
    setState(() { _selectedSession = session; _feedback = null; });

    // 이미 피드백이 있는지 확인
    try {
      final existing = await ApiService.get('/feedback/${session.id}');
      setState(() => _feedback = fb.Feedback.fromJson(existing));
    } catch (_) {
      // 없으면 무시 — 사용자가 "AI 피드백 받기" 버튼 클릭 시 요청
    }
  }

  /// AI 피드백 요청
  Future<void> _requestFeedback() async {
    if (_selectedSession == null) return;
    setState(() { _evaluating = true; });

    try {
      // 세션 상세 조회 (답변 포함)
      final sessionDetail = await ApiService.get('/exam/sessions/${_selectedSession!.id}');
      final answers = (sessionDetail['answers'] as List?)?.map((a) => {
        'question_text': a['question_text'] ?? '',
        'answer_text': a['answer_text'] ?? '',
      }).toList() ?? [];

      final result = await ApiService.post('/feedback/evaluate', {
        'session_id': _selectedSession!.id,
        'answers': answers,
        'target_level': _selectedSession!.targetLevel,
      });

      setState(() {
        _feedback = fb.Feedback.fromJson(result);
        _evaluating = false;
      });
    } catch (e) {
      setState(() { _evaluating = false; });
      if (mounted) {
        final msg = e is ApiException ? e.message : '네트워크 오류, 인터넷 연결을 확인해주세요';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(msg),
            backgroundColor: Theme.of(context).colorScheme.error,
            action: SnackBarAction(label: '재시도', onPressed: _requestFeedback, textColor: Colors.white),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.extension<AppColors>()!;

    if (_loading) return const Center(child: CircularProgressIndicator());

    if (_sessions.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('💬', style: TextStyle(fontSize: 48)),
            const SizedBox(height: 12),
            Text('아직 시험 기록이 없습니다', style: theme.textTheme.bodyMedium),
            const SizedBox(height: 4),
            Text('모의시험을 먼저 완료하세요', style: theme.textTheme.bodySmall),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('AI 피드백', style: theme.textTheme.titleLarge),
          const SizedBox(height: 12),

          // 세션 선택 드롭다운
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: theme.colorScheme.outline),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<int>(
                isExpanded: true,
                hint: Text('시험 세션 선택', style: theme.textTheme.bodySmall),
                value: _selectedSession?.id,
                dropdownColor: theme.colorScheme.surface,
                items: _sessions.map((s) => DropdownMenuItem(
                  value: s.id,
                  child: Text(
                    '#${s.id} — ${s.startedAt.substring(0, 10)} (${s.targetLevel})',
                    style: theme.textTheme.bodyMedium,
                  ),
                )).toList(),
                onChanged: (id) {
                  final session = _sessions.firstWhere((s) => s.id == id);
                  _selectSession(session);
                },
              ),
            ),
          ),

          // AI 피드백 요청 버튼
          if (_selectedSession != null && _feedback == null) ...[
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _evaluating ? null : _requestFeedback,
                child: _evaluating
                    ? const SizedBox(
                        height: 20, width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('AI 피드백 받기'),
              ),
            ),
          ],

          // 피드백 결과 표시
          if (_feedback != null) ...[
            const SizedBox(height: 20),

            // 예상 등급 뱃지
            Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      theme.colorScheme.primary.withValues(alpha: 0.2),
                      theme.colorScheme.primary.withValues(alpha: 0.05),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: theme.colorScheme.primary),
                ),
                child: Column(
                  children: [
                    Text('예상 등급', style: theme.textTheme.bodySmall),
                    const SizedBox(height: 4),
                    Text(
                      _feedback!.predictedLevel,
                      style: TextStyle(
                        fontSize: 36,
                        fontWeight: FontWeight.w800,
                        color: theme.colorScheme.primary,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // 점수 3개
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(child: _ScoreCard(label: '문법', score: _feedback!.grammarScore, color: const Color(0xFF818CF8))),
                const SizedBox(width: 8),
                Expanded(child: _ScoreCard(label: '유창성', score: _feedback!.fluencyScore, color: theme.colorScheme.primary)),
                const SizedBox(width: 8),
                Expanded(child: _ScoreCard(label: '어휘', score: _feedback!.vocabularyScore, color: colors.warning)),
              ],
            ),

            // 잘한 점
            const SizedBox(height: 20),
            Text('✅ 잘한 점', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            ..._feedback!.strengths.map((s) => Card(
              margin: const EdgeInsets.only(bottom: 6),
              child: ListTile(
                leading: Icon(Icons.check_circle, color: colors.success, size: 20),
                title: Text(s, style: const TextStyle(fontSize: 13)),
                dense: true,
              ),
            )),

            // 개선할 점
            const SizedBox(height: 12),
            Text('💡 개선할 점', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            ..._feedback!.improvements.map((s) => Card(
              margin: const EdgeInsets.only(bottom: 6),
              child: ListTile(
                leading: Icon(Icons.lightbulb_outline, color: colors.warning, size: 20),
                title: Text(s, style: const TextStyle(fontSize: 13)),
                dense: true,
              ),
            )),
          ],
        ],
      ),
    );
  }
}

/// 점수 카드 위젯
class _ScoreCard extends StatelessWidget {
  final String label;
  final int score;
  final Color color;

  const _ScoreCard({required this.label, required this.score, required this.color});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Text(label, style: theme.textTheme.bodySmall),
            const SizedBox(height: 8),
            SizedBox(
              width: 50, height: 50,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  CircularProgressIndicator(
                    value: score / 100,
                    strokeWidth: 4,
                    valueColor: AlwaysStoppedAnimation(color),
                    backgroundColor: theme.colorScheme.outline,
                  ),
                  Text(
                    '$score',
                    style: TextStyle(
                      color: color,
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
