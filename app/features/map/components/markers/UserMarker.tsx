import React from 'react';
import { Marker } from 'react-native-maps';
import UserWithLocation from '../../types/userWithLocation';
import UserAvatar from '../UserAvatar';

const UserMarker: React.FC<{
  user: UserWithLocation;
  imageLoaded: boolean;
  zIndex: number;
  highlighted: boolean;
  onPress: () => void;
}> = ({ user, imageLoaded, zIndex, highlighted, onPress }) => {
  //const markerSize = highlighted ? 'xl' : 'lg';
  const markerSize = 'lg';
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
        key={imageLoaded  ? user.avatar_url : 'loading'}
        firstName={user.firstName}
        lastName={user.lastName}
        avatar_url={user.avatar_url}
        avatarSize={markerSize}
        onlineStatus={user.onlineStatus}
      />
    </Marker>
  );
};

export default React.memo(UserMarker, (prevProps, nextProps) => {
  // Only re-render if the highlighted prop, avatar_url or onlineStatus has changed
  return prevProps.highlighted === nextProps.highlighted &&
    JSON.stringify(prevProps.user.avatar_url) === JSON.stringify(nextProps.user.avatar_url) &&
    prevProps.user.onlineStatus === nextProps.user.onlineStatus &&
    prevProps.imageLoaded === nextProps.imageLoaded;
});