import React from 'react';
import useStore from '../../common/store/store';
import { TouchableOpacity, View, Alert } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';

const NonMemberInfo: React.FC = () => {
    const { user } = useStore();

    if (!user || user.settings.show_location !== 'NO_ONE') {
        return null;
    }

    const showInfoAlert = () => {
        Alert.alert(
            'Begränsad funktionalitet',
            'Som internationell medlem eller medföljande har du i dagsläget begränsad funktionalitet på grund av sekretess kring sociala funktioner.\n\nVi arbetar med förändringar för att låta internationella medlemmar och medföljande deltaga i fler av appens funktioner.',
            [
                {
                    text: 'Stäng',
                    style: 'default',
                }
            ]
        );
    };

    return (
        <>
            <TouchableOpacity onPress={showInfoAlert}>
                <View
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 48,
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'row',
                        gap: 8,
                        backgroundColor: 'rgba(61, 61, 61, 0.1)',
                    }}>
                    <Ionicons 
                        name="information-circle-outline" 
                        size={20} 
                        color="#60a5fa" 
                    />
                    <ThemedText type='link'>
                        Begränsad funktionalitet
                    </ThemedText>
                </View>
            </TouchableOpacity>
        </>
    );
};

export default NonMemberInfo;
