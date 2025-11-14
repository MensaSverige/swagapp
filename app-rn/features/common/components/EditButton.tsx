import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { ICustomTheme, useTheme } from 'native-base';
import { Pressable } from '../../../gluestack-components';

export const EditButton: React.FC<{
  onPress: () => void;
}> = ({ onPress }) => {
  const theme = useTheme() as ICustomTheme;
  const styles = createStyles(theme);

  return (
    <Pressable
      p="$4"
      onPress={onPress}>
      <FontAwesomeIcon icon={faEdit} size={20} style={styles.editButton} />
    </Pressable>

  );
};

const createStyles = (theme: ICustomTheme) => ({
  editButton: {
    color: theme.colors.accent[500],
  },
});
