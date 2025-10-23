import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';

import '../../../core/config/app_config.dart';
import '../models/user_model.dart';

part 'auth_service.g.dart';

@RestApi(baseUrl: AppConfig.currentApiUrl)
abstract class AuthService {
  factory AuthService(Dio dio, {String baseUrl}) = _AuthService;

  @POST('/auth/login')
  Future<AuthResponse> login(@Body() LoginRequest request);

  @POST('/auth/register')
  Future<AuthResponse> register(@Body() RegisterRequest request);

  @GET('/auth/me')
  Future<UserModel> getCurrentUser();

  @POST('/auth/refresh')
  Future<AuthResponse> refreshToken();

  @POST('/auth/logout')
  Future<void> logout();
}

class AuthRepository {
  final AuthService _authService;

  AuthRepository(this._authService);

  Future<AuthResponse> login(String email, String password) async {
    try {
      final request = LoginRequest(email: email, password: password);
      return await _authService.login(request);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<AuthResponse> register({
    required String name,
    required String email,
    required String phone,
    required String password,
    required int userType,
  }) async {
    try {
      final request = RegisterRequest(
        name: name,
        email: email,
        phone: phone,
        password: password,
        userType: userType,
      );
      return await _authService.register(request);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<UserModel> getCurrentUser() async {
    try {
      return await _authService.getCurrentUser();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<AuthResponse> refreshToken() async {
    try {
      return await _authService.refreshToken();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> logout() async {
    try {
      await _authService.logout();
    } on DioException catch (e) {
      // Ignore logout errors
      print('Logout error: ${e.message}');
    }
  }

  String _handleError(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Timeout de conexão. Verifique sua internet.';
      
      case DioExceptionType.badResponse:
        final statusCode = e.response?.statusCode;
        final data = e.response?.data;
        
        if (statusCode == 401) {
          return 'Email ou senha incorretos.';
        } else if (statusCode == 422) {
          if (data is Map && data.containsKey('detail')) {
            final detail = data['detail'];
            if (detail is String) {
              return detail;
            } else if (detail is List && detail.isNotEmpty) {
              return detail.first['msg'] ?? 'Dados inválidos.';
            }
          }
          return 'Dados inválidos.';
        } else if (statusCode == 409) {
          return 'Email já está em uso.';
        } else if (statusCode! >= 500) {
          return 'Erro interno do servidor. Tente novamente.';
        }
        
        return data?['detail'] ?? 'Erro desconhecido.';
      
      case DioExceptionType.cancel:
        return 'Operação cancelada.';
      
      case DioExceptionType.unknown:
        if (e.error.toString().contains('SocketException')) {
          return 'Sem conexão com a internet.';
        }
        return 'Erro de conexão.';
      
      default:
        return 'Erro desconhecido.';
    }
  }
}
