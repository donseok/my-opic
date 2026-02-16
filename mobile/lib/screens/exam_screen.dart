import 'dart:async';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/question.dart';
import '../main.dart';

/// 모의시험 화면 (FR-014~021)
/// 5문제 순차 진행, 타이머, 단어 수 카운트
class ExamScreen extends StatefulWidget {
  const ExamScreen({super.key});

  @override
  State<ExamScreen> createState() => _ExamScreenState();
}

class _ExamScreenState extends State<ExamScreen> {
  // 상태: idle, preparing, answering, completed
  String _state = 'idle';
  List<Question> _questions = [];
  int _currentIndex = 0;
  String _targetLevel = '';
  int _targetWords = 60;

  // 타이머
  Timer? _timer;
  int _timeLeft = 0;
  int _totalTime = 0;

  // 답변 데이터
  final TextEditingController _answerCtrl = TextEditingController();
  final List<Map<String, dynamic>> _answers = [];
  int _prepTime = 8;

  // 시험 결과

  bool _canStart = false;
  bool _checkingReady = true;

  @override
  void initState() {
    super.initState();
    _checkReady();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _answerCtrl.dispose();
    super.dispose();
  }

  /// 시험 시작 가능 여부 확인
  Future<void> _checkReady() async {
    setState(() => _checkingReady = true);
    try {
      final topics = await ApiService.get('/topics');
      final settings = await ApiService.get('/settings');
      final selectedTopics = (topics as List).where((t) => t['is_selected'] == 1).toList();
      final hasLevel = settings['target_level'] != null;
      setState(() {
        _canStart = selectedTopics.length >= 3 && hasLevel;
        _checkingReady = false;
      });
    } catch (e) {
      setState(() { _canStart = false; _checkingReady = false; });
    }
  }

