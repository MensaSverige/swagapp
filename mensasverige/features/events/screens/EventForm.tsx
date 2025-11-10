import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { 
  ActivityIndicator, 
  Keyboard, 
  TouchableWithoutFeedback, 
  ScrollView, 
  SafeAreaView, 
  TextInput, 
  TouchableOpacity, 
  Text, 
  View,
  StyleSheet
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import useStore from '../../common/store/store';
import { useEventLists } from '../hooks/useEventLists';
import Field from '../../common/components/Field';
import Fields from '../../common/components/Fields';
import { createUserEvent, updateUserEvent } from '../services/eventService';
import { DatepickerField } from '../../common/components/DatepickerField';
import { Event, UserEvent } from '../../../api_schema/types';
import { extractNumericValue } from '../../common/functions/extractNumericValue';
import SettingsSwitchField from '../../common/components/SettingsSwitchField';
import EventMapField from '../components/EventMapField';

const EditEventForm: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ event?: string }>();
  
  // Parse the event from params if it exists
  // To navigate to this screen with an event, use: router.push({ pathname: '/event-form', params: { event: JSON.stringify(eventObject) } })
  const initialEvent = params.event ? JSON.parse(params.event) as Event : null;

  const user = useStore(state => state.user);

  //create a formstate based on event type
  const [formState, setFormState] = useState<Event>({
    userId: user?.userId ?? 0,
    name: '',
    start: new Date().toISOString(),
    ownerName: `${user?.firstName} ${user?.lastName}` || '',
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

    if (!formState.name) {
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
      suggested_hosts: [],
      userId: user?.userId,
      reports: [],
      attendees: [],
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
          router.back();
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
    router,
    user,
  ]);

const handleChangeStartDate = useCallback((newStartDate?: Date) => {
  if (!newStartDate || newStartDate < new Date()) {
    newStartDate = new Date(); // set to current time if not provided or if before current time
  }

  const previousStartDate = new Date(formState.start);
  const startDateDelta = newStartDate.getTime() - previousStartDate.getTime();

  const newStartDateString = newStartDate.toISOString();
  let newEndDateString = undefined;
  if (endtimeSwitch && formState.end) {
    const previousEndDate = new Date(formState.end);
    // update end date to maintain the same time difference from start date
    const newEndDate = new Date(previousEndDate.getTime() + startDateDelta);
    newEndDateString = newEndDate.toISOString();
  }

  setFormState(currentFromState => ({
    ...currentFromState,
    start: newStartDateString,
    end: newEndDateString || currentFromState.end,
  }));
}, [formState.start, formState.end, endtimeSwitch]);

const handleChangeEndDate = useCallback((newEndDate?: Date) => {
  if (!newEndDate || newEndDate < new Date()) {
    newEndDate = new Date(); // set to current time if not provided or if before current time
  }

  let newEndTime = newEndDate?.toISOString() || undefined;
  // if end time is before start time, set start time to new end time
  if (newEndTime && new Date(newEndTime) < new Date(formState.start)) { 
    setFormState(currentFormState => ({
      ...currentFormState,
      start: newEndTime,
      end: newEndTime
    }));
  } else {
    setFormState(currentFormState => ({
      ...currentFormState,
      end: newEndTime
    }));
  }
}, [formState.start, formState.end]);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
    padding: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  textarea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#ffffff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    paddingVertical: 30,
    paddingHorizontal: 0,
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView style={styles.scrollView}>
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
              <TextInput
                style={styles.input}
                defaultValue={formState.name}
                onChangeText={
                  (value: string) => {
                    setFormState({
                      ...formState,
                      name: value,
                    });
                  }
                }
                onBlur={() => {
                }} placeholder="Evenemangets titel" />
            </Field>

            <Field label="Beskrivning">
              <TextInput
                style={styles.textarea}
                defaultValue={formState.description || ''}
                onChangeText={(value: string) => {
                  setFormState({
                    ...formState,
                    description: value,
                  });
                }}
                placeholder="Beskrivning av evenemanget" 
                multiline
                numberOfLines={4}
              />
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
                      end: formState.start,
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
                <TextInput
                  style={styles.input}
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
                        maxAttendees: parseInt(extractNumericValue(value) ?? ''),
                      });
                    }
                  }}
                  placeholder="Max antal deltagare" />
              }
            </Field>

            <Field
              label="Adress">
              <SettingsSwitchField
                label="Lägg till adress"
                value={addressSwitch}
                onValueChange={() => {
                  if (addressSwitch && formState) {
                      setFormState({
                          ...formState,
                          location: {
                              ...formState.location,
                              address: undefined,
                              latitude: undefined,
                              longitude: undefined,
                          }
                      });
                  }
                  setAddressSwitch(!addressSwitch);
              }}
              />
              {addressSwitch && (
                <EventMapField
                  location={formState.location}
                  onLocationChanged={(value) => {
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
                <TextInput
                  style={styles.input}
                  defaultValue={formState.location?.description || ''} 
                  placeholder="Rum 107"
                  onChangeText={(value: string) => {
                    setFormState({
                      ...formState,
                      location: {
                        ...formState.location,
                        description: value,
                      }
                    })
                  }}
                />
              }
            </Field>

          </Fields>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, isSaving && styles.buttonDisabled]}
              disabled={isSaving}
              onPress={saveEvent}
            >
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>
                  Spara
                </Text>
                {isSaving &&
                  <ActivityIndicator style={{ marginLeft: 5 }} color="#ffffff" />
                }
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default EditEventForm;
