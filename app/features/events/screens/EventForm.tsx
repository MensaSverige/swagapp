import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, Keyboard, TouchableWithoutFeedback } from 'react-native';
import useStore from '../../common/store/store';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { useEventLists } from '../hooks/useEventLists';
import { RootStackParamList } from '../../../navigation/RootStackParamList';
import Field from '../../common/components/Field';
import Fields from '../../common/components/Fields';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createUserEvent, updateUserEvent } from '../services/eventService';
import { DatepickerField } from '../../common/components/DatepickerField';
import { ExtendedUserEvent, UserEvent } from '../../../api_schema/types';
import {
  Input,
  ScrollView,
  Button,
  ButtonText,
  HStack,
  Textarea,
  SafeAreaView,
  TextareaInput,
  InputField,
} from '../../../gluestack-components';
import { extractNumericValue } from '../../common/functions/extractNumericValue';
import SettingsSwitchField from '../../common/components/SettingsSwitchField';
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
    start: new Date().toISOString(),
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

  const [addressSwitch, setAddressSwitch] = useState<boolean>(false);
  const [locationDescriptionSwitch, setLocationDescriptionSwitch] = useState<boolean>(false);
  const [endtimeSwitch, setEndtimeSwitch] = useState<boolean>(false);
  const [maxParticipantsSwitch, setMaxParticipantsSwitch] = useState<boolean>(false);

  // Event data, and saving it
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { fetchAllEvents } = useEventLists();

  useEffect(() => {
    if (initialEvent) {
      // Event Object fields
      setFormState({
        ...formState,
        name: initialEvent.name,
        description: initialEvent.description,
        maxAttendees: initialEvent.maxAttendees,
        start: initialEvent.start,
        end: initialEvent.end,
        location: initialEvent.location,
      });
      setAddressSwitch(!!initialEvent.location?.address);
      setLocationDescriptionSwitch(!!initialEvent.location?.description);
      setEndtimeSwitch(!!initialEvent.end);
      setMaxParticipantsSwitch(!!initialEvent.maxAttendees);

    }
  }, [initialEvent]);


  const saveEvent = useMemo(() => () => {
    console.log('Saving event', formState);
    if (!user) {
      console.error('No user found');
      return;
    }

    const event: UserEvent = {
      _id: initialEvent?.id,
      name: formState.name,
      description: formState.description,
      maxAttendees: formState.maxAttendees ?? undefined,
      start: formState.start,
      end: formState.end || undefined,
      location: {
        latitude: formState.location?.latitude || undefined,
        longitude: formState.location?.longitude || undefined,
        address: formState.location?.address || undefined,
        description: formState.location?.description || undefined,
        marker: formState.location?.marker || undefined,
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
    initialEvent,
    formState,
    navigation,
    user,
  ]);

const handleChangeStartDate = useCallback((newStartDate?: Date) => {
  if (!newStartDate || newStartDate < new Date()) {
    newStartDate = new Date(); // set to current time if not provided or if before current time
  }

  const previousStartDate = new Date(formState.start);
  const startDateDelta = newStartDate.getTime() - previousStartDate.getTime();

  let updatedFormState = {
    ...formState,
    start: newStartDate.toISOString(),
  };

  if (endtimeSwitch && formState.end) {
    const previousEndDate = new Date(formState.end);
    // update end date to maintain the same time difference from start date
    const newEndDate = new Date(previousEndDate.getTime() + startDateDelta);
    updatedFormState = {
      ...updatedFormState,
      end: newEndDate.toISOString(),
    };
  }

  setFormState(updatedFormState);
}, [formState.start, formState.end, endtimeSwitch]);

const handleChangeEndDate = useCallback((newEndDate?: Date) => {
  if (!newEndDate || newEndDate < new Date()) {
    newEndDate = new Date(); // set to current time if not provided or if before current time
  }

  let newEndTime = newEndDate?.toISOString() || undefined;
  // if end time is before start time, set start time to new end time
  if (newEndTime && new Date(newEndTime) < new Date(formState.start)) { 
    setFormState({
      ...formState,
      start: newEndTime,
      end: newEndTime
    });
  } else {
    setFormState({
      ...formState,
      end: newEndTime
    });
  }
}, [formState.start, formState.end]);

  return (
    <SafeAreaView flex={1} bgColor='$background0'>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView flex={1} flexDirection='column' padding={10}>
          <Fields>
            <Field
              label="Titel"
              required
              // error={
              //   nameFieldTouched && !nameValid
              //     ? 'Titeln får inte vara tom.'
              //     : undefined
              // }
              >
              <Input>
                <InputField type="text"
                  defaultValue={formState.name}
                  onChangeText={
                    (value) => {
                      setFormState({
                        ...formState,
                        name: value,
                      });
                    }
                  }
                  onBlur={() => {
                  }} placeholder="Evenemangets titel" />
              </Input>
            </Field>

            <Field label="Beskrivning">
              <Textarea>
                <TextareaInput
                  defaultValue={formState.description || ''}
                  onChangeText={(value) => {
                    setFormState({
                      ...formState,
                      description: value,
                    });
                  }}
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
                date={new Date(formState.start)}
                onDateChange={handleChangeStartDate}
              />
              {endtimeSwitch && (
                <DatepickerField
                  label="Slut"
                  date={formState.end ? new Date(formState.end) : undefined}
                  minimumDate={new Date(formState.start)}
                  optional
                  onDateChange={handleChangeEndDate}
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
                    defaultValue={formState.maxAttendees?.toString() || ''}
                    onChangeText={(value: string) => {
                      if (value === '') {
                        setFormState({
                          ...formState,
                          maxAttendees: undefined,
                        });
                      } else {
                        setFormState({
                          ...formState,
                          maxAttendees: extractNumericValue(value),
                        });
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
                        latitude: undefined,
                        longitude: undefined,
                      }
                    });
                }}
              />
              {addressSwitch && (
                <EventMapField
                  location={formState.location}
                  onLocationChanged={(value) => {
                    console.log('Location changed', value);
                    setFormState({
                      ...formState,
                      location: {
                        ...formState.location,
                        address: value?.address,
                        latitude: value?.latitude,
                        longitude: value?.longitude,
                      }
                    })
                  }
                  } />
              )}
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
                  <InputField type="text" defaultValue={formState.location?.description || ''} placeholder="Rum 107"
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
          <HStack space="lg" justifyContent="space-evenly" alignItems='center' paddingVertical={30} >
            <Button
              size="md"
              variant="solid"
              action="primary"
              width="100%"
              isDisabled={isSaving}
              isFocusVisible={false}
              onPress={saveEvent}
            >
              <ButtonText textAlign='center'>
                Spara
                {isSaving &&
                  <ActivityIndicator style={{ marginLeft: 5 }} />
                }
              </ButtonText>
            </Button>
          </HStack>
        </ScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default EditEventForm;
