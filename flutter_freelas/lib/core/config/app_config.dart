class AppConfig {
  static const String appName = 'Freelas';
  static const String appVersion = '1.0.0';
  
  // API Configuration
  static const String baseUrl = 'http://localhost:8000';
  static const String apiUrl = '$baseUrl/api';
  static const String socketUrl = baseUrl;
  
  // Production URLs (Ngrok)
  static const String prodBaseUrl = 'https://a09f89583882.ngrok-free.app';
  static const String prodApiUrl = '$prodBaseUrl/api';
  static const String prodSocketUrl = prodBaseUrl;
  
  // Environment
  static const bool isDevelopment = true;
  
  // Current URLs based on environment
  static String get currentBaseUrl => isDevelopment ? baseUrl : prodBaseUrl;
  static String get currentApiUrl => isDevelopment ? apiUrl : prodApiUrl;
  static String get currentSocketUrl => isDevelopment ? socketUrl : prodSocketUrl;
  
  // API Endpoints
  static const String authEndpoint = '/auth';
  static const String providersEndpoint = '/providers';
  static const String requestsEndpoint = '/requests';
  static const String paymentsEndpoint = '/payments';
  static const String matchingEndpoint = '/matching';
  static const String notificationsEndpoint = '/notifications';
  
  // Map Configuration
  static const String googleMapsApiKey = 'YOUR_GOOGLE_MAPS_API_KEY';
  
  // Stripe Configuration
  static const String stripePublishableKey = 'pk_test_...';
  
  // Socket Events
  static const String socketConnect = 'connect';
  static const String socketDisconnect = 'disconnect';
  static const String socketNewRequest = 'new_request';
  static const String socketRequestAccepted = 'request_accepted';
  static const String socketRequestCompleted = 'request_completed';
  static const String socketLocationUpdate = 'location_updated';
  static const String socketProviderStatusUpdate = 'provider_status_update';
  
  // User Types
  static const int userTypeProvider = 1;
  static const int userTypeClient = 2;
  
  // Request Status
  static const String requestStatusPending = 'pending';
  static const String requestStatusAccepted = 'accepted';
  static const String requestStatusInProgress = 'in_progress';
  static const String requestStatusCompleted = 'completed';
  static const String requestStatusCancelled = 'cancelled';
  
  // Payment Status
  static const String paymentStatusPending = 'pending';
  static const String paymentStatusProcessing = 'processing';
  static const String paymentStatusSucceeded = 'succeeded';
  static const String paymentStatusFailed = 'failed';
  static const String paymentStatusCancelled = 'cancelled';
  
  // Storage Keys
  static const String storageKeyToken = 'auth_token';
  static const String storageKeyUser = 'user_data';
  static const String storageKeyProviderStatus = 'provider_status';
  static const String storageKeyNotificationToken = 'notification_token';
  
  // Default Values
  static const double defaultLatitude = -23.5505;
  static const double defaultLongitude = -46.6333;
  static const double defaultZoom = 15.0;
  static const int defaultSearchRadius = 10; // km
  
  // Animation Durations
  static const Duration shortAnimation = Duration(milliseconds: 200);
  static const Duration mediumAnimation = Duration(milliseconds: 400);
  static const Duration longAnimation = Duration(milliseconds: 600);
  
  // Timeouts
  static const Duration apiTimeout = Duration(seconds: 30);
  static const Duration socketTimeout = Duration(seconds: 20);
  static const Duration locationTimeout = Duration(seconds: 10);
}
