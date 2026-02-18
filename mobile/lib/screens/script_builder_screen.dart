import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../main.dart';
import 'sentence_practice_screen.dart';

/// 스크립트 빌더 화면
/// 4가지 뷰: list, detail, create, flashcard
class ScriptBuilderScreen extends StatefulWidget {
  const ScriptBuilderScreen({super.key});

  @override
  State<ScriptBuilderScreen> createState() => _ScriptBuilderScreenState();
}

class _ScriptBuilderScreenState extends State<ScriptBuilderScreen> {
  // 뷰 상태: list, detail, create, flashcard
  String _view = 'list';

  // 리스트 뷰
  List<Map<String, dynamic>> _scripts = [];
  bool _loading = true;
  String _filter = '전체';
  static const List<String> _filterTabs = ['전체', '초안', '다듬기 완료', '암기 중', '완료'];
  static const Map<String, String> _filterToStatus = {
    '전체': '',
    '초안': 'draft',
    '다듬기 완료': 'refined',
    '암기 중': 'memorizing',
    '완료': 'mastered',
  };

  // 상세 뷰
  Map<String, dynamic>? _selectedScript;
  final TextEditingController _contentCtrl = TextEditingController();
  bool _saving = false;
  bool _refining = false;

  // 생성 뷰
  final TextEditingController _titleCtrl = TextEditingController();
  final TextEditingController _questionCtrl = TextEditingController();
  String _targetLevel = 'IM2';
  bool _creating = false;
  static const List<String> _levels = ['IM1', 'IM2', 'IM3', 'IH', 'AL'];

  // 플래시카드 뷰
  List<String> _sentences = [];
  int _revealedCount = 0;

  @override
  void initState() {
    super.initState();
    _loadScripts();
  }

  @override
  void dispose() {
    _contentCtrl.dispose();
    _titleCtrl.dispose();
    _questionCtrl.dispose();
    super.dispose();
  }

  /// 단어 수 계산
  int _wordCount(String text) {
    return text.trim().split(RegExp(r'\s+')).where((w) => w.isNotEmpty).length;
  }

  /// 스크립트 목록 로드
  Future<void> _loadScripts() async {
    setState(() => _loading = true);
    try {
      final data = await ApiService.get('/scripts');
      setState(() {
        _scripts = List<Map<String, dynamic>>.from(data);
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  /// 필터링된 스크립트 목록
  List<Map<String, dynamic>> get _filteredScripts {
    final statusKey = _filterToStatus[_filter] ?? '';
    if (statusKey.isEmpty) return _scripts;
    return _scripts.where((s) => s['status'] == statusKey).toList();
  }

  /// 상태 한국어 라벨
  String _statusLabel(String? status) {
    switch (status) {
      case 'draft':
        return '초안';
      case 'refined':
        return '다듬기 완료';
      case 'memorizing':
        return '암기 중';
      case 'mastered':
        return '완료';
      default:
        return '초안';
    }
  }

  /// 상태별 색상
  Color _statusColor(String? status, ThemeData theme, AppColors colors) {
    switch (status) {
      case 'draft':
        return colors.textMuted;
      case 'refined':
        return theme.colorScheme.primary;
      case 'memorizing':
        return colors.warning;
      case 'mastered':
        return colors.success;
      default:
        return colors.textMuted;
    }
  }

  /// 스크립트 상세 보기
  void _openDetail(Map<String, dynamic> script) {
    setState(() {
      _selectedScript = script;
      _contentCtrl.text = script['content'] ?? '';
      _view = 'detail';
    });
  }

  /// 리스트 뷰로 돌아가기
  void _goBackToList() {
    setState(() {
      _view = 'list';
      _selectedScript = null;
    });
    _loadScripts();
  }

  /// 저장
  Future<void> _saveScript() async {
    if (_selectedScript == null) return;
    setState(() => _saving = true);
    try {
      await ApiService.put('/scripts/${_selectedScript!['id']}', {
        'content': _contentCtrl.text,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('저장되었습니다')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('저장 실패: $e')),
        );
      }
    } finally {
      setState(() => _saving = false);
    }
  }

  /// AI 다듬기
  Future<void> _refineScript() async {
    if (_selectedScript == null) return;
    setState(() => _refining = true);
    try {
      final result = await ApiService.post(
        '/scripts/${_selectedScript!['id']}/refine',
        {},
      );
      final newContent = result['content'] ?? _contentCtrl.text;
      setState(() {
        _contentCtrl.text = newContent;
        _selectedScript!['content'] = newContent;
        _selectedScript!['status'] = result['status'] ?? 'refined';
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('AI 다듬기가 완료되었습니다')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('다듬기 실패: $e')),
        );
      }
    } finally {
      setState(() => _refining = false);
    }
  }

  /// 삭제
  Future<void> _deleteScript() async {
    if (_selectedScript == null) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('스크립트 삭제'),
        content: const Text('이 스크립트를 삭제하시겠습니까?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('취소'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(
              '삭제',
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    try {
      await ApiService.delete('/scripts/${_selectedScript!['id']}');
      _goBackToList();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('삭제 실패: $e')),
        );
      }
    }
  }

