import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { DisplayTime } from '../utilities/DisplayTime';
import { displayLocaleTimeStringDate } from '../utils/eventUtils';
import { EditButton } from '../../common/components/EditButton';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';

const createStyles = (colorScheme: string) => {
  return StyleSheet.create({
    dateText: {
      fontSize: 14,
      fontWeight: 'normal',
      lineHeight: 18,
      marginBottom: 0,
      color: colorScheme === 'dark' ? Colors.dark.text700 : Colors.light.coolGray700,
    },
    timeText: {
      fontSize: 14,
      color: colorScheme === 'dark' ? Colors.dark.teal400 : Colors.light.teal700,
      marginBottom: 12,
      paddingTop: 2,
    },
    editableContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    dateTimeContent: {
      flex: 1,
    },
  });
};

interface EventDateTimeDisplayProps {
  start: string;
  end?: string | null;
  isEditable?: boolean;
  onEdit?: () => void;
}

const EventDateTimeDisplay: React.FC<EventDateTimeDisplayProps> = ({
  start,
  end,
  isEditable = false,
  onEdit,
}) => {
  const colorScheme = useColorScheme();
  const styles = createStyles(colorScheme ?? 'light');

  const content = (
    <View style={styles.dateTimeContent}>
      <ThemedText style={styles.dateText}>
        {displayLocaleTimeStringDate(start)}
      </ThemedText>
      <ThemedText style={styles.timeText}>
        {DisplayTime(start)} - {DisplayTime(end || start)}
      </ThemedText>
    </View>
  );

  if (isEditable && onEdit) {
    return (
      <TouchableOpacity onPress={onEdit} style={styles.editableContainer}>
        {content}
        <EditButton onPress={onEdit} />
      </TouchableOpacity>
    );
  }

  return content;
};

export default EventDateTimeDisplay;