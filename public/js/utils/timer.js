// 타이머 유틸리티 (SVG 원형 타이머 + 프로그레스 바)

const TimerUtil = {
  intervalId: null,

  /**
   * SVG 원형 준비 타이머 생성 (8초)
   * @param {HTMLElement} container - 타이머를 렌더링할 컨테이너
   * @param {number} seconds - 카운트다운 초
   * @param {Function} onComplete - 완료 콜백
   */
  startPrepTimer(container, seconds, onComplete) {
    this.stop();

    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    let remaining = seconds;

    container.innerHTML = `
      <div class="prep-timer">
        <div class="prep-timer-label">준비 시간</div>
        <div class="prep-timer-circle">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle class="timer-bg" cx="60" cy="60" r="${radius}" />
            <circle class="timer-fg" cx="60" cy="60" r="${radius}"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="0"
              id="prep-timer-fg" />
          </svg>
          <div class="prep-timer-count" id="prep-timer-count">${remaining}</div>
        </div>
      </div>
    `;

    const fgCircle = document.getElementById('prep-timer-fg');
    const countEl = document.getElementById('prep-timer-count');

    this.intervalId = setInterval(() => {
      remaining--;
      if (countEl) countEl.textContent = remaining;
      if (fgCircle) {
        const offset = circumference * (1 - remaining / seconds);
        fgCircle.setAttribute('stroke-dashoffset', offset);
      }

      if (remaining <= 0) {
        this.stop();
        if (onComplete) onComplete();
      }
    }, 1000);
  },

  /**
   * 답변 시간 타이머 시작
   * @param {number} totalSeconds - 총 시간 (90 또는 120)
   * @param {Function} onTick - 매 초 콜백 (remaining)
   * @param {Function} onComplete - 완료 콜백
   */
  startAnswerTimer(totalSeconds, onTick, onComplete) {
    this.stop();
    let remaining = totalSeconds;

    this.intervalId = setInterval(() => {
      remaining--;
      if (onTick) onTick(remaining, totalSeconds);

      if (remaining <= 0) {
        this.stop();
        if (onComplete) onComplete();
      }
    }, 1000);
  },

  /**
   * 타이머 중지
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
};
