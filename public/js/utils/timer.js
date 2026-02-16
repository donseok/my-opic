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

    // DOM으로 SVG 타이머 구성
    container.replaceChildren();

    const wrapper = document.createElement('div');
    wrapper.className = 'prep-timer';

    const label = document.createElement('div');
    label.className = 'prep-timer-label';
    label.textContent = '준비 시간';
    wrapper.appendChild(label);

    const circleDiv = document.createElement('div');
    circleDiv.className = 'prep-timer-circle';

    // SVG는 createElementNS 필요
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '120');
    svg.setAttribute('height', '120');
    svg.setAttribute('viewBox', '0 0 120 120');

    const bgCircle = document.createElementNS(svgNS, 'circle');
    bgCircle.setAttribute('class', 'timer-bg');
    bgCircle.setAttribute('cx', '60');
    bgCircle.setAttribute('cy', '60');
    bgCircle.setAttribute('r', String(radius));

    const fgCircle = document.createElementNS(svgNS, 'circle');
    fgCircle.setAttribute('class', 'timer-fg');
    fgCircle.setAttribute('cx', '60');
    fgCircle.setAttribute('cy', '60');
    fgCircle.setAttribute('r', String(radius));
    fgCircle.setAttribute('stroke-dasharray', String(circumference));
    fgCircle.setAttribute('stroke-dashoffset', '0');
    fgCircle.id = 'prep-timer-fg';

    svg.appendChild(bgCircle);
    svg.appendChild(fgCircle);
    circleDiv.appendChild(svg);

    const countEl = document.createElement('div');
    countEl.className = 'prep-timer-count';
    countEl.id = 'prep-timer-count';
    countEl.textContent = String(remaining);
    circleDiv.appendChild(countEl);

    wrapper.appendChild(circleDiv);
    container.appendChild(wrapper);

    this.intervalId = setInterval(() => {
      remaining--;
      if (countEl) countEl.textContent = String(remaining);
      if (fgCircle) {
        const offset = circumference * (1 - remaining / seconds);
        fgCircle.setAttribute('stroke-dashoffset', String(offset));
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
   * @param {Function} onTick - 매 초 콜백 (remaining, total)
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
