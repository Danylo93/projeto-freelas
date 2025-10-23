import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';

class StatusToggle extends StatelessWidget {
  final bool isOnline;
  final ValueChanged<bool> onToggle;

  const StatusToggle({
    super.key,
    required this.isOnline,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isOnline 
                        ? AppTheme.successColor.withOpacity(0.1)
                        : AppTheme.textSecondaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    isOnline ? Icons.wifi : Icons.wifi_off,
                    color: isOnline ? AppTheme.successColor : AppTheme.textSecondaryColor,
                    size: 28,
                  ),
                ),
                
                const SizedBox(width: 16),
                
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isOnline ? 'Você está online' : 'Você está offline',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: isOnline ? AppTheme.successColor : AppTheme.textSecondaryColor,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        isOnline 
                            ? 'Recebendo solicitações de serviço'
                            : 'Ative para receber solicitações',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppTheme.textSecondaryColor,
                        ),
                      ),
                    ],
                  ),
                ),
                
                // Toggle switch
                Switch(
                  value: isOnline,
                  onChanged: onToggle,
                  activeColor: AppTheme.successColor,
                  activeTrackColor: AppTheme.successColor.withOpacity(0.3),
                  inactiveThumbColor: AppTheme.textSecondaryColor,
                  inactiveTrackColor: AppTheme.textSecondaryColor.withOpacity(0.3),
                ),
              ],
            ),
            
            if (isOnline) ...[
              const SizedBox(height: 16),
              
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.successColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: AppTheme.successColor.withOpacity(0.3),
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: AppTheme.successColor,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Sua localização está sendo compartilhada com clientes próximos',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppTheme.successColor,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
