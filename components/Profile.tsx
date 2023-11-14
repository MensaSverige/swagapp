import React, {useEffect, useState} from 'react';
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
} from 'native-base';
import apiClient from '../apiClient';
import useStore from '../store';
import * as Keychain from 'react-native-keychain';

const Profile: React.FC = () => {
  // Get current user and token from Zustand store
  const {user, setUser} = useStore();

  // Local state for dirty form
  const [dirtyForm, setDirtyForm] = useState(false);

  // Local state for form fields
  const [showLocation, setShowLocation] = useState(user?.show_location);

  useEffect(() => {
    if (showLocation !== user?.show_location) {
      setDirtyForm(true);
    }
  }, [showLocation, user?.show_location]);

  const handleLogout = () => {
    Keychain.resetGenericPassword({service: 'credentials'});
    Keychain.resetGenericPassword({service: 'refreshToken'});
    Keychain.resetGenericPassword({service: 'accessToken'});
    setUser(null);
  };

  const handleSave = async () => {
    if (!user) {
      return;
    }

    console.log('User', user);

    try {
      const response = await apiClient.put('/user/' + user.id, {
        ...user,
        show_location: showLocation,
      });

      if (response.status === 200 && response.data.status === 'success') {
        const returnedUser = response.data.data;
        console.log('User after update', returnedUser);
        setUser(returnedUser);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (!user) {
    return null;
  }

  console.log('user', user);

  return (
    <Center w="100%" h="100%">
      <ScrollView>
        <Center pt={10}>
          <Image
            source={{uri: user.avatar_url}}
            alt="Profile image"
            size={150}
            borderRadius={100}
          />
        </Center>
        <Box safeArea flex={1} pb={10} w="100%" mx="auto">
          <VStack space={4}>
            <FormControl isDisabled isRequired>
              <Stack>
                <FormControl.Label>Användarnamn</FormControl.Label>
                <Input
                  placeholder="Email"
                  value={user.username}
                  onChangeText={_ => {}}
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
                  onChangeText={_ => {}}
                  isDisabled
                />
                <FormControl.HelperText>
                  Namnet kan inte ändras
                </FormControl.HelperText>
              </Stack>
            </FormControl>

            <FormControl>
              <Stack>
                <FormControl.Label>Visa position</FormControl.Label>
                <Switch
                  isChecked={showLocation}
                  onToggle={show_location => {
                    console.log('show_location', show_location);
                    setShowLocation(show_location);
                  }}
                  accessibilityLabel="Visa min position på kartan"
                />
                <FormControl.HelperText>
                  Visa din position på kartan
                </FormControl.HelperText>
              </Stack>
            </FormControl>

            <FormControl isDisabled={!dirtyForm}>
              <Button onPress={handleSave} disabled={!dirtyForm}>
                Spara
              </Button>
            </FormControl>
          </VStack>
          <VStack space={4} mt={10}>
            <Text>Du är inloggad som {user.username}</Text>
            <Button size="sm" onPress={() => handleLogout()}>
              Logga ut
            </Button>
          </VStack>
        </Box>
      </ScrollView>
    </Center>
  );
};

export default Profile;
