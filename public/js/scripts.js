// 스크립트 빌더 모듈
// 스크립트 작성, AI 개선, 암기 연습 (플래시카드)
const ScriptsModule = {
  scripts: [],
  currentFilter: '',
  currentScript: null,
  viewMode: 'list', // list, detail, create, flashcard

  /**
   * 메인 렌더링 - viewMode에 따라 분기
   */
  async render(container) {
    container.replaceChildren();

    if (this.viewMode === 'detail' && this.currentScript) {
      await this.renderDetail(container);
    } else if (this.viewMode === 'create') {
      this.renderCreateForm(container);
    } else if (this.viewMode === 'flashcard' && this.currentScript) {
      this.renderFlashcard(container);
    } else {
      this.viewMode = 'list';
      await this.renderList(container);
    }
  },

  // ──────────────────────────────────────────
  // 목록 뷰
  // ──────────────────────────────────────────

  /**
   * 스크립트 목록 렌더링
   */
  async renderList(container) {
    // 헤더
    const header = document.createElement('div');
    header.className = 'scripts-header';

    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '스크립트';
    header.appendChild(title);

    const createBtn = document.createElement('button');
    createBtn.className = 'btn btn-primary';
    createBtn.textContent = '+ 새 스크립트';
    createBtn.addEventListener('click', () => {
      this.viewMode = 'create';
      this.render(container);
    });
    header.appendChild(createBtn);
    container.appendChild(header);

    // 상태 필터 탭
    const filterBar = document.createElement('div');
    filterBar.className = 'scripts-filter';

    const filters = [
      { value: '', label: '전체' },
      { value: 'draft', label: '초안' },
      { value: 'refined', label: '다듬기 완료' },
      { value: 'memorizing', label: '암기 중' },
      { value: 'mastered', label: '완료' }
    ];

    filters.forEach(f => {
      const btn = document.createElement('button');
      btn.className = 'questions-tab' + (f.value === this.currentFilter ? ' active' : '');
      btn.textContent = f.label;
      btn.addEventListener('click', () => {
        this.currentFilter = f.value;
        // 탭 활성 상태 업데이트
        filterBar.querySelectorAll('.questions-tab').forEach(b => {
          b.classList.toggle('active', b === btn);
        });
        this._renderScriptCards(listEl);
      });
      filterBar.appendChild(btn);
    });

    container.appendChild(filterBar);

    // 스크립트 목록 영역
    const listEl = document.createElement('div');
    listEl.className = 'script-list';
    container.appendChild(listEl);

    // 데이터 로드
    try {
      this.scripts = await apiGet('/scripts');
      this._renderScriptCards(listEl);
    } catch (err) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      const p = document.createElement('p');
      p.className = 'empty-state-text';
      p.textContent = '스크립트를 불러올 수 없습니다.';
      empty.appendChild(p);
      listEl.appendChild(empty);
    }
  },

  /**
   * 스크립트 카드 렌더링 (필터 적용)
   */
  _renderScriptCards(listEl) {
    listEl.replaceChildren();

    let filtered = this.scripts;
    if (this.currentFilter) {
      filtered = filtered.filter(s => s.status === this.currentFilter);
    }

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      const icon = document.createElement('div');
      icon.className = 'empty-state-icon';
      icon.textContent = '📝';
      const p = document.createElement('p');
      p.className = 'empty-state-text';
      p.textContent = this.currentFilter
        ? '해당 상태의 스크립트가 없습니다.'
        : '아직 스크립트가 없습니다. 새 스크립트를 작성해보세요.';
      empty.appendChild(icon);
      empty.appendChild(p);
      listEl.appendChild(empty);
      return;
    }

    const statusLabels = {
      draft: '초안',
      refined: '다듬기 완료',
      memorizing: '암기 중',
      mastered: '완료'
    };

    filtered.forEach(script => {
      const card = document.createElement('div');
      card.className = 'script-card';

      // 헤더: 제목 + 상태 뱃지
      const cardHeader = document.createElement('div');
      cardHeader.className = 'script-card-header';

      const cardTitle = document.createElement('div');
      cardTitle.className = 'script-card-title';
      cardTitle.textContent = script.title || '제목 없음';

      const badge = document.createElement('span');
      badge.className = 'script-status-badge status-' + (script.status || 'draft');
      badge.textContent = statusLabels[script.status] || '초안';

      cardHeader.appendChild(cardTitle);
      cardHeader.appendChild(badge);
      card.appendChild(cardHeader);

      // 메타 정보: 단어 수, 주제
      const meta = document.createElement('div');
      meta.className = 'script-card-meta';

      const wordCount = WordCountUtil.count(script.content || '');
      const wordSpan = document.createElement('span');
      wordSpan.textContent = wordCount + '단어';
      meta.appendChild(wordSpan);

      if (script.topic_name) {
        const topicSpan = document.createElement('span');
        topicSpan.textContent = script.topic_name;
        meta.appendChild(topicSpan);
      }

      card.appendChild(meta);

      // 미리보기 텍스트
      if (script.content) {
        const preview = document.createElement('div');
        preview.className = 'script-card-preview';
        preview.textContent = script.content.substring(0, 120) + (script.content.length > 120 ? '...' : '');
        card.appendChild(preview);
      }

      // 암기 진행률 바 (memorizing/mastered 상태일 때)
      if (script.status === 'memorizing' || script.status === 'mastered') {
        const progress = script.memorization_progress || 0;
        const barWrap = document.createElement('div');
        barWrap.className = 'script-memorization-bar';

        const bar = document.createElement('div');
        bar.className = 'progress-bar';
        const fill = document.createElement('div');
        fill.className = 'progress-fill';
        fill.style.width = progress + '%';
        bar.appendChild(fill);
        barWrap.appendChild(bar);

        card.appendChild(barWrap);
      }

      // 카드 클릭 -> 상세 뷰
      card.addEventListener('click', () => {
        this.currentScript = script;
        this.viewMode = 'detail';
        const cont = document.getElementById('app-content');
        if (cont) this.render(cont);
      });

      listEl.appendChild(card);
    });
  },

  // ──────────────────────────────────────────
  // 상세 뷰
  // ──────────────────────────────────────────

  /**
   * 스크립트 상세 렌더링
   */
  async renderDetail(container) {
    const script = this.currentScript;
    if (!script) return;

    const statusLabels = {
      draft: '초안',
      refined: '다듬기 완료',
      memorizing: '암기 중',
      mastered: '완료'
    };

    // 뒤로가기 버튼
    const backBtn = document.createElement('button');
    backBtn.className = 'script-back-btn';
    backBtn.textContent = '< 목록으로';
    backBtn.addEventListener('click', () => {
      this.viewMode = 'list';
      this.currentScript = null;
      this.render(container);
    });
    container.appendChild(backBtn);

    // 제목 + 상태 뱃지
    const detailHeader = document.createElement('div');
    detailHeader.className = 'script-detail-header';

    const titleEl = document.createElement('h2');
    titleEl.className = 'section-title';
    titleEl.textContent = script.title || '제목 없음';

    const badge = document.createElement('span');
    badge.className = 'script-status-badge status-' + (script.status || 'draft');
    badge.textContent = statusLabels[script.status] || '초안';

    detailHeader.appendChild(titleEl);
    detailHeader.appendChild(badge);
    container.appendChild(detailHeader);

    // 질문 텍스트 (있으면 표시)
    if (script.question_text) {
      const questionDiv = document.createElement('div');
      questionDiv.className = 'script-question';
      questionDiv.style.background = 'var(--bg-secondary)';
      questionDiv.style.padding = '12px 14px';
      questionDiv.style.borderRadius = 'var(--radius-btn)';
      questionDiv.style.marginBottom = '12px';
      questionDiv.style.fontSize = '13px';
      questionDiv.style.color = 'var(--text-secondary)';
      questionDiv.style.lineHeight = '1.5';
      questionDiv.textContent = script.question_text;
      container.appendChild(questionDiv);
    }

    // 스크립트 텍스트 (편집 가능)
    const textarea = document.createElement('textarea');
    textarea.className = 'script-textarea';
    textarea.value = script.content || '';
    textarea.placeholder = '스크립트 내용을 작성하세요...';
    container.appendChild(textarea);

    // 단어 수 표시
    const wordInfo = document.createElement('div');
    wordInfo.style.fontSize = '12px';
    wordInfo.style.color = 'var(--text-secondary)';
    wordInfo.style.marginTop = '6px';
    wordInfo.style.textAlign = 'right';
    wordInfo.textContent = WordCountUtil.count(textarea.value) + '단어';
    container.appendChild(wordInfo);

    textarea.addEventListener('input', () => {
      wordInfo.textContent = WordCountUtil.count(textarea.value) + '단어';
    });

    // 액션 버튼들
    const tools = document.createElement('div');
    tools.className = 'script-tools';

    // 저장 버튼
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-primary';
    saveBtn.textContent = '저장';
    saveBtn.addEventListener('click', async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = '저장 중...';
      try {
        const updated = await apiPut('/scripts/' + script.id, {
          content: textarea.value
        });
        Object.assign(script, updated);
        showToast('저장되었습니다', 'success');
      } catch (err) {
        showToast('저장 실패: ' + (err.message || ''), 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = '저장';
      }
    });
    tools.appendChild(saveBtn);

    // AI 개선 버튼
    const refineBtn = document.createElement('button');
    refineBtn.className = 'btn';
    refineBtn.style.background = 'var(--bg-secondary)';
    refineBtn.textContent = 'AI 개선';
    refineBtn.addEventListener('click', async () => {
      if (!textarea.value.trim()) {
        showToast('스크립트 내용을 먼저 작성해주세요.', 'warning');
        return;
      }
      refineBtn.disabled = true;
      refineBtn.textContent = 'AI 분석 중...';
      try {
        // 현재 내용 먼저 저장
        await apiPut('/scripts/' + script.id, { content: textarea.value });
        const result = await apiPost('/scripts/' + script.id + '/refine', {});
        if (result.content) {
          textarea.value = result.content;
          wordInfo.textContent = WordCountUtil.count(result.content) + '단어';
          Object.assign(script, result);
        }
        showToast('AI 개선이 완료되었습니다', 'success');
      } catch (err) {
        showToast('AI 개선 실패: ' + (err.message || ''), 'error');
      } finally {
        refineBtn.disabled = false;
        refineBtn.textContent = 'AI 개선';
      }
    });
    tools.appendChild(refineBtn);

    // 암기 시작 버튼
    const memorizeBtn = document.createElement('button');
    memorizeBtn.className = 'btn';
    memorizeBtn.style.background = 'var(--bg-secondary)';
    memorizeBtn.textContent = '암기 시작';
    memorizeBtn.addEventListener('click', async () => {
      if (!textarea.value.trim()) {
        showToast('스크립트 내용을 먼저 작성해주세요.', 'warning');
        return;
      }
      try {
        // 상태를 memorizing으로 업데이트
        await apiPut('/scripts/' + script.id, {
          content: textarea.value,
          status: 'memorizing'
        });
        script.status = 'memorizing';
        script.content = textarea.value;
        showToast('암기 모드를 시작합니다', 'success');
        this.viewMode = 'flashcard';
        this.render(container);
      } catch (err) {
        showToast('상태 변경 실패: ' + (err.message || ''), 'error');
      }
    });
    tools.appendChild(memorizeBtn);

    // 플래시카드 연습 버튼 (memorizing 상태일 때만)
    if (script.status === 'memorizing') {
      const flashcardBtn = document.createElement('button');
      flashcardBtn.className = 'btn';
      flashcardBtn.style.background = 'rgba(245, 158, 11, 0.1)';
      flashcardBtn.style.color = 'var(--warning)';
      flashcardBtn.textContent = '플래시카드 연습';
      flashcardBtn.addEventListener('click', () => {
        script.content = textarea.value;
        this.viewMode = 'flashcard';
        this.render(container);
      });
      tools.appendChild(flashcardBtn);
    }

    // 삭제 버튼
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn';
    deleteBtn.style.background = 'rgba(239, 68, 68, 0.1)';
    deleteBtn.style.color = 'var(--error)';
    deleteBtn.textContent = '삭제';
    deleteBtn.addEventListener('click', async () => {
      if (!confirm('이 스크립트를 삭제하시겠습니까?')) return;
      deleteBtn.disabled = true;
      try {
        await apiDelete('/scripts/' + script.id);
        showToast('삭제되었습니다', 'success');
        this.viewMode = 'list';
        this.currentScript = null;
        this.render(container);
      } catch (err) {
        showToast('삭제 실패: ' + (err.message || ''), 'error');
        deleteBtn.disabled = false;
      }
    });
    tools.appendChild(deleteBtn);

    container.appendChild(tools);
  },

  // ──────────────────────────────────────────
  // 생성 폼
  // ──────────────────────────────────────────

  /**
   * 새 스크립트 생성 폼 렌더링
   */
  renderCreateForm(container) {
    // 뒤로가기
    const backBtn = document.createElement('button');
    backBtn.className = 'script-back-btn';
    backBtn.textContent = '< 목록으로';
    backBtn.addEventListener('click', () => {
      this.viewMode = 'list';
      this.render(container);
    });
    container.appendChild(backBtn);

    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '새 스크립트';
    container.appendChild(title);

    const form = document.createElement('div');
    form.className = 'script-create-form';

    // 제목 입력
    const titleGroup = document.createElement('div');
    titleGroup.className = 'form-group';
    const titleLabel = document.createElement('label');
    titleLabel.className = 'form-label';
    titleLabel.textContent = '제목';
    const titleInput = document.createElement('input');
    titleInput.className = 'form-input';
    titleInput.type = 'text';
    titleInput.placeholder = '예: 자기소개, 취미 소개';
    titleGroup.appendChild(titleLabel);
    titleGroup.appendChild(titleInput);
    form.appendChild(titleGroup);

    // 질문 텍스트 입력 (선택사항)
    const questionGroup = document.createElement('div');
    questionGroup.className = 'form-group';
    const questionLabel = document.createElement('label');
    questionLabel.className = 'form-label';
    questionLabel.textContent = '질문 (선택사항)';
    const questionInput = document.createElement('textarea');
    questionInput.className = 'form-input';
    questionInput.style.minHeight = '60px';
    questionInput.style.resize = 'vertical';
    questionInput.placeholder = '예: Tell me about yourself.';
    questionGroup.appendChild(questionLabel);
    questionGroup.appendChild(questionInput);
    form.appendChild(questionGroup);

    // 목표 레벨 선택
    const levelGroup = document.createElement('div');
    levelGroup.className = 'form-group';
    const levelLabel = document.createElement('label');
    levelLabel.className = 'form-label';
    levelLabel.textContent = '목표 레벨';
    const levelSelect = document.createElement('select');
    levelSelect.className = 'form-select';

    const levels = ['IM1', 'IM2', 'IM3', 'IH', 'AL'];
    levels.forEach(lv => {
      const option = document.createElement('option');
      option.value = lv;
      option.textContent = lv;
      levelSelect.appendChild(option);
    });

    levelGroup.appendChild(levelLabel);
    levelGroup.appendChild(levelSelect);
    form.appendChild(levelGroup);

    // 버튼 영역
    const actions = document.createElement('div');
    actions.className = 'script-tools';
    actions.style.marginTop = '16px';

    // AI 자동 생성 버튼
    const aiBtn = document.createElement('button');
    aiBtn.className = 'btn btn-primary';
    aiBtn.textContent = 'AI 자동 생성';
    aiBtn.addEventListener('click', async () => {
      const titleVal = titleInput.value.trim();
      if (!titleVal) {
        showToast('제목을 입력해주세요.', 'warning');
        return;
      }
      aiBtn.disabled = true;
      aiBtn.textContent = 'AI 생성 중...';
      try {
        const result = await apiPost('/scripts/generate', {
          title: titleVal,
          question_text: questionInput.value.trim() || null,
          target_level: levelSelect.value
        });
        showToast('스크립트가 생성되었습니다', 'success');
        this.currentScript = result;
        this.viewMode = 'detail';
        this.render(container);
      } catch (err) {
        showToast('AI 생성 실패: ' + (err.message || ''), 'error');
        aiBtn.disabled = false;
        aiBtn.textContent = 'AI 자동 생성';
      }
    });
    actions.appendChild(aiBtn);

    // 직접 작성 버튼
    const manualBtn = document.createElement('button');
    manualBtn.className = 'btn';
    manualBtn.style.background = 'var(--bg-secondary)';
    manualBtn.textContent = '직접 작성';
    manualBtn.addEventListener('click', async () => {
      const titleVal = titleInput.value.trim();
      if (!titleVal) {
        showToast('제목을 입력해주세요.', 'warning');
        return;
      }
      manualBtn.disabled = true;
      manualBtn.textContent = '생성 중...';
      try {
        const result = await apiPost('/scripts', {
          title: titleVal,
          question_text: questionInput.value.trim() || null,
          target_level: levelSelect.value,
          content: ''
        });
        showToast('스크립트가 생성되었습니다', 'success');
        this.currentScript = result;
        this.viewMode = 'detail';
        this.render(container);
      } catch (err) {
        showToast('생성 실패: ' + (err.message || ''), 'error');
        manualBtn.disabled = false;
        manualBtn.textContent = '직접 작성';
      }
    });
    actions.appendChild(manualBtn);

    form.appendChild(actions);
    container.appendChild(form);
  },

  // ──────────────────────────────────────────
  // 플래시카드 연습
  // ──────────────────────────────────────────

  /**
   * 플래시카드 연습 모드 렌더링
   */
  renderFlashcard(container) {
    const script = this.currentScript;
    if (!script || !script.content) {
      this.viewMode = 'list';
      this.render(container);
      return;
    }

    // 문장 분리 (마침표, 느낌표, 물음표 기준)
    const sentences = script.content
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 0);

    if (sentences.length === 0) {
      showToast('스크립트 내용이 비어 있습니다.', 'warning');
      this.viewMode = 'detail';
      this.render(container);
      return;
    }

    let currentIdx = 0;
    let revealedCount = 0;

    // 뒤로가기
    const backBtn = document.createElement('button');
    backBtn.className = 'script-back-btn';
    backBtn.textContent = '< 스크립트로';
    backBtn.addEventListener('click', () => {
      this.viewMode = 'detail';
      this.render(container);
    });
    container.appendChild(backBtn);

    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '플래시카드 연습';
    container.appendChild(title);

    // 진행률 도트
    const dotsDiv = document.createElement('div');
    dotsDiv.className = 'flashcard-progress';
    sentences.forEach((_, idx) => {
      const dot = document.createElement('div');
      dot.className = 'flashcard-dot';
      if (idx === 0) dot.classList.add('active');
      dotsDiv.appendChild(dot);
    });
    container.appendChild(dotsDiv);

    // 플래시카드 영역
    const cardDiv = document.createElement('div');
    cardDiv.className = 'flashcard-container';

    const card = document.createElement('div');
    card.className = 'flashcard';

    const hint = document.createElement('div');
    hint.className = 'flashcard-hint';
    hint.textContent = '탭하여 다음 문장 보기 (' + (currentIdx + 1) + '/' + sentences.length + ')';

    const textDiv = document.createElement('div');
    textDiv.className = 'flashcard-text';
    textDiv.textContent = sentences[0];

    card.appendChild(hint);
    card.appendChild(textDiv);
    cardDiv.appendChild(card);
    container.appendChild(cardDiv);

    // 카드 클릭으로 다음 문장 표시
    card.addEventListener('click', () => {
      currentIdx++;

      if (currentIdx >= sentences.length) {
        // 연습 완료
        this._completeFlashcard(container, script, sentences.length);
        return;
      }

      // 이전 도트를 completed로, 현재 도트를 active로
      const dots = dotsDiv.querySelectorAll('.flashcard-dot');
      if (dots[currentIdx - 1]) {
        dots[currentIdx - 1].classList.remove('active');
        dots[currentIdx - 1].classList.add('completed');
      }
      if (dots[currentIdx]) {
        dots[currentIdx].classList.add('active');
      }

      // 텍스트 누적 표시 (이전 문장들 + 현재 문장)
      revealedCount = currentIdx;
      const visibleText = sentences.slice(0, currentIdx + 1).join(' ');
      textDiv.textContent = visibleText;

      hint.textContent = currentIdx < sentences.length - 1
        ? '탭하여 다음 문장 보기 (' + (currentIdx + 1) + '/' + sentences.length + ')'
        : '탭하여 완료하기 (' + sentences.length + '/' + sentences.length + ')';
    });

    // 처음부터 다시 버튼
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'flashcard-actions';

    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn';
    resetBtn.style.background = 'var(--bg-secondary)';
    resetBtn.textContent = '처음부터';
    resetBtn.addEventListener('click', () => {
      this.renderFlashcard(container);
    });
    actionsDiv.appendChild(resetBtn);

    container.appendChild(actionsDiv);
  },

  /**
   * 플래시카드 연습 완료 처리
   */
  async _completeFlashcard(container, script, totalSentences) {
    container.replaceChildren();

    const completeDiv = document.createElement('div');
    completeDiv.style.textAlign = 'center';
    completeDiv.style.padding = '40px 20px';

    const icon = document.createElement('div');
    icon.style.fontSize = '64px';
    icon.style.marginBottom = '16px';
    icon.textContent = '🎉';
    completeDiv.appendChild(icon);

    const msg = document.createElement('h2');
    msg.className = 'section-title';
    msg.textContent = '연습 완료!';
    completeDiv.appendChild(msg);

    const detail = document.createElement('p');
    detail.style.color = 'var(--text-secondary)';
    detail.style.fontSize = '14px';
    detail.style.marginTop = '8px';
    detail.textContent = totalSentences + '개 문장을 모두 연습했습니다.';
    completeDiv.appendChild(detail);

    container.appendChild(completeDiv);

    // 암기 진행도 업데이트
    try {
      const currentProgress = script.memorization_progress || 0;
      const newProgress = Math.min(100, currentProgress + 10);
      await apiPost('/scripts/' + script.id + '/practice', {
        memorization_progress: newProgress
      });
      script.memorization_progress = newProgress;

      // 100% 달성 시 mastered로 상태 변경
      if (newProgress >= 100) {
        script.status = 'mastered';
      }
    } catch (err) {
      // 진행도 업데이트 실패는 UX를 중단하지 않음
    }

    // 액션 버튼들
    const actions = document.createElement('div');
    actions.className = 'flashcard-actions';
    actions.style.marginTop = '20px';

    const retryBtn = document.createElement('button');
    retryBtn.className = 'btn';
    retryBtn.style.background = 'var(--bg-secondary)';
    retryBtn.textContent = '다시 연습';
    retryBtn.addEventListener('click', () => {
      this.viewMode = 'flashcard';
      this.render(container);
    });
    actions.appendChild(retryBtn);

    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-primary';
    backBtn.textContent = '스크립트로 돌아가기';
    backBtn.addEventListener('click', () => {
      this.viewMode = 'detail';
      this.render(container);
    });
    actions.appendChild(backBtn);

    container.appendChild(actions);
  }
};
