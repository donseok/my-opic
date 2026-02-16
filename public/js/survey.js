// 서베이 설정 모듈 (FR-001~004)
// 주제 카드 선택/해제, 저장/로드

const SurveyModule = {
  topics: [],       // 전체 주제 목록
  selectedIds: [],  // 선택된 주제 ID 배열

  /**
   * 서베이 설정 화면 렌더링
   */
  async render(container) {
    container.replaceChildren();

    // 주제 목록 로드
    try {
      this.topics = await apiGet('/topics');
      this.selectedIds = this.topics.filter(t => t.is_selected).map(t => t.id);
    } catch (err) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      const p = document.createElement('p');
      p.textContent = '주제 목록을 불러올 수 없습니다';
      empty.appendChild(p);
      container.appendChild(empty);
      return;
    }

    // 헤더
    const header = document.createElement('div');
    header.className = 'survey-header';

    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '서베이 주제 선택';

    const count = document.createElement('span');
    count.className = 'survey-count';
    count.id = 'survey-count';

    header.appendChild(title);
    header.appendChild(count);
    container.appendChild(header);

    // 안내 텍스트
    const subtitle = document.createElement('p');
    subtitle.className = 'section-subtitle';
    subtitle.textContent = 'OPIc 시험에 출제되는 주제 중 관심 있는 3~5개를 선택하세요.';
    container.appendChild(subtitle);

    // 카드 그리드
    const grid = document.createElement('div');
    grid.className = 'survey-grid';

    this.topics.forEach(topic => {
      const card = document.createElement('div');
      card.className = 'topic-card';
      card.dataset.id = topic.id;

      if (this.selectedIds.includes(topic.id)) {
        card.classList.add('selected');
      }

      const icon = document.createElement('span');
      icon.className = 'topic-icon';
      icon.textContent = topic.icon || '📌';

      const name = document.createElement('div');
      name.className = 'topic-name';
      name.textContent = topic.name;

      const nameEn = document.createElement('div');
      nameEn.className = 'topic-name-en';
      nameEn.textContent = topic.name_en;

      card.appendChild(icon);
      card.appendChild(name);
      card.appendChild(nameEn);

      // 클릭 이벤트
      card.addEventListener('click', () => this.toggleTopic(topic.id, card));

      grid.appendChild(card);
    });

    container.appendChild(grid);

    // 안내 메시지
    const message = document.createElement('div');
    message.className = 'survey-message';
    message.id = 'survey-message';
    container.appendChild(message);

    // 저장 버튼
    const actions = document.createElement('div');
    actions.className = 'survey-actions';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-primary';
    saveBtn.id = 'survey-save-btn';
    saveBtn.textContent = '선택 저장';
    saveBtn.addEventListener('click', () => this.saveSelection());

    actions.appendChild(saveBtn);
    container.appendChild(actions);

    // 상태 업데이트
    this.updateUI();
  },

  /**
   * 주제 선택/해제 토글
   */
  toggleTopic(id, cardEl) {
    const idx = this.selectedIds.indexOf(id);

    if (idx > -1) {
      // 해제
      this.selectedIds.splice(idx, 1);
      cardEl.classList.remove('selected');
    } else {
      // 5개 초과 시 차단
      if (this.selectedIds.length >= 5) {
        showToast('최대 5개까지 선택할 수 있습니다', 'warning');
        return;
      }
      this.selectedIds.push(id);
      cardEl.classList.add('selected');
    }

    this.updateUI();
  },

  /**
   * UI 상태 업데이트 (카운트, 버튼, 메시지)
   */
  updateUI() {
    const count = this.selectedIds.length;
    const countEl = document.getElementById('survey-count');
    const saveBtn = document.getElementById('survey-save-btn');
    const messageEl = document.getElementById('survey-message');

    if (countEl) {
      countEl.replaceChildren();
      const strong = document.createElement('strong');
      strong.textContent = count;
      countEl.appendChild(strong);
      countEl.appendChild(document.createTextNode('/5개 선택'));
    }

    if (saveBtn) {
      saveBtn.disabled = count < 3;
    }

    if (messageEl) {
      if (count < 3) {
        messageEl.textContent = `${3 - count}개 더 선택해주세요 (최소 3개)`;
      } else if (count >= 5) {
        messageEl.textContent = '최대 선택 개수에 도달했습니다';
      } else {
        messageEl.textContent = '';
      }
    }
  },

  /**
   * 선택 저장
   */
  async saveSelection() {
    try {
      await apiPut('/topics/selection', { selected_ids: this.selectedIds });
      showToast('주제 선택이 저장되었습니다', 'success');
    } catch (err) {
      showToast(err.message || '저장에 실패했습니다', 'error');
    }
  }
};
