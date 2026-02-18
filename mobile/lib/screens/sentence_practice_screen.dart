import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../main.dart';

/// 문장별 발음 연습 화면
/// 스크립트를 문장 단위로 분리하여 각 문장의 발음을 연습하고 AI 평가를 받음
class SentencePracticeScreen extends StatefulWidget {
  final int scriptId;
  final String scriptTitle;

  const SentencePracticeScreen({
    super.key,
    required this.scriptId,
    required this.scriptTitle,
  });

  @override
  State<SentencePracticeScreen> createState() => _SentencePracticeScreenState();
}

class _SentencePracticeScreenState extends State<SentencePracticeScreen> {
  List<Map<String, dynamic>> _sentences = [];
  Map<int, Map<String, dynamic>> _results = {};
  bool _loading = true;
  int? _activeSentenceIndex;
  bool _evaluating = false;

  @override
  void initState() {
    super.initState();
    _loadSentences();
  }

  /// 문장 분리 + 기존 연습 결과 로드
  Future<void> _loadSentences() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        ApiService.post('/sentence-practice/split', {
          'script_id': widget.scriptId,
        }),
        ApiService.get('/sentence-practice/script/${widget.scriptId}')
            .catchError((_) => {'practices': []}),
      ]);

      final sentences = List<Map<String, dynamic>>.from(results[0]['sentences'] ?? []);
      final practices = results[1];

      // 기존 결과를 인덱스별로 매핑
      final practiceList = practices is Map ? (practices['practices'] as List? ?? []) : [];
      final resultsMap = <int, Map<String, dynamic>>{};
      for (final p in practiceList) {
        final idx = p['sentence_index'] as int?;
        if (idx != null) {
          resultsMap[idx] = Map<String, dynamic>.from(p);
        }
      }

      setState(() {
        _sentences = sentences;
        _results = resultsMap;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('로드 실패: $e')),
        );
      }
    }
  }

  /// 문장 발음 평가 (시뮬레이션 — 실제로는 녹음 후 전송)
  Future<void> _evaluateSentence(int index, String text) async {
    setState(() {
      _activeSentenceIndex = index;
      _evaluating = true;
    });

    try {
      final result = await ApiService.post('/sentence-practice/evaluate', {
        'script_id': widget.scriptId,
        'sentence_index': index,
        'sentence_text': text,
        // 실제 환경에서는 audio_data를 함께 전송
      });

      setState(() {
        _results[index] = Map<String, dynamic>.from(result);
        _evaluating = false;
        _activeSentenceIndex = null;
      });
    } catch (e) {
      setState(() {
        _evaluating = false;
        _activeSentenceIndex = null;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('평가 실패: $e')),
        );
      }
    }
  }

  /// 등급별 색상
  Color _gradeColor(String? grade) {
    switch (grade) {
      case 'AL': return const Color(0xFF059669);
      case 'IH': return const Color(0xFF0284C7);
      case 'IM': return const Color(0xFF7C3AED);
      case 'IL': return const Color(0xFFF59E0B);
      case 'NM': return const Color(0xFFEF4444);
      default: return const Color(0xFF94A3B8);
    }
  }

  /// 등급별 이모지
  String _gradeEmoji(String? grade) {
    switch (grade) {
      case 'AL': return '🌟';
      case 'IH': return '⭐';
      case 'IM': return '👍';
      case 'IL': return '💪';
      case 'NM': return '📝';
      default: return '🎤';
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.extension<AppColors>()!;

    // 진행률 계산
    final totalCount = _sentences.length;
    final completedCount = _results.length;
    final progress = totalCount > 0 ? completedCount / totalCount : 0.0;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.scriptTitle,
          overflow: TextOverflow.ellipsis,
        ),
        actions: [
          Center(
            child: Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Text(
                '$completedCount/$totalCount',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: theme.colorScheme.primary,
                ),
              ),
            ),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _sentences.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('🎤', style: TextStyle(fontSize: 48)),
                      const SizedBox(height: 12),
                      Text('문장을 분리할 수 없습니다', style: theme.textTheme.bodyMedium),
                      const SizedBox(height: 4),
                      Text('스크립트에 내용을 추가하세요', style: theme.textTheme.bodySmall),
                    ],
                  ),
                )
              : Column(
                  children: [
                    // 진행률 바
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      child: Column(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: progress,
                              backgroundColor: theme.colorScheme.outline.withValues(alpha: 0.2),
                              valueColor: AlwaysStoppedAnimation(theme.colorScheme.primary),
                              minHeight: 6,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            '${(progress * 100).toInt()}% 완료',
                            style: TextStyle(fontSize: 12, color: colors.textMuted),
                          ),
                        ],
                      ),
                    ),

                    // 문장 목록
                    Expanded(
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _sentences.length,
                        itemBuilder: (context, index) {
                          final sentence = _sentences[index];
                          final text = sentence['text'] ?? '';
                          final result = _results[index];
                          final isActive = _activeSentenceIndex == index;
                          final grade = result?['pronunciation_grade'] ?? result?['grade'];
                          final score = result?['pronunciation_score'] ?? result?['score'];

                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            decoration: BoxDecoration(
                              color: isActive
                                  ? theme.colorScheme.primary.withValues(alpha: 0.05)
                                  : theme.colorScheme.surface,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: isActive
                                    ? theme.colorScheme.primary
                                    : grade != null
                                        ? _gradeColor(grade).withValues(alpha: 0.3)
                                        : theme.colorScheme.outline.withValues(alpha: 0.2),
                                width: isActive ? 2 : 1,
                              ),
                              boxShadow: [
                                if (grade != null)
                                  BoxShadow(
                                    color: _gradeColor(grade).withValues(alpha: 0.08),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                              ],
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(14),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // 문장 번호 + 등급
                                  Row(
                                    children: [
                                      Container(
                                        width: 28, height: 28,
                                        alignment: Alignment.center,
                                        decoration: BoxDecoration(
                                          color: grade != null
                                              ? _gradeColor(grade).withValues(alpha: 0.12)
                                              : theme.colorScheme.outline.withValues(alpha: 0.1),
                                          shape: BoxShape.circle,
                                        ),
                                        child: Text(
                                          '${index + 1}',
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w700,
                                            color: grade != null ? _gradeColor(grade) : colors.textMuted,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Text(
                                          text,
                                          style: TextStyle(
                                            fontSize: 14,
                                            height: 1.5,
                                            color: theme.colorScheme.onSurface,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),

                                  // 결과 표시 또는 연습 버튼
                                  const SizedBox(height: 10),
                                  if (grade != null) ...[
                                    // 결과 카드
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                      decoration: BoxDecoration(
                                        color: _gradeColor(grade).withValues(alpha: 0.08),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Row(
                                        children: [
                                          Text(_gradeEmoji(grade), style: const TextStyle(fontSize: 20)),
                                          const SizedBox(width: 8),
                                          Text(
                                            grade ?? '-',
                                            style: TextStyle(
                                              fontSize: 18,
                                              fontWeight: FontWeight.w800,
                                              color: _gradeColor(grade),
                                            ),
                                          ),
                                          if (score != null) ...[
                                            const SizedBox(width: 8),
                                            Text(
                                              '${score}점',
                                              style: TextStyle(
                                                fontSize: 13,
                                                color: _gradeColor(grade).withValues(alpha: 0.7),
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                          ],
                                          const Spacer(),
                                          // 재시도 버튼
                                          GestureDetector(
                                            onTap: () => _evaluateSentence(index, text),
                                            child: Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                              decoration: BoxDecoration(
                                                color: colors.textMuted.withValues(alpha: 0.1),
                                                borderRadius: BorderRadius.circular(8),
                                              ),
                                              child: Text(
                                                '재시도',
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  color: colors.textMuted,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ] else ...[
                                    // 연습 버튼
                                    SizedBox(
                                      width: double.infinity,
                                      child: OutlinedButton.icon(
                                        onPressed: isActive && _evaluating
                                            ? null
                                            : () => _evaluateSentence(index, text),
                                        icon: isActive && _evaluating
                                            ? SizedBox(
                                                width: 16, height: 16,
                                                child: CircularProgressIndicator(
                                                  strokeWidth: 2,
                                                  color: theme.colorScheme.primary,
                                                ),
                                              )
                                            : Icon(Icons.mic_rounded, size: 18, color: theme.colorScheme.primary),
                                        label: Text(
                                          isActive && _evaluating ? '평가 중...' : '발음 연습',
                                          style: TextStyle(fontSize: 13),
                                        ),
                                        style: OutlinedButton.styleFrom(
                                          padding: const EdgeInsets.symmetric(vertical: 10),
                                          side: BorderSide(color: theme.colorScheme.primary.withValues(alpha: 0.3)),
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
    );
  }
}
