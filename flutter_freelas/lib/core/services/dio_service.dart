import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';

import '../config/app_config.dart';

class DioService {
  static Dio? _dio;

  static Dio get instance {
    _dio ??= _createDio();
    return _dio!;
  }

  static Dio _createDio() {
    final dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.currentApiUrl,
        connectTimeout: AppConfig.apiTimeout,
        receiveTimeout: AppConfig.apiTimeout,
        sendTimeout: AppConfig.apiTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Add interceptors
    if (AppConfig.isDevelopment) {
      dio.interceptors.add(
        PrettyDioLogger(
          requestHeader: true,
          requestBody: true,
          responseBody: true,
          responseHeader: false,
          error: true,
          compact: true,
          maxWidth: 90,
        ),
      );
    }

    // Add auth interceptor
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          // Add auth token if available
          final token = _getStoredToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) {
          // Handle 401 errors (token expired)
          if (error.response?.statusCode == 401) {
            // Token expired, trigger refresh or logout
            _handleUnauthorized();
          }
          handler.next(error);
        },
      ),
    );

    return dio;
  }

  static String? _storedToken;

  static String? _getStoredToken() {
    return _storedToken;
  }

  static void setAuthToken(String token) {
    _storedToken = token;
    if (_dio != null) {
      _dio!.options.headers['Authorization'] = 'Bearer $token';
    }
  }

  static void clearAuthToken() {
    _storedToken = null;
    if (_dio != null) {
      _dio!.options.headers.remove('Authorization');
    }
  }

  static void _handleUnauthorized() {
    // This will be handled by the auth provider
    clearAuthToken();
  }

  // Create a new instance with custom base URL
  static Dio createCustomInstance(String baseUrl) {
    return Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: AppConfig.apiTimeout,
        receiveTimeout: AppConfig.apiTimeout,
        sendTimeout: AppConfig.apiTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );
  }

  // Multipart requests for file uploads
  static Future<FormData> createFormData(Map<String, dynamic> data) async {
    final formData = FormData();
    
    for (final entry in data.entries) {
      if (entry.value is MultipartFile) {
        formData.files.add(MapEntry(entry.key, entry.value));
      } else {
        formData.fields.add(MapEntry(entry.key, entry.value.toString()));
      }
    }
    
    return formData;
  }

  // File upload helper
  static Future<MultipartFile> createMultipartFile(
    String filePath, {
    String? filename,
    String? contentType,
  }) async {
    return await MultipartFile.fromFile(
      filePath,
      filename: filename,
      contentType: contentType != null ? DioMediaType.parse(contentType) : null,
    );
  }

  // Download file helper
  static Future<void> downloadFile(
    String url,
    String savePath, {
    ProgressCallback? onReceiveProgress,
    CancelToken? cancelToken,
  }) async {
    await instance.download(
      url,
      savePath,
      onReceiveProgress: onReceiveProgress,
      cancelToken: cancelToken,
    );
  }

  // Cancel all requests
  static void cancelAllRequests() {
    if (_dio != null) {
      _dio!.close(force: true);
      _dio = null;
    }
  }
}

// Provider for Dio instance
final dioProvider = Provider<Dio>((ref) {
  return DioService.instance;
});

// Provider for custom Dio instances
final customDioProvider = Provider.family<Dio, String>((ref, baseUrl) {
  return DioService.createCustomInstance(baseUrl);
});
