// SRS (간격 반복) 복습 모듈
// 복습 카드 표시, 품질 평가, 진행률 추적
const SrsModule = {
  dueItems: [],
  currentIndex: 0,
  isRevealed: false,
  stats: null,
  isReviewMode: false,
  reviewResults: [], // 리뷰 결과 추적

  /**
   * SRS 메인 화면 렌더링
   */
  async render(container) {
    container.replaceChildren();

    const header = document.createElement('div');
    header.className = 'srs-header';

    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '복습';
    header.appendChild(title);

    // 아이템 추가 버튼
    const seedBtn = document.createElement('button');
    seedBtn.className = 'btn';
    seedBtn.style.background = 'var(--bg-secondary)';
    seedBtn.textContent = '자동 추가';
    seedBtn.addEventListener('click', () => this.seedItems(container));
    header.appendChild(seedBtn);

    container.appendChild(header);

    // 리뷰 진행 중이면 리뷰 화면 표시
    if (this.isReviewMode && this.dueItems.length > 0) {
      this.renderReviewCard(container);
      return;
    }

    // 통계 로드
    try {
      this.stats = await apiGet('/srs/stats');
    } catch (err) {
      this.stats = { total: 0, due_today: 0, mastered: 0 };
    }

    // 통계 카드
    this._renderStatsCards(container);

    // 오늘 복습할 항목이 있으면 시작 버튼 표시
    if (this.stats.due_today > 0) {
      const startSection = document.createElement('div');
      startSection.style.textAlign = 'center';
      startSection.style.marginTop = '20px';

      const dueLabel = document.createElement('p');
      dueLabel.style.color = 'var(--text-secondary)';
      dueLabel.style.fontSize = '14px';
      dueLabel.style.marginBottom = '12px';
      dueLabel.textContent = '오늘 복습할 카드가 ' + this.stats.due_today + '개 있습니다.';
      startSection.appendChild(dueLabel);

      const startBtn = document.createElement('button');
      startBtn.className = 'btn btn-primary';
      startBtn.style.padding = '14px 40px';
      startBtn.style.fontSize = '16px';
      startBtn.textContent = '복습 시작';
      startBtn.addEventListener('click', () => this.startReview(container));
      startSection.appendChild(startBtn);

      container.appendChild(startSection);
    } else if (this.stats.total === 0) {
      // 아이템이 없을 때
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      const emptyIcon = document.createElement('div');
      emptyIcon.className = 'empty-state-icon';
      emptyIcon.textContent = '🃏';
      const emptyText = document.createElement('p');
      emptyText.className = 'empty-state-text';
      emptyText.textContent = '복습 카드가 없습니다. "자동 추가" 버튼을 눌러 학습 데이터에서 복습 카드를 만들어보세요.';
      empty.appendChild(emptyIcon);
      empty.appendChild(emptyText);
      container.appendChild(empty);
    } else {
      // 오늘 복습 완료
      const doneDiv = document.createElement('div');
      doneDiv.style.textAlign = 'center';
      doneDiv.style.marginTop = '20px';

      const doneIcon = document.createElement('div');
      doneIcon.style.fontSize = '48px';
      doneIcon.style.marginBottom = '12px';
      doneIcon.textContent = '✅';
      doneDiv.appendChild(doneIcon);

      const doneText = document.createElement('p');
      doneText.style.color = 'var(--text-secondary)';
      doneText.style.fontSize = '14px';
      doneText.textContent = '오늘의 복습을 모두 완료했습니다!';
      doneDiv.appendChild(doneText);

      container.appendChild(doneDiv);
    }
  },

  /**
   * 통계 카드 렌더링
   */
  _renderStatsCards(container) {
    const statsGrid = document.createElement('div');
    statsGrid.className = 'srs-stats';

    const statData = [
      { label: '전체 카드', value: this.stats.total || 0 },
      { label: '오늘 복습', value: this.stats.due_today || 0 },
      { label: '완료', value: this.stats.mastered || 0 }
    ];

    statData.forEach(s => {
      const card = document.createElement('div');
      card.className = 'srs-stat-card';

      const valueEl = document.createElement('div');
      valueEl.className = 'srs-stat-value';
      valueEl.textContent = s.value;

      const labelEl = document.createElement('div');
      labelEl.className = 'srs-stat-label';
      labelEl.textContent = s.label;

      card.appendChild(valueEl);
      card.appendChild(labelEl);
      statsGrid.appendChild(card);
    });

    container.appendChild(statsGrid);
  },

  /**
   * 복습 세션 시작
   */
  async startReview(container) {
    try {
      this.dueItems = await apiGet('/srs/due');
    } catch (err) {
      showToast('복습 카드를 불러올 수 없습니다.', 'error');
      return;
    }

    if (this.dueItems.length === 0) {
      showToast('오늘 복습할 카드가 없습니다.', 'warning');
      return;
    }

    this.currentIndex = 0;
    this.isRevealed = false;
    this.isReviewMode = true;
    this.reviewResults = [];

    this.render(container);
  },

  /**
   * 현재 리뷰 카드 렌더링
   */
  renderReviewCard(container) {
    const item = this.dueItems[this.currentIndex];
    if (!item) {
      this.renderComplete(container);
      return;
    }

    // 진행률 바
    const progressDiv = document.createElement('div');
    progressDiv.className = 'srs-progress';

    const progressText = document.createElement('span');
    progressText.className = 'srs-progress-text';
    progressText.textContent = (this.currentIndex + 1) + ' / ' + this.dueItems.length;

    const progressBarOuter = document.createElement('div');
    progressBarOuter.className = 'progress-bar';
    progressBarOuter.style.flex = '1';
    const progressFill = document.createElement('div');
    progressFill.className = 'progress-fill';
    progressFill.style.width = ((this.currentIndex + 1) / this.dueItems.length * 100) + '%';
    progressBarOuter.appendChild(progressFill);

    progressDiv.appendChild(progressText);
    progressDiv.appendChild(progressBarOuter);
    container.appendChild(progressDiv);

    // 리뷰 카드
    const cardEl = document.createElement('div');
    cardEl.className = 'srs-review-card';

    // 앞면 (표현/문구)
    const frontText = document.createElement('div');
    frontText.className = 'srs-card-front';
    frontText.textContent = item.front_text || item.phrase || '';
    cardEl.appendChild(frontText);

    if (this.isRevealed) {
      // 뒷면 표시
      const backText = document.createElement('div');
      backText.className = 'srs-card-back';
      backText.textContent = item.back_text || item.meaning || item.example || '';
      cardEl.appendChild(backText);
    } else {
      // 힌트
      const hint = document.createElement('div');
      hint.className = 'srs-card-hint';
      hint.textContent = '탭하여 정답 확인';
      cardEl.appendChild(hint);

      cardEl.addEventListener('click', () => {
        this.isRevealed = true;
        // 카드 영역만 다시 렌더링
        const cont = document.getElementById('app-content');
        if (cont) {
          cont.replaceChildren();
          // 헤더 다시 그리기
          const header = document.createElement('div');
          header.className = 'srs-header';
          const title = document.createElement('h2');
          title.className = 'section-title';
          title.textContent = '복습';
          header.appendChild(title);
          cont.appendChild(header);
          this.renderReviewCard(cont);
        }
      });
    }

    container.appendChild(cardEl);

    // 품질 평가 버튼 (뒷면이 보일 때만)
    if (this.isRevealed) {
      const qualityDiv = document.createElement('div');
      qualityDiv.className = 'srs-quality-buttons';

      const qualities = [
        { label: '모름', value: 1, cls: 'fail' },
        { label: '어려움', value: 2, cls: 'hard' },
        { label: '보통', value: 3, cls: 'good' },
        { label: '쉬움', value: 5, cls: 'easy' }
      ];

      qualities.forEach(q => {
        const btn = document.createElement('button');
        btn.className = 'srs-quality-btn ' + q.cls;
        btn.textContent = q.label;
        btn.addEventListener('click', () => this._submitQuality(item, q.value));
        qualityDiv.appendChild(btn);
      });

      container.appendChild(qualityDiv);
    }
  },

  /**
   * 품질 평가 제출 후 다음 카드로 이동
   */
  async _submitQuality(item, quality) {
    // 결과 기록
    this.reviewResults.push({
      item_id: item.id,
      quality: quality,
      success: quality >= 3
    });

    // 서버에 리뷰 결과 전송
    try {
      await apiPost('/srs/review', {
        item_id: item.id,
        quality: quality
      });
    } catch (err) {
      // 리뷰 전송 실패 시에도 다음 카드로 진행 (UX 우선)
    }

    // 다음 카드로
    this.currentIndex++;
    this.isRevealed = false;

    if (this.currentIndex >= this.dueItems.length) {
      this.isReviewMode = false;
      const container = document.getElementById('app-content');
      if (container) {
        container.replaceChildren();
        this.renderComplete(container);
      }
    } else {
      const container = document.getElementById('app-content');
      if (container) {
        container.replaceChildren();
        // 헤더 다시 그리기
        const header = document.createElement('div');
        header.className = 'srs-header';
        const title = document.createElement('h2');
        title.className = 'section-title';
        title.textContent = '복습';
        header.appendChild(title);
        container.appendChild(header);
        this.renderReviewCard(container);
      }
    }
  },

  /**
   * 복습 완료 화면 렌더링
   */
  renderComplete(container) {
    const totalReviewed = this.reviewResults.length;
    const successCount = this.reviewResults.filter(r => r.success).length;
    const successRate = totalReviewed > 0 ? Math.round(successCount / totalReviewed * 100) : 0;

    const completeDiv = document.createElement('div');
    completeDiv.className = 'srs-complete';

    const icon = document.createElement('div');
    icon.className = 'srs-complete-icon';
    icon.textContent = '🎉';
    completeDiv.appendChild(icon);

    const titleEl = document.createElement('div');
    titleEl.className = 'srs-complete-title';
    titleEl.textContent = '복습 완료!';
    completeDiv.appendChild(titleEl);

    const statsText = document.createElement('div');
    statsText.className = 'srs-complete-text';
    statsText.textContent = totalReviewed + '개 카드를 복습했습니다.';
    completeDiv.appendChild(statsText);

    const rateText = document.createElement('div');
    rateText.className = 'srs-complete-text';
    rateText.style.marginTop = '4px';
    rateText.textContent = '정답률: ' + successRate + '% (' + successCount + '/' + totalReviewed + ')';
    if (successRate >= 80) {
      rateText.style.color = 'var(--success)';
    } else if (successRate >= 50) {
      rateText.style.color = 'var(--warning)';
    } else {
      rateText.style.color = 'var(--error)';
    }
    completeDiv.appendChild(rateText);

    container.appendChild(completeDiv);

    // 돌아가기 버튼
    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-primary';
    backBtn.style.display = 'block';
    backBtn.style.margin = '20px auto 0';
    backBtn.textContent = '돌아가기';
    backBtn.addEventListener('click', () => {
      this.isReviewMode = false;
      this.reviewResults = [];
      const cont = document.getElementById('app-content');
      if (cont) this.render(cont);
    });
    container.appendChild(backBtn);
  },

  /**
   * SRS 아이템 자동 생성 (시드)
   */
  async seedItems(container) {
    try {
      showToast('복습 카드를 생성하고 있습니다...', 'success');
      await apiPost('/srs/seed', {});
      showToast('복습 카드가 추가되었습니다', 'success');
      this.render(container);
    } catch (err) {
      if (err.status === 404) {
        showToast('학습 데이터가 부족합니다. 시험이나 스크립트를 먼저 진행해주세요.', 'warning');
      } else {
        showToast('카드 생성 실패: ' + (err.message || ''), 'error');
      }
    }
  }
};
