import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Event } from '../../../api_schema/types';
import { Colors } from '@/constants/Colors';
import { formatRegion, formatRowDateColumn } from '../utils/mainEventUtils';
import { PAGE_PADDING, typeScale } from '../styles/typeScale';

interface MainEventListItemProps {
  event: Event;
  onPress: (event: Event) => void;
}

/** Start-page row: looks like EventListItem, with a chevron and a meta line. */
const MainEventListItem: React.FC<MainEventListItemProps> = ({ event, onPress }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const styles = useMemo(() => createStyles(colorScheme), [colorScheme]);
  const date = formatRowDateColumn(event);
  const meta = [formatRegion(event), event.locationDescription, event.attending ? 'Du är anmäld' : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <TouchableOpacity onPress={() => onPress(event)} accessibilityRole="button">
      <View style={[styles.item, event.attending && styles.attending]}>
        <View style={styles.dateColumn}>
          <Text style={styles.startDate}>{date.start}</Text>
          {!!date.end && <Text style={styles.endDate}>{date.end}</Text>}
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{event.name}</Text>
          {!!meta && <Text style={styles.meta}>{meta}</Text>}
        </View>
        <MaterialIcons
          name="chevron-right"
          size={24}
          color={colorScheme === 'dark' ? Colors.coolGray400 : Colors.coolGray500}
        />
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (colorScheme: string) =>
  StyleSheet.create({
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginHorizontal: -PAGE_PADDING,
      paddingHorizontal: PAGE_PADDING,
      paddingVertical: 10,
    },
    attending: { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
    dateColumn: { minWidth: 48, alignSelf: 'flex-start' },
    startDate: {
      ...typeScale.time,
      color: colorScheme === 'dark' ? Colors.teal400 : '#0F766E',
    },
    endDate: {
      ...typeScale.time,
      color: colorScheme === 'dark' ? Colors.teal600 : '#115E59',
    },
    content: { flex: 1 },
    title: {
      ...typeScale.listTitle,
      color: colorScheme === 'dark' ? Colors.info500 : '#0369A1',
    },
    meta: {
      ...typeScale.meta,
      color: colorScheme === 'dark' ? Colors.coolGray400 : '#4B5563',
    },
  });

export default React.memo(MainEventListItem);
