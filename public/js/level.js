// 레벨 설정 모듈 (FR-009~013)
// 현재/목표 레벨 선택, 갭 분석, 저장/로드

const LevelModule = {
  levels: [],          // 전체 레벨 목록
  currentLevel: null,  // 선택된 현재 레벨 코드
  targetLevel: null,   // 선택된 목표 레벨 코드

  /**
   * 레벨 설정 화면 렌더링
   */
  async render(container) {
    container.replaceChildren();

    // 데이터 로드
    try {
      this.levels = await apiGet('/levels');
      const settings = await apiGet('/settings');
      this.currentLevel = settings.current_level;
      this.targetLevel = settings.target_level;
    } catch (err) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      const p = document.createElement('p');
      p.textContent = '레벨 정보를 불러올 수 없습니다';
      empty.appendChild(p);
      container.appendChild(empty);
      return;
    }

    // 제목
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '레벨 설정';
    container.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'section-subtitle';
    subtitle.textContent = '현재 실력 레벨과 목표 레벨을 선택하세요.';
    container.appendChild(subtitle);

    // 통합 레벨 리스트
    const levelSection = document.createElement('div');
    levelSection.className = 'level-section';

    const levelList = document.createElement('div');
    levelList.className = 'level-list';
    levelList.id = 'level-list';

    this.levels.forEach(level => {
      const item = this.createLevelItem(level);
      levelList.appendChild(item);
    });

    levelSection.appendChild(levelList);
    container.appendChild(levelSection);

    // 갭 분석
    const gapEl = document.createElement('div');
    gapEl.id = 'gap-analysis';
    container.appendChild(gapEl);

    // 저장 버튼
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-primary';
    saveBtn.style.width = '100%';
    saveBtn.textContent = '레벨 설정 저장';
    saveBtn.addEventListener('click', () => this.saveSettings());
    container.appendChild(saveBtn);

    // 상태 반영
    this.updateTargetDisabled();
    this.renderGapAnalysis();
  },

  /**
   * 레벨 아이템 생성 (통합: 현재/목표 뱃지 포함)
   */
  createLevelItem(level) {
    const item = document.createElement('div');
    item.className = 'level-item';
    item.dataset.code = level.code;

    const info = document.createElement('div');
    info.className = 'level-info';

    const code = document.createElement('span');
    code.className = 'level-code';
    code.textContent = level.code;

    const name = document.createElement('span');
    name.className = 'level-name';
    name.textContent = level.name;

    info.appendChild(code);
    info.appendChild(name);

    const actions = document.createElement('div');
    actions.className = 'level-actions';

    const words = document.createElement('span');
    words.className = 'level-words';
    words.textContent = level.min_words + '단어+';

    const currentBtn = document.createElement('button');
    currentBtn.className = 'level-badge level-badge-current';
    currentBtn.textContent = '현재';
    if (this.currentLevel === level.code) currentBtn.classList.add('active');
    currentBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectLevel(level.code, 'current');
    });

    const targetBtn = document.createElement('button');
    targetBtn.className = 'level-badge level-badge-target';
    targetBtn.textContent = '목표';
    if (this.targetLevel === level.code) targetBtn.classList.add('active');
    targetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectLevel(level.code, 'target');
    });

    actions.appendChild(words);
    actions.appendChild(currentBtn);
    actions.appendChild(targetBtn);

    item.appendChild(info);
    item.appendChild(actions);

    return item;
  },

  /**
   * 레벨 선택
   */
  selectLevel(code, type) {
    if (type === 'current') {
      this.currentLevel = code;
      this.updateBadges();
      this.updateTargetDisabled();
    } else {
      this.targetLevel = code;
      this.updateBadges();
    }
    this.renderGapAnalysis();
  },

  /**
   * 뱃지 활성 상태 업데이트
   */
  updateBadges() {
    document.querySelectorAll('#level-list .level-badge-current').forEach(btn => {
      btn.classList.toggle('active', btn.closest('.level-item').dataset.code === this.currentLevel);
    });
    document.querySelectorAll('#level-list .level-badge-target').forEach(btn => {
      btn.classList.toggle('active', btn.closest('.level-item').dataset.code === this.targetLevel);
    });
  },

  /**
   * 목표 레벨에서 현재 레벨 이하 비활성화
   */
  updateTargetDisabled() {
    const currentIdx = this.levels.findIndex(l => l.code === this.currentLevel);

    document.querySelectorAll('#level-list .level-item').forEach(el => {
      const levelIdx = this.levels.findIndex(l => l.code === el.dataset.code);
      const targetBtn = el.querySelector('.level-badge-target');
      if (currentIdx >= 0 && levelIdx <= currentIdx) {
        targetBtn.classList.add('disabled');
        if (this.targetLevel === el.dataset.code) {
          this.targetLevel = null;
          targetBtn.classList.remove('active');
        }
      } else {
        targetBtn.classList.remove('disabled');
      }
    });
  },

  /**
   * 갭 분석 렌더링
   */
  renderGapAnalysis() {
    const container = document.getElementById('gap-analysis');
    if (!container) return;

    if (!this.currentLevel || !this.targetLevel) {
      container.replaceChildren();
      return;
    }

    const currentIdx = this.levels.findIndex(l => l.code === this.currentLevel);
    const targetIdx = this.levels.findIndex(l => l.code === this.targetLevel);
    const steps = targetIdx - currentIdx;

    // 예상 학습 기간 계산 (단계당 약 2~4주)
    const minWeeks = steps * 2;
    const maxWeeks = steps * 4;

    // 프로그레스 바 비율
    const progress = ((currentIdx + 1) / this.levels.length * 100).toFixed(0);

    container.replaceChildren();
    container.className = 'gap-analysis';

    const title = document.createElement('div');
    title.className = 'gap-title';
    title.textContent = '📊 갭 분석';
    container.appendChild(title);

    // 레벨 뱃지
    const levelsRow = document.createElement('div');
    levelsRow.className = 'gap-levels';

    const currentBadge = document.createElement('span');
    currentBadge.className = 'gap-level-badge gap-current';
    currentBadge.textContent = this.currentLevel;

    const arrow = document.createElement('span');
    arrow.className = 'gap-arrow';
    arrow.textContent = '→';

    const targetBadge = document.createElement('span');
    targetBadge.className = 'gap-level-badge gap-target';
    targetBadge.textContent = this.targetLevel;

    levelsRow.appendChild(currentBadge);
    levelsRow.appendChild(arrow);
    levelsRow.appendChild(targetBadge);
    container.appendChild(levelsRow);

    // 단계 수
    const stepsEl = document.createElement('div');
    stepsEl.className = 'gap-steps';
    const stepsStrong = document.createElement('strong');
    stepsStrong.textContent = steps + '단계';
    stepsEl.appendChild(stepsStrong);
    stepsEl.appendChild(document.createTextNode(' 차이'));
    container.appendChild(stepsEl);

    // 프로그레스 바
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.style.marginBottom = '12px';

    const progressFill = document.createElement('div');
    progressFill.className = 'progress-fill';
    progressFill.style.width = progress + '%';
    progressBar.appendChild(progressFill);
    container.appendChild(progressBar);

    // 상세 정보
    const details = document.createElement('div');
    details.className = 'gap-details';
    details.textContent = '예상 학습 기간: ' + minWeeks + '~' + maxWeeks + '주 | 꾸준한 연습이 필요합니다';
    container.appendChild(details);
  },

  /**
   * 레벨 설정 저장
   */
  async saveSettings() {
    if (!this.currentLevel || !this.targetLevel) {
      showToast('현재 레벨과 목표 레벨을 모두 선택해주세요', 'warning');
      return;
    }

    try {
      await apiPut('/settings', {
        current_level: this.currentLevel,
        target_level: this.targetLevel
      });
      showToast('레벨 설정이 저장되었습니다', 'success');
    } catch (err) {
      showToast(err.message || '저장에 실패했습니다', 'error');
    }
  }
};
