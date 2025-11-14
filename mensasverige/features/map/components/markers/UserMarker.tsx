import React from 'react';
import { Marker, MarkerPressEvent } from 'react-native-maps';
import UserWithLocation from '../../types/userWithLocation';
import UserAvatar from '../UserAvatar';

const UserMarker: React.FC<{
  user: UserWithLocation;
  zIndex: number;
  highlighted: boolean;
  onPress: (event: MarkerPressEvent) => void;
}> = ({ user, zIndex, highlighted, onPress }) => {
  const markerSize = 'lg';
  return (
    <Marker
      tracksViewChanges={true}
      coordinate={{
        latitude: user.location.latitude,
        longitude: user.location.longitude,
      }}
      anchor={{ x: 0.5, y: 0.5 }}
      zIndex={zIndex}
      onPress={onPress}>
      <UserAvatar
        firstName={user.firstName}
        lastName={user.lastName}
        avatar_url={user.avatar_url}
        avatarSize={markerSize}
        onlineStatus={user.onlineStatus}
      />
    </Marker>
  );
};

export default UserMarker;