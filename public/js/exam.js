// 모의시험 모듈 (FR-014~021)
const ExamModule = {
  questions: [],      // 시험 문제 배열
  currentIndex: 0,    // 현재 문제 인덱스
  answers: [],        // 답변 배열
  targetLevel: '',
  targetWords: 60,
  isActive: false,    // 시험 진행 중 여부
  sessionId: null,    // 저장된 세션 ID

  /**
   * 모의시험 화면 렌더링
   */
  async render(container) {
    container.innerHTML = '';

    // 시험 진행 중이면 시험 화면 표시
    if (this.isActive && this.questions.length > 0) {
      this.renderExamQuestion(container);
      return;
    }

    // 시험 시작 대기 화면
    const startDiv = document.createElement('div');
    startDiv.className = 'exam-start';

    const icon = document.createElement('div');
    icon.className = 'exam-start-icon';
    icon.textContent = '📝';

    const title = document.createElement('h2');
    title.className = 'exam-start-title';
    title.textContent = '모의시험';

    const desc = document.createElement('p');
    desc.className = 'exam-start-desc';
    desc.textContent = '실제 OPIc 시험과 동일한 환경에서 5문제 모의시험을 진행합니다.';

    startDiv.appendChild(icon);
    startDiv.appendChild(title);
    startDiv.appendChild(desc);

    // 설정 상태 확인
    try {
      const [topics, settings] = await Promise.all([
        apiGet('/topics'),
        apiGet('/settings')
      ]);

      const selectedTopics = topics.filter(t => t.is_selected);
      const hasTopics = selectedTopics.length >= 3;
      const hasLevel = settings.current_level && settings.target_level;

      // 정보 카드
      const infoCards = document.createElement('div');
      infoCards.className = 'exam-info-cards';

      const topicCard = document.createElement('div');
      topicCard.className = 'exam-info-card';
      topicCard.innerHTML = `<div class="exam-info-label">선택 주제</div><div class="exam-info-value">${hasTopics ? selectedTopics.length + '개' : '미설정'}</div>`;

      const levelCard = document.createElement('div');
      levelCard.className = 'exam-info-card';
      levelCard.innerHTML = `<div class="exam-info-label">목표 레벨</div><div class="exam-info-value">${settings.target_level || '미설정'}</div>`;

      infoCards.appendChild(topicCard);
      infoCards.appendChild(levelCard);
      startDiv.appendChild(infoCards);

      // 경고 메시지
      if (!hasTopics || !hasLevel) {
        const warning = document.createElement('p');
        warning.className = 'exam-warning';
        if (!hasTopics) warning.textContent = '⚠️ 서베이 설정에서 주제를 3개 이상 선택해주세요.';
        else warning.textContent = '⚠️ 레벨 설정에서 현재/목표 레벨을 설정해주세요.';
        startDiv.appendChild(warning);
      }

      // 시작 버튼
      const startBtn = document.createElement('button');
      startBtn.className = 'btn btn-primary';
      startBtn.style.padding = '14px 40px';
      startBtn.style.fontSize = '16px';
      startBtn.textContent = '🚀 시험 시작';
      startBtn.disabled = !hasTopics || !hasLevel;
      startBtn.addEventListener('click', () => this.startExam(selectedTopics.map(t => t.id)));
      startDiv.appendChild(startBtn);

    } catch (err) {
      const warning = document.createElement('p');
      warning.className = 'exam-warning';
      warning.textContent = '설정 정보를 불러올 수 없습니다.';
      startDiv.appendChild(warning);
    }

    container.appendChild(startDiv);
  },

  /**
   * 시험 시작
   */
  async startExam(topicIds) {
    try {
      const data = await apiPost('/exam/start', { topic_ids: topicIds });
      this.questions = data.questions;
      this.targetLevel = data.target_level;
      this.targetWords = data.target_words;
      this.currentIndex = 0;
      this.answers = [];
      this.isActive = true;
      this.sessionId = null;

      const container = document.getElementById('app-content');
      this.showPrepTimer(container);
    } catch (err) {
      showToast('시험 시작에 실패했습니다: ' + (err.message || ''), 'error');
    }
  },

  /**
   * 준비 타이머 표시 (8초)
   */
  showPrepTimer(container) {
    TimerUtil.startPrepTimer(container, 8, () => {
      this.renderExamQuestion(container);
    });
  },

  /**
   * 시험 문제 렌더링
   */
  renderExamQuestion(container) {
    container.innerHTML = '';

    const q = this.questions[this.currentIndex];
    if (!q) {
      this.completeExam(container);
      return;
    }

    const timeLimit = q.time_limit || 90;

    // 문제 번호
    const progress = document.createElement('div');
    progress.className = 'exam-progress';
    progress.innerHTML = `<div class="exam-question-num">문제 <strong>${this.currentIndex + 1}</strong> / ${this.questions.length}</div>`;
    container.appendChild(progress);

    // 질문 텍스트
    const questionText = document.createElement('div');
    questionText.className = 'exam-question-text';
    questionText.textContent = q.question_text;
    container.appendChild(questionText);

    // 타이머 영역
    const timerInfo = document.createElement('div');
    timerInfo.className = 'exam-timer-info';
    timerInfo.id = 'exam-timer-info';
    timerInfo.innerHTML = `<span>${q.type === 'roleplay' ? '롤플레이' : '서베이'} (${timeLimit}초)</span><span id="timer-remaining">${timeLimit}초</span>`;
    container.appendChild(timerInfo);

    const timerBar = document.createElement('div');
    timerBar.className = 'progress-bar exam-timer-bar';
    const timerFill = document.createElement('div');
    timerFill.className = 'progress-fill';
    timerFill.id = 'timer-fill';
    timerFill.style.width = '100%';
    timerBar.appendChild(timerFill);
    container.appendChild(timerBar);

    // 답변 입력
    const textarea = document.createElement('textarea');
    textarea.className = 'exam-answer-area';
    textarea.id = 'exam-answer';
    textarea.placeholder = 'Write your answer in English...';
    container.appendChild(textarea);

    // 단어 수 + 달성률
    const wordInfo = document.createElement('div');
    wordInfo.className = 'exam-word-info';
    wordInfo.id = 'exam-word-info';
    wordInfo.innerHTML = `<span>0 단어</span><span>0/${this.targetWords} 단어 — 0% 달성</span>`;
    container.appendChild(wordInfo);

    const wordProgress = document.createElement('div');
    wordProgress.className = 'progress-bar exam-word-progress';
    const wordFill = document.createElement('div');
    wordFill.className = 'progress-fill';
    wordFill.id = 'word-fill';
    wordFill.style.width = '0%';
    wordProgress.appendChild(wordFill);
    container.appendChild(wordProgress);

    // 다음 버튼
    const actions = document.createElement('div');
    actions.className = 'exam-actions';
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-primary';
    nextBtn.textContent = this.currentIndex < this.questions.length - 1 ? '다음 문제 →' : '시험 완료';
    nextBtn.addEventListener('click', () => this.nextQuestion(container));
    actions.appendChild(nextBtn);
    container.appendChild(actions);

    // 실시간 단어 수 카운트
    textarea.addEventListener('input', () => {
      const wc = WordCountUtil.count(textarea.value);
      const pct = Math.min(100, Math.round(wc / this.targetWords * 100));
      const wordInfoEl = document.getElementById('exam-word-info');
      const wordFillEl = document.getElementById('word-fill');
      if (wordInfoEl) wordInfoEl.innerHTML = `<span>${wc} 단어</span><span>${wc}/${this.targetWords} 단어 — ${pct}% 달성</span>`;
      if (wordFillEl) wordFillEl.style.width = `${pct}%`;
    });

    // 답변 타이머 시작
    const startTime = Date.now();
    TimerUtil.startAnswerTimer(timeLimit,
      (remaining, total) => {
        const remainEl = document.getElementById('timer-remaining');
        const fillEl = document.getElementById('timer-fill');
        const infoEl = document.getElementById('exam-timer-info');
        if (remainEl) remainEl.textContent = `${remaining}초`;
        if (fillEl) fillEl.style.width = `${remaining / total * 100}%`;
        if (remaining <= 30) {
          if (fillEl) fillEl.classList.add('warning');
          if (infoEl) infoEl.classList.add('warning');
        }
      },
      () => this.nextQuestion(container)
    );
  },

  /**
   * 다음 문제로 이동
   */
  nextQuestion(container) {
    TimerUtil.stop();

    // 현재 답변 저장
    const textarea = document.getElementById('exam-answer');
    const answerText = textarea ? textarea.value : '';
    const wordCount = WordCountUtil.count(answerText);
    const q = this.questions[this.currentIndex];

    this.answers.push({
      question_id: q.id,
      question_text: q.question_text,
      answer_text: answerText,
      word_count: wordCount,
      time_spent: q.time_limit || 90,
      type: q.type
    });

    this.currentIndex++;

    if (this.currentIndex >= this.questions.length) {
      this.completeExam(container);
    } else {
      this.showPrepTimer(container);
    }
  },

  /**
   * 시험 완료 처리
   */
  async completeExam(container) {
    this.isActive = false;
    TimerUtil.stop();

    container.innerHTML = '';

    const resultDiv = document.createElement('div');
    resultDiv.className = 'exam-result';

    const title = document.createElement('h2');
    title.className = 'result-title';
    title.textContent = '🎉 시험 완료!';
    resultDiv.appendChild(title);

    // 답변 요약
    this.answers.forEach((a, idx) => {
      const card = document.createElement('div');
      card.className = 'result-summary-card';

      const header = document.createElement('div');
      header.className = 'result-q-header';
      header.innerHTML = `<span class="result-q-num">문제 ${idx + 1}</span><span class="result-q-stats">${a.word_count}단어 · ${a.time_spent}초</span>`;

      const qText = document.createElement('div');
      qText.className = 'result-q-text';
      qText.textContent = a.question_text;

      const aText = document.createElement('div');
      aText.className = 'result-a-text';
      aText.textContent = a.answer_text || '(답변 없음)';

      card.appendChild(header);
      card.appendChild(qText);
      card.appendChild(aText);
      resultDiv.appendChild(card);
    });

    container.appendChild(resultDiv);

    // DB에 저장
    try {
      const result = await apiPost('/exam/sessions', {
        target_level: this.targetLevel,
        answers: this.answers
      });
      this.sessionId = result.session_id;
      showToast('시험 결과가 저장되었습니다', 'success');
    } catch (err) {
      showToast('결과 저장 실패: ' + (err.message || ''), 'error');
    }

    // AI 피드백 받기 버튼
    const feedbackBtn = document.createElement('button');
    feedbackBtn.className = 'btn btn-primary';
    feedbackBtn.style.width = '100%';
    feedbackBtn.style.marginTop = '16px';
    feedbackBtn.textContent = '🤖 AI 피드백 받기';
    feedbackBtn.addEventListener('click', () => {
      if (this.sessionId) {
        FeedbackModule.requestFeedback(this.sessionId, this.answers, this.targetLevel);
        // 피드백 탭으로 이동
        window.location.hash = '#feedback';
      }
    });
    container.appendChild(feedbackBtn);
  }
};
