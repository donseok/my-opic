/// AI 피드백 모델
class Feedback {
  final int? id;
  final int sessionId;
  final String predictedLevel;
  final int grammarScore;
  final int fluencyScore;
  final int vocabularyScore;
  final List<String> strengths;
  final List<String> improvements;
  final String? createdAt;

  Feedback({
    this.id,
    required this.sessionId,
    required this.predictedLevel,
    required this.grammarScore,
    required this.fluencyScore,
    required this.vocabularyScore,
    required this.strengths,
    required this.improvements,
    this.createdAt,
  });

  factory Feedback.fromJson(Map<String, dynamic> json) {
    return Feedback(
      id: json['id'],
      sessionId: json['session_id'] ?? 0,
      predictedLevel: json['predicted_level'] ?? '',
      grammarScore: json['grammar_score'] ?? 0,
      fluencyScore: json['fluency_score'] ?? 0,
      vocabularyScore: json['vocabulary_score'] ?? 0,
      strengths: json['strengths'] != null
          ? List<String>.from(json['strengths'])
          : [],
      improvements: json['improvements'] != null
          ? List<String>.from(json['improvements'])
          : [],
      createdAt: json['created_at'],
    );
  }
}
