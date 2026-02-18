import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

/// API 통신 서비스 — 모든 HTTP 요청을 중앙 관리
class ApiService {
  static const String _baseUrl = ApiConfig.baseUrl;

  /// GET 요청
  static Future<dynamic> get(String path) async {
    final response = await http.get(
      Uri.parse('$_baseUrl$path'),
      headers: {'Content-Type': 'application/json'},
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw ApiException(response.statusCode, response.body);
    }
  }

  /// POST 요청
  static Future<dynamic> post(String path, Map<String, dynamic> body) async {
    final response = await http.post(
      Uri.parse('$_baseUrl$path'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(body),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw ApiException(response.statusCode, response.body);
    }
  }

  /// PUT 요청
  static Future<dynamic> put(String path, Map<String, dynamic> body) async {
    final response = await http.put(
      Uri.parse('$_baseUrl$path'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(body),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw ApiException(response.statusCode, response.body);
    }
  }

  /// DELETE 요청
  static Future<dynamic> delete(String path) async {
    final response = await http.delete(
      Uri.parse('$_baseUrl$path'),
      headers: {'Content-Type': 'application/json'},
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw ApiException(response.statusCode, response.body);
    }
  }

  /// POST (대용량 - 10MB base64 오디오 등)
  static Future<dynamic> postLarge(String path, Map<String, dynamic> body) async {
    final client = http.Client();
    try {
      final response = await client.post(
        Uri.parse('$_baseUrl$path'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      ).timeout(const Duration(seconds: 60));
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw ApiException(response.statusCode, response.body);
      }
    } finally {
      client.close();
    }
  }
}

/// API 에러 클래스
class ApiException implements Exception {
  final int statusCode;
  final String body;

  ApiException(this.statusCode, this.body);

  String get message {
    switch (statusCode) {
      case 400:
        return '잘못된 요청입니다';
      case 404:
        return '데이터를 찾을 수 없습니다';
      case 429:
        return '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요';
      case 500:
        return '서버 오류가 발생했습니다';
      default:
        return '네트워크 오류가 발생했습니다 ($statusCode)';
    }
  }

  @override
  String toString() => 'ApiException($statusCode): $message';
}
