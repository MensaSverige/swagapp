import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';



interface FieldProps {
  label: React.ReactNode;
  labelIcon?: React.ReactNode; // Changed from IconProp to React.ReactNode
  labelIconColor?: string;
  labelControl?: React.ReactNode;
  help?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  children?: React.ReactNode;
  onPress?: () => void;
}

const Field: React.FC<FieldProps> = ({
  children = undefined,
  label,
  labelIcon,
  labelIconColor,
  labelControl,
  help,
  required,
  disabled = false,
  error,
  onPress = undefined,
}) => (
  <View style={[styles.card, disabled && styles.disabled]}>
    <Pressable onPress={onPress} disabled={disabled || !onPress}>
      <View style={styles.container}>
        <View style={styles.label}>
          <Text style={[styles.labelText, required && styles.required]}>
            {label}
            {required && <Text style={styles.asterisk}> *</Text>}
          </Text>
          {labelControl}
          {labelIcon && (
            <View style={styles.iconContainer}>
              {labelIcon}
            </View>
          )}
        </View>
        
        {children}

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {error}
            </Text>
          </View>
        ) : (
          help && (
            <View style={styles.helpContainer}>
              <Text style={styles.helpText}>{help}</Text>
            </View>
          )
        )}
      </View>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  disabled: {
    opacity: 0.6,
  },
  container: {
    flex: 1,
  },
  label: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  iconContainer: {
    marginLeft: 8,
  },
  required: {
    // Base style for required fields
  },
  asterisk: {
    color: '#EF4444',
    fontWeight: '600',
  },
  errorContainer: {
    marginTop: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
  },
  helpContainer: {
    marginTop: 4,
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default Field;
