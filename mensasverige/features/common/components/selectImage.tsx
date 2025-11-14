import * as ImagePicker from 'expo-image-picker';
import { uploadAvatar } from '../../account/services/userService';
import { User } from '../../../api_schema/types';

const options: ImagePicker.ImagePickerOptions = {
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  quality: 1,
  aspect: [1, 1],
  allowsEditing: true,
};
export const selectImage = async (): Promise<User | null> => {
  try {
    // Request media library permissions
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      console.log('Media library permission denied');
      return Promise.reject('Media library permission denied');
    }

    const result = await ImagePicker.launchImageLibraryAsync(options);
    
    if (result.canceled) {
      console.log('User cancelled image picker');
      return null;
    }
    
    if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
      const sourceuri = result.assets[0].uri;
      const user = await uploadAvatar(sourceuri);
      console.log('Uploaded avatar', user.avatar_url);
      return user;
    } else {
      console.log('no assets in response');
      return Promise.reject('no assets in response');
    }
  } catch (error) {
    console.error('Failed to select image:', error);
    return Promise.reject('Failed to select image');
  }
}
