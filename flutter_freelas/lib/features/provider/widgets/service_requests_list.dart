import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';

class ServiceRequestsList extends StatelessWidget {
  const ServiceRequestsList({super.key});

  @override
  Widget build(BuildContext context) {
    // TODO: Replace with real data from provider
    final requests = List.generate(3, (index) => _mockRequest(index));
    
    if (requests.isEmpty) {
      return _buildEmptyState();
    }
    
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: requests.length,
      itemBuilder: (context, index) {
        final request = requests[index];
        return _ServiceRequestCard(
          request: request,
          onAccept: () => _onAcceptRequest(request),
          onDecline: () => _onDeclineRequest(request),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: AppTheme.backgroundColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: Column(
        children: [
          Icon(
            Icons.search_off,
            size: 48,
            color: AppTheme.textSecondaryColor,
          ),
          const SizedBox(height: 16),
          Text(
            'Nenhuma solicitação no momento',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: AppTheme.textSecondaryColor,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Novas solicitações aparecerão aqui quando clientes próximos precisarem dos seus serviços',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppTheme.textSecondaryColor,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  void _onAcceptRequest(ServiceRequest request) {
    // TODO: Implement accept request
    print('Accepting request: ${request.id}');
  }

  void _onDeclineRequest(ServiceRequest request) {
    // TODO: Implement decline request
    print('Declining request: ${request.id}');
  }

  ServiceRequest _mockRequest(int index) {
    return ServiceRequest(
      id: 'req_${index + 1}',
      clientName: ['Maria Silva', 'João Santos', 'Ana Costa'][index],
      category: 'Eletricista',
      description: [
        'Preciso trocar algumas tomadas na sala',
        'Instalação de ventilador de teto',
        'Problema na fiação do quarto'
      ][index],
      price: [80.0, 120.0, 150.0][index],
      distance: '${(index + 1) * 0.8} km',
      estimatedTime: '${15 + (index * 5)} min',
      urgency: index == 0 ? 'Alta' : 'Normal',
    );
  }
}

class _ServiceRequestCard extends StatelessWidget {
  final ServiceRequest request;
  final VoidCallback onAccept;
  final VoidCallback onDecline;

  const _ServiceRequestCard({
    required this.request,
    required this.onAccept,
    required this.onDecline,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                  child: Text(
                    request.clientName.substring(0, 1),
                    style: const TextStyle(
                      color: AppTheme.primaryColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            request.clientName,
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          if (request.urgency == 'Alta') ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppTheme.errorColor.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                'URGENTE',
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: AppTheme.errorColor,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      Text(
                        request.category,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppTheme.textSecondaryColor,
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  'R\$ ${request.price.toStringAsFixed(0)}',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppTheme.primaryColor,
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 12),
            
            // Description
            Text(
              request.description,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            
            const SizedBox(height: 12),
            
            // Info row
            Row(
              children: [
                Icon(
                  Icons.location_on,
                  size: 16,
                  color: AppTheme.textSecondaryColor,
                ),
                const SizedBox(width: 4),
                Text(
                  request.distance,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppTheme.textSecondaryColor,
                  ),
                ),
                const SizedBox(width: 16),
                Icon(
                  Icons.access_time,
                  size: 16,
                  color: AppTheme.textSecondaryColor,
                ),
                const SizedBox(width: 4),
                Text(
                  request.estimatedTime,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppTheme.textSecondaryColor,
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 16),
            
            // Action buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: onDecline,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.errorColor,
                      side: const BorderSide(color: AppTheme.errorColor),
                    ),
                    child: const Text('Recusar'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: onAccept,
                    child: const Text('Aceitar Serviço'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class ServiceRequest {
  final String id;
  final String clientName;
  final String category;
  final String description;
  final double price;
  final String distance;
  final String estimatedTime;
  final String urgency;

  ServiceRequest({
    required this.id,
    required this.clientName,
    required this.category,
    required this.description,
    required this.price,
    required this.distance,
    required this.estimatedTime,
    required this.urgency,
  });
}
