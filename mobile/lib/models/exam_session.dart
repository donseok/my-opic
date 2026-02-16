/// 시험 세션 모델
class ExamSession {
  final int id;
  final String startedAt;
  final String? completedAt;
  final String targetLevel;
  final int totalWords;
  final String? predictedLevel;
  final int? grammarScore;
  final int? fluencyScore;
  final int? vocabularyScore;
  final List<ExamAnswer>? answers;

  ExamSession({
    required this.id,
    required this.startedAt,
    this.completedAt,
    required this.targetLevel,
    required this.totalWords,
    this.predictedLevel,
    this.grammarScore,
    this.fluencyScore,
    this.vocabularyScore,
    this.answers,
  });

  factory ExamSession.fromJson(Map<String, dynamic> json) {
    return ExamSession(
      id: json['id'],
      startedAt: json['started_at'] ?? '',
      completedAt: json['completed_at'],
      targetLevel: json['target_level'] ?? '',
      totalWords: json['total_words'] ?? 0,
      predictedLevel: json['predicted_level'],
      grammarScore: json['grammar_score'],
      fluencyScore: json['fluency_score'],
      vocabularyScore: json['vocabulary_score'],
      answers: json['answers'] != null
          ? (json['answers'] as List).map((a) => ExamAnswer.fromJson(a)).toList()
          : null,
    );
  }
}

/// 시험 답변 모델
class ExamAnswer {
  final int id;
  final int sessionId;
  final int questionId;
  final String answerText;
  final int wordCount;
  final int timeSpent;
  final int orderIndex;
  final String? questionText;
  final String? type;

  ExamAnswer({
    required this.id,
    required this.sessionId,
    required this.questionId,
    required this.answerText,
    required this.wordCount,
    required this.timeSpent,
    required this.orderIndex,
    this.questionText,
    this.type,
  });

  factory ExamAnswer.fromJson(Map<String, dynamic> json) {
    return ExamAnswer(
      id: json['id'] ?? 0,
      sessionId: json['session_id'] ?? 0,
      questionId: json['question_id'] ?? 0,
      answerText: json['answer_text'] ?? '',
      wordCount: json['word_count'] ?? 0,
      timeSpent: json['time_spent'] ?? 0,
      orderIndex: json['order_index'] ?? 0,
      questionText: json['question_text'],
      type: json['type'],
    );
  }
}
