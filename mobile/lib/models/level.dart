/// 레벨 모델
class Level {
  final int id;
  final String code;
  final String name;
  final String description;
  final int minWords;
  final int orderIndex;

  Level({
    required this.id,
    required this.code,
    required this.name,
    required this.description,
    required this.minWords,
    required this.orderIndex,
  });

  factory Level.fromJson(Map<String, dynamic> json) {
    return Level(
      id: json['id'],
      code: json['code'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      minWords: json['min_words'] ?? 0,
      orderIndex: json['order_index'] ?? 0,
    );
  }
}
