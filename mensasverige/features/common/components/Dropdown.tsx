import React, { useState } from 'react';
import { View, StyleSheet, Pressable, useColorScheme } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';

/**
 * Reusable Dropdown Component
 * 
 * A customizable dropdown picker that automatically adapts to light and dark themes.
 * Features:
 * - Automatic light/dark theme adaptation
 * - Smooth animations and native feel
 * - Customizable styling
 * - Click outside to close
 * - Disabled state support
 * - TypeScript support
 * 
 * Usage Example:
 * ```tsx
 * const options = [
 *   { value: 'option1', label: 'Option 1' },
 *   { value: 'option2', label: 'Option 2' },
 * ];
 * 
 * <Dropdown
 *   options={options}
 *   selectedValue={selectedValue}
 *   onValueChange={(value) => setSelectedValue(value)}
 *   placeholder="Select an option"
 * />
 * ```
 */

export interface DropdownOption {
    value: string;
    label: string;
}

interface DropdownProps {
    options: DropdownOption[];
    selectedValue: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    style?: any;
    disabled?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({
    options,
    selectedValue,
    onValueChange,
    placeholder = 'Välj alternativ',
    style,
    disabled = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const colorScheme = useColorScheme();
    
    const styles = createStyles(colorScheme);

    const selectedOption = options.find(option => option.value === selectedValue);
    const displayText = selectedOption?.label || placeholder;

    const handleOptionPress = (value: string) => {
        onValueChange(value);
        setIsOpen(false);
    };

    return (
        <ThemedView style={[styles.container, style]}>
            <View style={styles.dropdownContainer}>
                {/* Invisible overlay to close dropdown when clicking outside */}
                {isOpen && (
                    <Pressable
                        style={styles.overlay}
                        onPress={() => setIsOpen(false)}
                    />
                )}
                
                <Pressable
                    style={[
                        styles.button,
                        disabled && styles.disabledButton,
                        isOpen && styles.openButton
                    ]}
                    onPress={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}>
                    <ThemedText style={[
                        styles.buttonText,
                        disabled && styles.disabledButtonText,
                        !selectedOption && styles.placeholderText
                    ]}>
                        {displayText}
                    </ThemedText>
                    <MaterialIcons 
                        name={isOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                        size={24} 
                        color={disabled ? 
                            (colorScheme === 'dark' ? Colors.dark?.text300 : Colors.coolGray300) : 
                            (colorScheme === 'dark' ? Colors.dark?.text500 : Colors.coolGray500)
                        } 
                    />
                </Pressable>
                
                {isOpen && !disabled && (
                    <View style={styles.optionsList}>
                        {options.map((option, index) => (
                            <Pressable
                                key={`dropdown-option-${option.value}-${index}`}
                                style={[
                                    styles.optionItem,
                                    selectedValue === option.value && styles.selectedOptionItem,
                                    index === options.length - 1 && styles.lastOptionItem
                                ]}
                                onPress={() => handleOptionPress(option.value)}>
                                <ThemedText style={[
                                    styles.optionText,
                                    selectedValue === option.value && styles.selectedOptionText
                                ]}>
                                    {option.label}
                                </ThemedText>
                                {selectedValue === option.value && (
                                    <MaterialIcons 
                                        name="check" 
                                        size={20} 
                                        color={colorScheme === 'dark' ? Colors.dark?.info600 || Colors.primary500 : Colors.primary500} 
                                    />
                                )}
                            </Pressable>
                        ))}
                    </View>
                )}
            </View>
        </ThemedView>
    );
};

const createStyles = (colorScheme: 'light' | 'dark' | null | undefined) => StyleSheet.create({
    container: {
        borderWidth: 1,
        borderColor: colorScheme === 'dark' ? Colors.dark?.background300 || '#374151' : Colors.background200 || '#E5E5E5',
        borderRadius: 6,
        overflow: 'visible',
    },
    dropdownContainer: {
        position: 'relative',
        zIndex: 1000,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,
    },
    button: {
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        backgroundColor: 'transparent',
    },
    openButton: {
        borderBottomWidth: 1,
        borderBottomColor: colorScheme === 'dark' ? Colors.dark?.background300 || '#374151' : Colors.background200 || '#E5E5E5',
    },
    disabledButton: {
        opacity: 0.5,
        backgroundColor: colorScheme === 'dark' ? Colors.dark?.background100 || '#1F2937' : Colors.coolGray50 || '#F9FAFB',
    },
    buttonText: {
        fontSize: 16,
        flex: 1,
    },
    placeholderText: {
        opacity: 0.6,
        fontStyle: 'italic',
    },
    disabledButtonText: {
        color: colorScheme === 'dark' ? Colors.dark?.text300 || '#9CA3AF' : Colors.coolGray400 || '#9CA3AF',
    },
    optionsList: {
        backgroundColor: colorScheme === 'dark' ? Colors.dark?.background50 || '#111827' : Colors.light?.background || '#FFFFFF',
        borderWidth: 1,
        borderColor: colorScheme === 'dark' ? Colors.dark?.background300 || '#374151' : Colors.background200 || '#E5E5E5',
        borderTopWidth: 0,
        borderBottomLeftRadius: 6,
        borderBottomRightRadius: 6,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.1,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 1001,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colorScheme === 'dark' ? Colors.dark?.background300 || '#374151' : Colors.background200 || '#E5E5E5',
    },
    lastOptionItem: {
        borderBottomWidth: 0,
    },
    selectedOptionItem: {
        backgroundColor: colorScheme === 'dark' ? Colors.dark?.background200 || '#1F2937' : Colors.primary50 || '#F0F9FF',
    },
    optionText: {
        fontSize: 16,
        flex: 1,
    },
    selectedOptionText: {
        color: colorScheme === 'dark' ? Colors.dark?.info600 || Colors.primary500 : Colors.primary500,
        fontWeight: '600',
    },
});

export default Dropdown;