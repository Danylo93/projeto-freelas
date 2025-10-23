import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../auth/models/user_model.dart';
import '../../auth/providers/auth_provider.dart';

class ProviderHeader extends ConsumerWidget {
  final UserModel? user;

  const ProviderHeader({
    super.key,
    required this.user,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        gradient: AppTheme.primaryGradient,
      ),
      child: Row(
        children: [
          // User avatar
          CircleAvatar(
            radius: 24,
            backgroundColor: Colors.white.withOpacity(0.2),
            backgroundImage: user?.avatar != null 
                ? NetworkImage(user!.avatar!)
                : null,
            child: user?.avatar == null
                ? Text(
                    user?.name.substring(0, 1).toUpperCase() ?? 'U',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  )
                : null,
          ),
          
          const SizedBox(width: 12),
          
          // Greeting and subtitle
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Olá, ${user?.name.split(' ').first ?? 'Prestador'}! 🔧',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                const Text(
                  'Pronto para trabalhar hoje?',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          
          // Stats and menu
          Row(
            children: [
              // Today's earnings
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  children: [
                    const Text(
                      'Hoje',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 10,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const Text(
                      'R\$ 150',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              
              const SizedBox(width: 8),
              
              // Menu button
              IconButton(
                onPressed: () => _showMenu(context, ref),
                icon: const Icon(
                  Icons.menu,
                  color: Colors.white,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showMenu(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => _MenuBottomSheet(user: user),
    );
  }
}

class _MenuBottomSheet extends ConsumerWidget {
  final UserModel? user;

  const _MenuBottomSheet({required this.user});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppTheme.borderColor,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          
          const SizedBox(height: 24),
          
          // User info
          Row(
            children: [
              CircleAvatar(
                radius: 30,
                backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                backgroundImage: user?.avatar != null 
                    ? NetworkImage(user!.avatar!)
                    : null,
                child: user?.avatar == null
                    ? Text(
                        user?.name.substring(0, 1).toUpperCase() ?? 'U',
                        style: const TextStyle(
                          color: AppTheme.primaryColor,
                          fontSize: 24,
                          fontWeight: FontWeight.w600,
                        ),
                      )
                    : null,
              ),
              
              const SizedBox(width: 16),
              
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user?.name ?? 'Prestador',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      user?.email ?? '',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.textSecondaryColor,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(
                          Icons.star,
                          size: 16,
                          color: Colors.amber[600],
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '4.8 (127 avaliações)',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppTheme.textSecondaryColor,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 32),
          
          // Menu items
          _MenuItem(
            icon: Icons.person_outline,
            title: 'Meu Perfil',
            onTap: () {
              Navigator.pop(context);
              // TODO: Navigate to profile
            },
          ),
          
          _MenuItem(
            icon: Icons.history,
            title: 'Histórico de Serviços',
            onTap: () {
              Navigator.pop(context);
              // TODO: Navigate to history
            },
          ),
          
          _MenuItem(
            icon: Icons.attach_money,
            title: 'Ganhos e Pagamentos',
            onTap: () {
              Navigator.pop(context);
              // TODO: Navigate to earnings
            },
          ),
          
          _MenuItem(
            icon: Icons.star_outline,
            title: 'Avaliações',
            onTap: () {
              Navigator.pop(context);
              // TODO: Navigate to reviews
            },
          ),
          
          _MenuItem(
            icon: Icons.help_outline,
            title: 'Ajuda e Suporte',
            onTap: () {
              Navigator.pop(context);
              // TODO: Navigate to help
            },
          ),
          
          _MenuItem(
            icon: Icons.settings_outlined,
            title: 'Configurações',
            onTap: () {
              Navigator.pop(context);
              // TODO: Navigate to settings
            },
          ),
          
          const Divider(height: 32),
          
          _MenuItem(
            icon: Icons.logout,
            title: 'Sair',
            textColor: AppTheme.errorColor,
            onTap: () {
              Navigator.pop(context);
              ref.read(authProvider.notifier).logout();
            },
          ),
          
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;
  final Color? textColor;

  const _MenuItem({
    required this.icon,
    required this.title,
    required this.onTap,
    this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(
        icon,
        color: textColor ?? AppTheme.textSecondaryColor,
      ),
      title: Text(
        title,
        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
          color: textColor,
        ),
      ),
      onTap: onTap,
      contentPadding: EdgeInsets.zero,
    );
  }
}