  /// 시험 시작
  Future<void> _startExam() async {
    try {
      final topics = await ApiService.get('/topics');
      final selectedIds = (topics as List)
          .where((t) => t['is_selected'] == 1)
          .map((t) => t['id'] as int)
          .toList();

      final data = await ApiService.post('/exam/start', {'topic_ids': selectedIds});
      setState(() {
        _questions = (data['questions'] as List).map((j) => Question.fromJson(j)).toList();
        _targetLevel = data['target_level'] ?? '';
        _targetWords = data['target_words'] ?? 60;
        _currentIndex = 0;
        _answers.clear();
        _state = 'preparing';
        _prepTime = 8;
      });
      _startPrepTimer();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('시험 시작 실패: $e'), backgroundColor: Theme.of(context).colorScheme.error),
        );
      }
    }
  }

  /// 준비 카운트다운 (8초)
  void _startPrepTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      setState(() { _prepTime--; });
      if (_prepTime <= 0) {
        t.cancel();
        _startAnswering();
      }
    });
  }

  /// 답변 시간 시작
  void _startAnswering() {
    final q = _questions[_currentIndex];
    final limit = q.timeLimit ?? (q.type == 'roleplay' ? 120 : 90);
    _answerCtrl.clear();
    setState(() {
      _state = 'answering';
      _timeLeft = limit;
      _totalTime = limit;
    });
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      setState(() { _timeLeft--; });
      if (_timeLeft <= 0) {
        t.cancel();
        _submitAnswer();
      }
    });
  }

  /// 단어 수 계산
  int _wordCount(String text) {
    return text.trim().isEmpty ? 0 : text.trim().split(RegExp(r'\s+')).length;
  }

  /// 답변 제출 → 다음 문제 or 완료
  void _submitAnswer() {
    _timer?.cancel();
    final q = _questions[_currentIndex];
    final text = _answerCtrl.text;
    _answers.add({
      'question_id': q.id,
      'answer_text': text,
      'word_count': _wordCount(text),
      'time_spent': _totalTime - _timeLeft,
      'question_text': q.questionText,
      'type': q.type,
    });

    if (_currentIndex < _questions.length - 1) {
      setState(() {
        _currentIndex++;
        _state = 'preparing';
        _prepTime = 8;
      });
      _startPrepTimer();
    } else {
      _completeExam();
    }
  }

  /// 시험 완료 → 결과 저장
  Future<void> _completeExam() async {
    _timer?.cancel();
    setState(() => _state = 'completed');
    try {
      await ApiService.post('/exam/sessions', {
        'target_level': _targetLevel,
        'answers': _answers,
      });
    } catch (e) {
      // 저장 실패해도 결과는 표시
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.extension<AppColors>()!;

    if (_checkingReady) return const Center(child: CircularProgressIndicator());

    switch (_state) {
      case 'idle':
        return _buildIdleView(theme, colors);
      case 'preparing':
        return _buildPrepView(theme);
      case 'answering':
        return _buildAnswerView(theme, colors);
      case 'completed':
        return _buildCompletedView(theme, colors);
      default:
        return const SizedBox();
    }
  }

  /// 시험 시작 대기 화면
  Widget _buildIdleView(ThemeData theme, AppColors colors) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('📝', style: TextStyle(fontSize: 64)),
            const SizedBox(height: 16),
            Text('OPIc 모의시험', style: theme.textTheme.headlineMedium),
            const SizedBox(height: 8),
            Text('5문제 (서베이 4 + 롤플레이 1)', style: theme.textTheme.bodySmall),
            const SizedBox(height: 24),
            if (!_canStart) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: colors.warning.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: colors.warning.withValues(alpha: 0.3)),
                ),
                child: Column(
                  children: [
                    Text('⚠️ 시험을 시작하려면:', style: TextStyle(color: colors.warning, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    Text('• 서베이 주제 3~5개를 선택하세요\n• 목표 레벨을 설정하세요',
                        style: theme.textTheme.bodySmall, textAlign: TextAlign.center),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _canStart ? _startExam : null,
                child: const Text('시험 시작'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// 준비 시간 카운트다운 화면
  Widget _buildPrepView(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('문제 ${_currentIndex + 1}/${_questions.length}', style: theme.textTheme.titleLarge),
          const SizedBox(height: 24),
          // SVG 원형 타이머를 Stack + CircularProgressIndicator로 대체
          SizedBox(
            width: 120,
            height: 120,
            child: Stack(
              alignment: Alignment.center,
              children: [
                CircularProgressIndicator(
                  value: _prepTime / 8,
                  strokeWidth: 6,
                  valueColor: AlwaysStoppedAnimation(theme.colorScheme.primary),
                  backgroundColor: theme.colorScheme.outline,
                ),
                Text(
                  '$_prepTime',
                  style: TextStyle(
                    fontSize: 40,
                    fontWeight: FontWeight.w700,
                    color: theme.colorScheme.primary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Text('준비 시간', style: theme.textTheme.bodySmall),
          const SizedBox(height: 24),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  _questions[_currentIndex].questionText,
                  style: theme.textTheme.bodyMedium,
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// 답변 입력 화면
  Widget _buildAnswerView(ThemeData theme, AppColors colors) {
    final q = _questions[_currentIndex];
    final wc = _wordCount(_answerCtrl.text);
    final progress = wc / _targetWords;
    final isWarning = _timeLeft < 30;

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 상단 정보
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('${_currentIndex + 1}/${_questions.length}', style: theme.textTheme.titleMedium),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: (isWarning ? theme.colorScheme.error : theme.colorScheme.primary).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  '${_timeLeft ~/ 60}:${(_timeLeft % 60).toString().padLeft(2, '0')}',
                  style: TextStyle(
                    color: isWarning ? theme.colorScheme.error : theme.colorScheme.primary,
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                  ),
                ),
              ),
            ],
          ),

          // 타이머 프로그레스 바
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: _totalTime > 0 ? _timeLeft / _totalTime : 0,
              backgroundColor: theme.colorScheme.outline,
              valueColor: AlwaysStoppedAnimation(
                isWarning ? theme.colorScheme.error : theme.colorScheme.primary,
              ),
              minHeight: 6,
            ),
          ),

          // 질문
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Text(q.questionText, style: theme.textTheme.bodyMedium),
            ),
          ),

          // 답변 입력
          const SizedBox(height: 12),
          Expanded(
            child: TextField(
              controller: _answerCtrl,
              maxLines: null,
              expands: true,
              textAlignVertical: TextAlignVertical.top,
              onChanged: (_) => setState(() {}),
              style: const TextStyle(fontSize: 15),
              decoration: InputDecoration(
                hintText: 'Type your answer here...',
                hintStyle: TextStyle(color: colors.textMuted),
                filled: true,
                fillColor: theme.colorScheme.surface,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: theme.colorScheme.outline),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: theme.colorScheme.outline),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: theme.colorScheme.primary),
                ),
              ),
            ),
          ),

          // 단어 수 + 달성률
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: progress.clamp(0.0, 1.0),
                    backgroundColor: theme.colorScheme.outline,
                    valueColor: AlwaysStoppedAnimation(
                      progress >= 1.0 ? colors.success : theme.colorScheme.primary,
                    ),
                    minHeight: 6,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Text(
                '$wc/$_targetWords 단어 — ${(progress * 100).clamp(0, 999).toInt()}%',
                style: TextStyle(
                  fontSize: 12,
                  color: progress >= 1.0 ? colors.success : theme.colorScheme.onSurface,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),

          // 다음 버튼
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _submitAnswer,
              child: Text(_currentIndex < _questions.length - 1 ? '다음' : '시험 완료'),
            ),
          ),
        ],
      ),
    );
  }

  /// 시험 완료 결과 화면
  Widget _buildCompletedView(ThemeData theme, AppColors colors) {
    final totalWords = _answers.fold<int>(0, (sum, a) => sum + (a['word_count'] as int));

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Center(child: Text('🎉', style: TextStyle(fontSize: 48))),
          const SizedBox(height: 8),
          Center(
            child: Text('시험 완료!', style: theme.textTheme.headlineMedium),
          ),
          const SizedBox(height: 4),
          Center(
            child: Text('총 단어 수: $totalWords', style: theme.textTheme.bodySmall),
          ),
          const SizedBox(height: 20),

          // 각 문제 요약
          ...List.generate(_answers.length, (i) {
            final a = _answers[i];
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('문제 ${i + 1}', style: theme.textTheme.titleMedium),
                        Text('${a['word_count']}단어 · ${a['time_spent']}초',
                            style: theme.textTheme.bodySmall),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(a['question_text'] ?? '', style: theme.textTheme.bodySmall?.copyWith(fontStyle: FontStyle.italic)),
                    const SizedBox(height: 6),
                    Text(a['answer_text'] ?? '(미응답)', style: theme.textTheme.bodyMedium),
                  ],
                ),
              ),
            );
          }),

          // 액션 버튼
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    setState(() {
                      _state = 'idle';
                    });
                    _checkReady();
                  },
                  child: const Text('다시 시험 보기'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
