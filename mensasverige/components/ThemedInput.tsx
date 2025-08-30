import { TextInput, type TextInputProps, StyleSheet, View, TouchableOpacity, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedInputProps = TextInputProps & {
  lightColor?: string;
  darkColor?: string;
  lightBackgroundColor?: string;
  darkBackgroundColor?: string;
  lightBorderColor?: string;
  darkBorderColor?: string;
  showPasswordToggle?: boolean;
  onPasswordToggle?: () => void;
};

export function ThemedInput({
  style,
  lightColor,
  darkColor,
  lightBackgroundColor,
  darkBackgroundColor,
  lightBorderColor,
  darkBorderColor,
  showPasswordToggle = false,
  onPasswordToggle,
  secureTextEntry,
  ...rest
}: ThemedInputProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const backgroundColor = useThemeColor(
    { light: lightBackgroundColor, dark: darkBackgroundColor }, 
    'background'
  );
  const borderColor = useThemeColor(
    { light: lightBorderColor, dark: darkBorderColor }, 
    'tabIconDefault'
  );
  const iconColor = useThemeColor({}, 'icon');

  if (showPasswordToggle) {
    return (
      <View
        style={[
          { ...styles.outline, backgroundColor, borderColor },
          styles.passwordContainer,
          style as ViewStyle,
        ]}
      >
        <TextInput
          style={[
            { color, flex: 1 },
            styles.passwordInput,
          ]}
          placeholderTextColor={useThemeColor({}, 'tabIconDefault')}
          secureTextEntry={secureTextEntry}
          {...rest}
        />
        <TouchableOpacity onPress={onPasswordToggle} style={styles.passwordToggle}>
          <Ionicons
            name={secureTextEntry ? 'eye-off' : 'eye'}
            size={20}
            color={iconColor}
          />§
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TextInput
      style={[
        { color, ...styles.outline, backgroundColor, borderColor },
        style,
      ]}
      placeholderTextColor={useThemeColor({}, 'tabIconDefault')}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  outline: {
    height: 48,
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  passwordInput: {
    fontSize: 16,
  },
  passwordToggle: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
