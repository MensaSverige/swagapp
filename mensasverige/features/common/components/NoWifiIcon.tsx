import React from 'react-native';
import {ICustomTheme, ZStack, useTheme} from 'native-base';
import {faWifi, faSlash} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';

export const NoWifiIcon = () => {
  const theme = useTheme() as ICustomTheme;
  return (
    <ZStack style={styles.noWifiIcon}>
      <FontAwesomeIcon
        icon={faWifi}
        size={20}
        color={theme.colors.accent[500]}
        style={styles.noWifiIconElement}
      />
      <FontAwesomeIcon
        icon={faSlash}
        size={20}
        color={theme.colors.error[500]}
        style={styles.noWifiIconElement}
      />
    </ZStack>
  );
};
const styles = React.StyleSheet.create({
  noWifiIcon: {
    position: 'relative',
    width: 22,
    height: 22,
  },
  noWifiIconElement: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    alignSelf: 'center',
  },
});
