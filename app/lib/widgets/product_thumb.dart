import 'package:flutter/material.dart';
import '../models/product.dart';
import '../theme/app_theme.dart';

class ProductThumb extends StatelessWidget {
  final Product product;
  final double size;
  final double radius;

  const ProductThumb({
    super.key,
    required this.product,
    this.size = 84,
    this.radius = 12,
  });

  @override
  Widget build(BuildContext context) {
    final imageUrl = product.imageUrl;
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: SizedBox(
        width: size,
        height: size,
        child: imageUrl == null
            ? const _ThumbFallback()
            : Image.network(
                imageUrl,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) =>
                    const _ThumbFallback(),
              ),
      ),
    );
  }
}

class _ThumbFallback extends StatelessWidget {
  const _ThumbFallback();

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      'assets/images/product-fallback.png',
      fit: BoxFit.cover,
      // 앱 번들에 포함된 파일이라 실패할 일이 없지만, 손상된 배포 파일에서도 레이아웃이
      // 깨지지 않게 최종 아이콘 폴백을 둔다.
      errorBuilder: (_, __, ___) => Container(
        color: AppColors.surface,
        alignment: Alignment.center,
        child: const Icon(
          Icons.shopping_bag_outlined,
          color: AppColors.textSecondary,
        ),
      ),
    );
  }
}
