import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { EditButton } from './EditButton';
import { ThemedText } from '@/components/ThemedText';

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
  const styles = createStyles(colorScheme);

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
              // Use onValueChange if provided (doesn't close edit mode), otherwise use onSave
              if (onValueChange) {
                onValueChange(text);
              } else {
                onSave(text);
              }
            }}
            placeholder={placeholder}
            placeholderTextColor={Colors[colorScheme ?? 'light'].blueGray400}
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

const createStyles = (colorScheme: 'light' | 'dark' | null | undefined) => StyleSheet.create({
  editableField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editableInput: {
    flex: 1,
    fontSize: 14,
    color: Colors[colorScheme ?? 'light'].text,
    borderWidth: 1,
    borderColor: Colors[colorScheme ?? 'light'].background200,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: Colors[colorScheme ?? 'light'].background,
    marginRight: 8,
  },
  editableInputLarge: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  placeholderText: {
    color: Colors[colorScheme ?? 'light'].blueGray400,
    fontStyle: 'italic',
  },
  editModeContainer: {
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  doneButton: {
    backgroundColor: Colors[colorScheme ?? 'light'].teal600,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  doneButtonText: {
    color: Colors[colorScheme ?? 'light'].white,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default EditableField;