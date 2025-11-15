import React, { useState } from 'react';
import RNDateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Dimensions, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { formatDateAndTime } from '../functions/FormatDateAndTime';

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
  const [openDateModal, setOpenDateModal] = useState(false);
  const styles = createStyles();

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
            <Text>{date ? formatDateAndTime(date) : (placeholder || formatDateAndTime(''))}</Text>
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
              case 'dismissed':
                setOpenDateModal(false);
                return;
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

const createStyles = () =>
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
    },
    pressable: {
      padding: 4,
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
