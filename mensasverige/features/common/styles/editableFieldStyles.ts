import { StyleSheet } from 'react-native';
import { Colors } from '../../../constants/Colors';

/**
 * Centralized styles for all editable field components
 * Used across EditableField, EventMapField, and other editable components
 */
export const createEditableFieldStyles = (colorScheme: 'light' | 'dark' | null | undefined = 'light') => {
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  
  return StyleSheet.create({
    // Container styles
    editModeContainer: {
      borderRadius: 8,
      marginBottom: 8,
    },
    
    // Field and input styles
    editableField: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    
    editableInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.background200 || colors.coolGray200,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 8,
      backgroundColor: colors.background || colors.white,
      marginRight: 8,
    },
    
    editableInputLarge: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    
    // Label styles
    fieldLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.blueGray500,
      marginBottom: 4,
    },
    
    // Text styles
    placeholderText: {
      color: colors.blueGray400,
      fontStyle: 'italic',
    },
    
    // Button styles
    doneButton: {
      backgroundColor: colors.teal600,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      marginLeft: 8,
    },
    
    doneButtonText: {
      color: colors.white,
      fontSize: 12,
      fontWeight: '600',
    },
    
    // Map field specific styles
    mapContainer: {
      flex: 1,
      gap: 16,
      width: '100%',
      height: '100%',
    },
    
    mapEditContainer: {
      backgroundColor: colors.background50 || colors.backgroundAlt,
      borderRadius: 8,
      padding: 12,
    },
    
    mapInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.coolGray200 || '#ccc',
      borderRadius: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.white,
    },
    
    mapTextInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 14,
      color: colors.text,
    },
    
    mapSearchButton: {
      padding: 8,
      marginLeft: 8,
      backgroundColor: colors.teal600 || '#0891B2',
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    mapInputWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.background200 || colors.coolGray200,
      borderRadius: 6,
      backgroundColor: colors.background || colors.white,
    },
    
    mapTextInputWithIcon: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      paddingHorizontal: 12,
      paddingVertical: 12,
      backgroundColor: 'transparent',
    },
    
    mapSearchIconButton: {
      padding: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    mapPreviewContainer: {
      paddingTop: 10,
    },
    
    mapDisplayContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 16,
    },
    
    mapDisplayText: {
      fontSize: 14,
      color: colors.text,
    },
    
    // Touch target styles
    touchableField: {
      minHeight: 44, // Minimum touch target size
      justifyContent: 'center',
    },
    
    // Error state styles
    errorInput: {
      borderColor: colors.red600 || '#DC2626',
    },
    
    errorText: {
      color: colors.red600 || '#DC2626',
      fontSize: 12,
      marginTop: 4,
    },
    
    // Focus state styles
    focusedInput: {
      borderColor: colors.teal600 || '#0891B2',
      borderWidth: 2,
    },
    
    // Disabled state styles
    disabledInput: {
      backgroundColor: colors.coolGray100 || '#F3F4F6',
      color: colors.coolGray400,
    },
    
    disabledText: {
      color: colors.coolGray400,
    },
  });
};

export const editableFieldStyles = createEditableFieldStyles('light');

export default createEditableFieldStyles;