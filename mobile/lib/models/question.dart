/// 질문 모델
class Question {
  final int id;
  final int topicId;
  final String questionText;
  final String type;
  final String difficulty;
  final String? topicName;
  final int? timeLimit;

  Question({
    required this.id,
    required this.topicId,
    required this.questionText,
    required this.type,
    required this.difficulty,
    this.topicName,
    this.timeLimit,
  });

  factory Question.fromJson(Map<String, dynamic> json) {
    return Question(
      id: json['id'],
      topicId: json['topic_id'] ?? 0,
      questionText: json['question_text'] ?? '',
      type: json['type'] ?? 'survey',
      difficulty: json['difficulty'] ?? 'medium',
      topicName: json['topic_name'],
      timeLimit: json['time_limit'],
    );
  }
}

/// 답변 가이드 모델
class AnswerGuide {
  final int id;
  final int questionId;
  final String levelCode;
  final String structure;
  final List<String> keyPhrases;
  final int targetWords;

  AnswerGuide({
    required this.id,
    required this.questionId,
    required this.levelCode,
    required this.structure,
    required this.keyPhrases,
    required this.targetWords,
  });

  factory AnswerGuide.fromJson(Map<String, dynamic> json) {
    List<String> phrases = [];
    if (json['key_phrases'] != null) {
      if (json['key_phrases'] is String) {
        try {
          phrases = List<String>.from(
            (json['key_phrases'] as String).isNotEmpty
                ? List.from(json['key_phrases'] is List ? json['key_phrases'] : [])
                : [],
          );
        } catch (_) {
          phrases = [];
        }
      } else if (json['key_phrases'] is List) {
        phrases = List<String>.from(json['key_phrases']);
      }
    }
    return AnswerGuide(
      id: json['id'] ?? 0,
      questionId: json['question_id'] ?? 0,
      levelCode: json['level_code'] ?? '',
      structure: json['structure'] ?? '',
      keyPhrases: phrases,
      targetWords: json['target_words'] ?? 0,
    );
  }
}
