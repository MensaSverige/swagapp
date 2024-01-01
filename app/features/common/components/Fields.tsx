import {Heading, VStack} from 'native-base';
import React from 'react';
import {StyleProp, ViewStyle} from 'react-native';

const Fields: React.FC<{
  heading?: React.ReactNode;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}> = ({heading, children, style}) => (
  <VStack space={4} style={style}>
    {heading && <Heading size="lg">{heading}</Heading>}
    {children}
  </VStack>
);

export default Fields;
