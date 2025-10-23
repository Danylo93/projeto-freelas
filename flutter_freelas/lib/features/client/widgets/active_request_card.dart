import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';

class ActiveRequestCard extends StatelessWidget {
  const ActiveRequestCard({super.key});

  @override
  Widget build(BuildContext context) {
    // TODO: Implement with real data from provider
    final hasActiveRequest = false; // This will come from state management
    
    if (!hasActiveRequest) {
      return const SizedBox.shrink();
    }
    
    return Card(
      margin: EdgeInsets.zero,
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
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppTheme.successColor,
                        ),
                      ),
                      Text(
                        'Eletricista - João Silva',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppTheme.textSecondaryColor,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () {
                    // TODO: Navigate to request details
                  },
                  icon: const Icon(Icons.arrow_forward_ios, size: 16),
                ),
              ],
            ),
            
            const SizedBox(height: 12),
            
            LinearProgressIndicator(
              value: 0.7, // TODO: Real progress
              backgroundColor: AppTheme.borderColor,
              valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.successColor),
            ),
            
            const SizedBox(height: 8),
            
            Text(
              'Chegando em ~15 min',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppTheme.textSecondaryColor,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
