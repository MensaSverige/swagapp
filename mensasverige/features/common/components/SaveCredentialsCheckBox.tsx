import Checkbox from "expo-checkbox";
import { Pressable, Text, useColorScheme } from "react-native";
import { StyleSheet } from "react-native";

export const SaveCredentialsCheckBox = ({
    value,
    onValueChange,
}: {
    value: boolean;
    onValueChange: (v: boolean) => void;
}) => {
    const isDark = useColorScheme() === "dark";
    return (
        <Pressable
            onPress={() => onValueChange(!value)}
            style={styles.checkboxRow}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: value }}
        >
            <Checkbox
                value={value}
                onValueChange={onValueChange}
                color={value ? "#2563EB" : undefined}
                style={styles.checkbox}
            />
            <Text style={[styles.checkboxLabel, { color: isDark ? "#ddd" : "#333" }]}>
                Spara inloggning
            </Text>
        </Pressable>
    );
};
const styles = StyleSheet.create({
    checkboxRow: { flexDirection: "row", alignItems: "center", height: 48 },
    checkbox: { width: 20, height: 20, marginRight: 10, borderRadius: 4 },
    checkboxLabel: { fontSize: 16 }
});
