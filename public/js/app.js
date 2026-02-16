// OPIc Master SPA 라우터 + 초기화
// Hash 기반 라우팅 (#survey, #level, #questions, #exam, #feedback, #dashboard)

const App = {
  // 탭-모듈 매핑
  modules: {
    survey: SurveyModule,
    questions: QuestionsModule,
    exam: ExamModule,
    feedback: FeedbackModule,
    dashboard: DashboardModule,
    level: LevelModule
  },

  currentTab: 'survey', // 기본 탭

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
  }
};

// DOM 로드 후 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
