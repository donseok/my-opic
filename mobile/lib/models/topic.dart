/// 서베이 주제 모델
class Topic {
  final int id;
  final String name;
  final String nameEn;
  final String icon;
  final bool isSelected;

  Topic({
    required this.id,
    required this.name,
    required this.nameEn,
    required this.icon,
    required this.isSelected,
  });

  factory Topic.fromJson(Map<String, dynamic> json) {
    return Topic(
      id: json['id'],
      name: json['name'] ?? '',
      nameEn: json['name_en'] ?? '',
      icon: json['icon'] ?? '📌',
      isSelected: (json['is_selected'] ?? 0) == 1,
    );
  }
}
