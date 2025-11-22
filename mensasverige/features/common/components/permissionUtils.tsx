import * as ImagePicker from 'expo-image-picker';

export interface PermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}

export const checkMediaLibraryPermission = async (): Promise<PermissionStatus> => {
  try {
    const permission = await ImagePicker.getMediaLibraryPermissionsAsync();
    return {
      granted: permission.granted,
      canAskAgain: permission.canAskAgain,
      status: permission.status
    };
  } catch (error) {
    console.error('Error checking media library permission:', error);
    return {
      granted: false,
      canAskAgain: true,
      status: 'undetermined'
    };
  }
};

export const requestMediaLibraryPermissionWithFeedback = async (): Promise<{
  granted: boolean;
  message?: string;
}> => {
  try {
    // First check current status
    const currentPermission = await checkMediaLibraryPermission();
    
    if (currentPermission.granted) {
      return { granted: true };
    }

    if (!currentPermission.canAskAgain) {
      return {
        granted: false,
        message: 'Du har tidigare nekat tillgång till fotobiblioteket. Gå till Inställningar > Mensa Sverige > Foton för att ändra detta.'
      };
    }

    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted) {
      return { granted: true };
    } else {
      return {
        granted: false,
        message: 'Tillgång till fotobiblioteket krävs för att välja en profilbild.'
      };
    }
  } catch (error) {
    console.error('Error requesting media library permission:', error);
    return {
      granted: false,
      message: 'Ett fel inträffade vid begäran om behörigheter.'
    };
  }
};