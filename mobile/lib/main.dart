import 'package:flutter/material.dart';
import 'screens/survey_screen.dart';
import 'screens/questions_screen.dart';
import 'screens/exam_screen.dart';
import 'screens/feedback_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/level_screen.dart';

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
      theme: _buildDarkTheme(),
      home: const MainScreen(),
    );
  }

  /// 다크 모드 테마 — 웹 SPA 디자인 시스템과 동일한 색상
  ThemeData _buildDarkTheme() {
    const bgPrimary = Color(0xFF0F172A);
    const bgCard = Color(0xFF1E293B);
    const borderColor = Color(0xFF334155);
    const accent = Color(0xFF2DD4BF);
    const accentHover = Color(0xFF14B8A6);
    const textPrimary = Color(0xFFF1F5F9);
    const textSecondary = Color(0xFF94A3B8);
    const error = Color(0xFFEF4444);
    const success = Color(0xFF22C55E);

    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: bgPrimary,
      primaryColor: accent,
      colorScheme: const ColorScheme.dark(
        primary: accent,
        secondary: accentHover,
        surface: bgCard,
        error: error,
        onPrimary: bgPrimary,
        onSecondary: bgPrimary,
        onSurface: textPrimary,
        onError: Colors.white,
        outline: borderColor,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: bgCard,
        foregroundColor: accent,
        elevation: 0,
        centerTitle: true,
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
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: borderColor),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: accent,
          foregroundColor: bgPrimary,
          disabledBackgroundColor: const Color(0xFF64748B),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: bgCard,
        selectedItemColor: accent,
        unselectedItemColor: textSecondary,
        type: BottomNavigationBarType.fixed,
        selectedLabelStyle: TextStyle(fontSize: 11),
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
        backgroundColor: bgCard,
        contentTextStyle: const TextStyle(color: textPrimary),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        behavior: SnackBarBehavior.floating,
      ),
      dividerColor: borderColor,
      extensions: const <ThemeExtension<dynamic>>[
        AppColors(
          success: success,
          warning: Color(0xFFFBBF24),
          textMuted: Color(0xFF64748B),
          bgCardHover: Color(0xFF253449),
        ),
      ],
    );
  }
}

/// 커스텀 색상 확장 (success, warning 등)
class AppColors extends ThemeExtension<AppColors> {
  final Color success;
  final Color warning;
  final Color textMuted;
  final Color bgCardHover;

  const AppColors({
    required this.success,
    required this.warning,
    required this.textMuted,
    required this.bgCardHover,
  });

  @override
  AppColors copyWith({Color? success, Color? warning, Color? textMuted, Color? bgCardHover}) {
    return AppColors(
      success: success ?? this.success,
      warning: warning ?? this.warning,
      textMuted: textMuted ?? this.textMuted,
      bgCardHover: bgCardHover ?? this.bgCardHover,
    );
  }

  @override
  AppColors lerp(ThemeExtension<AppColors>? other, double t) {
    if (other is! AppColors) return this;
    return AppColors(
      success: Color.lerp(success, other.success, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
      textMuted: Color.lerp(textMuted, other.textMuted, t)!,
      bgCardHover: Color.lerp(bgCardHover, other.bgCardHover, t)!,
    );
  }
}

/// 메인 화면 — 하단 탭바 네비게이션
class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  // 6개 탭 화면
  final List<Widget> _screens = const [
    SurveyScreen(),
    QuestionsScreen(),
    ExamScreen(),
    FeedbackScreen(),
    DashboardScreen(),
    LevelScreen(),
  ];

  // 6개 탭 라벨
  final List<String> _labels = const [
    '서베이',
    '문제은행',
    '모의시험',
    'AI피드백',
    '대시보드',
    '레벨설정',
  ];

  // 6개 탭 아이콘
  final List<IconData> _icons = const [
    Icons.checklist_rounded,
    Icons.menu_book_rounded,
    Icons.edit_note_rounded,
    Icons.chat_bubble_outline_rounded,
    Icons.bar_chart_rounded,
    Icons.track_changes_rounded,
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('🎓 ', style: TextStyle(fontSize: 22)),
            Text('OPIc Master'),
          ],
        ),
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        items: List.generate(6, (i) => BottomNavigationBarItem(
          icon: Icon(_icons[i]),
          label: _labels[i],
        )),
      ),
    );
  }
}
