/// 대시보드 통계 모델
class DashboardStats {
  final int totalExams;
  final double avgGrammar;
  final double avgFluency;
  final double avgVocabulary;
  final double avgPronunciation;
  final double avgOrganization;
  final String? currentLevel;
  final String? targetLevel;
  final String? latestPredictedLevel;

  DashboardStats({
    required this.totalExams,
    required this.avgGrammar,
    required this.avgFluency,
    required this.avgVocabulary,
    required this.avgPronunciation,
    required this.avgOrganization,
    this.currentLevel,
    this.targetLevel,
    this.latestPredictedLevel,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      totalExams: json['total_exams'] ?? 0,
      avgGrammar: (json['avg_grammar'] ?? 0).toDouble(),
      avgFluency: (json['avg_fluency'] ?? 0).toDouble(),
      avgVocabulary: (json['avg_vocabulary'] ?? 0).toDouble(),
      avgPronunciation: (json['avg_pronunciation'] ?? 0).toDouble(),
      avgOrganization: (json['avg_organization'] ?? 0).toDouble(),
      currentLevel: json['current_level'],
      targetLevel: json['target_level'],
      latestPredictedLevel: json['latest_predicted_level'],
    );
  }
}
