import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { EditButton } from './EditButton';

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

  const handleSave = () => {
    onSave(editValue);
  };

  if (isEditing) {
    return (
      <View style={styles.editModeContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
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
            placeholderTextColor="#9CA3AF"
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
      <Text style={[
        value ? { color: '#374151' } : styles.placeholderText,
        style,
      ]}>
        {value || placeholder}
      </Text>
      <EditButton onPress={onEdit} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  editableField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editableInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.blueGray700,
    borderWidth: 1,
    borderColor: Colors.blueGray200,
    borderRadius: 6,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  editableInputLarge: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  placeholderText: {
    color: Colors.blueGray400,
    fontStyle: 'italic',
  },
  editModeContainer: {
    backgroundColor: Colors.background50,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.blueGray500,
    marginBottom: 4,
  },
  doneButton: {
    backgroundColor: Colors.teal600,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  doneButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default EditableField;