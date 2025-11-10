import React, { useState } from 'react';
import DatePicker from 'react-native-date-picker';
import { Dimensions, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { formatDateAndTime } from '../functions/FormatDateAndTime';

interface DateFieldProps {
  label: React.ReactNode;
  date?: Date;
  minimumDate?: Date;
  optional?: boolean;
  onDateChange: (date?: Date) => void;
}

export const DatepickerField: React.FC<DateFieldProps> = ({
  label,
  date,
  minimumDate,
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
            <Text>{formatDateAndTime(date || '')}</Text>
          </TouchableOpacity>
        </View>
        <DatePicker
          modal
          key={label?.toString()}
          title={label?.toString()}
          minimumDate={minimumDate}
          open={openDateModal}
          theme="dark"
          onConfirm={(confirmDate: Date) => {
            onDateChange(confirmDate);
            setOpenDateModal(false);
          }}
          onCancel={() => {
            setOpenDateModal(false);
          }}
          style={[styles.datepicker]}
          date={date ?? new Date()}
          mode="datetime"
          locale="sv"
          is24hourSource="locale"
          confirmText="Välj"
          cancelText="Avbryt"
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
