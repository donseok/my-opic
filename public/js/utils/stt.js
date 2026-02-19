// Web Speech API 기반 음성→텍스트(STT) 유틸리티
// SpeechRecognition API를 사용하여 실시간 음성 인식

const SttUtil = {
  recognition: null,
  isListening: false,
  finalTranscript: '',
  interimTranscript: '',

  /**
   * Web Speech API 지원 여부 확인
   * @returns {boolean}
   */
  isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  },

  /**
   * STT 시작
   * @param {Function} onResult - (transcript, isFinal) 콜백
   * @param {Function} onEnd - 종료 콜백
   */
  start(onResult, onEnd) {
    if (!this.isSupported()) return;
    if (this.isListening) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.finalTranscript = '';
    this.interimTranscript = '';

    this.recognition.onresult = (event) => {
      this.interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          this.finalTranscript += transcript + ' ';
          if (onResult) onResult(this.finalTranscript.trim(), true);
        } else {
          this.interimTranscript += transcript;
          if (onResult) onResult(this.finalTranscript + this.interimTranscript, false);
        }
      }
    };

    this.recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      console.warn('[STT] 오류:', event.error);
    };

    this.recognition.onend = () => {
      // continuous 모드에서 자동 재시작 (사용자가 stop 호출 전까지)
      if (this.isListening) {
        try {
          this.recognition.start();
        } catch (e) {
          this.isListening = false;
          if (onEnd) onEnd(this.finalTranscript.trim());
        }
        return;
      }
      if (onEnd) onEnd(this.finalTranscript.trim());
    };

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (e) {
      console.warn('[STT] 시작 실패:', e);
    }
  },

  /**
   * STT 중지
   * @returns {string} 최종 transcript
   */
  stop() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // 이미 중지된 경우 무시
      }
      this.recognition = null;
    }
    return this.finalTranscript.trim();
  },

  /**
   * 현재까지의 transcript 반환
   * @returns {string}
   */
  getTranscript() {
    return this.finalTranscript.trim();
  }
};
