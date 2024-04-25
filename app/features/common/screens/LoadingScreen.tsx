import { Center, Spinner } from '../../../gluestack-components';
import React from 'react';

export const LoadingScreen: React.FC = () => (
  <Center w="100%">
    <Spinner color="$secondary300" />
  </Center>
);
