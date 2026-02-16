// 문제은행 모듈 (FR-005~008) — M2에서 상세 구현
const QuestionsModule = {
  async render(container) {
    container.innerHTML = '';

    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '문제은행';
    container.appendChild(title);

    // 선택된 주제 확인
    let topics, questions;
    try {
      topics = await apiGet('/topics');
      const selectedTopics = topics.filter(t => t.is_selected);

      if (selectedTopics.length === 0) {
        container.innerHTML += '<div class="empty-state"><div class="empty-state-icon">📋</div><p class="empty-state-text">서베이 설정에서 주제를 먼저 선택해주세요.</p></div>';
        return;
      }

      // 주제별 탭
      const tabBar = document.createElement('div');
      tabBar.className = 'questions-tabs';

      // 전체 탭
      const allTab = document.createElement('button');
      allTab.className = 'questions-tab active';
      allTab.textContent = '전체';
      allTab.addEventListener('click', () => this.filterByTopic(null, tabBar));
      tabBar.appendChild(allTab);

      selectedTopics.forEach(topic => {
        const tab = document.createElement('button');
        tab.className = 'questions-tab';
        tab.textContent = topic.name;
        tab.dataset.topicId = topic.id;
        tab.addEventListener('click', () => this.filterByTopic(topic.id, tabBar));
        tabBar.appendChild(tab);
      });

      container.appendChild(tabBar);

      // 유형 필터
      const filterBar = document.createElement('div');
      filterBar.className = 'question-filter';
      const types = [
        { value: '', label: '전체' },
        { value: 'survey', label: '서베이' },
        { value: 'combo', label: '콤보' },
        { value: 'roleplay', label: '롤플레이' },
        { value: 'unexpected', label: '돌발' }
      ];
      types.forEach(t => {
        const btn = document.createElement('button');
        btn.className = `questions-tab ${t.value === '' ? 'active' : ''}`;
        btn.textContent = t.label;
        btn.dataset.type = t.value;
        btn.addEventListener('click', () => this.filterByType(t.value, filterBar));
        filterBar.appendChild(btn);
      });
      container.appendChild(filterBar);

      // 질문 목록 영역
      const listEl = document.createElement('div');
      listEl.className = 'question-list';
      listEl.id = 'question-list';
      container.appendChild(listEl);

      // 전체 질문 로드
      questions = await apiGet('/questions');
      this.allQuestions = questions;
      this.renderQuestions(questions);

    } catch (err) {
      container.innerHTML += '<div class="empty-state"><p class="empty-state-text">질문을 불러올 수 없습니다.</p></div>';
    }
  },

  allQuestions: [],
  currentTopicId: null,
  currentType: '',

  filterByTopic(topicId, tabBar) {
    this.currentTopicId = topicId;
    tabBar.querySelectorAll('.questions-tab').forEach(tab => {
      tab.classList.toggle('active', (topicId === null && !tab.dataset.topicId) || tab.dataset.topicId == topicId);
    });
    this.applyFilters();
  },

  filterByType(type, filterBar) {
    this.currentType = type;
    filterBar.querySelectorAll('.questions-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === type);
    });
    this.applyFilters();
  },

  applyFilters() {
    let filtered = this.allQuestions;
    if (this.currentTopicId) {
      filtered = filtered.filter(q => q.topic_id == this.currentTopicId);
    }
    if (this.currentType) {
      filtered = filtered.filter(q => q.type === this.currentType);
    }
    this.renderQuestions(filtered);
  },

  renderQuestions(questions) {
    const listEl = document.getElementById('question-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    if (questions.length === 0) {
      listEl.innerHTML = '<div class="empty-state"><p class="empty-state-text">해당 조건의 질문이 없습니다.</p></div>';
      return;
    }

    const typeLabels = { survey: '서베이', combo: '콤보', roleplay: '롤플레이', unexpected: '돌발' };

    questions.forEach(q => {
      const card = document.createElement('div');
      card.className = 'question-card';

      const header = document.createElement('div');
      header.className = 'question-header';

      const tag = document.createElement('span');
      tag.className = `question-type-tag tag-${q.type}`;
      tag.textContent = typeLabels[q.type] || q.type;

      const topicTag = document.createElement('span');
      topicTag.className = 'question-type-tag';
      topicTag.style.background = 'rgba(148,163,184,0.15)';
      topicTag.style.color = 'var(--text-secondary)';
      topicTag.textContent = q.topic_name || '';

      header.appendChild(tag);
      header.appendChild(topicTag);

      const text = document.createElement('div');
      text.className = 'question-text';
      text.textContent = q.question_text;

      card.appendChild(header);
      card.appendChild(text);

      // 클릭 시 답변 가이드 토글
      card.addEventListener('click', () => this.toggleGuide(q.id, card));

      listEl.appendChild(card);
    });
  },

  async toggleGuide(questionId, cardEl) {
    const existing = cardEl.querySelector('.guide-panel');
    if (existing) {
      existing.remove();
      return;
    }

    try {
      const settings = await apiGet('/settings');
      const levelCode = settings.target_level || 'IM1';
      const guides = await apiGet(`/questions/${questionId}/guide?level_code=${levelCode}`);

      if (guides.length === 0) {
        const panel = document.createElement('div');
        panel.className = 'guide-panel';
        panel.innerHTML = '<p class="guide-content">이 질문에 대한 답변 가이드가 아직 없습니다.</p>';
        cardEl.appendChild(panel);
        return;
      }

      const guide = guides[0];
      const panel = document.createElement('div');
      panel.className = 'guide-panel';

      let html = '';
      if (guide.structure) {
        html += `<div class="guide-section-title">📝 답변 구조</div><div class="guide-content">${guide.structure}</div>`;
      }
      if (guide.key_phrases) {
        try {
          const phrases = JSON.parse(guide.key_phrases);
          html += '<div class="guide-section-title">💬 핵심 표현</div><div class="guide-phrases">';
          phrases.forEach(p => { html += `<span class="guide-phrase">${p}</span>`; });
          html += '</div>';
        } catch (e) { /* 파싱 실패 무시 */ }
      }
      if (guide.target_words) {
        html += `<div class="guide-section-title mt-12">🎯 목표 단어 수</div><div class="guide-content">${guide.target_words}단어</div>`;
      }

      panel.innerHTML = html;
      cardEl.appendChild(panel);
    } catch (err) {
      console.error('가이드 로드 실패:', err);
    }
  }
};
