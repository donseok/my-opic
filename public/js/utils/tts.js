// TTS (Text-to-Speech) 유틸리티
// Web Speech API를 사용한 영어 문장 읽기 기능

const TtsUtil = {
  synth: window.speechSynthesis || null,
  currentUtterance: null,
  isSpeaking: false,

  /**
   * 영어 음성 객체 가져오기
   * @returns {SpeechSynthesisVoice|null}
   */
  getEnglishVoice() {
    if (!this.synth) return null;
    const voices = this.synth.getVoices();
    // 영어 음성 우선순위: en-US > en-GB > en 접두어
    return voices.find(v => v.lang === 'en-US') ||
           voices.find(v => v.lang === 'en-GB') ||
           voices.find(v => v.lang.startsWith('en')) ||
           null;
  },

  /**
   * 텍스트를 영어로 읽기
   * @param {string} text - 읽을 텍스트
   * @param {Object} options - 옵션 {rate, pitch, onEnd}
   */
  speak(text, options = {}) {
    if (!this.synth) return;

    // 기존 재생 중지
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = options.rate || 0.9; // 약간 느리게 (학습용)
    utterance.pitch = options.pitch || 1.0;

    const voice = this.getEnglishVoice();
    if (voice) utterance.voice = voice;

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.updateButtons(true);
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.updateButtons(false);
      if (options.onEnd) options.onEnd();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.updateButtons(false);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  },

  /**
   * 재생 중지
   */
  stop() {
    if (!this.synth) return;
    this.synth.cancel();
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.updateButtons(false);
  },

  /**
   * 재생/중지 토글
   * @param {string} text - 읽을 텍스트
   * @param {Object} options - 옵션
   */
  toggle(text, options = {}) {
    if (this.isSpeaking) {
      this.stop();
    } else {
      this.speak(text, options);
    }
  },

  /**
   * TTS 지원 여부 확인
   * @returns {boolean}
   */
  isSupported() {
    return !!this.synth;
  },

  /**
   * TTS 버튼 생성
   * @param {string} text - 읽을 텍스트
   * @param {string} size - 버튼 크기 ('sm' | 'md' | 'lg')
   * @returns {HTMLElement} 버튼 요소
   */
  createButton(text, size = 'md') {
    const btn = document.createElement('button');
    btn.className = 'tts-btn tts-btn-' + size;
    btn.type = 'button';
    btn.dataset.ttsText = text;
    btn.title = '영어로 읽기';

    const icon = document.createElement('span');
    icon.className = 'tts-icon';
    icon.textContent = '🔊';
    btn.appendChild(icon);

    if (size === 'lg') {
      const label = document.createElement('span');
      label.className = 'tts-label';
      label.textContent = '문제 듣기';
      btn.appendChild(label);
    }

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle(text);
    });

    return btn;
  },

  /**
   * 모든 TTS 버튼의 아이콘 업데이트
   * @param {boolean} speaking - 재생 중 여부
   */
  updateButtons(speaking) {
    document.querySelectorAll('.tts-btn').forEach(btn => {
      const icon = btn.querySelector('.tts-icon');
      const label = btn.querySelector('.tts-label');
      if (icon) icon.textContent = speaking ? '⏹️' : '🔊';
      if (label) label.textContent = speaking ? '중지' : '문제 듣기';
      btn.classList.toggle('speaking', speaking);
    });
  }
};

// 음성 목록이 비동기로 로드되므로 미리 트리거
if (window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}
