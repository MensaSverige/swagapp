import React from "react";
import {
  Dimensions,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Platform,
} from "react-native";
import { formatDate, formatTime } from "../functions/FormatDateAndTime";
import { Colors } from "@/constants/Colors";
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { ThemedText } from "@/components/ThemedText";

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
  const colorTheme = useColorScheme();
  const styles = createStyles(colorTheme ?? "light"); 

  const showAndroidPicker = (mode: "date" | "time") => {
    if (Platform.OS === "android") {
      console.log(`Opening Android ${mode} picker`);
      DateTimePickerAndroid.open({
        value: date ?? new Date(),
        onChange: (event: DateTimePickerEvent, date: Date | undefined) => {
          switch (event.type) {
            case "set":
              if (date !== undefined) {
                onDateChange(date);
              }
              break;
          }
        },
        mode: mode,
        is24Hour: true,
        minimumDate: minimumDate,
        timeZoneName: "Europe/Stockholm",
        display: mode === "date" ? "calendar" : "spinner",
      });
    }
  };

  return (
    <>
      <View style={styles.formControl}>
        <View style={styles.formControlLabel}>
          <Text style={styles.heading}>{label}</Text>
          {Platform.OS === "ios" ? (
            <DateTimePicker
              testID="dateTimePicker"
              value={date || new Date()}
              mode="datetime"
              themeVariant={ colorTheme === 'dark' ? 'dark' : 'light' }
              is24Hour={false}
              onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                switch (event.type) {
                  case "set":
                    if (selectedDate !== undefined) {
                      onDateChange(selectedDate);
                    }
                    break;
                }
              }}
              minimumDate={minimumDate}
            />
          ) : (
            <View style={styles.datepickerField}>
              <TouchableOpacity
                key={"datepicker-" + label?.toString()}
                style={styles.pressable}
                onPress={() => showAndroidPicker("date")}
              >
                <ThemedText>{date ? formatDate(date) : placeholder}</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pressable}
                key={"timepicker-" + label?.toString()}
                onPress={() => showAndroidPicker("time")}
              >
                <ThemedText>{date ? formatTime(date) : placeholder}</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </>
  );
};

const createStyles = (colorScheme: string = 'light') => {
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  return StyleSheet.create({
    formControl: {
      backgroundColor: colors.backgroundAlt,
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
      color: colors.text,
    },
    pressable: {
      padding: 4,
    },
    pressableText: {
      color: colors.text,
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
};