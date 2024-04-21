import React, { useEffect } from 'react';
import { Marker } from 'react-native-maps';
import UserWithLocation from '../../types/userWithLocation';
import UserAvatar from '../UserAvatar';

const UserMarker: React.FC<{
  user: UserWithLocation;
  zIndex: number;
  highlighted: boolean;
  onPress: () => void;
}> = ({ user, zIndex, highlighted, onPress }) => {
  useEffect(() => {
    console.log('UserMarker re-rendered');
  });

  const markerSize = highlighted ? 'xl' : 'lg';
  return (
    <Marker
      tracksViewChanges={false}
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
      />
    </Marker>
  );
};

export default React.memo(UserMarker, (prevProps, nextProps) => {
  // Only re-render if the highlighted prop has changed
  return prevProps.highlighted === nextProps.highlighted;
});
