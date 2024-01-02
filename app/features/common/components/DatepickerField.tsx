import React, {useState} from 'react';
import DatePicker from 'react-native-date-picker';
import {Dimensions, TouchableOpacity} from 'react-native';
import {Text} from 'react-native';
import {FormControl, ICustomTheme, useTheme, Heading} from 'native-base';
import {formatDate} from '../functions/FormatDate';

interface DateFieldProps {
  label: React.ReactNode;
  date: string | undefined;
  onDateChange: (date: Date) => void;
}

export const DatepickerField: React.FC<DateFieldProps> = ({
  label,
  date,
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
          <TouchableOpacity onPress={() => setOpenDateModal(true)}>
            <Text>{formatDate(date || '')}</Text>
          </TouchableOpacity>
        </FormControl.Label>

        <DatePicker
          modal
          title={label?.toString()}
          open={openDateModal}
          theme="dark"
          onConfirm={date => {
            onDateChange(date);
            setOpenDateModal(false);
          }}
          onCancel={() => {
            setOpenDateModal(false);
          }}
          style={[styles.datepicker]}
          date={new Date(date || Date.now())}
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

const createStyles = (theme: ICustomTheme) => ({
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
