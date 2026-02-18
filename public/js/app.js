// OPIc Master SPA 라우터 + 초기화
// Hash 기반 라우팅

const App = {
  // 탭-모듈 매핑
  modules: {
    studyplan: typeof StudyPlanModule !== 'undefined' ? StudyPlanModule : null,
    survey: SurveyModule,
    questions: QuestionsModule,
    scripts: typeof ScriptsModule !== 'undefined' ? ScriptsModule : null,
    exam: ExamModule,
    feedback: FeedbackModule,
    srs: typeof SrsModule !== 'undefined' ? SrsModule : null,
    dashboard: DashboardModule,
    level: LevelModule
  },

  currentTab: 'survey', // 기본 탭
  sessionStartTime: null, // 학습 세션 추적
  currentSessionId: null,

  /**
   * 앱 초기화
   */
  init() {
    // Lucide 아이콘 생성
    if (window.lucide) {
      lucide.createIcons();
    }

    // 탭바 이벤트 바인딩
    document.querySelectorAll('.tab-item').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        const tab = tabBtn.dataset.tab;
        this.navigate(tab);
      });
    });

    // 해시 변경 감지
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '') || 'survey';
      this.navigate(hash, false);
    });

    // 학습 세션 시작
    this.startStudySession();

    // 초기 라우팅
    const initialTab = window.location.hash.replace('#', '') || 'survey';
    this.navigate(initialTab, false);
  },

  /**
   * 탭 네비게이션
   * @param {string} tab - 탭 이름
   * @param {boolean} updateHash - 해시 업데이트 여부
   */
  navigate(tab, updateHash = true) {
    if (!this.modules[tab]) {
      tab = 'survey';
    }

    this.currentTab = tab;

    // 해시 업데이트
    if (updateHash) {
      window.location.hash = `#${tab}`;
    }

    // 탭바 활성 상태 업데이트
    document.querySelectorAll('.tab-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // 콘텐츠 렌더링
    const content = document.getElementById('app-content');
    if (content && this.modules[tab]) {
      this.modules[tab].render(content);
    }
  },

  /**
   * 학습 세션 추적 시작
   */
  async startStudySession() {
    this.sessionStartTime = Date.now();
    try {
      const result = await apiPost('/study-sessions/start', { activity_type: 'general' });
      this.currentSessionId = result.id;
    } catch (e) {
      // 세션 추적 실패 무시
    }
  },

  /**
   * 학습 세션 종료
   */
  async endStudySession() {
    if (this.currentSessionId) {
      try {
        await apiPut('/study-sessions/' + this.currentSessionId + '/end', {});
      } catch (e) {
        // 무시
      }
    }
  }
};

// 페이지 언로드 시 세션 종료
window.addEventListener('beforeunload', () => {
  if (App.currentSessionId) {
    navigator.sendBeacon(API_BASE + '/study-sessions/' + App.currentSessionId + '/end', JSON.stringify({}));
  }
});

// DOM 로드 후 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
