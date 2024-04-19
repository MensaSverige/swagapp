import React from 'react';
import {FormControl, Heading, Text} from 'native-base';
import {Pressable, StyleSheet} from 'react-native';
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
  <Pressable onPress={onPress}>
    <FormControl
      isInvalid={error !== undefined}
      isRequired={required}
      isDisabled={disabled}>
      <FormControl.Label style={styles.label}>
        <Heading size="sm">{label}</Heading>
        {labelControl}
        {labelIcon && <FontAwesomeIcon
                  icon={labelIcon}
                  size={24}
                  color={labelIconColor ? labelIconColor : colors.primary500}
                />}

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
  </Pressable>
);

const styles = StyleSheet.create({
  label: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default Field;
