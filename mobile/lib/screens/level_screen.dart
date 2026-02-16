import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/level.dart';
import '../main.dart';

/// 레벨 설정 화면 (FR-009~013)
/// 9단계 레벨 선택, 갭 분석, 프로그레스 바
class LevelScreen extends StatefulWidget {
  const LevelScreen({super.key});

  @override
  State<LevelScreen> createState() => _LevelScreenState();
}

class _LevelScreenState extends State<LevelScreen> {
  List<Level> _levels = [];
  String? _currentLevel;
  String? _targetLevel;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final levelsData = await ApiService.get('/levels');
      final settingsData = await ApiService.get('/settings');
      setState(() {
        _levels = (levelsData as List).map((j) => Level.fromJson(j)).toList();
        _currentLevel = settingsData['current_level'];
        _targetLevel = settingsData['target_level'];
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  int _levelIndex(String? code) {
    if (code == null) return -1;
    return _levels.indexWhere((l) => l.code == code);
  }

  Level? _levelByCode(String? code) {
    if (code == null) return null;
    try {
      return _levels.firstWhere((l) => l.code == code);
    } catch (_) {
      return null;
    }
  }

  Future<void> _save() async {
    if (_currentLevel == null || _targetLevel == null) return;
    try {
      await ApiService.put('/settings', {
        'current_level': _currentLevel,
        'target_level': _targetLevel,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('레벨 설정이 저장되었습니다'),
            backgroundColor: Theme.of(context).extension<AppColors>()!.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('저장 실패: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.extension<AppColors>()!;

    if (_loading) return const Center(child: CircularProgressIndicator());

    final currentIdx = _levelIndex(_currentLevel);
    final targetIdx = _levelIndex(_targetLevel);
    final gap = (currentIdx >= 0 && targetIdx >= 0) ? targetIdx - currentIdx : 0;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('레벨 설정', style: theme.textTheme.titleLarge),
          const SizedBox(height: 16),

          // 현재 레벨 선택
          Text('현재 레벨', style: theme.textTheme.titleMedium),
          const SizedBox(height: 4),
          Text('현재 본인의 OPIc 등급을 선택하세요', style: theme.textTheme.bodySmall),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _levels.map((level) {
              final selected = _currentLevel == level.code;
              return ChoiceChip(
                label: Text(level.code),
                selected: selected,
                selectedColor: theme.colorScheme.primary.withValues(alpha: 0.2),
                labelStyle: TextStyle(
                  color: selected ? theme.colorScheme.primary : theme.colorScheme.onSurface,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                ),
                side: BorderSide(
                  color: selected ? theme.colorScheme.primary : theme.colorScheme.outline,
                ),
                onSelected: (_) {
                  setState(() {
                    _currentLevel = level.code;
                    // 목표 레벨이 현재보다 낮으면 초기화
                    if (_targetLevel != null && _levelIndex(_targetLevel) <= _levelIndex(level.code)) {
                      _targetLevel = null;
                    }
                  });
                },
              );
            }).toList(),
          ),

          const SizedBox(height: 24),

          // 목표 레벨 선택
          Text('목표 레벨', style: theme.textTheme.titleMedium),
          const SizedBox(height: 4),
          Text('달성하고 싶은 OPIc 등급을 선택하세요', style: theme.textTheme.bodySmall),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _levels.map((level) {
              final levelIdx = _levels.indexOf(level);
              final disabled = currentIdx >= 0 && levelIdx <= currentIdx;
              final selected = _targetLevel == level.code;
              return ChoiceChip(
                label: Text(level.code),
                selected: selected,
                selectedColor: theme.colorScheme.primary.withValues(alpha: 0.2),
                labelStyle: TextStyle(
                  color: disabled
                      ? colors.textMuted
                      : selected
                          ? theme.colorScheme.primary
                          : theme.colorScheme.onSurface,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                ),
                side: BorderSide(
                  color: disabled
                      ? colors.textMuted.withValues(alpha: 0.3)
                      : selected
                          ? theme.colorScheme.primary
                          : theme.colorScheme.outline,
                ),
                onSelected: disabled ? null : (_) {
                  setState(() => _targetLevel = level.code);
                },
              );
            }).toList(),
          ),

          // 갭 분석
          if (_currentLevel != null && _targetLevel != null) ...[
            const SizedBox(height: 24),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('갭 분석', style: theme.textTheme.titleMedium),
                    const SizedBox(height: 12),

                    // 레벨 진행률 바
                    Row(
                      children: [
                        Text(_currentLevel!, style: TextStyle(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.w700,
                        )),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: _levels.isEmpty ? 0 : (currentIdx + 1) / _levels.length,
                              backgroundColor: theme.colorScheme.outline,
                              valueColor: AlwaysStoppedAnimation(theme.colorScheme.primary),
                              minHeight: 8,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(_targetLevel!, style: TextStyle(
                          color: colors.warning,
                          fontWeight: FontWeight.w700,
                        )),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // 상세 정보
                    _InfoRow(label: '단계 차이', value: '$gap 단계'),
                    _InfoRow(
                      label: '현재 권장 단어 수',
                      value: '${_levelByCode(_currentLevel)?.minWords ?? 0}단어',
                    ),
                    _InfoRow(
                      label: '목표 권장 단어 수',
                      value: '${_levelByCode(_targetLevel)?.minWords ?? 0}단어',
                    ),
                    _InfoRow(
                      label: '예상 학습 기간',
                      value: '약 ${gap * 4}~${gap * 8}주',
                    ),
                  ],
                ),
              ),
            ),
          ],

          // 저장 버튼
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: (_currentLevel != null && _targetLevel != null) ? _save : null,
              child: const Text('설정 저장'),
            ),
          ),
        ],
      ),
    );
  }
}

/// 정보 행 위젯
class _InfoRow extends StatelessWidget {
  final String label;
  final String value;

  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodySmall),
          Text(value, style: TextStyle(
            color: Theme.of(context).colorScheme.onSurface,
            fontWeight: FontWeight.w600,
            fontSize: 14,
          )),
        ],
      ),
    );
  }
}
