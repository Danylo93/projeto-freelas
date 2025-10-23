import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../../core/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';
import '../widgets/provider_header.dart';
import '../widgets/status_toggle.dart';
import '../widgets/earnings_card.dart';
import '../widgets/service_requests_list.dart';
import '../widgets/active_service_card.dart';

class ProviderHomeScreen extends ConsumerStatefulWidget {
  const ProviderHomeScreen({super.key});

  @override
  ConsumerState<ProviderHomeScreen> createState() => _ProviderHomeScreenState();
}

class _ProviderHomeScreenState extends ConsumerState<ProviderHomeScreen>
    with TickerProviderStateMixin {
  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  bool _isOnline = false;
  bool _hasActiveService = false;

  @override
  void initState() {
    super.initState();
    
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeInOut,
    ));

    _fadeController.forward();
    _loadProviderStatus();
  }

  void _loadProviderStatus() {
    // TODO: Load from storage service
    setState(() {
      _isOnline = false; // Load from storage
    });
  }

  @override
  void dispose() {
    _fadeController.dispose();
    super.dispose();
  }

  void _onStatusToggle(bool isOnline) {
    setState(() {
      _isOnline = isOnline;
    });
    // TODO: Save to storage and update backend
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      body: FadeTransition(
        opacity: _fadeAnimation,
        child: SafeArea(
          child: Column(
            children: [
              // Header
              ProviderHeader(user: user),
              
              // Content
              Expanded(
                child: _hasActiveService ? _buildActiveServiceView() : _buildMainView(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMainView() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status Toggle
          StatusToggle(
            isOnline: _isOnline,
            onToggle: _onStatusToggle,
          ),
          
          const SizedBox(height: 24),
          
          // Earnings Card
          const EarningsCard(),
          
          const SizedBox(height: 24),
          
          // Service Requests
          Row(
            children: [
              Text(
                'Solicitações disponíveis',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textPrimaryColor,
                ),
              ),
              const Spacer(),
              if (_isOnline)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.successColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: AppTheme.successColor,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Recebendo',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppTheme.successColor,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          if (_isOnline)
            const ServiceRequestsList()
          else
            _buildOfflineMessage(),
        ],
      ),
    );
  }

  Widget _buildActiveServiceView() {
    return Column(
      children: [
        // Active service header
        Container(
          padding: const EdgeInsets.all(16),
          decoration: const BoxDecoration(
            color: AppTheme.surfaceColor,
            border: Border(
              bottom: BorderSide(color: AppTheme.borderColor),
            ),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppTheme.successColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.handyman,
                  color: AppTheme.successColor,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Serviço em andamento',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppTheme.successColor,
                      ),
                    ),
                    Text(
                      'Maria Silva - Eletricista',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.textSecondaryColor,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        
        // Map and service details
        Expanded(
          child: Stack(
            children: [
              // Google Map
              GoogleMap(
                initialCameraPosition: const CameraPosition(
                  target: LatLng(-23.5505, -46.6333), // São Paulo
                  zoom: 15,
                ),
                myLocationEnabled: true,
                myLocationButtonEnabled: true,
                zoomControlsEnabled: false,
                mapToolbarEnabled: false,
                onMapCreated: (GoogleMapController controller) {
                  // TODO: Initialize map controller
                },
              ),
              
              // Active service card at bottom
              const Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: ActiveServiceCard(),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildOfflineMessage() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppTheme.textSecondaryColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: Column(
        children: [
          Icon(
            Icons.wifi_off,
            size: 48,
            color: AppTheme.textSecondaryColor,
          ),
          const SizedBox(height: 16),
          Text(
            'Você está offline',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: AppTheme.textSecondaryColor,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Ative seu status para começar a receber solicitações de serviço',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppTheme.textSecondaryColor,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
