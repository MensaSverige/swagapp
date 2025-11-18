import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FullyBookedBadgeProps {
    text?: string;
}

const FullyBookedBadge: React.FC<FullyBookedBadgeProps> = ({ text = 'Fullbokad' }) => {
    return (
        <View style={styles.fullyBookedBadge}>
            <Text style={styles.fullyBookedBadgeText}>{text}</Text>
            <MaterialIcons name="event-busy" size={14} color="#EF4444" />
        </View>
    );
};

const styles = StyleSheet.create({
    fullyBookedBadge: {
        borderColor: '#EF4444',
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
    fullyBookedBadgeText: {
        color: '#EF4444',
        fontSize: 12,
        fontWeight: '500',
    },
});

export default FullyBookedBadge;