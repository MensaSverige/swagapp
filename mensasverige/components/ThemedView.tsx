import { View, type ViewProps, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedViewProps = Omit<ViewProps, 'style'> & {
  lightColor?: string;
  darkColor?: string;
  style?: ViewProps['style'];
  useSafeArea?: boolean;
};

export function ThemedView({ style = styles.defaultStyle, lightColor, darkColor, useSafeArea = false, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  const insets = useSafeAreaInsets();

  const safeAreaStyle = useSafeArea ? {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  } : {};

  return <View style={[{ backgroundColor }, safeAreaStyle, style]} {...otherProps} />;
}

const styles = StyleSheet.create({
  defaultStyle: {
    // flexDirection: 'row',
    // alignItems: 'center',
    // gap: 8,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 16,
    flex: 1
  },
});