  /// 플래시카드 시작
  void _startFlashcard() {
    final content = _contentCtrl.text;
    if (content.trim().isEmpty) return;
    final sentences = content
        .split(RegExp(r'(?<=[.!?])\s+'))
        .where((s) => s.trim().isNotEmpty)
        .toList();
    setState(() {
      _sentences = sentences;
      _revealedCount = 1;
      _view = 'flashcard';
    });
  }

  /// 플래시카드에서 다음 문장 표시
  void _revealNext() {
    if (_revealedCount < _sentences.length) {
      setState(() => _revealedCount++);
    }
  }

  /// 플래시카드 완료 → 진행률 업데이트
  Future<void> _completeFlashcard() async {
    if (_selectedScript == null) return;
    final currentProgress = (_selectedScript!['memorization_progress'] ?? 0).toDouble();
    final newProgress = (currentProgress + 10).clamp(0.0, 100.0);

    try {
      await ApiService.post('/scripts/${_selectedScript!['id']}/practice', {
        'memorization_progress': newProgress,
      });
      setState(() {
        _selectedScript!['memorization_progress'] = newProgress;
        _view = 'detail';
      });
    } catch (e) {
      setState(() => _view = 'detail');
    }
  }

  /// 생성 뷰 열기
  void _openCreate() {
    _titleCtrl.clear();
    _questionCtrl.clear();
    _targetLevel = 'IM2';
    setState(() => _view = 'create');
  }

