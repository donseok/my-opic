import 'package:flutter/material.dart';
import 'screens/study_plan_screen.dart';
import 'screens/questions_screen.dart';
import 'screens/script_builder_screen.dart';
import 'screens/exam_screen.dart';
import 'screens/srs_review_screen.dart';
import 'screens/dashboard_screen.dart';
import 'services/api_service.dart';

/// OPIc Master 앱 진입점
void main() {
  runApp(const OPIcMasterApp());
}

/// 앱 루트 위젯
class OPIcMasterApp extends StatelessWidget {
  const OPIcMasterApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'OPIc Master',
      debugShowCheckedModeBanner: false,
      theme: _buildLightTheme(),
      home: const MainScreen(),
    );
  }

  /// 라이트 테마 — 웹 SPA 디자인 시스템과 동일한 색상
  ThemeData _buildLightTheme() {
    const bgPrimary = Color(0xFFFFFFFF);
    const bgSecondary = Color(0xFFF0F9FF);
    const bgCard = Color(0xFFFFFFFF);
    const borderColor = Color(0xFFE2E8F0);
    const accent = Color(0xFF0284C7);
    const accentLight = Color(0xFF38BDF8);
    const textPrimary = Color(0xFF0F172A);
    const textSecondary = Color(0xFF475569);
    const error = Color(0xFFEF4444);
    const success = Color(0xFF22C55E);

    return ThemeData(
      brightness: Brightness.light,
      scaffoldBackgroundColor: bgSecondary,
      primaryColor: accent,
      colorScheme: const ColorScheme.light(
        primary: accent,
        secondary: accentLight,
        surface: bgCard,
        error: error,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: textPrimary,
        onError: Colors.white,
        outline: borderColor,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: bgPrimary,
        foregroundColor: accent,
        elevation: 0,
        centerTitle: true,
        scrolledUnderElevation: 1,
        titleTextStyle: TextStyle(
          color: accent,
          fontSize: 20,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.5,
        ),
      ),
      cardTheme: CardThemeData(
        color: bgCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: borderColor),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: accent,
          foregroundColor: Colors.white,
          disabledBackgroundColor: const Color(0xFFCBD5E1),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: accent,
          side: const BorderSide(color: borderColor),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: bgPrimary,
        selectedItemColor: accent,
        unselectedItemColor: textSecondary,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
        selectedLabelStyle: TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
        unselectedLabelStyle: TextStyle(fontSize: 11),
      ),
      textTheme: const TextTheme(
        headlineMedium: TextStyle(color: textPrimary, fontWeight: FontWeight.w700),
        titleLarge: TextStyle(color: textPrimary, fontWeight: FontWeight.w700, fontSize: 18),
        titleMedium: TextStyle(color: textPrimary, fontWeight: FontWeight.w600),
        bodyLarge: TextStyle(color: textPrimary),
        bodyMedium: TextStyle(color: textPrimary),
        bodySmall: TextStyle(color: textSecondary, fontSize: 12),
        labelMedium: TextStyle(color: textSecondary, fontSize: 14),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: textPrimary,
        contentTextStyle: const TextStyle(color: Colors.white),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        behavior: SnackBarBehavior.floating,
      ),
      dividerColor: borderColor,
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: bgPrimary,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: borderColor),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: borderColor),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: accent, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      ),
      extensions: const <ThemeExtension<dynamic>>[
        AppColors(
          success: success,
          warning: Color(0xFFF59E0B),
          textMuted: Color(0xFF94A3B8),
          bgSecondary: bgSecondary,
        ),
      ],
    );
  }
}

/// 커스텀 색상 확장
class AppColors extends ThemeExtension<AppColors> {
  final Color success;
  final Color warning;
  final Color textMuted;
  final Color bgSecondary;

  const AppColors({
    required this.success,
    required this.warning,
    required this.textMuted,
    required this.bgSecondary,
  });

  @override
  AppColors copyWith({Color? success, Color? warning, Color? textMuted, Color? bgSecondary}) {
    return AppColors(
      success: success ?? this.success,
      warning: warning ?? this.warning,
      textMuted: textMuted ?? this.textMuted,
      bgSecondary: bgSecondary ?? this.bgSecondary,
    );
  }

