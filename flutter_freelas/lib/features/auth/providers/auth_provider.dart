import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';

import '../../../core/config/app_config.dart';
import '../../../core/services/storage_service.dart';
import '../../../core/services/dio_service.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';

// Auth State
class AuthState {
  final UserModel? user;
  final String? token;
  final bool isLoading;
  final String? error;

  const AuthState({
    this.user,
    this.token,
    this.isLoading = false,
    this.error,
  });

  bool get isAuthenticated => user != null && token != null;
  bool get isProvider => user?.isProvider ?? false;
  bool get isClient => user?.isClient ?? false;

  AuthState copyWith({
    UserModel? user,
    String? token,
    bool? isLoading,
    String? error,
  }) {
    return AuthState(
      user: user ?? this.user,
      token: token ?? this.token,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  AuthState clearError() {
    return copyWith(error: null);
  }

  AuthState setLoading(bool loading) {
    return copyWith(isLoading: loading, error: null);
  }

  AuthState setError(String error) {
    return copyWith(isLoading: false, error: error);
  }

  AuthState setAuthenticated(UserModel user, String token) {
    return copyWith(
      user: user,
      token: token,
      isLoading: false,
      error: null,
    );
  }

  AuthState clearAuth() {
    return const AuthState();
  }
}

// Auth Notifier
class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _authRepository;
  final StorageService _storageService;

  AuthNotifier(this._authRepository, this._storageService) : super(const AuthState()) {
    _loadStoredAuth();
  }

  Future<void> _loadStoredAuth() async {
    state = state.setLoading(true);
    
    try {
      final token = await _storageService.getToken();
      final user = await _storageService.getUser();
      
      if (token != null && user != null) {
        // Configure Dio with token
        DioService.setAuthToken(token);
        
        // Verify token is still valid
        try {
          final currentUser = await _authRepository.getCurrentUser();
          state = state.setAuthenticated(currentUser, token);
        } catch (e) {
          // Token is invalid, clear storage
          await _clearStoredAuth();
          state = state.clearAuth();
        }
      } else {
        state = state.clearAuth();
      }
    } catch (e) {
      state = state.setError('Erro ao carregar dados de autenticação');
    }
  }

  Future<void> login(String email, String password) async {
    state = state.setLoading(true);
    
    try {
      final response = await _authRepository.login(email, password);
      
      // Store auth data
      await _storageService.saveToken(response.accessToken);
      await _storageService.saveUser(response.userData);
      
      // Configure Dio with token
      DioService.setAuthToken(response.accessToken);
      
      state = state.setAuthenticated(response.userData, response.accessToken);
    } catch (e) {
      state = state.setError(e.toString());
    }
  }

  Future<void> register({
    required String name,
    required String email,
    required String phone,
    required String password,
    required int userType,
  }) async {
    state = state.setLoading(true);
    
    try {
      final response = await _authRepository.register(
        name: name,
        email: email,
        phone: phone,
        password: password,
        userType: userType,
      );
      
      // Store auth data
      await _storageService.saveToken(response.accessToken);
      await _storageService.saveUser(response.userData);
      
      // Configure Dio with token
      DioService.setAuthToken(response.accessToken);
      
      state = state.setAuthenticated(response.userData, response.accessToken);
    } catch (e) {
      state = state.setError(e.toString());
    }
  }

  Future<void> logout() async {
    state = state.setLoading(true);
    
    try {
      await _authRepository.logout();
    } catch (e) {
      // Ignore logout errors
    } finally {
      await _clearStoredAuth();
      DioService.clearAuthToken();
      state = state.clearAuth();
    }
  }

  Future<void> refreshToken() async {
    try {
      final response = await _authRepository.refreshToken();
      
      // Update stored auth data
      await _storageService.saveToken(response.accessToken);
      await _storageService.saveUser(response.userData);
      
      // Configure Dio with new token
      DioService.setAuthToken(response.accessToken);
      
      state = state.setAuthenticated(response.userData, response.accessToken);
    } catch (e) {
      // Refresh failed, logout user
      await logout();
    }
  }

  Future<void> _clearStoredAuth() async {
    await _storageService.clearToken();
    await _storageService.clearUser();
  }

  void clearError() {
    state = state.clearError();
  }
}

// Providers
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final dio = ref.watch(dioProvider);
  final authService = AuthService(dio);
  return AuthRepository(authService);
});

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final authRepository = ref.watch(authRepositoryProvider);
  final storageService = ref.watch(storageServiceProvider);
  return AuthNotifier(authRepository, storageService);
});

// Convenience providers
final currentUserProvider = Provider<UserModel?>((ref) {
  return ref.watch(authProvider).user;
});

final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authProvider).isAuthenticated;
});

final isProviderProvider = Provider<bool>((ref) {
  return ref.watch(authProvider).isProvider;
});

final isClientProvider = Provider<bool>((ref) {
  return ref.watch(authProvider).isClient;
});
