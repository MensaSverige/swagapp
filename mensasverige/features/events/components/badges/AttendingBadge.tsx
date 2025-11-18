import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AttendingBadgeProps {
    text?: string;
}

const AttendingBadge: React.FC<AttendingBadgeProps> = ({ text = 'Anmäld' }) => {
    return (
        <View style={styles.attendingBadge}>

            <Text style={styles.attendingBadgeText}>{text}</Text>
            <MaterialIcons name="done" size={14} color="#10B981" />

        </View>
    );
};

const styles = StyleSheet.create({
    attendingBadge: {
        borderColor: '#10B981',
        borderWidth: 1,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 12,
        height: 24,
        gap: 4,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    attendingBadgeText: {
        color: '#10B981',
        fontSize: 12,
        fontWeight: '500',
    },
});

export default AttendingBadge;