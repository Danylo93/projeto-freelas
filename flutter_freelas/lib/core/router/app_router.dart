import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/auth_screen.dart';
import '../../features/splash/splash_screen.dart';
import '../../features/client/screens/client_home_screen.dart';
import '../../features/provider/screens/provider_home_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    debugLogDiagnostics: true,
    initialLocation: '/',
    redirect: (context, state) {
      final isAuthenticated = authState.isAuthenticated;
      final isLoading = authState.isLoading;
      
      // Show splash while loading
      if (isLoading && state.location == '/') {
        return null;
      }
      
      // If not authenticated and trying to access protected routes
      if (!isAuthenticated && !_isPublicRoute(state.location)) {
        return '/auth';
      }
      
      // If authenticated and on auth screen, redirect to home
      if (isAuthenticated && state.location == '/auth') {
        if (authState.isProvider) {
          return '/provider';
        } else {
          return '/client';
        }
      }
      
      return null;
    },
    routes: [
      // Splash Screen
      GoRoute(
        path: '/',
        name: 'splash',
        builder: (context, state) => const SplashScreen(),
      ),
      
      // Auth Screen
      GoRoute(
        path: '/auth',
        name: 'auth',
        builder: (context, state) => const AuthScreen(),
      ),
      
      // Client Routes
      GoRoute(
        path: '/client',
        name: 'client_home',
        builder: (context, state) => const ClientHomeScreen(),
        routes: [
          GoRoute(
            path: '/profile',
            name: 'client_profile',
            builder: (context, state) => const Placeholder(), // TODO: Implement
          ),
          GoRoute(
            path: '/history',
            name: 'client_history',
            builder: (context, state) => const Placeholder(), // TODO: Implement
          ),
          GoRoute(
            path: '/request/:id',
            name: 'request_details',
            builder: (context, state) {
              final requestId = state.pathParameters['id']!;
              return const Placeholder(); // TODO: Implement
            },
          ),
        ],
      ),
      
      // Provider Routes
      GoRoute(
        path: '/provider',
        name: 'provider_home',
        builder: (context, state) => const ProviderHomeScreen(),
        routes: [
          GoRoute(
            path: '/profile',
            name: 'provider_profile',
            builder: (context, state) => const Placeholder(), // TODO: Implement
          ),
          GoRoute(
            path: '/history',
            name: 'provider_history',
            builder: (context, state) => const Placeholder(), // TODO: Implement
          ),
          GoRoute(
            path: '/earnings',
            name: 'provider_earnings',
            builder: (context, state) => const Placeholder(), // TODO: Implement
          ),
        ],
      ),
      
      // Payment Routes
      GoRoute(
        path: '/payment/:requestId',
        name: 'payment',
        builder: (context, state) {
          final requestId = state.pathParameters['requestId']!;
          return const Placeholder(); // TODO: Implement
        },
      ),
      
      // Chat Routes
      GoRoute(
        path: '/chat/:requestId',
        name: 'chat',
        builder: (context, state) {
          final requestId = state.pathParameters['requestId']!;
          return const Placeholder(); // TODO: Implement
        },
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red,
            ),
            const SizedBox(height: 16),
            Text(
              'Página não encontrada',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              'A página que você está procurando não existe.',
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go('/'),
              child: const Text('Voltar ao início'),
            ),
          ],
        ),
      ),
    ),
  );
});

bool _isPublicRoute(String location) {
  const publicRoutes = ['/', '/auth'];
  return publicRoutes.contains(location);
}

// Navigation helpers
class AppRouter {
  static void goToAuth(BuildContext context) {
    context.go('/auth');
  }
  
  static void goToClientHome(BuildContext context) {
    context.go('/client');
  }
  
  static void goToProviderHome(BuildContext context) {
    context.go('/provider');
  }
  
  static void goToProfile(BuildContext context, {required bool isProvider}) {
    if (isProvider) {
      context.go('/provider/profile');
    } else {
      context.go('/client/profile');
    }
  }
  
  static void goToHistory(BuildContext context, {required bool isProvider}) {
    if (isProvider) {
      context.go('/provider/history');
    } else {
      context.go('/client/history');
    }
  }
  
  static void goToRequestDetails(BuildContext context, String requestId) {
    context.go('/client/request/$requestId');
  }
  
  static void goToPayment(BuildContext context, String requestId) {
    context.go('/payment/$requestId');
  }
  
  static void goToChat(BuildContext context, String requestId) {
    context.go('/chat/$requestId');
  }
  
  static void goToEarnings(BuildContext context) {
    context.go('/provider/earnings');
  }
}
