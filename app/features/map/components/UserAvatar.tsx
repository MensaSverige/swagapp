import React from 'react';
import { Avatar, AvatarFallbackText, AvatarImage } from '../../../gluestack-components';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { gluestackUIConfig } from '../../../gluestack-components/gluestack-ui.config';

type UserAvatarProps = {
    firstName: string | null | undefined;
    lastName: string | null | undefined;
    avatar_url: string | null | undefined;
    avatarSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
};

const UserAvatar: React.FC<UserAvatarProps> = ({ firstName, lastName, avatar_url, avatarSize }) => {
    return (
        <Avatar
            size={avatarSize || "lg"}
            bgColor={gluestackUIConfig.tokens.colors.backgroundDarkMuted}
            borderColor={gluestackUIConfig.tokens.colors.amber100}
            borderWidth={2}
            style={{ justifyContent: 'center', alignItems: 'center' }}
        >
            <AvatarFallbackText>{firstName} {lastName}</AvatarFallbackText>
            {(avatar_url) ? (
                <AvatarImage
                    source={{ uri: avatar_url }}
                />
            ) : (
                <FontAwesomeIcon icon={faUser} size={30} color={gluestackUIConfig.tokens.colors.amber100} style={{ position: 'absolute', alignSelf: 'center' }} />
            )}
        </Avatar>
    );
};

export default UserAvatar;