import React from 'react';
import { Center, Image, Pressable, View, useToast } from '../../../gluestack-components';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUser, faPlus } from '@fortawesome/free-solid-svg-icons';
import { selectImage } from './selectImage';
import useStore from '../store/store';
import { gluestackUIConfig } from '../../../gluestack-components/gluestack-ui.config';

type ProfileEditAvatarProps = {
    onError: (error: string) => void;
    onSaved: () => void;
    onSaving: () => void;
  };

const ProfileEditAvatar: React.FC<ProfileEditAvatarProps> = ({onError, onSaved, onSaving }) => {
    const { user, setUser } = useStore();;
    if (!user) {
        return null;
    }

    const handlePress = () => {
        onSaving();
        selectImage().then((response) => {
            if (response.assets) {
                setUser({ ...user, avatar_url: response.assets[0].uri });
            }
        })
        .catch((error) => {
            onError(error.message || error);
        })
        .finally(() => {
            console.log('saved');
            onSaved();
        });
    };
    return (
        <Center pt={10}>
            {user.avatar_url ? (
                <Image
                    source={{ uri: user.avatar_url }}
                    alt="Profile image"
                    size="md"
                    style={{ width: 160, height: 160, borderRadius: 80 }}
                />
            ) : (
                <View style={{
                    backgroundColor: gluestackUIConfig.tokens.colors.blue700,
                    borderRadius: 80,
                    width: 160,
                    height: 160,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <FontAwesomeIcon
                        icon={faUser}
                        size={100}
                        color="white"
                    />
                </View>
            )}
            <Pressable style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                backgroundColor: 'white',
                borderRadius: 20,
                width: 40,
                height: 40,
                justifyContent: 'center',
                alignItems: 'center'
            }}
                onPress={handlePress}
            >
                <FontAwesomeIcon
                    icon={faPlus}
                    size={15}
                    color={gluestackUIConfig.tokens.colors.blue700}
                />
            </Pressable>
        </Center>
    );
};

export default ProfileEditAvatar;