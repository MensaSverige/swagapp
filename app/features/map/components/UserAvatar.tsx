import React from 'react';
import { Avatar, AvatarFallbackText, AvatarImage } from '../../../gluestack-components';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { gluestackUIConfig } from '../../../gluestack-components/gluestack-ui.config';
import { getFullUrl } from '../../common/functions/GetFullUrl';
import { OnlineStatus } from '../types/userWithLocation';

type UserAvatarProps = {
    firstName: string | null | undefined;
    lastName: string | null | undefined;
    avatar_url: string | null | undefined;
    avatarSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    onlineStatus?: OnlineStatus;
};

export const getOnlineStatusColor = (status: OnlineStatus) => {
    switch (status) {
      case 'online':
        return gluestackUIConfig.tokens.colors.secondary400;
      case 'away':
        return gluestackUIConfig.tokens.colors.amber300;
      default:
        return gluestackUIConfig.tokens.colors.coolGray600;
    }
  };
  

const UserAvatar: React.FC<UserAvatarProps> = ({ firstName, lastName, avatar_url, avatarSize, onlineStatus }) => {
    const onlineStatusColor = onlineStatus ? getOnlineStatusColor(onlineStatus) : gluestackUIConfig.tokens.colors.coolGray600;
    return (
        <Avatar
            size={avatarSize || "lg"}
            bg='$background50'
            borderColor={onlineStatusColor}
            borderWidth={2}
            style={{ justifyContent: 'center', alignItems: 'center' }}
        >
            <AvatarFallbackText>{firstName} {lastName}</AvatarFallbackText>
            {(avatar_url) ? (
                <AvatarImage
                    source={{ uri: getFullUrl(avatar_url) }}
                />
            ) : (
                <FontAwesomeIcon icon={faUser} size={30} color={onlineStatusColor} style={{ position: 'absolute', alignSelf: 'center' }} />
            )}
        </Avatar>
    );
};

export default React.memo(UserAvatar, (prevProps, nextProps) => {
  // Only re-render if the avatar_url or onlineStatus has changed
  return prevProps.avatar_url === nextProps.avatar_url &&
    prevProps.onlineStatus === nextProps.onlineStatus;
});