// 주제별 핵심 단어/표현 학습 모듈
// 플래시카드 UI + TTS 발음 듣기
const VocabularyModule = {
  currentTopicId: null,
  allItems: [],
  currentCards: [],
  currentCardIndex: 0,
  isFlipped: false,

  /**
   * 단어장 화면 렌더링
   */
  async render(container) {
    container.replaceChildren();

    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '단어장';
    container.appendChild(title);

    try {
      const topics = await apiGet('/vocabulary/topics');

      if (topics.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        const icon = document.createElement('div');
        icon.className = 'empty-state-icon';
        icon.textContent = '📖';
        const p = document.createElement('p');
        p.className = 'empty-state-text';
        p.textContent = '아직 등록된 단어가 없습니다.';
        empty.appendChild(icon);
        empty.appendChild(p);
        container.appendChild(empty);
        return;
      }

      // 주제 탭
      const tabBar = document.createElement('div');
      tabBar.className = 'questions-tabs';

      const allTab = document.createElement('button');
      allTab.className = 'questions-tab active';
      allTab.textContent = '전체';
      allTab.addEventListener('click', () => {
        this.currentTopicId = null;
        tabBar.querySelectorAll('.questions-tab').forEach(t => t.classList.remove('active'));
        allTab.classList.add('active');
        this.loadCards(container);
      });
      tabBar.appendChild(allTab);

      topics.forEach(topic => {
        const tab = document.createElement('button');
        tab.className = 'questions-tab';
        tab.textContent = (topic.icon || '') + ' ' + topic.name + ' (' + topic.word_count + ')';
        tab.addEventListener('click', () => {
          this.currentTopicId = topic.id;
          tabBar.querySelectorAll('.questions-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this.loadCards(container);
        });
        tabBar.appendChild(tab);
      });

      container.appendChild(tabBar);

      // 모드 전환: 카드 / 리스트
      const modeBar = document.createElement('div');
      modeBar.className = 'vocab-mode-bar';

      const cardModeBtn = document.createElement('button');
      cardModeBtn.className = 'mode-btn active';
      cardModeBtn.textContent = '🃏 카드 모드';
      cardModeBtn.addEventListener('click', () => {
        cardModeBtn.classList.add('active');
        listModeBtn.classList.remove('active');
        this.renderCardMode(contentArea);
      });

      const listModeBtn = document.createElement('button');
      listModeBtn.className = 'mode-btn';
      listModeBtn.textContent = '📋 리스트 모드';
      listModeBtn.addEventListener('click', () => {
        listModeBtn.classList.add('active');
        cardModeBtn.classList.remove('active');
        this.renderListMode(contentArea);
      });

      modeBar.appendChild(cardModeBtn);
      modeBar.appendChild(listModeBtn);
      container.appendChild(modeBar);

      // 콘텐츠 영역
      const contentArea = document.createElement('div');
      contentArea.className = 'vocab-content';
      contentArea.id = 'vocab-content';
      container.appendChild(contentArea);

      await this.loadCards(container);
    } catch (err) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      const p = document.createElement('p');
      p.className = 'empty-state-text';
      p.textContent = '단어를 불러올 수 없습니다.';
      empty.appendChild(p);
      container.appendChild(empty);
    }
  },

  /**
   * 카드 데이터 로드
   */
  async loadCards(container) {
    try {
      const url = this.currentTopicId
        ? '/vocabulary/random?topic_id=' + this.currentTopicId + '&count=20'
        : '/vocabulary/random?count=20';
      this.currentCards = await apiGet(url);
      this.currentCardIndex = 0;
      this.isFlipped = false;

      const contentArea = document.getElementById('vocab-content');
      if (contentArea) this.renderCardMode(contentArea);
    } catch (err) {
      showToast('단어 로드 실패', 'error');
    }
  },

  /**
   * 카드 모드 렌더링
   */
  renderCardMode(container) {
    container.replaceChildren();

    if (this.currentCards.length === 0) {
      const p = document.createElement('p');
      p.className = 'empty-state-text';
      p.textContent = '해당 주제의 단어가 없습니다.';
      container.appendChild(p);
      return;
    }

    const card = this.currentCards[this.currentCardIndex];

    // 진행 표시
    const progress = document.createElement('div');
    progress.className = 'vocab-progress';
    progress.textContent = (this.currentCardIndex + 1) + ' / ' + this.currentCards.length;
    container.appendChild(progress);

    // 플래시카드
    const cardWrapper = document.createElement('div');
    cardWrapper.className = 'flashcard-wrapper';

    const cardEl = document.createElement('div');
    cardEl.className = 'flashcard' + (this.isFlipped ? ' flipped' : '');
    cardEl.addEventListener('click', () => {
      this.isFlipped = !this.isFlipped;
      cardEl.classList.toggle('flipped');
    });

    // 앞면 (영어)
    const front = document.createElement('div');
    front.className = 'flashcard-face flashcard-front';

    const wordEl = document.createElement('div');
    wordEl.className = 'flashcard-word';
    wordEl.textContent = card.word;
    front.appendChild(wordEl);

    if (card.category) {
      const catEl = document.createElement('div');
      catEl.className = 'flashcard-category';
      catEl.textContent = card.category;
      front.appendChild(catEl);
    }

    const flipHint = document.createElement('div');
    flipHint.className = 'flashcard-hint';
    flipHint.textContent = '탭하여 뒤집기';
    front.appendChild(flipHint);

    // 뒷면 (한국어 뜻 + 예문)
    const back = document.createElement('div');
    back.className = 'flashcard-face flashcard-back';

    const meaningEl = document.createElement('div');
    meaningEl.className = 'flashcard-meaning';
    meaningEl.textContent = card.meaning_ko;
    back.appendChild(meaningEl);

    if (card.example_sentence) {
      const exEl = document.createElement('div');
      exEl.className = 'flashcard-example';
      exEl.textContent = card.example_sentence;
      back.appendChild(exEl);
    }

    cardEl.appendChild(front);
    cardEl.appendChild(back);
    cardWrapper.appendChild(cardEl);
    container.appendChild(cardWrapper);

    // 하단 버튼들
    const actions = document.createElement('div');
    actions.className = 'vocab-actions';

    // TTS 버튼
    if (typeof TtsUtil !== 'undefined' && TtsUtil.isSupported()) {
      const ttsBtn = document.createElement('button');
      ttsBtn.className = 'btn vocab-btn';
      ttsBtn.textContent = '🔊 발음 듣기';
      ttsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        TtsUtil.speak(card.word);
        if (card.example_sentence) {
          setTimeout(() => TtsUtil.speak(card.example_sentence), 1500);
        }
      });
      actions.appendChild(ttsBtn);
    }

    // 이전/다음
    const prevBtn = document.createElement('button');
    prevBtn.className = 'btn vocab-btn';
    prevBtn.textContent = '← 이전';
    prevBtn.disabled = this.currentCardIndex === 0;
    prevBtn.addEventListener('click', () => {
      if (this.currentCardIndex > 0) {
        this.currentCardIndex--;
        this.isFlipped = false;
        this.renderCardMode(container);
      }
    });

    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn vocab-btn';
    nextBtn.textContent = '다음 →';
    nextBtn.disabled = this.currentCardIndex >= this.currentCards.length - 1;
    nextBtn.addEventListener('click', () => {
      if (this.currentCardIndex < this.currentCards.length - 1) {
        this.currentCardIndex++;
        this.isFlipped = false;
        this.renderCardMode(container);
      }
    });

    actions.appendChild(prevBtn);
    actions.appendChild(nextBtn);
    container.appendChild(actions);

    // 셔플 버튼
    const shuffleBtn = document.createElement('button');
    shuffleBtn.className = 'btn btn-secondary vocab-shuffle';
    shuffleBtn.textContent = '🔀 섞기';
    shuffleBtn.addEventListener('click', () => {
      this.currentCards.sort(() => Math.random() - 0.5);
      this.currentCardIndex = 0;
      this.isFlipped = false;
      this.renderCardMode(container);
    });
    container.appendChild(shuffleBtn);
  },

  /**
   * 리스트 모드 렌더링
   */
  renderListMode(container) {
    container.replaceChildren();

    if (this.currentCards.length === 0) {
      const p = document.createElement('p');
      p.className = 'empty-state-text';
      p.textContent = '해당 주제의 단어가 없습니다.';
      container.appendChild(p);
      return;
    }

    const list = document.createElement('div');
    list.className = 'vocab-list';

    this.currentCards.forEach(card => {
      const item = document.createElement('div');
      item.className = 'vocab-list-item';

      const top = document.createElement('div');
      top.className = 'vocab-list-top';

      const wordEl = document.createElement('span');
      wordEl.className = 'vocab-list-word';
      wordEl.textContent = card.word;
      top.appendChild(wordEl);

      // TTS
      if (typeof TtsUtil !== 'undefined' && TtsUtil.isSupported()) {
        const ttsBtn = document.createElement('button');
        ttsBtn.className = 'vocab-tts-btn';
        ttsBtn.textContent = '🔊';
        ttsBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          TtsUtil.speak(card.word);
        });
        top.appendChild(ttsBtn);
      }

      const meaningEl = document.createElement('div');
      meaningEl.className = 'vocab-list-meaning';
      meaningEl.textContent = card.meaning_ko;

      item.appendChild(top);
      item.appendChild(meaningEl);

      if (card.example_sentence) {
        const exEl = document.createElement('div');
        exEl.className = 'vocab-list-example';
        exEl.textContent = card.example_sentence;
        item.appendChild(exEl);
      }

      list.appendChild(item);
    });

    container.appendChild(list);
  }
};
