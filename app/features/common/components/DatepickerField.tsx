import React, { useState } from 'react';
import DatePicker from 'react-native-date-picker';
import { Dimensions } from 'react-native';
import { Heading, FormControl, FormControlLabel, Text, Pressable } from '../../../gluestack-components';
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
      <FormControl paddingVertical={5}>
        <FormControlLabel flex={1} justifyContent="space-between" alignItems='center'>
          <Heading size="sm">{label}</Heading>
          <Pressable
            p="$1"
            onPress={() => setOpenDateModal(true)}>
            <Text>{formatDateAndTime(date || '')}</Text>
          </Pressable>
        </FormControlLabel>
        <DatePicker
          modal
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
      </FormControl>
    </>
  );
};

const createStyles = () => ({
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
