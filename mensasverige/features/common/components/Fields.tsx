import React from 'react';
import {StyleProp, ViewStyle, View, Text, StyleSheet} from 'react-native';

const Fields: React.FC<{
  heading?: React.ReactNode;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}> = ({heading, children, style}) => (
  <View style={[styles.container, style]}>
    {heading && <Text style={styles.heading}>{heading}</Text>}
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    gap: 16, // equivalent to space={4} in native-base (4 * 4px = 16px)
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 24,
  },
});

export default Fields;
