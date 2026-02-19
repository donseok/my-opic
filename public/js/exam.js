// 모의시험 모듈 (FR-014~021)
// 시험 시작, 준비 타이머, 답변 입력, 결과 요약, TTS 문제 읽기
const ExamModule = {
  questions: [],      // 시험 문제 배열
  currentIndex: 0,    // 현재 문제 인덱스
  answers: [],        // 답변 배열
  targetLevel: '',
  targetWords: 60,
  isActive: false,    // 시험 진행 중 여부
  sessionId: null,    // 저장된 세션 ID
  examStartedAt: null,     // 시험 시작 시각 (ISO 8601)
  questionStartTime: null, // 문제별 시작 시간 (실제 소요 시간 계산용)
  _navGuardBound: null,    // 네비게이션 가드 핸들러
  _recordingData: null,    // 녹음 데이터 {base64, duration}
  _speechMetrics: null,    // 음성 분석 메트릭
  _recordingTimerInterval: null,
  _STORAGE_KEY: 'opic_exam_state', // sessionStorage 키

  /**
   * 시험 상태를 sessionStorage에 저장
   */
  _saveState() {
    try {
      sessionStorage.setItem(this._STORAGE_KEY, JSON.stringify({
        questions: this.questions,
        currentIndex: this.currentIndex,
        answers: this.answers,
        targetLevel: this.targetLevel,
        targetWords: this.targetWords,
        examStartedAt: this.examStartedAt,
        isActive: this.isActive
      }));
    } catch (e) { /* 저장 실패 무시 */ }
  },

  /**
   * sessionStorage에서 시험 상태 복원
   * @returns {boolean} 복원 성공 여부
   */
  _restoreState() {
    try {
      const saved = sessionStorage.getItem(this._STORAGE_KEY);
      if (!saved) return false;
      const state = JSON.parse(saved);
      if (!state.isActive || !state.questions?.length) return false;
      this.questions = state.questions;
      this.currentIndex = state.currentIndex;
      this.answers = state.answers;
      this.targetLevel = state.targetLevel;
      this.targetWords = state.targetWords;
      this.examStartedAt = state.examStartedAt;
      this.isActive = true;
      return true;
    } catch (e) { return false; }
  },

  /**
   * sessionStorage 시험 상태 삭제
   */
  _clearState() {
    try { sessionStorage.removeItem(this._STORAGE_KEY); } catch (e) { /* 무시 */ }
  },

  /**
   * 모의시험 화면 렌더링
   */
  async render(container) {
    container.replaceChildren();

    // 시험 진행 중이면 시험 화면 표시
    if (this.isActive && this.questions.length > 0) {
      this.renderExamQuestion(container);
      return;
    }

    // 새로고침 후 시험 복원 시도
    if (!this.isActive && this._restoreState()) {
      this.installNavGuard();
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
      const topicLabel = document.createElement('div');
      topicLabel.className = 'exam-info-label';
      topicLabel.textContent = '선택 주제';
      const topicValue = document.createElement('div');
      topicValue.className = 'exam-info-value';
      topicValue.textContent = hasTopics ? selectedTopics.length + '개' : '미설정';
      topicCard.appendChild(topicLabel);
      topicCard.appendChild(topicValue);

      const levelCard = document.createElement('div');
      levelCard.className = 'exam-info-card';
      const levelLabel = document.createElement('div');
      levelLabel.className = 'exam-info-label';
      levelLabel.textContent = '목표 레벨';
      const levelValue = document.createElement('div');
      levelValue.className = 'exam-info-value';
      levelValue.textContent = settings.target_level || '미설정';
      levelCard.appendChild(levelLabel);
      levelCard.appendChild(levelValue);

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

      if (!data.questions || data.questions.length === 0) {
        showToast('선택한 주제에 문제가 없습니다. 주제를 변경해주세요.', 'error');
        return;
      }

      this.questions = data.questions;
      this.targetLevel = data.target_level;
      this.targetWords = data.target_words;
      this.currentIndex = 0;
      this.answers = [];
      this.isActive = true;
      this.sessionId = null;
      this.examStartedAt = new Date().toISOString();
      this._saveState();

      // 네비게이션 가드 설치
      this.installNavGuard();

      // 시험 모드 진입 (헤더/탭바 숨김)
      document.body.classList.add('exam-mode');

      const container = document.getElementById('app-content');
      this.showInstructions(container);
    } catch (err) {
      showToast('시험 시작에 실패했습니다: ' + (err.message || ''), 'error');
    }
  },

  /**
   * 시험 안내 화면 표시
   */
  showInstructions(container) {
    container.replaceChildren();

    const instructions = document.createElement('div');
    instructions.className = 'exam-instructions';

    const icon = document.createElement('div');
    icon.className = 'exam-instructions-icon';
    icon.textContent = '🎯';
    instructions.appendChild(icon);

    const title = document.createElement('h2');
    title.className = 'exam-instructions-title';
    title.textContent = 'OPIc 모의시험';
    instructions.appendChild(title);

    const rules = [
      '총 ' + this.questions.length + '개 문제가 출제됩니다',
      '각 문제마다 8초 준비 시간이 주어집니다',
      '답변 시간은 문제 유형에 따라 60~120초입니다',
      '타이핑 또는 음성 녹음으로 답변할 수 있습니다',
      '시험 중 다른 탭으로 이동할 수 없습니다'
    ];

    const ruleList = document.createElement('div');
    ruleList.className = 'exam-rules';
    rules.forEach(rule => {
      const item = document.createElement('div');
      item.className = 'exam-rule-item';
      item.textContent = rule;
      ruleList.appendChild(item);
    });
    instructions.appendChild(ruleList);

    const info = document.createElement('div');
    info.className = 'exam-instructions-info';
    info.textContent = '목표 레벨: ' + this.targetLevel + ' · 목표 단어: ' + this.targetWords + '단어';
    instructions.appendChild(info);

    const startBtn = document.createElement('button');
    startBtn.className = 'btn btn-primary';
    startBtn.style.padding = '14px 48px';
    startBtn.style.fontSize = '16px';
    startBtn.textContent = '시험 시작';
    startBtn.addEventListener('click', () => {
      this.showPrepTimer(container);
    });
    instructions.appendChild(startBtn);

    container.appendChild(instructions);
  },

  /**
   * 네비게이션 가드 — 시험 중 탭 이동 방지
   */
  installNavGuard() {
    this.removeNavGuard();
    this._navGuardBound = (e) => {
      if (!this.isActive) return;
      const hash = window.location.hash.replace('#', '');
      if (hash !== 'exam') {
        if (!confirm('시험이 진행 중입니다. 나가면 진행 상황이 사라집니다. 정말 나가시겠습니까?')) {
          e.preventDefault();
          window.location.hash = '#exam';
        } else {
          this.isActive = false;
          TimerUtil.stop();
          TtsUtil.stop();
          this.removeNavGuard();
          this._clearState();
          document.body.classList.remove('exam-mode');
        }
      }
    };
    window.addEventListener('hashchange', this._navGuardBound);
  },

  /**
   * 네비게이션 가드 제거
   */
  removeNavGuard() {
    if (this._navGuardBound) {
      window.removeEventListener('hashchange', this._navGuardBound);
      this._navGuardBound = null;
    }
  },

  /**
   * "답변을 시작하세요!" 플래시 프롬프트 (1초)
   */
  _showBeginPrompt(container, onComplete) {
    container.replaceChildren();
    const prompt = document.createElement('div');
    prompt.className = 'exam-begin-prompt';
    prompt.textContent = '답변을 시작하세요!';
    container.appendChild(prompt);
    TimerUtil.playBeep(600, 300);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 1000);
  },

  /**
   * 준비 타이머 표시 (8초) + 문제 미리보기 + TTS 자동 읽기
   */
  showPrepTimer(container) {
    const q = this.questions[this.currentIndex];

    TimerUtil.startPrepTimer(container, 8, () => {
      TtsUtil.stop();
      // "답변을 시작하세요!" 플래시 프롬프트
      this._showBeginPrompt(container, () => {
        this.renderExamQuestion(container);
      });
    });

    // 준비 타이머 아래에 문제 미리보기 추가
    if (q) {
      const preview = document.createElement('div');
      preview.className = 'prep-question-preview';

      const previewLabel = document.createElement('div');
      previewLabel.className = 'prep-preview-label';
      previewLabel.textContent = '문제 ' + (this.currentIndex + 1) + '/' + this.questions.length;
      preview.appendChild(previewLabel);

      const previewText = document.createElement('div');
      previewText.className = 'prep-preview-text';
      previewText.textContent = q.question_text;
      preview.appendChild(previewText);

      // TTS 듣기 버튼
      if (TtsUtil.isSupported()) {
        const ttsBtn = TtsUtil.createButton(q.question_text, 'lg');
        preview.appendChild(ttsBtn);

        // 준비 시간에 자동으로 문제 읽기
        TtsUtil.speak(q.question_text);
      }

      container.appendChild(preview);
    }
  },

  /**
   * 시험 문제 렌더링
   */
  renderExamQuestion(container) {
    container.replaceChildren();
    TtsUtil.stop();

    const q = this.questions[this.currentIndex];
    if (!q) {
      this.completeExam(container);
      return;
    }

    // 문제 시작 시간 기록
    this.questionStartTime = Date.now();

    const timeLimit = q.time_limit || 90;

    // 진행 도트
    const stepsDiv = document.createElement('div');
    stepsDiv.className = 'exam-steps';
    for (let i = 0; i < this.questions.length; i++) {
      const dot = document.createElement('div');
      dot.className = 'exam-step-dot';
      if (i < this.currentIndex) dot.classList.add('completed');
      if (i === this.currentIndex) dot.classList.add('current');
      stepsDiv.appendChild(dot);
    }
    container.appendChild(stepsDiv);

    // 문제 번호
    const progress = document.createElement('div');
    progress.className = 'exam-progress';
    const questionNum = document.createElement('div');
    questionNum.className = 'exam-question-num';
    const numText = document.createTextNode('문제 ');
    const numStrong = document.createElement('strong');
    numStrong.textContent = this.currentIndex + 1;
    questionNum.appendChild(numText);
    questionNum.appendChild(numStrong);
    questionNum.appendChild(document.createTextNode(' / ' + this.questions.length));
    progress.appendChild(questionNum);
    container.appendChild(progress);

    // 질문 텍스트 + TTS 버튼
    const questionRow = document.createElement('div');
    questionRow.className = 'exam-question-row';

    const questionText = document.createElement('div');
    questionText.className = 'exam-question-text';
    questionText.textContent = q.question_text;
    questionRow.appendChild(questionText);

    // TTS 듣기 버튼
    if (TtsUtil.isSupported()) {
      const ttsBtn = TtsUtil.createButton(q.question_text, 'md');
      questionRow.appendChild(ttsBtn);
    }

    container.appendChild(questionRow);

    // 타이머 정보
    const timerInfo = document.createElement('div');
    timerInfo.className = 'exam-timer-info';
    timerInfo.id = 'exam-timer-info';
    const timerType = document.createElement('span');
    timerType.textContent = (q.type === 'roleplay' ? '롤플레이' : '서베이') + ' (' + timeLimit + '초)';
    const timerRemaining = document.createElement('span');
    timerRemaining.id = 'timer-remaining';
    timerRemaining.textContent = timeLimit + '초';
    timerInfo.appendChild(timerType);
    timerInfo.appendChild(timerRemaining);
    container.appendChild(timerInfo);

    // 타이머 프로그레스 바
    const timerBar = document.createElement('div');
    timerBar.className = 'progress-bar exam-timer-bar';
    const timerFill = document.createElement('div');
    timerFill.className = 'progress-fill';
    timerFill.id = 'timer-fill';
    timerFill.style.width = '100%';
    timerBar.appendChild(timerFill);
    container.appendChild(timerBar);

    // 답변 모드 전환 (타이핑 / 녹음)
    const modeToggle = document.createElement('div');
    modeToggle.className = 'exam-mode-toggle';

    const typeBtn = document.createElement('button');
    typeBtn.className = 'mode-btn active';
    typeBtn.textContent = '⌨️ 타이핑';
    typeBtn.addEventListener('click', () => {
      typeBtn.classList.add('active');
      voiceBtn.classList.remove('active');
      document.getElementById('exam-answer').classList.remove('hidden');
      const recArea = document.getElementById('exam-recorder');
      if (recArea) recArea.classList.add('hidden');
    });

    const voiceBtn = document.createElement('button');
    voiceBtn.className = 'mode-btn';
    voiceBtn.textContent = '🎙️ 음성 녹음';
    voiceBtn.addEventListener('click', () => {
      voiceBtn.classList.add('active');
      typeBtn.classList.remove('active');
      document.getElementById('exam-answer').classList.add('hidden');
      const recArea = document.getElementById('exam-recorder');
      if (recArea) recArea.classList.remove('hidden');
      else this.renderRecorder(container);
    });

    modeToggle.appendChild(typeBtn);
    modeToggle.appendChild(voiceBtn);
    container.appendChild(modeToggle);

    // 답변 입력 (타이핑)
    const textarea = document.createElement('textarea');
    textarea.className = 'exam-answer-area';
    textarea.id = 'exam-answer';
    textarea.placeholder = 'Write your answer in English...';
    container.appendChild(textarea);

    // 음성 녹음 영역 (기본 숨김)
    if (typeof RecorderUtil !== 'undefined' && RecorderUtil.isSupported()) {
      const recorderDiv = document.createElement('div');
      recorderDiv.id = 'exam-recorder';
      recorderDiv.className = 'recorder-container hidden';

      const recBtn = document.createElement('div');
      recBtn.className = 'record-btn';
      recBtn.id = 'exam-record-btn';
      const recInner = document.createElement('div');
      recInner.className = 'record-btn-inner';
      recBtn.appendChild(recInner);
      recorderDiv.appendChild(recBtn);

      const recStatus = document.createElement('div');
      recStatus.className = 'record-status';
      recStatus.id = 'exam-record-status';
      recStatus.textContent = '버튼을 눌러 녹음을 시작하세요';
      recorderDiv.appendChild(recStatus);

      // STT 상태 뱃지
      if (typeof SttUtil !== 'undefined' && SttUtil.isSupported()) {
        const sttBadge = document.createElement('div');
        sttBadge.className = 'stt-badge hidden';
        sttBadge.id = 'stt-badge';
        sttBadge.textContent = '🎤 음성→텍스트 변환 중';
        recorderDiv.appendChild(sttBadge);
      }

      const recTimer = document.createElement('div');
      recTimer.className = 'record-timer';
      recTimer.id = 'exam-record-timer';
      recTimer.textContent = '00:00';
      recorderDiv.appendChild(recTimer);

      const waveform = document.createElement('div');
      waveform.className = 'waveform-container';
      waveform.id = 'exam-waveform';
      for (let i = 0; i < 30; i++) {
        const bar = document.createElement('div');
        bar.className = 'waveform-bar';
        bar.style.height = '4px';
        waveform.appendChild(bar);
      }
      recorderDiv.appendChild(waveform);

      recBtn.addEventListener('click', () => this.toggleRecording());
      container.appendChild(recorderDiv);
    }

    // 단어 수 + 달성률
    const wordInfo = document.createElement('div');
    wordInfo.className = 'exam-word-info';
    wordInfo.id = 'exam-word-info';
    const wordCount = document.createElement('span');
    wordCount.textContent = '0 단어';
    const wordTarget = document.createElement('span');
    wordTarget.textContent = '0/' + this.targetWords + ' 단어 — 0% 달성';
    wordInfo.appendChild(wordCount);
    wordInfo.appendChild(wordTarget);
    container.appendChild(wordInfo);

    // 단어 수 프로그레스 바
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
    const targetWords = this.targetWords;
    textarea.addEventListener('input', () => {
      const wc = WordCountUtil.count(textarea.value);
      const pct = Math.min(100, Math.round(wc / targetWords * 100));
      const wordInfoEl = document.getElementById('exam-word-info');
      if (wordInfoEl) {
        wordInfoEl.replaceChildren();
        const s1 = document.createElement('span');
        s1.textContent = wc + ' 단어';
        const s2 = document.createElement('span');
        s2.textContent = wc + '/' + targetWords + ' 단어 — ' + pct + '% 달성';
        wordInfoEl.appendChild(s1);
        wordInfoEl.appendChild(s2);
      }
      const wordFillEl = document.getElementById('word-fill');
      if (wordFillEl) wordFillEl.style.width = pct + '%';
    });

    // 답변 타이머 시작
    TimerUtil.startAnswerTimer(timeLimit,
      (remaining, total) => {
        const remainEl = document.getElementById('timer-remaining');
        const fillEl = document.getElementById('timer-fill');
        const infoEl = document.getElementById('exam-timer-info');
        if (remainEl) remainEl.textContent = remaining + '초';
        if (fillEl) fillEl.style.width = (remaining / total * 100) + '%';
        if (remaining <= 30) {
          if (fillEl) fillEl.classList.add('warning');
          if (infoEl) infoEl.classList.add('warning');
        }
        // 비프음 경고
        if (remaining === 30) {
          TimerUtil.playBeep(800, 200);
        } else if (remaining === 10) {
          TimerUtil.playDoubleBeep(900);
        }
      },
      () => this.nextQuestion(container)
    );

    // 답변 시간에 자동 포커스
    textarea.focus();
  },

  /**
   * 음성 녹음 토글
   */
  async toggleRecording() {
    if (typeof RecorderUtil === 'undefined') return;

    const btn = document.getElementById('exam-record-btn');
    const status = document.getElementById('exam-record-status');
    const timer = document.getElementById('exam-record-timer');
    const waveform = document.getElementById('exam-waveform');

    if (!RecorderUtil.isRecording) {
      // 녹음 시작
      try {
        await RecorderUtil.start((freqData) => {
          // 파형 시각화
          if (waveform) {
            const bars = waveform.querySelectorAll('.waveform-bar');
            const step = Math.floor(freqData.length / bars.length);
            bars.forEach((bar, i) => {
              const value = freqData[i * step] || 0;
              bar.style.height = Math.max(4, (value / 255) * 50) + 'px';
            });
          }
          // 타이머 업데이트
          if (timer) {
            timer.textContent = RecorderUtil.formatTime(RecorderUtil.getDuration());
          }
        });
        if (btn) btn.classList.add('recording');
        if (status) status.textContent = '녹음 중... 다시 누르면 중지됩니다';
        this._recordingData = null;

        // STT 동시 시작
        if (typeof SttUtil !== 'undefined' && SttUtil.isSupported()) {
          const textarea = document.getElementById('exam-answer');
          SttUtil.start((transcript) => {
            if (textarea) textarea.value = transcript;
            // 단어 수 업데이트
            if (typeof WordCountUtil !== 'undefined') {
              const wc = WordCountUtil.count(transcript);
              const pct = Math.min(100, Math.round(wc / this.targetWords * 100));
              const wordInfoEl = document.getElementById('exam-word-info');
              if (wordInfoEl) {
                wordInfoEl.replaceChildren();
                const s1 = document.createElement('span');
                s1.textContent = wc + ' 단어';
                const s2 = document.createElement('span');
                s2.textContent = wc + '/' + this.targetWords + ' 단어 — ' + pct + '% 달성';
                wordInfoEl.appendChild(s1);
                wordInfoEl.appendChild(s2);
              }
              const wordFillEl = document.getElementById('word-fill');
              if (wordFillEl) wordFillEl.style.width = pct + '%';
            }
          });
          // STT 활성 표시
          const sttBadge = document.getElementById('stt-badge');
          if (sttBadge) sttBadge.classList.remove('hidden');
        }
      } catch (err) {
        showToast('마이크 접근 권한이 필요합니다', 'error');
      }
    } else {
      // 녹음 중지
      try {
        // STT 중지
        if (typeof SttUtil !== 'undefined' && SttUtil.isListening) {
          const finalText = SttUtil.stop();
          const textarea = document.getElementById('exam-answer');
          if (textarea && finalText) textarea.value = finalText;
          const sttBadge = document.getElementById('stt-badge');
          if (sttBadge) sttBadge.classList.add('hidden');
        }

        const data = await RecorderUtil.stop();
        this._recordingData = data;
        // 음성 분석 데이터 수집
        if (typeof SpeechAnalysisUtil !== 'undefined') {
          const textarea = document.getElementById('exam-answer');
          const transcript = textarea ? textarea.value : '';
          this._speechMetrics = SpeechAnalysisUtil.analyze(transcript, data.duration);
          const pauseData = SpeechAnalysisUtil.analyzePauses(RecorderUtil.amplitudeHistory, 50);
          this._speechMetrics.pause_count = pauseData.pause_count;
          this._speechMetrics.total_pause_ms = pauseData.total_pause_ms;
        }
        if (btn) btn.classList.remove('recording');
        if (status) status.textContent = '녹음 완료 (' + RecorderUtil.formatTime(data.duration) + ')';
        // 파형 리셋
        if (waveform) {
          waveform.querySelectorAll('.waveform-bar').forEach(bar => {
            bar.style.height = '4px';
          });
        }
      } catch (err) {
        showToast('녹음 중지 오류', 'error');
      }
    }
  },

  /**
   * 다음 문제로 이동
   */
  nextQuestion(container) {
    TimerUtil.stop();
    TtsUtil.stop();

    // 녹음 중이면 중지
    if (typeof RecorderUtil !== 'undefined' && RecorderUtil.isRecording) {
      RecorderUtil.stop().catch(() => {});
    }

    // 현재 답변 저장
    const textarea = document.getElementById('exam-answer');
    const answerText = textarea ? textarea.value : '';
    const wordCount = WordCountUtil.count(answerText);
    const q = this.questions[this.currentIndex];

    // 실제 소요 시간 계산
    const elapsed = Math.round((Date.now() - this.questionStartTime) / 1000);

    const answerData = {
      question_id: q.id,
      question_text: q.question_text,
      answer_text: answerText,
      word_count: wordCount,
      time_spent: elapsed,
      type: q.type
    };

    // 녹음 데이터가 있으면 첨부
    if (this._recordingData) {
      answerData.voice_recording = {
        audio_data: this._recordingData.base64,
        duration: this._recordingData.duration
      };
      this._recordingData = null;
    }

    // 음성 분석 메트릭 첨부
    if (this._speechMetrics) {
      answerData.speech_metrics = this._speechMetrics;
      this._speechMetrics = null;
    }

    this.answers.push(answerData);

    this.currentIndex++;
    this._saveState();

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
    TimerUtil.stop();
    TtsUtil.stop();
    this.removeNavGuard();
    // 시험 모드 해제
    document.body.classList.remove('exam-mode');

    container.replaceChildren();

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
      const qNum = document.createElement('span');
      qNum.className = 'result-q-num';
      qNum.textContent = '문제 ' + (idx + 1);
      const qStats = document.createElement('span');
      qStats.className = 'result-q-stats';
      qStats.textContent = a.word_count + '단어 · ' + a.time_spent + '초';
      header.appendChild(qNum);
      header.appendChild(qStats);

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

    // DB에 저장 — 저장 성공 후에만 상태 초기화
    const saveResult = async () => {
      const result = await apiPost('/exam/sessions', {
        target_level: this.targetLevel,
        started_at: this.examStartedAt,
        answers: this.answers
      });
      this.sessionId = result.session_id;
      this.isActive = false;
      this._clearState();
      showToast('시험 결과가 저장되었습니다', 'success');
    };

    try {
      await saveResult();
    } catch (err) {
      showToast('결과 저장 실패: ' + (err.message || ''), 'error');

      // 재시도 버튼 제공
      const retryBtn = document.createElement('button');
      retryBtn.className = 'btn btn-primary';
      retryBtn.style.width = '100%';
      retryBtn.style.marginTop = '8px';
      retryBtn.textContent = '💾 결과 저장 재시도';
      retryBtn.addEventListener('click', async () => {
        retryBtn.disabled = true;
        retryBtn.textContent = '저장 중...';
        try {
          await saveResult();
          retryBtn.remove();
        } catch (retryErr) {
          showToast('결과 저장 실패: ' + (retryErr.message || ''), 'error');
          retryBtn.disabled = false;
          retryBtn.textContent = '💾 결과 저장 재시도';
        }
      });
      container.appendChild(retryBtn);
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
        window.location.hash = '#feedback';
      }
    });
    container.appendChild(feedbackBtn);
  }
};
