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
      const currentDate = date ?? new Date();

      DateTimePickerAndroid.open({
        value: currentDate,
        onChange: (event: DateTimePickerEvent, selectedDate: Date | undefined) => {
          switch (event.type) {
            case "set":
              if (selectedDate !== undefined) {
                if (mode === "date") {
                  // When changing date, preserve the existing time
                  const newDate = new Date(selectedDate);
                  if (date) {
                    newDate.setHours(currentDate.getHours());
                    newDate.setMinutes(currentDate.getMinutes());
                    newDate.setSeconds(currentDate.getSeconds());
                    newDate.setMilliseconds(currentDate.getMilliseconds());
                  }
                  onDateChange(newDate);
                } else if (mode === "time") {
                  // When changing time, preserve the existing date
                  const newDate = new Date(currentDate);
                  newDate.setHours(selectedDate.getHours());
                  newDate.setMinutes(selectedDate.getMinutes());
                  newDate.setSeconds(selectedDate.getSeconds());
                  newDate.setMilliseconds(selectedDate.getMilliseconds());
                  onDateChange(newDate);
                }
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
      <View>
        {Platform.OS === "ios" ? (
          date ? (
            <View style={styles.formControlLabel}>
              <Text style={styles.heading}>{label}</Text>
              <DateTimePicker
                testID="dateTimePicker"
                value={date}
                mode="datetime"
                themeVariant={colorTheme === 'dark' ? 'dark' : 'light'}
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
            </View>
          ) : (
            <TouchableOpacity
              style={styles.formControlLabel}
              onPress={() => onDateChange(new Date())}
            >
              <Text style={styles.heading}>{label}</Text>
              <ThemedText style={[styles.pressableText, styles.placeholderText]}>
                {placeholder || "Välj datum och tid"}
              </ThemedText>
            </TouchableOpacity>
          )
        ) : (
          date ? (
            <View style={styles.formControlLabel}>
              <Text style={styles.heading}>{label}</Text>
              <View style={styles.datepickerField}>
                <TouchableOpacity
                  key={"datepicker-" + label?.toString()}
                  onPress={() => showAndroidPicker("date")}
                >
                  <ThemedText style={styles.pressableText}>
                    {formatDate(date)}
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  key={"timepicker-" + label?.toString()}
                  onPress={() => showAndroidPicker("time")}
                >
                  <ThemedText style={styles.pressableText}>
                    {formatTime(date)}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.formControlLabel}
              onPress={() => showAndroidPicker("date")}
            >
              <Text style={styles.heading}>{label}</Text>
              <ThemedText style={[styles.pressableText, styles.placeholderText]}>
                {placeholder || "Välj datum"}
              </ThemedText>
            </TouchableOpacity>
          )
        )}
      </View>
    </>
  );
};

const createStyles = (colorScheme: string = 'light') => {
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  return StyleSheet.create({
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
    pressableText: {
      color: colors.text,
      fontSize: 14,
      padding: 12,
    },
    placeholderText: {
      color: colorScheme === 'dark' ? '#6b7280' : '#9ca3af',
      fontStyle: 'italic',
    },
    datepickerField: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 8,
    },
    datepicker: {
      width: Dimensions.get('window').width,
    },
  });
};