import { faEdit } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { ICustomTheme, useTheme } from "native-base";
import { TouchableOpacity } from "react-native";

export const EditButton: React.FC<{
    onPress: () => void;
  }> = ({onPress}) => {
    const theme = useTheme() as ICustomTheme;
    const styles = createStyles(theme);
  
    return (
      <TouchableOpacity onPress={onPress}>
        <FontAwesomeIcon icon={faEdit} style={styles.editButton} />
      </TouchableOpacity>
    );
  };

const createStyles = (theme: ICustomTheme) => ({
    editButton: {
      color: theme.colors.accent[500],
    },
  });
  