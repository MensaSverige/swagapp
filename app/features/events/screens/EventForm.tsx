import React, { useCallback, useEffect, useState } from 'react';
import { Keyboard, Platform, TouchableWithoutFeedback } from 'react-native';
import { StyleSheet } from 'react-native';
import MapView from 'react-native-maps';
import useStore from '../../common/store/store';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { useEventLists } from '../hooks/useEventLists';
import { RootStackParamList } from '../../../navigation/RootStackParamList';
import Field from '../../common/components/Field';
import Fields from '../../common/components/Fields';
import EventCard from '../components/EventCard';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createUserEvent, updateUserEvent } from '../services/eventService';
import { DatepickerField } from '../../common/components/DatepickerField';
import { ExtendedUserEvent, UserEvent } from '../../../api_schema/types';
import EventWithLocation from '../types/eventWithLocation';
import FutureUserEvent, { isFutureUserEvent } from '../types/futureUserEvent';
import {
  Box,
  SearchIcon,
  Input,
  InputSlot,
  KeyboardAvoidingView,
  ScrollView,
  Text,
  View,
  Button,
  ButtonText,
  HStack,
  Textarea,
  SafeAreaView,
  VStack,
  TextareaInput,
  InputField,
  Card,
  InputIcon
} from '../../../gluestack-components';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { config } from '../../../gluestack-components/gluestack-ui.config';
import { extractNumericValue } from '../../common/functions/extractNumericValue';
import EventCardPreview from '../components/EventCardPreview';
import SettingsSwitchField from '../../common/components/SettingsSwitchField';
import { getGeoLocation } from '../../map/services/locationService';
import EventMapField from './EventMapField';

type EventFormProps = RouteProp<RootStackParamList, 'EventForm'>;

