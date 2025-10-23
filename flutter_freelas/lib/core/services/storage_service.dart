import 'package:hive_flutter/hive_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/models/user_model.dart';
import '../config/app_config.dart';

class StorageService {
  static late Box _authBox;
  static late Box _settingsBox;
  static late Box _cacheBox;

  static Future<void> init() async {
    // Register adapters
    if (!Hive.isAdapterRegistered(0)) {
      Hive.registerAdapter(UserModelAdapter());
    }

    // Open boxes
    _authBox = await Hive.openBox('auth');
    _settingsBox = await Hive.openBox('settings');
    _cacheBox = await Hive.openBox('cache');
  }

  // Auth methods
  Future<String?> getToken() async {
    return _authBox.get(AppConfig.storageKeyToken);
  }

  Future<void> saveToken(String token) async {
    await _authBox.put(AppConfig.storageKeyToken, token);
  }

  Future<void> clearToken() async {
    await _authBox.delete(AppConfig.storageKeyToken);
  }

  Future<UserModel?> getUser() async {
    return _authBox.get(AppConfig.storageKeyUser);
  }

  Future<void> saveUser(UserModel user) async {
    await _authBox.put(AppConfig.storageKeyUser, user);
  }

  Future<void> clearUser() async {
    await _authBox.delete(AppConfig.storageKeyUser);
  }

  // Provider status methods
  Future<bool> getProviderStatus() async {
    return _settingsBox.get(AppConfig.storageKeyProviderStatus, defaultValue: false);
  }

  Future<void> saveProviderStatus(bool isOnline) async {
    await _settingsBox.put(AppConfig.storageKeyProviderStatus, isOnline);
  }

  // Notification token methods
  Future<String?> getNotificationToken() async {
    return _settingsBox.get(AppConfig.storageKeyNotificationToken);
  }

  Future<void> saveNotificationToken(String token) async {
    await _settingsBox.put(AppConfig.storageKeyNotificationToken, token);
  }

  Future<void> clearNotificationToken() async {
    await _settingsBox.delete(AppConfig.storageKeyNotificationToken);
  }

  // Settings methods
  Future<T?> getSetting<T>(String key, {T? defaultValue}) async {
    return _settingsBox.get(key, defaultValue: defaultValue);
  }

  Future<void> saveSetting<T>(String key, T value) async {
    await _settingsBox.put(key, value);
  }

  Future<void> deleteSetting(String key) async {
    await _settingsBox.delete(key);
  }

  // Cache methods
  Future<T?> getCache<T>(String key) async {
    final data = _cacheBox.get(key);
    if (data == null) return null;
    
    // Check if cache is expired (24 hours)
    final timestamp = _cacheBox.get('${key}_timestamp');
    if (timestamp != null) {
      final cacheTime = DateTime.fromMillisecondsSinceEpoch(timestamp);
      final now = DateTime.now();
      if (now.difference(cacheTime).inHours > 24) {
        await deleteCache(key);
        return null;
      }
    }
    
    return data;
  }

  Future<void> saveCache<T>(String key, T value) async {
    await _cacheBox.put(key, value);
    await _cacheBox.put('${key}_timestamp', DateTime.now().millisecondsSinceEpoch);
  }

  Future<void> deleteCache(String key) async {
    await _cacheBox.delete(key);
    await _cacheBox.delete('${key}_timestamp');
  }

  Future<void> clearCache() async {
    await _cacheBox.clear();
  }

  // Clear all data
  Future<void> clearAll() async {
    await _authBox.clear();
    await _settingsBox.clear();
    await _cacheBox.clear();
  }

  // Get box sizes for debugging
  Map<String, int> getBoxSizes() {
    return {
      'auth': _authBox.length,
      'settings': _settingsBox.length,
      'cache': _cacheBox.length,
    };
  }
}

final storageServiceProvider = Provider<StorageService>((ref) {
  return StorageService();
});
