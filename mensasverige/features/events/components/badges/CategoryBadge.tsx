import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import OfficialEventIcon from '../../../../components/icons/OfficialEventIcon';

export interface CategoryBadgeProps {
  categoryCode?: string;
  eventType?: 'official' | 'non-official';
  label?: string;
  showLabel?: boolean;
  size?: 'x-small' | 'small' | 'medium';
  onPress?: () => void;
}

// Category definitions with colors and icons
const CATEGORY_CONFIG = {
  'F': { label: 'Föreläsning', color: Colors.indigo500, icon: 'co-present' as keyof typeof MaterialIcons.glyphMap },
  'Fö': { label: 'Föreningsarbete', color: Colors.primary400, icon: 'groups' as keyof typeof MaterialIcons.glyphMap },
  'M': { label: 'Middag', color: Colors.pink600, icon: 'restaurant' as keyof typeof MaterialIcons.glyphMap },
  'S': { label: 'Spel', color: '#D97706', icon: 'casino' as keyof typeof MaterialIcons.glyphMap },
  'U': { label: 'Ungdomsaktivitet', color: Colors.fuchsia600, icon: 'escalator-warning' as keyof typeof MaterialIcons.glyphMap },
  'Up': { label: 'Uppträdande', color: Colors.amber600, icon: 'mic' as keyof typeof MaterialIcons.glyphMap },
  'Ut': { label: 'Utflykt', color: Colors.lime600, icon: 'explore' as keyof typeof MaterialIcons.glyphMap },
  'W': { label: 'Workshop', color: Colors.purple600, icon: 'handyman' as keyof typeof MaterialIcons.glyphMap },
};

// Event type definitions with colors and icons
const EVENT_TYPE_CONFIG = {
  'official': {
    label: 'Officiellt evenemang',
    color: Colors.primary500,
    icon: 'official' as const
  },
  'non-official': {
    label: 'Medlemsaktivitet',
    color: Colors.info300,
    icon: 'person-add-alt-1' as keyof typeof MaterialIcons.glyphMap
  },
};

// Isolated so useColorScheme is only called when a label is actually rendered.
// In the events list showLabel is always false, so this component never mounts there.
const BadgeLabel = React.memo(function BadgeLabel({ text, size }: { text: string; size: 'x-small' | 'small' | 'medium' }) {
  return (
    <ThemedText
      lightColor={Colors.coolGray700}
      darkColor={Colors.coolGray200}
      style={
        size === 'x-small' ? styles.labelTextXSmall :
        size === 'small' ? styles.labelTextSmall :
        styles.labelTextMedium
      }
    >
      {text}
    </ThemedText>
  );
});

type BadgeConfig =
  | (typeof CATEGORY_CONFIG)[keyof typeof CATEGORY_CONFIG]
  | (typeof EVENT_TYPE_CONFIG)[keyof typeof EVENT_TYPE_CONFIG];

const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  categoryCode,
  eventType,
  label,
  showLabel = true,
  size: labelSize = 'medium',
  onPress
}) => {
  // Determine if this is a category or event type badge
  let config: BadgeConfig | null = null;
  let isEventType = false;

  if (eventType) {
    config = EVENT_TYPE_CONFIG[eventType];
    isEventType = true;
  } else if (categoryCode) {
    config = CATEGORY_CONFIG[categoryCode as keyof typeof CATEGORY_CONFIG];
  }

  if (!config) {
    return null;
  }

  let iconSize: number;
  let badgeSize: number;

  switch (labelSize) {
    case 'x-small':
      badgeSize = 16;
      iconSize = 10;
      break;
    case 'small':
      badgeSize = 26;
      iconSize = 13;
      break;
    case 'medium':
    default:
      badgeSize = 32;
      iconSize = 16;
      break;
  }

  const badgeCircleStyle = useMemo(() => ({
    borderRadius: badgeSize / 2,
    width: badgeSize,
    height: badgeSize,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: config.color + '20',
  }), [badgeSize, config.color]);

  const icon = isEventType && config.icon === 'official'
    ? <OfficialEventIcon size={iconSize} color={config.color} />
    : <MaterialIcons name={config.icon as keyof typeof MaterialIcons.glyphMap} size={iconSize} color={config.color} />;

  const badgeContent = (
    <>
      <View style={badgeCircleStyle}>
        {icon}
      </View>
      {showLabel && (
        <BadgeLabel text={label || config.label} size={labelSize} />
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {badgeContent}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {badgeContent}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
  },
  labelTextXSmall: {
    fontSize: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  labelTextSmall: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  labelTextMedium: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default React.memo(CategoryBadge);
