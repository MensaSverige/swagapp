import React from 'react';
import {FormControl, Heading, Text} from 'native-base';
import {StyleSheet} from 'react-native';

interface FieldProps {
  label: React.ReactNode;
  labelControl?: React.ReactNode;
  help?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({
  children,
  label,
  labelControl,
  help,
  required,
  disabled = false,
  error,
}) => (
  <FormControl
    isInvalid={error !== undefined}
    isRequired={required}
    isDisabled={disabled}>
    <FormControl.Label style={styles.label}>
      <Heading size="sm">{label}</Heading>
      {labelControl}
    </FormControl.Label>
    {children}

    {error ? (
      <FormControl.ErrorMessage>
        <Text>{error}</Text>
      </FormControl.ErrorMessage>
    ) : (
      help && (
        <FormControl.HelperText>
          <Text>{help}</Text>
        </FormControl.HelperText>
      )
    )}
  </FormControl>
);

const styles = StyleSheet.create({
  label: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default Field;
