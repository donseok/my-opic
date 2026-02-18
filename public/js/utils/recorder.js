// 오디오 녹음 유틸리티
// MediaRecorder API 기반 음성 녹음 + AudioContext 시각화

const RecorderUtil = {
  mediaRecorder: null,
  audioChunks: [],
  analyserNode: null,
  audioContext: null,
  stream: null,
  isRecording: false,
  startTime: null,
  timerInterval: null,
  visualizeInterval: null,

  /**
   * MediaRecorder API 지원 여부 확인
   * @returns {boolean}
   */
  isSupported() {
    return !!(navigator.mediaDevices &&
              navigator.mediaDevices.getUserMedia &&
              window.MediaRecorder);
  },

  /**
   * 녹음 시작
   * @param {Function} onVisualize - 주파수 데이터 배열을 받는 시각화 콜백
   * @returns {Promise<void>}
   */
  async start(onVisualize) {
    if (this.isRecording) return;

    if (!this.isSupported()) {
      throw new Error('이 브라우저는 음성 녹음을 지원하지 않습니다.');
    }

    try {
      // 마이크 접근 권한 요청
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('마이크 접근 권한이 거부되었습니다. 브라우저 설정에서 마이크를 허용해주세요.');
      }
      if (err.name === 'NotFoundError') {
        throw new Error('마이크를 찾을 수 없습니다. 마이크가 연결되어 있는지 확인해주세요.');
      }
      throw new Error('마이크 접근에 실패했습니다: ' + (err.message || ''));
    }

    // AudioContext + AnalyserNode 설정 (시각화용)
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 256;
      source.connect(this.analyserNode);
    } catch (err) {
      // 시각화 실패는 녹음을 중단하지 않음
      this.analyserNode = null;
    }

    // MediaRecorder 시작
    this.audioChunks = [];
    try {
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType: 'audio/webm' });
    } catch (err) {
      // audio/webm 미지원 시 기본 mimeType 사용
      this.mediaRecorder = new MediaRecorder(this.stream);
    }

    this.mediaRecorder.addEventListener('dataavailable', (e) => {
      if (e.data && e.data.size > 0) {
        this.audioChunks.push(e.data);
      }
    });

    this.mediaRecorder.start(100); // 100ms 간격으로 데이터 수집
    this.isRecording = true;
    this.startTime = Date.now();

    // 시각화 콜백 주기적 호출
    if (onVisualize && this.analyserNode) {
      const bufferLength = this.analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      this.visualizeInterval = setInterval(() => {
        if (!this.isRecording || !this.analyserNode) return;
        this.analyserNode.getByteFrequencyData(dataArray);
        onVisualize(Array.from(dataArray));
      }, 50); // 50ms 간격으로 시각화 업데이트
    }

    // 녹음 시간 추적 타이머
    this.timerInterval = setInterval(() => {
      // 타이머는 getDuration()으로 조회 가능하도록 유지
    }, 1000);
  },

  /**
   * 녹음 중지
   * @returns {Promise<{blob: Blob, base64: string, duration: number}>}
   */
  stop() {
    return new Promise((resolve, reject) => {
      if (!this.isRecording || !this.mediaRecorder) {
        reject(new Error('녹음이 진행 중이 아닙니다.'));
        return;
      }

      const duration = this.getDuration();

      // 시각화 정리
      if (this.visualizeInterval) {
        clearInterval(this.visualizeInterval);
        this.visualizeInterval = null;
      }

      // 타이머 정리
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }

      this.mediaRecorder.addEventListener('stop', () => {
        // 오디오 청크를 Blob으로 합치기
        const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(this.audioChunks, { type: mimeType });

        // Blob을 base64로 변환
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(',')[1] || '';

          // 리소스 정리
          this._cleanup();

          resolve({
            blob: blob,
            base64: base64,
            duration: duration
          });
        };
        reader.onerror = () => {
          this._cleanup();
          reject(new Error('오디오 데이터 변환에 실패했습니다.'));
        };
        reader.readAsDataURL(blob);
      });

      this.mediaRecorder.stop();
      this.isRecording = false;
    });
  },

  /**
   * 현재 녹음 시간(초) 반환
   * @returns {number}
   */
  getDuration() {
    if (!this.startTime) return 0;
    return Math.round((Date.now() - this.startTime) / 1000);
  },

  /**
   * 초를 MM:SS 형식으로 변환
   * @param {number} seconds - 초
   * @returns {string} MM:SS 형식 문자열
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  },

  /**
   * 내부 리소스 정리
   */
  _cleanup() {
    // 스트림 트랙 중지
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    // AudioContext 종료
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {
        // 이미 닫힌 경우 무시
      }
      this.audioContext = null;
    }

    this.analyserNode = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.startTime = null;
    this.isRecording = false;
  }
};