  @override
  AppColors lerp(ThemeExtension<AppColors>? other, double t) {
    if (other is! AppColors) return this;
    return AppColors(
      success: Color.lerp(success, other.success, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
      textMuted: Color.lerp(textMuted, other.textMuted, t)!,
      bgSecondary: Color.lerp(bgSecondary, other.bgSecondary, t)!,
    );
  }
}

/// 메인 화면 — 5탭 바텀 네비게이션
class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  // 5개 탭 화면
  final List<Widget> _screens = const [
    StudyPlanScreen(),
    QuestionsScreen(),
    ExamScreen(),
    SrsReviewScreen(),
    DashboardScreen(),
  ];

  // 5개 탭 라벨
  final List<String> _labels = const [
    '학습플랜',
    '문제은행',
    '모의시험',
    '복습',
    '대시보드',
  ];

  // 5개 탭 아이콘
  final List<IconData> _icons = const [
    Icons.calendar_today_rounded,
    Icons.menu_book_rounded,
    Icons.edit_note_rounded,
    Icons.flip_rounded,
    Icons.bar_chart_rounded,
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('OPIc Master'),
          ],
        ),
        actions: [
          // 설정 (서베이, 레벨, 스크립트 등)
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert),
            onSelected: (value) {
              switch (value) {
                case 'survey':
                  Navigator.push(context, MaterialPageRoute(
                    builder: (_) => const _LazyScreen(type: 'survey'),
                  ));
                  break;
                case 'level':
                  Navigator.push(context, MaterialPageRoute(
                    builder: (_) => const _LazyScreen(type: 'level'),
                  ));
                  break;
                case 'scripts':
                  Navigator.push(context, MaterialPageRoute(
                    builder: (_) => const ScriptBuilderScreen(),
                  ));
                  break;
              }
            },
            itemBuilder: (_) => const [
              PopupMenuItem(value: 'survey', child: Text('서베이 설정')),
              PopupMenuItem(value: 'level', child: Text('레벨 설정')),
              PopupMenuItem(value: 'scripts', child: Text('스크립트')),
            ],
          ),
        ],
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        items: List.generate(5, (i) => BottomNavigationBarItem(
          icon: Icon(_icons[i]),
          label: _labels[i],
        )),
      ),
    );
  }
}

/// 서브 페이지를 lazy-load하는 래퍼
class _LazyScreen extends StatelessWidget {
  final String type;
  const _LazyScreen({required this.type});

  @override
  Widget build(BuildContext context) {
    // 기존 화면을 Navigator.push로 진입
    late final Widget screen;
    late final String title;

    switch (type) {
      case 'survey':
        // 동적 import 대신 직접 사용
        screen = const _SurveyScreenWrapper();
        title = '서베이 설정';
        break;
      case 'level':
        screen = const _LevelScreenWrapper();
        title = '레벨 설정';
        break;
      default:
        screen = const Center(child: Text('알 수 없는 화면'));
        title = '';
    }

    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: screen,
    );
  }
}

class _SurveyScreenWrapper extends StatelessWidget {
  const _SurveyScreenWrapper();

  @override
  Widget build(BuildContext context) {
    // SurveyScreen import
    return const _DynamicScreenLoader(screenName: 'survey');
  }
}

class _LevelScreenWrapper extends StatelessWidget {
  const _LevelScreenWrapper();

  @override
  Widget build(BuildContext context) {
    return const _DynamicScreenLoader(screenName: 'level');
  }
}

/// 기존 화면들을 lazy하게 로드하는 위젯
class _DynamicScreenLoader extends StatefulWidget {
  final String screenName;
  const _DynamicScreenLoader({required this.screenName});

  @override
  State<_DynamicScreenLoader> createState() => _DynamicScreenLoaderState();
}

class _DynamicScreenLoaderState extends State<_DynamicScreenLoader> {
  @override
  Widget build(BuildContext context) {
    switch (widget.screenName) {
      case 'survey':
        // Directly import and use SurveyScreen
        return _buildSurveyContent();
      case 'level':
        return _buildLevelContent();
      default:
        return const Center(child: Text('화면을 찾을 수 없습니다'));
    }
  }

