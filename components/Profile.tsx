import React, {useState} from 'react';
import {
  Box,
  Center,
  Input,
  Button,
  VStack,
  Text,
  Image,
  ScrollView,
  Switch,
  FormControl,
  Stack,
  Spinner,
} from 'native-base';
import apiClient from '../apiClient';
import useStore from '../store/store';
import * as Keychain from 'react-native-keychain';
import {User} from '../types/user';

const Profile: React.FC = () => {
  // Get current user and token from Zustand store
  const {user, setUser} = useStore();

  // Local state for form fields
  const [showLocation, setShowLocation] = useState(user?.show_location);
  const [isLoading, setIsLoading] = useState(false);
  const [avararChanged, setAvatarChanged] = useState(false);

  const handleLogout = () => {
    Keychain.resetGenericPassword({service: 'credentials'});
    Keychain.resetGenericPassword({service: 'refreshToken'});
    Keychain.resetGenericPassword({service: 'accessToken'});
    setUser(null);
  };

  const handleSave = async () => {
    setIsLoading(true);
    if (!user) {
      return;
    }

    return apiClient
      .put('/user/' + user.id, {
        ...user,
        show_location: showLocation,
      })
      .then(response => {
        if (response.status === 200 && response.data.status === 'success') {
          const returnedUser = response.data.data as User;
          setUser({
            ...user,
            avatar_url: returnedUser.avatar_url,
            show_location: returnedUser.show_location,
          });
        }
      })
      .catch(error => {
        console.error('Failed to update profile:', error.message || error);
      })
      .finally(() => {
        setIsLoading(false);
        setAvatarChanged(false);
      });
  };

  if (!user) {
    return null;
  }

  return (
    <Center w="100%" h="100%">
      <ScrollView w="100%" h="100%" padding="10px">
        <Center pt={10}>
          {!avararChanged && (
            <Image
              source={{uri: user.avatar_url}}
              alt="Profile image"
              size={150}
              borderRadius={100}
            />
          )}
        </Center>
        <Box safeArea flex={1} pb={10} w="100%" mx="auto">
          <VStack space={4}>
            <FormControl isDisabled isRequired>
              <Stack>
                <FormControl.Label>Användarnamn</FormControl.Label>
                <Input
                  placeholder="Email"
                  value={user.username}
                  onChangeText={null}
                  isDisabled
                />
                <FormControl.HelperText>
                  Användarnamnet kan inte ändras
                </FormControl.HelperText>
              </Stack>
            </FormControl>

            <FormControl isDisabled isRequired>
              <Stack>
                <FormControl.Label>Namn</FormControl.Label>
                <Input
                  placeholder="Namn"
                  value={user.name}
                  onChangeText={null}
                  isDisabled
                />
                <FormControl.HelperText>
                  Namnet kan inte ändras
                </FormControl.HelperText>
              </Stack>
            </FormControl>

            <FormControl isRequired>
              <Stack>
                <FormControl.Label>Avatar url</FormControl.Label>
                <Input
                  placeholder="https://example.com/avatar.png"
                  value={user.avatar_url}
                  onChangeText={(avatar_url: string) => {
                    setUser({...user, avatar_url});
                    setAvatarChanged(true);
                  }}
                />
              </Stack>
            </FormControl>
            <FormControl>
              <Stack>
                <FormControl.Label>Visa position</FormControl.Label>
                <Switch
                  isChecked={showLocation}
                  onToggle={show_location => {
                    setShowLocation(show_location);
                  }}
                  accessibilityLabel="Visa min position på kartan"
                />
                <FormControl.HelperText>
                  Visa din position på kartan
                </FormControl.HelperText>
              </Stack>
            </FormControl>

            <FormControl>
              <Button onPress={handleSave}>
                <Text color="white">
                  Spara
                  {isLoading && (
                    <Spinner
                      color="white"
                      top="10"
                      size="sm"
                      accessibilityLabel="Sparar..."
                    />
                  )}
                </Text>
              </Button>
            </FormControl>
          </VStack>
          <VStack space={4} mt={10}>
            <Text>Du är inloggad som {user.username}</Text>
            <Button size="sm" onPress={() => handleLogout()}>
              <Text color="white">Logga ut</Text>
            </Button>
          </VStack>
        </Box>
      </ScrollView>
    </Center>
  );
};

export default Profile;
