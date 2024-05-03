import React, { useState } from 'react';
import { Center, Image, Pressable, View } from '../../../gluestack-components';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUser, faPlus } from '@fortawesome/free-solid-svg-icons';
import { selectImage } from './selectImage';
import useStore from '../store/store';
import { config } from '../../../gluestack-components/gluestack-ui.config';
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
        <Center pt={10}>
            {user.avatar_url ? (
                <Image
                    source={{ uri: `${getFullUrl(user.avatar_url)}?${imageKey}` }} // Append image key as a query parameter to reload the image
                    alt="Profile image"
                    size="md"
                    style={{ 
                        width: 160, 
                        height: 160, 
                        borderRadius: 80
                    }}
                />
            ) : (
                <View style={{
                    backgroundColor: colorMode === 'light' ? config.tokens.colors.primary700 : config.tokens.colors.info900,
                    //borderWidth: 4,
                    borderColor: colorMode === 'light' ? config.tokens.colors.primary500 : config.tokens.colors.info600,
                    borderRadius: 80,
                    width: 160,
                    height: 160,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                <FontAwesomeIcon
                    icon={faUser}
                    size={100}
                    color={colorMode === 'light' ? config.tokens.colors.primary200 : config.tokens.colors.info500}
                />
                </View>
            )}
            <Pressable style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                backgroundColor: colorMode === 'light' ? config.tokens.colors.blueGray200 : config.tokens.colors.blueGray100,
                borderRadius: 25,
                width: 50,
                height: 50,
                justifyContent: 'center',
                alignItems: 'center'
            }}
                onPress={handlePress}
            >
                <FontAwesomeIcon
                    icon={faPlus}
                    size={16}
                    color={colorMode === 'light' ? config.tokens.colors.primary800 : config.tokens.colors.info800}
                />
            </Pressable>
        </Center>
    );
};

export default ProfileEditAvatar;