const EditEventForm: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<EventFormProps>();
  const initialEvent = route.params.event;

  const user = useStore(state => state.user);

  //create a formstate based on event type 
  const [formState, setFormState] = useState<ExtendedUserEvent>({
    userId: user?.userId ?? 0,
    name: '',
    start: Date.now().toString(),
    ownerName: `${user?.firstName} ${user?.lastName}` ?? '',
    id: null,
    hosts: null,
    suggested_hosts: [],
    location: null,
    end: null,
    description: null,
    reports: [],
    attendees: [],
    maxAttendees: null,
    hostNames: [],
    attendeeNames: [],
  });


  // Event data
  const [eventName, setEventName] = useState<string>('');
  const [eventDescription, setEventDescription] = useState<string>('');
  const [eventMaxParticipants, setEventMaxParticipants] = useState<
    number | null
  >(null);
  const [eventStartDate, setEventStartDate] = useState<Date>(new Date());
  const [eventEndDate, setEventEndDate] = useState<Date | undefined>(undefined);

  const [eventLocationDescription, setEventLocationDescription] =
    useState<string>('');
  const [eventLocationMarker, setEventLocationMarker] = useState<string>('');

  const [showPreview, setShowPreview] = useState<boolean>(false);

  const [addressSwitch, setAddressSwitch] = useState<boolean>(false);
  const [locationDescriptionSwitch, setLocationDescriptionSwitch] = useState<boolean>(false);
  const [endtimeSwitch, setEndtimeSwitch] = useState<boolean>(false);
  const [maxParticipantsSwitch, setMaxParticipantsSwitch] = useState<boolean>(false);

  // Event data, and saving it
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { fetchAllEvents } = useEventLists();

  // Field validation states
  const [nameFieldTouched, setNameFieldTouched] = useState<boolean>(false);
  const [nameValid, setNameValid] = useState<boolean>(
    (initialEvent && initialEvent.name !== '') || false,
  );
  const [formChanged, setFormChanged] = useState<boolean>(false);

  useEffect(() => {
    if (initialEvent) {
      // Event Object fields
      setEventName(initialEvent.name);
      setEventDescription(initialEvent.description || '');
      setEventMaxParticipants(initialEvent.maxAttendees || null);
      setEventStartDate(new Date(initialEvent.start));
      setEventEndDate(
        initialEvent.end ? new Date(initialEvent.end) : undefined,
      );
      setEventLocationDescription(initialEvent.location?.description || '');
      setEventLocationMarker(initialEvent.location?.marker || '');
    }
  }, [initialEvent]);

  // Validate form
  useEffect(() => {
    if (initialEvent) {
      // You can only save changed events.
      setFormChanged(
        eventName !== initialEvent.name ||
        eventDescription !== initialEvent.description ||
        eventMaxParticipants !== initialEvent.maxAttendees ||
        eventStartDate.toISOString() !== initialEvent.start ||
        (eventEndDate?.toISOString() || undefined) !== initialEvent.end ||
        eventLocationDescription !== initialEvent.location?.description ||
        eventLocationMarker !== initialEvent.location?.marker,
      );
    } else {
      setFormChanged(eventName !== '');
    }
  }, [
    initialEvent,
    nameValid,
    eventName,
    eventDescription,
    eventMaxParticipants,
    eventStartDate,
    eventEndDate,
    eventLocationDescription,
    eventLocationMarker,
  ]);

  // Validate individual fields
  useEffect(() => {
    if (nameFieldTouched) {
      setNameValid(eventName.trim() !== '');
    }
  }, [eventName, nameFieldTouched]);


  const searchLocation = useCallback(() => {
    const address = formState.location?.address;
    if (!address || address.trim() === '') {
      console.log('Invalid address');
      return;
    }
    getGeoLocation(address).then((location) => {
      console.log('Location:', location);
      if (location) {
        setFormState((prevState) => ({
          ...prevState,
          location: {
            ...prevState.location,
            address: location.formatted_address,
            latitude: location.latitude,
            longitude: location.longitude,
          }
        }));
      }
    });
  }, [formState, setFormState]);
  const saveEvent = useCallback(() => {
    if (!user) {
      console.error('No user found');
      return;
    }
    if (!formChanged) {
      return;
    }
    const event: UserEvent = {
      _id: initialEvent?.id,
      name: eventName,
      description: eventDescription,
      maxAttendees: eventMaxParticipants ?? undefined,
      start: eventStartDate.toISOString() || '',
      end: eventEndDate?.toISOString() || undefined,
      location: {
        latitude: 0,
        longitude: 0,
        description: eventLocationDescription,
        marker: eventLocationMarker,
      },
      hosts: [],
      userId: user?.userId,
    };
    setIsSaving(true);
    (initialEvent && initialEvent.id
      ? // when editing
      updateUserEvent(initialEvent.id, event)
      : // when creating
      createUserEvent(event)
    )
      .then(async () => {
        return fetchAllEvents().then(() => {
          navigation.goBack();
        });
      })
      .catch(err => {
        console.error('Error', err);
      })
      .finally(() => {
        setIsSaving(false);
      });
  }, [
    fetchAllEvents,
    formChanged,
    initialEvent,
    navigation,
    user,
  ]);


  const handleChangeStartDate = (date?: Date) => {
    if (!date) {
      return; // should not happen
    }
    let startDateDelta = 0;
    const newStartDate = new Date(date);
    const previousStartDateDate = new Date(eventStartDate);
    startDateDelta = newStartDate.getTime() - previousStartDateDate.getTime();
    setEventStartDate(date);
    if (eventEndDate && startDateDelta !== 0) {
      const newEndDate = new Date(eventEndDate || date);
      // If end date is set, move it the same amount of time as start date
      setEventEndDate(new Date(newEndDate.getTime() + startDateDelta));
    }
  };

  return (
    <SafeAreaView flex={1} bgColor='$background0'>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        flex={1}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView flex={1} flexDirection='column' padding={10}>
            <Fields>
              <Field
                label="Titel"
                required
                error={
                  nameFieldTouched && !nameValid
                    ? 'Titeln får inte vara tom.'
                    : undefined
                }>
                <Input>
                  <InputField type="text" defaultValue={eventName} onChangeText={setEventName}
                    onBlur={() => {
                      setNameFieldTouched(true);
                    }} placeholder="Evenemangets titel" />
                </Input>
              </Field>


              <Field label="Beskrivning">
                <Textarea>
                  <TextareaInput
                    defaultValue={eventDescription}
                    onChangeText={setEventDescription}
                    placeholder="Beskrivning av evenemanget" />
                </Textarea>
              </Field>



              <Field label="Datum och tid">
                <SettingsSwitchField
                  label="Ange sluttid"
                  value={endtimeSwitch}
                  onValueChange={() => {
                    setEndtimeSwitch(!endtimeSwitch)
                    if (!endtimeSwitch)
                      setFormState({
                        ...formState,
                        end: undefined,
                      });
                  }}
                />
                <DatepickerField
                  label="Start"
                  date={eventStartDate}
                  onDateChange={handleChangeStartDate}
                />
                {endtimeSwitch && (
                  <DatepickerField
                    label="Slut"
                    date={eventEndDate || undefined}
                    minimumDate={eventStartDate}
                    optional
                    onDateChange={setEventEndDate}
                  />
                )}
              </Field>
              <Field label="Antal deltagare">
                <SettingsSwitchField
                  label="Ange max antal deltagare"
                  value={maxParticipantsSwitch}
                  onValueChange={() => {
                    setMaxParticipantsSwitch(!maxParticipantsSwitch)
                    if (!maxParticipantsSwitch)
                      setFormState({
                        ...formState,
                        maxAttendees: undefined,
                      });
                  }}
                />
                {maxParticipantsSwitch &&
                  <Input>
                    <InputField
                      inputMode='numeric'
                      defaultValue={eventMaxParticipants?.toString() || ''}
                      onChangeText={(value: string) => {
                        if (value === '') {
                          setEventMaxParticipants(null);
                        } else {
                          setEventMaxParticipants(extractNumericValue(value));
                        }
                      }}
                      placeholder="Max antal deltagare" />
                  </Input>
                }
              </Field>


              <Field
                label="Adress">
                <SettingsSwitchField
                  label="Lägg till adress"
                  value={addressSwitch}
                  onValueChange={() => {
                    setAddressSwitch(!addressSwitch)
                    if (!formState) {
                      return;
                    }
                    if (!addressSwitch)
                      setFormState({
                        ...formState,
                        location: {
                          ...formState.location,
                          address: undefined,
                        }
                      });
                  }}
                />
                {addressSwitch &&
                  <Input>
                    <InputField type="text"
                      defaultValue={formState.location?.address || ''}
                      placeholder="Fabriksgatan 19, 702 23 Örebro"
                      onChangeText={(value) => {
                        setFormState({
                          ...formState,
                          location: {
                            ...formState.location,
                            address: value,
                          }
                        })
                      }}
                      onEndEditing={searchLocation}
                    />
                    <InputSlot pr="$3" onPress={searchLocation}>
                      <InputIcon
                        as={SearchIcon}
                        color="$primary500"
                      />
                    </InputSlot>
                  </Input>
                }
                <Text>
                  {formState.location?.address}
                  {formState.location?.latitude}
                  {formState.location?.longitude}
                </Text>
                {/* {formState.location?.latitude && formState.location?.longitude && (
                  <EventMapField longitude={formState.location?.longitude} latitude={formState.location?.latitude} />
                )} */}
              </Field>

              <Field
                label="Platsbeskrivning">
                <SettingsSwitchField
                  label="Lägg till platsbeskrivning"
                  value={locationDescriptionSwitch}
                  onValueChange={() => {
                    setLocationDescriptionSwitch(!locationDescriptionSwitch)
                    if (!locationDescriptionSwitch)
                      setFormState({
                        ...formState,
                        location: {
                          ...formState.location,
                          description: undefined,
                        }
                      });
                  }}
                />
                {locationDescriptionSwitch &&


                  <Input>
                    <InputField type="text" defaultValue={eventLocationDescription} placeholder="Rum 107"
                      onChangeText={(value) => {
                        setFormState({
                          ...formState,
                          location: {
                            ...formState.location,
                            description: value,
                          }
                        })
                      }
                      }
                    />
                  </Input>
                }
              </Field>

            </Fields>
            <HStack space="lg" h="100%" flex={1} justifyContent="space-between" paddingVertical={20} >
              <Button
                flex={1}
                size="md"
                variant="outline"
                action="secondary"
                borderRadius={0}
                borderColor="$vscode_stringLiteral"
                isDisabled={isSaving}
                isFocusVisible={false}
                onPress={() => {
                  navigation.goBack();
                }}
              >
                <ButtonText color='$vscode_stringLiteral'>Avbryt</ButtonText>
              </Button>
              <Button
                flex={1}
                size="md"
                variant="solid"
                action="primary"
                borderRadius={0}
                isDisabled={isSaving}
                isFocusVisible={false}
                onPress={() => { setShowPreview(true) }}
              >
                <ButtonText>Förhandsgranska</ButtonText>
              </Button>
            </HStack>
            {showPreview && (
              <EventCardPreview
                event={
                  {
                    id: '',
                    name: eventName,
                    start: eventStartDate.toISOString(),
                    end: eventEndDate?.toISOString() || undefined,
                    location: {
                      latitude: 0,
                      longitude: 0,
                      description: eventLocationDescription,
                      marker: eventLocationMarker,
                    },
                  } as FutureUserEvent
                }
                onClose={() => setShowPreview(false)}
                showPreview={showPreview}
                onSave={saveEvent}
              />
            )}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
};

export default EditEventForm;
