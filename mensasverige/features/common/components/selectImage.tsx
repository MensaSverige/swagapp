import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { uploadAvatar } from '../../account/services/userService';
import { User } from '../../../api_schema/types';
import { requestMediaLibraryPermissionWithFeedback } from './permissionUtils';

const MAX_AVATAR_DIMENSION = 1024;

const options: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 1,
  aspect: [1, 1],
  allowsEditing: true,
};

const capLongEdge = async (
  uri: string,
  width: number,
  height: number,
): Promise<string> => {
  if (width <= MAX_AVATAR_DIMENSION && height <= MAX_AVATAR_DIMENSION) {
    return uri;
  }
  const resize =
    width >= height
      ? { width: MAX_AVATAR_DIMENSION }
      : { height: MAX_AVATAR_DIMENSION };
  const result = await manipulateAsync(uri, [{ resize }], {
    compress: 0.85,
    format: SaveFormat.JPEG,
  });
  return result.uri;
};

export const selectImage = async (): Promise<User | null> => {
  try {
    // Request media library permissions with better feedback
    const permissionResult = await requestMediaLibraryPermissionWithFeedback();

    if (!permissionResult.granted) {
      throw new Error(permissionResult.message || 'Tillgång till fotobiblioteket krävs för att välja en profilbild.');
    }

    const result = await ImagePicker.launchImageLibraryAsync(options);

    if (result.canceled) {
      console.log('User cancelled image picker');
      return null;
    }

    if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
      const asset = result.assets[0];
      const uploadUri = await capLongEdge(asset.uri, asset.width, asset.height);
      const user = await uploadAvatar(uploadUri);
      console.log('Uploaded avatar', user.avatar_url);
      return user;
    } else {
      console.log('no assets in response');
      throw new Error('Ingen bild valdes eller kunde läsas.');
    }
  } catch (error) {
    console.error('Failed to select image:', error);
    // Re-throw the error to preserve the original message
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Kunde inte välja bild. Försök igen.');
  }
}
