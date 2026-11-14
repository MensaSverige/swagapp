import React, { useMemo } from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getCategoryByCode } from '../../utilities/EventCategories';

export interface CategoryBadgeProps {
  categoryCode: string;
  size?: 'small' | 'medium';
}

/**
 * A category's icon in a tinted circle, as list rows show it. Nothing for a
 * code that is not one of the event categories.
 */
const CategoryBadge: React.FC<CategoryBadgeProps> = ({ categoryCode, size = 'medium' }) => {
  const category = getCategoryByCode(categoryCode);
  const badgeSize = size === 'small' ? 26 : 32;
  const iconSize = size === 'small' ? 13 : 16;

  const circleStyle = useMemo(() => ({
    borderRadius: badgeSize / 2,
    width: badgeSize,
    height: badgeSize,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: (category?.color ?? '#000000') + '20',
  }), [badgeSize, category?.color]);

  if (!category) return null;
  return (
    <View style={circleStyle}>
      <MaterialIcons name={category.icon} size={iconSize} color={category.color} />
    </View>
  );
};

export default React.memo(CategoryBadge);
