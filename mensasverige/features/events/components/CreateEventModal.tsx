import React from 'react';
import {
    Modal,
    View,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    useColorScheme,
} from 'react-native';
import { Event } from '../../../api_schema/types';
import { ThemedText } from '@/components/ThemedText';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import CreateEventCard from './CreateEventCard';

interface CreateEventModalProps {
    visible: boolean;
    onClose: () => void;
    onEventCreated: (event: Event) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
    visible,
    onClose,
    onEventCreated,
}) => {
    const colorScheme = useColorScheme();
    const styles = createStyles(colorScheme ?? 'light');

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.createEventModal}>
                <View style={styles.createEventModalContent}>
                    <View style={styles.createEventHeader}>
                        <ThemedText type="subtitle">Bjud in till aktivitet</ThemedText>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <MaterialIcons 
                                name="close" 
                                size={24} 
                                color={colorScheme === 'dark' ? Colors.blue500 : Colors.blueGray600} 
                            />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.createEventScrollContainer}>
                        <CreateEventCard
                            onEventCreated={onEventCreated}
                            onCancel={onClose}
                            hideButtons={false}
                        />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const createStyles = (colorScheme: string) => StyleSheet.create({
    createEventModal: {
        flex: 1,
        backgroundColor: colorScheme === 'dark' ? Colors.coolGray900 : '#F9FAFB',
    },
    createEventModalContent: {
        flex: 1,
        backgroundColor: colorScheme === 'dark' ? Colors.coolGray800 : '#FFFFFF',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    createEventHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colorScheme === 'dark' ? Colors.coolGray700 : Colors.coolGray200,
    },
    closeButton: {
        padding: 8,
    },
    createEventScrollContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 16,
    },
});

export default CreateEventModal;