  /// 수동 생성
  Future<void> _createManual() async {
    if (_titleCtrl.text.trim().isEmpty) return;
    setState(() => _creating = true);
    try {
      await ApiService.post('/scripts', {
        'title': _titleCtrl.text.trim(),
        'question_text': _questionCtrl.text.trim(),
        'target_level': _targetLevel,
        'content': '',
      });
      _goBackToList();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('생성 실패: $e')),
        );
      }
    } finally {
      setState(() => _creating = false);
    }
  }

  /// AI 자동 생성
  Future<void> _generateScript() async {
    if (_titleCtrl.text.trim().isEmpty) return;
    setState(() => _creating = true);
    try {
      final result = await ApiService.post('/scripts/generate', {
        'title': _titleCtrl.text.trim(),
        'question_text': _questionCtrl.text.trim(),
        'target_level': _targetLevel,
      });
      // 생성된 스크립트의 상세로 이동
      final script = Map<String, dynamic>.from(result);
      setState(() {
        _selectedScript = script;
        _contentCtrl.text = script['content'] ?? '';
        _view = 'detail';
        _creating = false;
      });
      _loadScripts(); // 백그라운드에서 목록 갱신
    } catch (e) {
      setState(() => _creating = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('AI 생성 실패: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    switch (_view) {
      case 'detail':
        return _buildDetailView(context);
      case 'create':
        return _buildCreateView(context);
      case 'flashcard':
        return _buildFlashcardView(context);
      default:
        return _buildListView(context);
    }
  }

  /// ─── 리스트 뷰 ───
  Widget _buildListView(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.extension<AppColors>()!;

    return Scaffold(
      body: Column(
        children: [
          // 필터 탭
          SizedBox(
            height: 44,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              itemCount: _filterTabs.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, index) {
                final tab = _filterTabs[index];
                final isActive = tab == _filter;
                return ChoiceChip(
                  label: Text(tab, style: const TextStyle(fontSize: 12)),
                  selected: isActive,
                  selectedColor: theme.colorScheme.primary.withValues(alpha: 0.15),
                  onSelected: (_) => setState(() => _filter = tab),
                  visualDensity: VisualDensity.compact,
                );
              },
            ),
          ),

          // 스크립트 목록
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _filteredScripts.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Text('\u{1F4C4}',
                                style: TextStyle(fontSize: 48)), // 📄
                            const SizedBox(height: 12),
                            Text('스크립트가 없습니다',
                                style: theme.textTheme.bodyMedium),
                            const SizedBox(height: 4),
                            Text('새로운 스크립트를 만들어보세요',
                                style: theme.textTheme.bodySmall),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadScripts,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _filteredScripts.length,
                          itemBuilder: (_, index) {
                            final script = _filteredScripts[index];
                            return _ScriptCard(
                              script: script,
                              statusLabel: _statusLabel(script['status']),
                              statusColor: _statusColor(
                                  script['status'], theme, colors),
                              wordCount: _wordCount(script['content'] ?? ''),
                              onTap: () => _openDetail(script),
                              theme: theme,
                              colors: colors,
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _openCreate,
        backgroundColor: theme.colorScheme.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  /// ─── 상세 뷰 ───
  Widget _buildDetailView(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.extension<AppColors>()!;
    final script = _selectedScript!;
    final status = script['status'] ?? 'draft';
    final questionText = script['question_text'] ?? '';
    final wc = _wordCount(_contentCtrl.text);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: _goBackToList,
        ),
        title: Text(
          script['title'] ?? '스크립트',
          overflow: TextOverflow.ellipsis,
        ),
        actions: [
          // 상태 뱃지
          Center(
            child: Container(
              margin: const EdgeInsets.only(right: 12),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: _statusColor(status, theme, colors).withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                _statusLabel(status),
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: _statusColor(status, theme, colors),
                ),
              ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 질문 텍스트
            if (questionText.isNotEmpty) ...[
              Card(
                color: colors.bgSecondary,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.help_outline, size: 18,
                          color: theme.colorScheme.primary),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          questionText,
                          style: theme.textTheme.bodySmall?.copyWith(
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
            ],

            // 내용 편집
            TextField(
              controller: _contentCtrl,
              maxLines: 12,
              onChanged: (_) => setState(() {}),
              style: const TextStyle(fontSize: 14, height: 1.6),
              decoration: InputDecoration(
                hintText: '스크립트 내용을 입력하세요...',
                hintStyle: TextStyle(color: colors.textMuted),
                alignLabelWithHint: true,
              ),
            ),

            // 단어 수
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: Text(
                '$wc 단어',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: colors.textMuted,
                ),
              ),
            ),

            // 액션 버튼들
            const SizedBox(height: 20),

            // 저장 + AI 다듬기
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _saving ? null : _saveScript,
                    icon: _saving
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.white),
                          )
                        : const Icon(Icons.save_rounded, size: 18),
                    label: const Text('저장'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _refining ? null : _refineScript,
                    icon: _refining
                        ? SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: theme.colorScheme.primary,
                            ),
                          )
                        : const Icon(Icons.auto_awesome, size: 18),
                    label: const Text('AI 다듬기'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // 암기 시작 + 플래시카드
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      // 상태를 memorizing으로 변경
                      ApiService.put('/scripts/${script['id']}', {
                        'content': _contentCtrl.text,
                        'status': 'memorizing',
                      }).then((_) {
                        setState(() {
                          _selectedScript!['status'] = 'memorizing';
                        });
                      });
                    },
                    icon: const Icon(Icons.psychology_rounded, size: 18),
                    label: const Text('암기 시작'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _contentCtrl.text.trim().isNotEmpty
                        ? _startFlashcard
                        : null,
                    icon: const Icon(Icons.flip_rounded, size: 18),
                    label: const Text('플래시카드'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // 문장별 발음 연습
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _contentCtrl.text.trim().isNotEmpty
                    ? () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => SentencePracticeScreen(
                              scriptId: script['id'],
                              scriptTitle: script['title'] ?? '문장 연습',
                            ),
                          ),
                        );
                      }
                    : null,
                icon: const Icon(Icons.record_voice_over_rounded, size: 18),
                label: const Text('문장별 발음 연습'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF7C3AED),
                  foregroundColor: Colors.white,
                ),
              ),
            ),
            const SizedBox(height: 8),

            // 삭제
            SizedBox(
              width: double.infinity,
              child: TextButton.icon(
                onPressed: _deleteScript,
                icon: Icon(Icons.delete_outline,
                    size: 18, color: theme.colorScheme.error),
                label: Text(
                  '스크립트 삭제',
                  style: TextStyle(color: theme.colorScheme.error),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// ─── 생성 뷰 ───
  Widget _buildCreateView(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.extension<AppColors>()!;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: _goBackToList,
        ),
        title: const Text('새 스크립트'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 제목
            Text('제목', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            TextField(
              controller: _titleCtrl,
              decoration: InputDecoration(
                hintText: '스크립트 제목을 입력하세요',
                hintStyle: TextStyle(color: colors.textMuted),
              ),
            ),
            const SizedBox(height: 20),

            // 질문 (선택)
            Text('질문 (선택)', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            TextField(
              controller: _questionCtrl,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: 'OPIc 질문을 입력하세요 (선택사항)',
                hintStyle: TextStyle(color: colors.textMuted),
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 20),

            // 목표 레벨
            Text('목표 레벨', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: _levels.map((lv) {
                final selected = lv == _targetLevel;
                return ChoiceChip(
                  label: Text(lv),
                  selected: selected,
                  selectedColor:
                      theme.colorScheme.primary.withValues(alpha: 0.15),
                  onSelected: (_) => setState(() => _targetLevel = lv),
                );
              }).toList(),
            ),
            const SizedBox(height: 32),

            // AI 생성 버튼
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _creating ? null : _generateScript,
                icon: _creating
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.auto_awesome, size: 18),
                label: const Text('AI 자동 생성'),
              ),
            ),
            const SizedBox(height: 8),

            // 수동 생성 버튼
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: _creating ? null : _createManual,
                icon: const Icon(Icons.edit_rounded, size: 18),
                label: const Text('빈 스크립트 만들기'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// ─── 플래시카드 뷰 ───
  Widget _buildFlashcardView(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.extension<AppColors>()!;
    final isComplete = _revealedCount >= _sentences.length;
    final progress = _sentences.isEmpty
        ? 0.0
        : _revealedCount / _sentences.length;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => setState(() => _view = 'detail'),
        ),
        title: const Text('플래시카드'),
      ),
      body: GestureDetector(
        onTap: isComplete ? null : _revealNext,
        behavior: HitTestBehavior.opaque,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              // 진행 바
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: progress,
                  backgroundColor:
                      theme.colorScheme.outline.withValues(alpha: 0.3),
                  valueColor:
                      AlwaysStoppedAnimation(theme.colorScheme.primary),
                  minHeight: 6,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '$_revealedCount / ${_sentences.length}',
                style: theme.textTheme.bodySmall,
              ),

              // 문장 카드
              const SizedBox(height: 24),
              Expanded(
                child: Card(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: List.generate(
                        _revealedCount,
                        (i) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Text(
                            _sentences[i],
                            style: TextStyle(
                              fontSize: 16,
                              height: 1.6,
                              color: i == _revealedCount - 1
                                  ? theme.colorScheme.primary
                                  : theme.colorScheme.onSurface,
                              fontWeight: i == _revealedCount - 1
                                  ? FontWeight.w600
                                  : FontWeight.normal,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),

              // 진행 도트
              const SizedBox(height: 16),
              Wrap(
                spacing: 6,
                children: List.generate(
                  _sentences.length,
                  (i) => Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: i < _revealedCount
                          ? theme.colorScheme.primary
                          : theme.colorScheme.outline,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // 탭 안내 또는 완료 버튼
              if (!isComplete)
                Text(
                  '탭하여 다음 문장 보기',
                  style: TextStyle(
                    fontSize: 13,
                    color: colors.textMuted,
                  ),
                )
              else
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _completeFlashcard,
                    child: const Text('연습 완료'),
                  ),
                ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}

/// 스크립트 카드
class _ScriptCard extends StatelessWidget {
  final Map<String, dynamic> script;
  final String statusLabel;
  final Color statusColor;
  final int wordCount;
  final VoidCallback onTap;
  final ThemeData theme;
  final AppColors colors;

  const _ScriptCard({
    required this.script,
    required this.statusLabel,
    required this.statusColor,
    required this.wordCount,
    required this.onTap,
    required this.theme,
    required this.colors,
  });

  @override
  Widget build(BuildContext context) {
    final title = script['title'] ?? '';
    final content = script['content'] ?? '';
    final progress = (script['memorization_progress'] ?? 0).toDouble();
    final previewText =
        content.length > 80 ? '${content.substring(0, 80)}...' : content;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 제목 + 상태 뱃지
              Row(
                children: [
                  Expanded(
                    child: Text(
                      title,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      statusLabel,
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: statusColor,
                      ),
                    ),
                  ),
                ],
              ),

              // 단어 수
              const SizedBox(height: 4),
              Text(
                '$wordCount 단어',
                style: TextStyle(fontSize: 11, color: colors.textMuted),
              ),

              // 미리보기 텍스트
              if (previewText.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  previewText,
                  style: theme.textTheme.bodySmall,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],

              // 암기 진행률 바
              if (progress > 0) ...[
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(3),
                        child: LinearProgressIndicator(
                          value: (progress / 100).clamp(0.0, 1.0),
                          backgroundColor:
                              theme.colorScheme.outline.withValues(alpha: 0.3),
                          valueColor: AlwaysStoppedAnimation(
                            progress >= 100 ? colors.success : theme.colorScheme.primary,
                          ),
                          minHeight: 5,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${progress.toInt()}%',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: colors.textMuted,
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
