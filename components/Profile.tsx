import React from 'react';
import {Box, Center, Heading} from 'native-base';

const Profile: React.FC = () => {
  return (
    <Center w="100%" h="100%">
      <Box safeArea flex={1} p={10} w="100%" mx="auto">
        <Heading size="lg">Din Profil</Heading>
      </Box>
    </Center>
  );
};

export default Profile;
