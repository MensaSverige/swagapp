import React from 'react';
import { Card, FormControl, FormControlError, FormControlErrorText, FormControlHelper, FormControlHelperText, FormControlLabel, Heading, Text } from '../../../gluestack-components';
import { Pressable, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { config } from '../../../gluestack-components/gluestack-ui.config';


const colors = config.tokens.colors;
interface FieldProps {
  label: React.ReactNode;
  labelIcon?: IconProp;
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
  <Card size="sm" variant="elevated" m="$0">
  <Pressable onPress={onPress}>
    <FormControl
      isInvalid={error !== undefined}
      isRequired={required}
      isDisabled={disabled}>
      <FormControlLabel  style={styles.label}>
        <Heading size="sm">{label}</Heading>
        {labelControl}
        {labelIcon && <FontAwesomeIcon
          icon={labelIcon}
          size={24}
          color={labelIconColor ? labelIconColor : colors.primary500}
        />}

      </FormControlLabel>
      {children}

      {error ? (
        <FormControlError>
          <FormControlErrorText>
            {error}
          </FormControlErrorText>
        </FormControlError>
      ) : (
        help && (
          <FormControlHelper>
            <FormControlHelperText>{help}</FormControlHelperText>
          </FormControlHelper>
        )
      )}
    </FormControl>
  </Pressable>
  </Card>
);

const styles = StyleSheet.create({
  label: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default Field;
