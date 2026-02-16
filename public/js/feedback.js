// AI 피드백 모듈 (FR-022~026)
const FeedbackModule = {
  lastSessionId: null,
  lastFeedback: null,
  isLoading: false,

  /**
   * AI 피드백 화면 렌더링
   */
  async render(container) {
    container.innerHTML = '';

    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = 'AI 피드백';
    container.appendChild(title);

    // 로딩 중
    if (this.isLoading) {
      container.innerHTML += `
        <div class="feedback-loading">
          <div class="spinner"></div>
          <p class="feedback-loading-text">AI가 답변을 분석하고 있습니다...</p>
        </div>`;
      return;
    }

    // 마지막 피드백 결과가 있으면 표시
    if (this.lastFeedback) {
      this.renderFeedbackResult(container, this.lastFeedback);
      return;
    }

    // 최근 세션의 피드백 조회
    try {
      const sessions = await apiGet('/exam/sessions');
      if (sessions.length > 0) {
        const latestSession = sessions[0];
        if (latestSession.predicted_level) {
          // 이미 피드백이 있는 경우
          const feedback = await apiGet(`/feedback/${latestSession.id}`);
          this.lastFeedback = feedback;
          this.lastSessionId = latestSession.id;
          this.renderFeedbackResult(container, feedback);
          return;
        }
      }
    } catch (err) {
      // 무시
    }

    // 피드백 없음
    container.innerHTML += `
      <div class="empty-state">
        <div class="empty-state-icon">🤖</div>
        <p class="empty-state-text">아직 AI 피드백이 없습니다.<br>모의시험을 완료한 후 피드백을 받을 수 있습니다.</p>
      </div>`;
  },

  /**
   * AI 피드백 요청
   */
  async requestFeedback(sessionId, answers, targetLevel) {
    this.isLoading = true;
    this.lastSessionId = sessionId;

    // 화면 업데이트
    const container = document.getElementById('app-content');
    if (container) this.render(container);

    try {
      const feedback = await apiPost('/feedback/evaluate', {
        session_id: sessionId,
        answers: answers.map(a => ({
          question_text: a.question_text,
          answer_text: a.answer_text,
          word_count: a.word_count
        })),
        target_level: targetLevel
      });

      this.lastFeedback = feedback;
      this.isLoading = false;

      if (container) this.render(container);
    } catch (err) {
      this.isLoading = false;

      if (container) {
        container.innerHTML = '';
        const title = document.createElement('h2');
        title.className = 'section-title';
        title.textContent = 'AI 피드백';
        container.appendChild(title);

        // 에러 메시지 표시
        let errorMsg = '서버 오류가 발생했습니다.';
        if (err.status === 429) errorMsg = '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
        else if (err.status === 400) errorMsg = err.message || '잘못된 요청입니다.';
        else if (err.message?.includes('네트워크') || err.message?.includes('fetch')) errorMsg = '인터넷 연결을 확인해주세요.';
        else if (err.message) errorMsg = err.message;

        const errorDiv = document.createElement('div');
        errorDiv.className = 'feedback-error';
        errorDiv.innerHTML = `
          <div class="feedback-error-icon">⚠️</div>
          <p class="feedback-error-message">${errorMsg}</p>
        `;

        const retryBtn = document.createElement('button');
        retryBtn.className = 'btn btn-primary';
        retryBtn.textContent = '재시도';
        retryBtn.addEventListener('click', () => this.requestFeedback(sessionId, answers, targetLevel));
        errorDiv.appendChild(retryBtn);

        container.appendChild(errorDiv);
      }
    }
  },

  /**
   * 피드백 결과 렌더링
   */
  async renderFeedbackResult(container, feedback) {
    // 예상 등급 뱃지
    const gradeDiv = document.createElement('div');
    gradeDiv.className = 'feedback-grade';
    gradeDiv.innerHTML = `
      <div class="grade-badge">${feedback.predicted_level}</div>
      <div class="grade-label">AI 예상 등급</div>
    `;
    container.appendChild(gradeDiv);

    // 점수 카드
    const scores = document.createElement('div');
    scores.className = 'feedback-scores';

    const scoreData = [
      { label: '문법', value: feedback.grammar_score, cls: 'score-grammar' },
      { label: '유창성', value: feedback.fluency_score, cls: 'score-fluency' },
      { label: '어휘', value: feedback.vocabulary_score, cls: 'score-vocab' }
    ];

    scoreData.forEach(s => {
      const card = document.createElement('div');
      card.className = `score-card ${s.cls}`;
      card.innerHTML = `
        <div class="score-label">${s.label}</div>
        <div class="score-value">${s.value}</div>
        <div class="score-bar"><div class="score-bar-fill" style="width: ${s.value}%"></div></div>
      `;
      scores.appendChild(card);
    });

    container.appendChild(scores);

    // 잘한 점
    const strengthsDiv = document.createElement('div');
    strengthsDiv.className = 'feedback-cards';
    strengthsDiv.innerHTML = '<div class="feedback-card-title">✅ 잘한 점</div>';
    const strengthsList = document.createElement('div');
    strengthsList.className = 'feedback-card-list';
    const strengths = Array.isArray(feedback.strengths) ? feedback.strengths : JSON.parse(feedback.strengths || '[]');
    strengths.forEach(s => {
      const item = document.createElement('div');
      item.className = 'feedback-card-item feedback-strength';
      item.textContent = s;
      strengthsList.appendChild(item);
    });
    strengthsDiv.appendChild(strengthsList);
    container.appendChild(strengthsDiv);

    // 개선할 점
    const improvDiv = document.createElement('div');
    improvDiv.className = 'feedback-cards';
    improvDiv.innerHTML = '<div class="feedback-card-title">💡 개선할 점</div>';
    const improvList = document.createElement('div');
    improvList.className = 'feedback-card-list';
    const improvements = Array.isArray(feedback.improvements) ? feedback.improvements : JSON.parse(feedback.improvements || '[]');
    improvements.forEach(i => {
      const item = document.createElement('div');
      item.className = 'feedback-card-item feedback-improvement';
      item.textContent = i;
      improvList.appendChild(item);
    });
    improvDiv.appendChild(improvList);
    container.appendChild(improvDiv);

    // 레벨 진행 경로
    try {
      const settings = await apiGet('/settings');
      const pathDiv = document.createElement('div');
      pathDiv.className = 'feedback-level-path';
      pathDiv.innerHTML = `
        <div class="level-path-title">레벨 진행 경로</div>
        <div class="level-path-row">
          <span class="level-path-item level-path-current">${settings.current_level || '?'}</span>
          <span class="level-path-arrow">→</span>
          <span class="level-path-item level-path-predicted">${feedback.predicted_level}</span>
          <span class="level-path-arrow">→</span>
          <span class="level-path-item level-path-target">${settings.target_level || '?'}</span>
        </div>
      `;
      container.appendChild(pathDiv);
    } catch (err) {
      // 설정 로드 실패 시 경로 표시 생략
    }
  }
};
