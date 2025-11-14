import { TouchableOpacity, type TouchableOpacityProps, StyleSheet, Text, useColorScheme, ActivityIndicator, View } from 'react-native';

export type ThemedButtonProps = TouchableOpacityProps & {
  text: string;
  variant?: 'primary' | 'secondary';
  isDisabled?: boolean;
  isLoading?: boolean;
};

export function ThemedButton({
  text,
  style,
  variant = 'primary',
  isDisabled = false,
  isLoading = false,
  onPress,
//   ...rest
}: ThemedButtonProps) {
  const colorScheme = useColorScheme();

  const buttonStyle = variant === 'primary' 
    ? (colorScheme === 'light' ? styles.primaryLight : styles.primaryDark)
    : (colorScheme === 'light' ? styles.secondaryLight : styles.secondaryDark);

  const textStyle = variant === 'primary' 
    ? styles.primaryText
    : (colorScheme === 'light' ? styles.secondaryTextLight : styles.secondaryTextDark);

  const handlePress = (event: any) => {
    if (isLoading) return;
    onPress?.(event);
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        buttonStyle,
        (isLoading || isDisabled) && styles.disabled,
        style,
      ]}
      disabled={isLoading || isDisabled}
      onPress={handlePress}
    //   {...rest}
    >
      <View style={styles.buttonContent}>

        <Text
          style={[
            styles.buttonText,
            textStyle,
            isLoading && styles.loadingText,
          ]}
        >
          {text}
        </Text>
        {isLoading && (
          <ActivityIndicator 
            size="small" 
            color={variant === 'primary' ? '#fff' : (colorScheme === 'light' ? '#111' : '#fff')}
            style={styles.spinner}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    width: '100%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
  spinner: {
    marginLeft: 8,
  },
  loadingText: {
    opacity: 0.8,
  },
  // Primary button styles
  primaryLight: {
    backgroundColor: '#2563EB',
  },
  primaryDark: {
    backgroundColor: '#2563EB',
  },
  primaryText: {
    color: '#fff',
  },
  // Secondary button styles
  secondaryLight: {
    backgroundColor: '#FCD34D',
  },
  secondaryDark: {
    backgroundColor: '#FCD34D',
  },
  secondaryTextLight: {
    color: '#111',
  },
  secondaryTextDark: {
    color: '#fff',
  },
});
