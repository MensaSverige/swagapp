import { ImageLibraryOptions, launchImageLibrary } from 'react-native-image-picker';
import { uploadAvatar } from '../../account/services/userService';



const options: ImageLibraryOptions = {
  mediaType: 'photo',
  quality: 1,
  maxHeight: 500,
  maxWidth: 500,
};
export const selectImage = () =>{
  return launchImageLibrary(options, (response) => {

  })
}


launchImageLibrary(options, (response) => {
  if (response.didCancel) {
    console.log('User cancelled image picker');
  } else if (response.errorCode) {
    console.log('ImagePicker Error: ', response.errorMessage);
  } else if (response.assets) {
    const source = { uri: response.assets[0].uri };
    console.log(source);
    // if (source.uri)
    //   uploadAvatar(source.uri).then((avatarUrl) => {
    //     console.log('Uploaded avatar', avatarUrl);
    //   });
  }
});