  Widget _buildSurveyContent() {
    // Re-use the existing SurveyScreen body
    return const _EmbeddedSurveyScreen();
  }

  Widget _buildLevelContent() {
    return const _EmbeddedLevelScreen();
  }
}

/// 서베이 설정 화면 (embedded - AppBar 없음)
class _EmbeddedSurveyScreen extends StatefulWidget {
  const _EmbeddedSurveyScreen();
  @override
  State<_EmbeddedSurveyScreen> createState() => _EmbeddedSurveyScreenState();
}

class _EmbeddedSurveyScreenState extends State<_EmbeddedSurveyScreen> {
  List<Map<String, dynamic>> _topics = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadTopics();
  }

  Future<void> _loadTopics() async {
    try {
      final data = await ApiService.get('/topics');
      setState(() {
        _topics = List<Map<String, dynamic>>.from(data);
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Future<void> _toggleTopic(int id, bool selected) async {
    try {
      await ApiService.put('/topics/$id', {'is_selected': selected ? 1 : 0});
      _loadTopics();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('변경 실패: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_loading) return const Center(child: CircularProgressIndicator());

    final selected = _topics.where((t) => t['is_selected'] == 1).length;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('관심 주제를 3~5개 선택하세요', style: theme.textTheme.bodySmall),
        Text('$selected개 선택됨', style: TextStyle(
          color: selected >= 3 ? theme.extension<AppColors>()!.success : theme.extension<AppColors>()!.warning,
          fontWeight: FontWeight.w600, fontSize: 13,
        )),
        const SizedBox(height: 12),
        ..._topics.map((t) {
          final isSelected = t['is_selected'] == 1;
          return Card(
            margin: const EdgeInsets.only(bottom: 6),
            color: isSelected ? theme.colorScheme.primary.withValues(alpha: 0.06) : null,
            child: ListTile(
              title: Text(t['name'] ?? '', style: const TextStyle(fontSize: 14)),
              trailing: Switch(
                value: isSelected,
                activeColor: theme.colorScheme.primary,
                onChanged: (val) => _toggleTopic(t['id'], val),
              ),
            ),
          );
        }),
      ],
    );
  }
}

/// 레벨 설정 화면 (embedded - AppBar 없음)
class _EmbeddedLevelScreen extends StatefulWidget {
  const _EmbeddedLevelScreen();
  @override
  State<_EmbeddedLevelScreen> createState() => _EmbeddedLevelScreenState();
}

class _EmbeddedLevelScreenState extends State<_EmbeddedLevelScreen> {
  String? _currentLevel;
  String? _targetLevel;
  bool _loading = true;
  final List<String> _levels = const ['NL', 'NM', 'NH', 'IL', 'IM1', 'IM2', 'IM3', 'IH', 'AL'];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await ApiService.get('/settings');
      setState(() {
        _currentLevel = data['current_level'];
        _targetLevel = data['target_level'];
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Future<void> _save(String field, String value) async {
    try {
      await ApiService.put('/settings', {field: value});
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('저장 실패: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (_loading) return const Center(child: CircularProgressIndicator());

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('현재 레벨', style: theme.textTheme.titleMedium),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: _levels.map((lv) {
            final selected = lv == _currentLevel;
            return ChoiceChip(
              label: Text(lv),
              selected: selected,
              selectedColor: theme.colorScheme.primary.withValues(alpha: 0.15),
              onSelected: (_) => _save('current_level', lv),
            );
          }).toList(),
        ),
        const SizedBox(height: 24),
        Text('목표 레벨', style: theme.textTheme.titleMedium),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: _levels.map((lv) {
            final selected = lv == _targetLevel;
            return ChoiceChip(
              label: Text(lv),
              selected: selected,
              selectedColor: theme.extension<AppColors>()!.success.withValues(alpha: 0.15),
              onSelected: (_) => _save('target_level', lv),
            );
          }).toList(),
        ),
      ],
    );
  }
}
