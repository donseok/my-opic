import 'dart:convert';

/// AI 피드백 모델
class Feedback {
  final int? id;
  final int sessionId;
  final String predictedLevel;
  final int grammarScore;
  final int fluencyScore;
  final int vocabularyScore;
  final int pronunciationScore;
  final int organizationScore;
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
    required this.pronunciationScore,
    required this.organizationScore,
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
      pronunciationScore: json['pronunciation_score'] ?? 0,
      organizationScore: json['content_organization_score'] ?? 0,
      strengths: _parseStringList(json['strengths']),
      improvements: _parseStringList(json['improvements']),
      createdAt: json['created_at'],
    );
  }

  static List<String> _parseStringList(dynamic value) {
    if (value == null) return [];
    if (value is List) return List<String>.from(value);
    if (value is String) {
      try {
        final decoded = jsonDecode(value);
        if (decoded is List) return List<String>.from(decoded);
      } catch (_) {}
      return [value];
    }
    return [];
  }
}
