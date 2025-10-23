import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../../core/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';
import '../widgets/client_header.dart';
import '../widgets/service_categories.dart';
import '../widgets/active_request_card.dart';
import '../widgets/nearby_providers_list.dart';

class ClientHomeScreen extends ConsumerStatefulWidget {
  const ClientHomeScreen({super.key});

  @override
  ConsumerState<ClientHomeScreen> createState() => _ClientHomeScreenState();
}

class _ClientHomeScreenState extends ConsumerState<ClientHomeScreen>
    with TickerProviderStateMixin {
  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  bool _showMap = false;
  String? _selectedCategory;

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
  }

  @override
  void dispose() {
    _fadeController.dispose();
    super.dispose();
  }

  void _onCategorySelected(String category) {
    setState(() {
      _selectedCategory = category;
      _showMap = true;
    });
  }

  void _onBackToCategories() {
    setState(() {
      _showMap = false;
      _selectedCategory = null;
    });
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
              ClientHeader(user: user),
              
              // Content
              Expanded(
                child: _showMap ? _buildMapView() : _buildMainView(),
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
          // Active Request Card (if any)
          const ActiveRequestCard(),
          
          const SizedBox(height: 24),
          
          // Service Categories
          Text(
            'Que tipo de serviço você precisa?',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimaryColor,
            ),
          ),
          
          const SizedBox(height: 16),
          
          ServiceCategories(
            onCategorySelected: _onCategorySelected,
          ),
          
          const SizedBox(height: 32),
          
          // Recent Services or Tips
          Text(
            'Dicas para você',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimaryColor,
            ),
          ),
          
          const SizedBox(height: 16),
          
          _buildTipsCard(),
        ],
      ),
    );
  }

  Widget _buildMapView() {
    return Column(
      children: [
        // Map header
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
              IconButton(
                onPressed: _onBackToCategories,
                icon: const Icon(Icons.arrow_back),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _selectedCategory ?? '',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      'Prestadores próximos',
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
        
        // Map and providers list
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
              
              // Providers list at bottom
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: NearbyProvidersList(
                  category: _selectedCategory ?? '',
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTipsCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.lightbulb_outline,
                    color: AppTheme.primaryColor,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Como escolher o melhor prestador',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 12),
            
            Text(
              '• Verifique as avaliações e comentários\n'
              '• Compare preços e prazos\n'
              '• Confirme a disponibilidade\n'
              '• Mantenha comunicação clara',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppTheme.textSecondaryColor,
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
