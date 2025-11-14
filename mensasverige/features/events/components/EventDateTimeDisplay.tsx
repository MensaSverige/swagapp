import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DisplayTime } from '../utilities/DisplayTime';
import { displayLocaleTimeStringDate } from '../utils/eventUtils';
import { EditButton } from '../../common/components/EditButton';

const styles = StyleSheet.create({
  dateText: {
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 18,
    marginBottom: 0,
    color: '#374151',
  },
  timeText: {
    fontSize: 14,
    color: '#0F766E',
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
  const content = (
    <View style={styles.dateTimeContent}>
      <Text style={styles.dateText}>
        {displayLocaleTimeStringDate(start)}
      </Text>
      <Text style={styles.timeText}>
        {DisplayTime(start)} - {DisplayTime(end || start)}
      </Text>
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