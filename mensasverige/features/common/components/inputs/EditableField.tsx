import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, useColorScheme } from 'react-native';
import { EditButton } from './../EditButton';
import { ThemedText } from '@/components/ThemedText';
import { createEditableFieldStyles } from '../../styles/editableFieldStyles';

interface EditableFieldProps {
  label: string;
  value: string;
  placeholder: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (value: string) => void;
  multiline?: boolean;
  style?: any;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  onValueChange?: (value: string) => void;
}

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  placeholder,
  isEditing,
  onEdit,
  onSave,
  multiline = false,
  style,
  keyboardType = 'default',
  onValueChange,
}) => {
  const [editValue, setEditValue] = useState(value);
  const colorScheme = useColorScheme();
  const styles = createEditableFieldStyles(colorScheme);

  const handleSave = () => {
    onSave(editValue);
  };

  if (isEditing) {
    return (
      <View style={styles.editModeContainer}>
        <ThemedText style={styles.fieldLabel}>{label}</ThemedText>
        <View style={styles.editableField}>
          <TextInput
            style={[
              styles.editableInput,
              multiline && styles.editableInputLarge,
              style,
            ]}
            value={editValue}
            onChangeText={(text) => {
              setEditValue(text);
              if (onValueChange) {
                onValueChange(text);
              } else {
                onSave(text);
              }
            }}
            placeholder={placeholder}
            multiline={multiline}
            keyboardType={keyboardType}
            onBlur={handleSave}
            onEndEditing={handleSave}
            onSubmitEditing={multiline ? undefined : handleSave}
            autoFocus
          />
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity onPress={onEdit} style={styles.editableField}>
      <ThemedText style={[
        !value && styles.placeholderText,
        style,
      ]}>
        {value || placeholder}
      </ThemedText>
      <EditButton onPress={onEdit} />
    </TouchableOpacity>
  );
};

export default EditableField;