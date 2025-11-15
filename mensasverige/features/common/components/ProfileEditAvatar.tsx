import React, { useState } from 'react';
import { View, Pressable, useColorScheme } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { selectImage } from './selectImage';
import useStore from '../store/store';
import { Colors } from '../../../constants/Colors';
import { getFullUrl } from '../functions/GetFullUrl';

type ProfileEditAvatarProps = {
    colorMode: string;
    onError: (error: string) => void;
    onSaved: () => void;
    onSaving: () => void;
  };

const ProfileEditAvatar: React.FC<ProfileEditAvatarProps> = ({colorMode, onError, onSaved, onSaving }) => {
    const { user, setUser } = useStore();
    const [imageKey, setImageKey] = useState<number>(Date.now());
    const systemColorScheme = useColorScheme();
    const currentColorMode = colorMode || systemColorScheme || 'light';
    
    if (!user) {
        return null;
    }

    const handlePress = () => {
        onSaving();
        selectImage().then((response) => {
            if (!response) {
                return;
            }
            if (response?.avatar_url) {
                setUser({ ...user, avatar_url: response.avatar_url });
                setImageKey(Date.now()); // Update the image key
                console.log('saved');
                onSaved();
            }
            else {
                onError('Could not save image');
            }    
        })
        .catch((error) => {
            onError(error.message || error);
        })
    };

    return (
        <View style={{
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: 40
        }}>
            {user.avatar_url ? (
                <Image
                    source={{ uri: `${getFullUrl(user.avatar_url)}?${imageKey}` }} // Append image key as a query parameter to reload the image
                    style={{ 
                        width: 160, 
                        height: 160, 
                        borderRadius: 80
                    }}
                />
            ) : (
                <View style={{
                    backgroundColor: currentColorMode === 'light' ? Colors.light.primary700 : Colors.dark.info900,
                    borderColor: currentColorMode === 'light' ? Colors.light.primary500 : Colors.dark.info600,
                    borderRadius: 80,
                    width: 160,
                    height: 160,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <MaterialIcons
                        name="person"
                        size={100}
                        color={currentColorMode === 'light' ? Colors.light.primary200 : Colors.dark.info500}
                    />
                </View>
            )}
            <Pressable style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                backgroundColor: currentColorMode === 'light' ? Colors.light.blueGray200 : Colors.dark.blueGray100,
                borderRadius: 25,
                width: 50,
                height: 50,
                justifyContent: 'center',
                alignItems: 'center'
            }}
                onPress={handlePress}
            >
                <MaterialIcons
                    name="add"
                    size={16}
                    color={currentColorMode === 'light' ? Colors.light.primary800 : Colors.dark.info800}
                />
            </Pressable>
        </View>
    );
};

export default ProfileEditAvatar;