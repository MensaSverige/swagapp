import { View, type ViewProps, StyleSheet } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedViewProps = Omit<ViewProps, 'style'> & {
  lightColor?: string;
  darkColor?: string;
  style?: ViewProps['style'];
};

export function ThemedView({ style = styles.defaultStyle, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
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
