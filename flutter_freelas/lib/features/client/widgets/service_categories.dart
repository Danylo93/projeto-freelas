import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';

class ServiceCategories extends StatelessWidget {
  final ValueChanged<String> onCategorySelected;

  const ServiceCategories({
    super.key,
    required this.onCategorySelected,
  });

  static const List<ServiceCategory> _categories = [
    ServiceCategory(
      id: 'eletricista',
      name: 'Eletricista',
      icon: Icons.electrical_services,
      color: Color(0xFFFF9500),
    ),
    ServiceCategory(
      id: 'encanador',
      name: 'Encanador',
      icon: Icons.plumbing,
      color: Color(0xFF007AFF),
    ),
    ServiceCategory(
      id: 'pintor',
      name: 'Pintor',
      icon: Icons.format_paint,
      color: Color(0xFF34C759),
    ),
    ServiceCategory(
      id: 'marceneiro',
      name: 'Marceneiro',
      icon: Icons.carpenter,
      color: Color(0xFF8B4513),
    ),
    ServiceCategory(
      id: 'limpeza',
      name: 'Limpeza',
      icon: Icons.cleaning_services,
      color: Color(0xFF5856D6),
    ),
    ServiceCategory(
      id: 'jardinagem',
      name: 'Jardinagem',
      icon: Icons.grass,
      color: Color(0xFF30D158),
    ),
    ServiceCategory(
      id: 'mecanico',
      name: 'Mecânico',
      icon: Icons.build,
      color: Color(0xFF8E8E93),
    ),
    ServiceCategory(
      id: 'outros',
      name: 'Outros',
      icon: Icons.more_horiz,
      color: Color(0xFFAF52DE),
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 4,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.85,
      ),
      itemCount: _categories.length,
      itemBuilder: (context, index) {
        final category = _categories[index];
        return _CategoryCard(
          category: category,
          onTap: () => onCategorySelected(category.id),
        );
      },
    );
  }
}

class ServiceCategory {
  final String id;
  final String name;
  final IconData icon;
  final Color color;

  const ServiceCategory({
    required this.id,
    required this.name,
    required this.icon,
    required this.color,
  });
}

class _CategoryCard extends StatelessWidget {
  final ServiceCategory category;
  final VoidCallback onTap;

  const _CategoryCard({
    required this.category,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppTheme.surfaceColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.borderColor),
          boxShadow: [
            BoxShadow(
              color: AppTheme.shadowColor,
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: category.color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                category.icon,
                color: category.color,
                size: 24,
              ),
            ),
            
            const SizedBox(height: 8),
            
            Text(
              category.name,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w500,
                color: AppTheme.textPrimaryColor,
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
