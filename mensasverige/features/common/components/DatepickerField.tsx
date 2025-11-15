import React, { useState } from 'react';
import DatePicker from 'react-native-date-picker';
import { Dimensions, View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { formatDateAndTime } from '../functions/FormatDateAndTime';
import { Colors } from '@/constants/Colors';

interface DateFieldProps {
  label: React.ReactNode;
  date?: Date;
  minimumDate?: Date;
  optional?: boolean;
  mode?: 'date' | 'datetime' | 'time';
  placeholder?: string;
  onDateChange: (date?: Date) => void;
}

export const DatepickerField: React.FC<DateFieldProps> = ({
  label,
  date,
  minimumDate,
  mode = 'datetime',
  placeholder,
  onDateChange,
}) => {
  const [openDateModal, setOpenDateModal] = useState(false);
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
            onPress={() => setOpenDateModal(true)}
            >
            <Text style={styles.pressableText}>{date ? formatDateAndTime(date) : (placeholder || formatDateAndTime(''))}</Text>
          </TouchableOpacity>
        </View>
        <DatePicker
          modal
          key={label?.toString()}
          title={label?.toString()}
          minimumDate={minimumDate}
          open={openDateModal}
          theme={colorScheme === 'dark' ? 'dark' : 'light'}
          onConfirm={(confirmDate: Date) => {
            onDateChange(confirmDate);
            setOpenDateModal(false);
          }}
          onCancel={() => {
            setOpenDateModal(false);
          }}
          style={[styles.datepicker]}
          date={date ?? new Date()}
          mode={mode}
          locale="sv"
          is24hourSource="locale"
          confirmText="Välj"
          cancelText="Avbryt"
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
