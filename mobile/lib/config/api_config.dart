// API 기본 URL 설정
// 에뮬레이터에서는 10.0.2.2 (Android), localhost (iOS 시뮬레이터)
// 실기기에서는 PC의 로컬 IP 주소 사용
class ApiConfig {
  // Android 에뮬레이터 기본값
  static const String baseUrl = 'http://10.0.2.2:3000/api/v1';

  // iOS 시뮬레이터용
  // static const String baseUrl = 'http://localhost:3000/api/v1';

  // 실기기 테스트용 (PC의 IP 주소로 변경)
  // static const String baseUrl = 'http://192.168.x.x:3000/api/v1';
}
