import React from 'react';
import { Dimensions, View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import RNDateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { formatDateAndTime } from '../functions/FormatDateAndTime';
import { Colors } from '@/constants/Colors';

interface DateFieldProps {
  label: React.ReactNode;
  date?: Date;
  minimumDate?: Date;
  optional?: boolean;
  placeholder?: string;
  onDateChange: (date?: Date) => void;
}

export const DatepickerField: React.FC<DateFieldProps> = ({
  label,
  date,
  minimumDate,
  placeholder,
  onDateChange,
}) => {
  const colorScheme = useColorScheme();
  const styles = createStyles(colorScheme ?? 'light');

  return (
    <>
      <View style={styles.formControl}>
        <View style={styles.formControlLabel}>
          <Text style={styles.heading}>{label}</Text>
          <TouchableOpacity
            style={styles.pressable}
            key={label?.toString()}
            >
            <Text style={styles.pressableText}>{date ? formatDateAndTime(date) : (placeholder || formatDateAndTime(''))}</Text>
          </TouchableOpacity>
        </View>
        <RNDateTimePicker
          key={label?.toString()}
          minimumDate={minimumDate}
          onChange={(event: DateTimePickerEvent, date: Date|undefined) => {
            switch (event.type) {
              case 'set':
                if (date !== undefined) {
                  onDateChange(date);
                }
                break;
            }
          }}
          style={[styles.datepicker]}
          value={date ?? new Date()}
          mode="datetime"
          locale="sv"
          timeZoneName='Europe/Stockholm'
          
        />
      </View>
    </>
  );
};

const createStyles = (colorScheme: string) =>
  StyleSheet.create({
    formControl: {
      paddingVertical: 5,
    },
    formControlLabel: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    heading: {
      fontSize: 16,
      fontWeight: '600',
      color: colorScheme === 'dark' ? Colors.dark.text900 : Colors.light.text900,
    },
    pressable: {
      padding: 4,
    },
    pressableText: {
      color: colorScheme === 'dark' ? Colors.dark.text700 : Colors.light.text700,
      fontSize: 14,
    },
    datepickerField: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    datepicker: {
      width: Dimensions.get('window').width,
    },
  });
