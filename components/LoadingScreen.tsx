import { Center, Spinner } from 'native-base';
import React from 'react';

export const LoadingScreen: React.FC = () => (
  <Center w="100%" h="100%">
    <Spinner size="lg" />
  </Center>
);
