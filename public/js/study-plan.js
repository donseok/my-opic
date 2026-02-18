// 학습 플랜 모듈
// 오늘의 학습 플랜, 태스크 체크리스트, 약점 분석, 히스토리
const StudyPlanModule = {
  plan: null,
  tasks: [],

  /**
   * 학습 플랜 화면 렌더링
   */
  async render(container) {
    container.replaceChildren();

    // 헤더
    const header = document.createElement('div');
    header.className = 'plan-header';

    const headerLeft = document.createElement('div');
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '오늘의 학습 플랜';
    headerLeft.appendChild(title);

    const dateLabel = document.createElement('div');
    dateLabel.className = 'plan-date';
    dateLabel.textContent = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
    });
    headerLeft.appendChild(dateLabel);
    header.appendChild(headerLeft);

    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'btn';
    refreshBtn.style.background = 'var(--bg-secondary)';
    refreshBtn.textContent = '새로고침';
    refreshBtn.addEventListener('click', () => this.render(container));
    header.appendChild(refreshBtn);
    container.appendChild(header);

    // 로딩 표시
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'empty-state';
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    const loadingText = document.createElement('p');
    loadingText.className = 'empty-state-text';
    loadingText.textContent = '학습 플랜을 불러오는 중...';
    loadingDiv.appendChild(spinner);
    loadingDiv.appendChild(loadingText);
    container.appendChild(loadingDiv);

    try {
      // 오늘의 플랜 조회
      let plan;
      try {
        plan = await apiGet('/study-plan/today');
      } catch (err) {
        // 404 등 플랜이 없는 경우 자동 생성
        if (err.status === 404) {
          loadingText.textContent = '학습 플랜을 생성하고 있습니다...';
          plan = await apiPost('/study-plan/generate', {});
        } else {
          throw err;
        }
      }

      this.plan = plan;
      this.tasks = plan.tasks || [];

      // 로딩 제거, 콘텐츠 렌더링
      loadingDiv.remove();

      // 완료율 카드
      this._renderCompletionCard(container);

      // 약점 분석 카드
      if (plan.weakness_analysis) {
        this._renderWeaknessCard(container, plan.weakness_analysis);
      }

      // 태스크 목록
      this._renderTaskList(container);

      // 히스토리
      await this._renderHistory(container);

    } catch (err) {
      loadingDiv.remove();

      const errorDiv = document.createElement('div');
      errorDiv.className = 'empty-state';
      const errorIcon = document.createElement('div');
      errorIcon.className = 'empty-state-icon';
      errorIcon.textContent = '📋';
      const errorText = document.createElement('p');
      errorText.className = 'empty-state-text';
      errorText.textContent = '학습 플랜을 불러올 수 없습니다.';
      errorDiv.appendChild(errorIcon);
      errorDiv.appendChild(errorText);

      // 재시도 버튼
      const retryBtn = document.createElement('button');
      retryBtn.className = 'btn btn-primary';
      retryBtn.style.marginTop = '12px';
      retryBtn.textContent = '다시 시도';
      retryBtn.addEventListener('click', () => this.render(container));
      errorDiv.appendChild(retryBtn);

      container.appendChild(errorDiv);
    }
  },

  /**
   * 완료율 카드 렌더링
   */
  _renderCompletionCard(container) {
    const completedCount = this.tasks.filter(t => t.is_completed).length;
    const totalCount = this.tasks.length;
    const rate = totalCount > 0 ? Math.round(completedCount / totalCount * 100) : 0;

    const card = document.createElement('div');
    card.className = 'plan-completion';
    card.id = 'plan-completion';

    const rateEl = document.createElement('div');
    rateEl.className = 'plan-completion-rate';
    rateEl.textContent = rate + '%';

    const label = document.createElement('div');
    label.className = 'plan-completion-label';
    label.textContent = '오늘 학습 완료율 (' + completedCount + '/' + totalCount + ')';

    const barWrap = document.createElement('div');
    barWrap.className = 'plan-completion-bar';
    const bar = document.createElement('div');
    bar.className = 'progress-bar';
    const fill = document.createElement('div');
    fill.className = 'progress-fill';
    fill.style.width = rate + '%';
    bar.appendChild(fill);
    barWrap.appendChild(bar);

    card.appendChild(rateEl);
    card.appendChild(label);
    card.appendChild(barWrap);
    container.appendChild(card);
  },

  /**
   * 약점 분석 카드 렌더링
   */
  _renderWeaknessCard(container, weakness) {
    const card = document.createElement('div');
    card.className = 'weakness-card';

    const title = document.createElement('div');
    title.className = 'weakness-title';
    title.textContent = '약점 분석';
    card.appendChild(title);

    const bars = document.createElement('div');
    bars.className = 'weakness-bars';

    // weakness가 객체(키-값)이거나 배열일 수 있음
    let entries = [];
    if (typeof weakness === 'string') {
      try {
        weakness = JSON.parse(weakness);
      } catch (e) {
        // 파싱 실패 시 표시 생략
        return;
      }
    }

    if (Array.isArray(weakness)) {
      entries = weakness.map(w => ({
        label: w.skill || w.label || w.name || '',
        value: w.score || w.value || 0
      }));
    } else if (typeof weakness === 'object') {
      entries = Object.entries(weakness).map(([key, val]) => ({
        label: key,
        value: typeof val === 'number' ? val : 0
      }));
    }

    const colorMap = {
      '문법': 'var(--accent)',
      'grammar': 'var(--accent)',
      '유창성': '#7C3AED',
      'fluency': '#7C3AED',
      '어휘': '#0284C7',
      'vocabulary': '#0284C7',
      '발음': '#F59E0B',
      'pronunciation': '#F59E0B'
    };

    entries.forEach(entry => {
      const row = document.createElement('div');
      row.className = 'weakness-bar-row';

      const label = document.createElement('span');
      label.className = 'weakness-bar-label';
      label.textContent = entry.label;

      const barOuter = document.createElement('div');
      barOuter.className = 'weakness-bar';
      const barFill = document.createElement('div');
      barFill.className = 'weakness-bar-fill';
      barFill.style.width = Math.min(100, entry.value) + '%';
      barFill.style.background = colorMap[entry.label.toLowerCase()] || colorMap[entry.label] || 'var(--accent)';
      barOuter.appendChild(barFill);

      const valueEl = document.createElement('span');
      valueEl.className = 'weakness-bar-value';
      valueEl.textContent = entry.value;

      row.appendChild(label);
      row.appendChild(barOuter);
      row.appendChild(valueEl);
      bars.appendChild(row);
    });

    card.appendChild(bars);
    container.appendChild(card);
  },

  /**
   * 태스크 목록 렌더링
   */
  _renderTaskList(container) {
    const sectionTitle = document.createElement('div');
    sectionTitle.style.fontSize = '14px';
    sectionTitle.style.fontWeight = '600';
    sectionTitle.style.marginBottom = '12px';
    sectionTitle.style.marginTop = '8px';
    sectionTitle.textContent = '오늘의 학습 과제';
    container.appendChild(sectionTitle);

    const listEl = document.createElement('div');
    listEl.className = 'task-list';
    listEl.id = 'task-list';

    if (this.tasks.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      const p = document.createElement('p');
      p.className = 'empty-state-text';
      p.textContent = '오늘의 학습 과제가 아직 없습니다.';
      empty.appendChild(p);
      listEl.appendChild(empty);
      container.appendChild(listEl);
      return;
    }

    const typeIcons = {
      exam: '📝',
      script: '📄',
      review: '🔄',
      srs: '🃏',
      vocabulary: '📚',
      grammar: '📖',
      listening: '🎧',
      speaking: '🎤'
    };

    const priorityLabels = {
      high: '높음',
      medium: '보통',
      low: '낮음'
    };

    this.tasks.forEach(task => {
      const item = document.createElement('div');
      item.className = 'task-item' + (task.is_completed ? ' completed' : '');

      // 체크박스
      const checkbox = document.createElement('div');
      checkbox.className = 'task-checkbox' + (task.is_completed ? ' checked' : '');
      checkbox.textContent = task.is_completed ? '✓' : '';
      checkbox.addEventListener('click', async (e) => {
        e.stopPropagation();
        await this._toggleTask(task, checkbox, item);
      });
      item.appendChild(checkbox);

      // 타입 아이콘
      const iconEl = document.createElement('div');
      iconEl.className = 'task-type-icon';
      iconEl.textContent = typeIcons[task.type] || '📌';
      item.appendChild(iconEl);

      // 내용
      const content = document.createElement('div');
      content.className = 'task-content';

      const taskTitle = document.createElement('div');
      taskTitle.className = 'task-title';
      taskTitle.textContent = task.title || '';
      content.appendChild(taskTitle);

      if (task.description) {
        const desc = document.createElement('div');
        desc.className = 'task-description';
        desc.textContent = task.description;
        content.appendChild(desc);
      }

      item.appendChild(content);

      // 우선순위 뱃지
      if (task.priority) {
        const priorityEl = document.createElement('span');
        priorityEl.className = 'task-priority priority-' + task.priority;
        priorityEl.textContent = priorityLabels[task.priority] || task.priority;
        item.appendChild(priorityEl);
      }

      listEl.appendChild(item);
    });

    container.appendChild(listEl);
  },

  /**
   * 태스크 완료/미완료 토글
   */
  async _toggleTask(task, checkboxEl, itemEl) {
    const newCompleted = !task.is_completed;

    // 낙관적 UI 업데이트
    task.is_completed = newCompleted;
    checkboxEl.classList.toggle('checked', newCompleted);
    checkboxEl.textContent = newCompleted ? '✓' : '';
    itemEl.classList.toggle('completed', newCompleted);

    // 완료율 업데이트
    this._updateCompletionRate();

    try {
      await apiPut('/study-plan/tasks/' + task.id + '/complete', {
        is_completed: newCompleted
      });
    } catch (err) {
      // 실패 시 롤백
      task.is_completed = !newCompleted;
      checkboxEl.classList.toggle('checked', !newCompleted);
      checkboxEl.textContent = !newCompleted ? '' : '✓';
      itemEl.classList.toggle('completed', !newCompleted);
      this._updateCompletionRate();
      showToast('상태 변경에 실패했습니다.', 'error');
    }
  },

  /**
   * 완료율 UI 업데이트 (DOM 직접 조작)
   */
  _updateCompletionRate() {
    const completedCount = this.tasks.filter(t => t.is_completed).length;
    const totalCount = this.tasks.length;
    const rate = totalCount > 0 ? Math.round(completedCount / totalCount * 100) : 0;

    const card = document.getElementById('plan-completion');
    if (!card) return;

    const rateEl = card.querySelector('.plan-completion-rate');
    if (rateEl) rateEl.textContent = rate + '%';

    const labelEl = card.querySelector('.plan-completion-label');
    if (labelEl) labelEl.textContent = '오늘 학습 완료율 (' + completedCount + '/' + totalCount + ')';

    const fillEl = card.querySelector('.progress-fill');
    if (fillEl) fillEl.style.width = rate + '%';
  },

  /**
   * 학습 히스토리 렌더링
   */
  async _renderHistory(container) {
    try {
      const history = await apiGet('/study-plan/history');

      if (!history || history.length === 0) return;

      const section = document.createElement('div');
      section.className = 'plan-history';

      const historyTitle = document.createElement('div');
      historyTitle.style.fontSize = '14px';
      historyTitle.style.fontWeight = '600';
      historyTitle.style.marginBottom = '12px';
      historyTitle.textContent = '최근 7일 학습 현황';
      section.appendChild(historyTitle);

      history.slice(0, 7).forEach(h => {
        const item = document.createElement('div');
        item.className = 'plan-history-item';

        const dateEl = document.createElement('span');
        dateEl.className = 'plan-history-date';
        const d = new Date(h.date);
        dateEl.textContent = d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' });

        const rateEl = document.createElement('span');
        rateEl.className = 'plan-history-rate';
        const rate = h.completion_rate != null ? h.completion_rate : 0;
        rateEl.textContent = rate + '%';
        // 색상을 완료율에 따라 변경
        if (rate >= 80) {
          rateEl.style.color = 'var(--success)';
        } else if (rate >= 50) {
          rateEl.style.color = 'var(--warning)';
        } else {
          rateEl.style.color = 'var(--error)';
        }

        item.appendChild(dateEl);
        item.appendChild(rateEl);
        section.appendChild(item);
      });

      container.appendChild(section);
    } catch (err) {
      // 히스토리 로드 실패는 무시 (핵심 기능 아님)
    }
  }
};
