import { ImageLibraryOptions, launchImageLibrary } from 'react-native-image-picker';
import { uploadAvatar } from '../../account/services/userService';
import { User } from '../../../api_schema/types';

const options: ImageLibraryOptions = {
  mediaType: 'photo',
  quality: 1,
  maxHeight: 500,
  maxWidth: 500,
};
export const selectImage = async (): Promise<User | null> => {
  return launchImageLibrary(options)
    .then((response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
        return null;
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
        return Promise.reject('ImagePicker Error: ' + response.errorMessage);
      } else
      if (response.assets && response.assets && response.assets[0].uri) {
        const sourceuri = response.assets[0].uri;
          return uploadAvatar(sourceuri).then((user) => {
            console.log('Uploaded avatar', user.avatar_url);
            return user;
          });
      }
      else {
        console.log('no assets in response')
        return Promise.reject('no assets in response');
      }
    })
    .catch((error) => {
      console.error('Failed to select image:', error.message || error);
      return Promise.reject('Failed to select image');
    });
}
