import React, {useState} from 'react';
import DatePicker from 'react-native-date-picker';
import {Dimensions, TouchableOpacity} from 'react-native';
import {Box, Column, Text} from 'native-base';
import {FormControl, ICustomTheme, useTheme, Heading} from 'native-base';
import {formatDateAndTime} from '../functions/FormatDateAndTime';
import {SmallDeleteButton} from './SmallDeleteButton';

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
  optional = false,
  onDateChange,
}) => {
  const [openDateModal, setOpenDateModal] = useState(false);
  const theme = useTheme() as ICustomTheme;
  const styles = createStyles(theme);

  return (
    <>
      <FormControl>
        <FormControl.Label style={[styles.datepickerField]}>
          <Heading size="sm">{label}</Heading>
          <Column justifyContent={'right'}>
            <TouchableOpacity onPress={() => setOpenDateModal(true)}>
              <Text>{formatDateAndTime(date || '')}</Text>
            </TouchableOpacity>
            {optional && date && (
              <Box alignItems={'flex-end'}>
                <SmallDeleteButton onPress={() => onDateChange(undefined)} />
              </Box>
            )}
          </Column>
        </FormControl.Label>
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

const createStyles = (_theme: ICustomTheme) => ({
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
