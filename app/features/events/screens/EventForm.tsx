import React, {useCallback, useEffect, useState} from 'react';
import {Button, Platform, TextInput} from 'react-native';
import {StyleSheet, SafeAreaView} from 'react-native';
import MapView from 'react-native-maps';
import useStore from '../../common/store/store';
import {
  Box,
  ICustomTheme,
  Input,
  KeyboardAvoidingView,
  ScrollView,
  Spinner,
  Text,
  TextArea,
  View,
  ZStack,
  useTheme,
} from 'native-base';
import {RouteProp, useRoute, useNavigation} from '@react-navigation/native';
import {useEventLists} from '../hooks/useEventLists';
import {clockForTime} from '../../map/functions/clockForTime';
import {RootStackParamList} from '../../../navigation/RootStackParamList';
import EventMarker from '../../map/components/markers/EventMarker';
import Field from '../../common/components/Field';
import Fields from '../../common/components/Fields';
import EventCard from '../components/EventCard';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {createUserEvent, updateUserEvent} from '../services/eventService';
import {DatepickerField} from '../../common/components/DatepickerField';
import {UserEvent} from '../../../api_schema/types';
import EventWithLocation from '../types/eventWithLocation';
import FutureUserEvent from '../types/futureUserEvent';

type EventFormProps = RouteProp<RootStackParamList, 'EventForm'>;

const EditEventForm: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<EventFormProps>();
  const initialEvent = route.params.event;

  const user = useStore(state => state.user);

  // Event data
  const [eventName, setEventName] = useState<string>('');
  const [eventDescription, setEventDescription] = useState<string>('');
  const [eventMaxParticipants, setEventMaxParticipants] = useState<
    number | null
  >(null);
  const [eventStartDate, setEventStartDate] = useState<Date>(new Date());
  const [eventEndDate, setEventEndDate] = useState<Date | undefined>(undefined);
  const [eventLocationLatitude, setEventLocationLatitude] = useState<number>(0);
  const [eventLocationLongitude, setEventLocationLongitude] =
    useState<number>(0);
  const [eventLocationDescription, setEventLocationDescription] =
    useState<string>('');
  const [eventLocationMarker, setEventLocationMarker] = useState<string>('');

  const theme = useTheme() as ICustomTheme;
  const styles = createStyles(theme);
  const startRegion = useStore(state => state.region);
  const [mapRegionDeltas, setMapRegionDeltas] = useState<{
    latitudeDelta: number;
    longitudeDelta: number;
  }>({
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // Event data, and saving it
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const {fetchData} = useEventLists();

  // Field validation states
  const [nameFieldTouched, setNameFieldTouched] = useState<boolean>(false);
  const [nameValid, setNameValid] = useState<boolean>(
    (initialEvent && initialEvent.name !== '') || false,
  );
  const [formChanged, setFormChanged] = useState<boolean>(false);

  // Emoji input field ref, used for text selection
  const emojiInputRef = React.useRef<TextInput | null>(null);

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
      setEventLocationLatitude(
        initialEvent.location?.latitude || startRegion.latitude,
      );
      setEventLocationLongitude(
        initialEvent.location?.longitude || startRegion.longitude,
      );
      setEventLocationDescription(initialEvent.location?.description || '');
      setEventLocationMarker(initialEvent.location?.marker || '');
    } else {
      setEventLocationLatitude(startRegion.latitude);
      setEventLocationLongitude(startRegion.longitude);
    }
  }, [initialEvent, startRegion.latitude, startRegion.longitude]);

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
          eventLocationLatitude !== initialEvent.location?.latitude ||
          eventLocationLongitude !== initialEvent.location?.longitude ||
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
    eventLocationLatitude,
    eventLocationLongitude,
    eventLocationDescription,
    eventLocationMarker,
  ]);

  // Validate individual fields
  useEffect(() => {
    if (nameFieldTouched) {
      setNameValid(eventName.trim() !== '');
    }
  }, [eventName, nameFieldTouched]);

  const saveEvent = useCallback(() => {
    if (!user) {
      console.error('No user found');
      return;
    }
    if (!formChanged) {
      return;
    }
    const event: UserEvent = {
      id: initialEvent?.id,
      name: eventName,
      description: eventDescription,
      maxAttendees: eventMaxParticipants ?? undefined,
      start: eventStartDate.toISOString() || '',
      end: eventEndDate?.toISOString() || undefined,
      location: {
        latitude: eventLocationLatitude,
        longitude: eventLocationLongitude,
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
        return fetchData().then(() => {
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
    eventDescription,
    eventEndDate,
    eventLocationDescription,
    eventLocationLatitude,
    eventLocationLongitude,
    eventLocationMarker,
    eventMaxParticipants,
    eventName,
    eventStartDate,
    fetchData,
    formChanged,
    initialEvent,
    navigation,
    user,
  ]);

  useEffect(() => {
    navigation.setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components
      headerLeft: () => (
        <Button
          title="Avbryt"
          disabled={isSaving}
          onPress={() => {
            navigation.goBack();
          }}
        />
      ),
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () =>
        isSaving ? (
          <Spinner />
        ) : (
          <Button title="Spara" disabled={!formChanged} onPress={saveEvent} />
        ),
    });
  }, [initialEvent, fetchData, formChanged, isSaving, navigation, saveEvent]);

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
    <SafeAreaView style={[styles.viewContainer]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 144 : 0}>
        <ScrollView contentContainerStyle={[styles.contentContainer]}>
          <Fields>
            <Field
              label="Titel"
              required
              error={
                nameFieldTouched && !nameValid
                  ? 'Titeln får inte vara tom.'
                  : undefined
              }>
              <Input
                type={'text'}
                placeholder="Evenemangets titel"
                value={eventName}
                onChangeText={setEventName}
                onBlur={() => {
                  setNameFieldTouched(true);
                }}
              />
            </Field>

            <Field label="Beskrivning">
              <TextArea
                placeholder="Beskrivning av evenemanget"
                value={eventDescription}
                onChangeText={setEventDescription}
                autoCompleteType={'off'}
              />
            </Field>

            <Field label="Antal deltagare">
              <Input
                type={'number'}
                placeholder="Lämna tomt för obegränsat antal deltagare"
                value={eventMaxParticipants?.toString() || ''}
                onChangeText={(value: string) => {
                  if (value === '') {
                    setEventMaxParticipants(null);
                  } else {
                    setEventMaxParticipants(parseInt(value, 10));
                  }
                }}
              />
            </Field>

            <DatepickerField
              label="Start"
              date={eventStartDate}
              onDateChange={handleChangeStartDate}
            />

            <DatepickerField
              label="Slut"
              date={eventEndDate || undefined}
              minimumDate={eventStartDate}
              optional
              onDateChange={setEventEndDate}
            />

            <Field label="Plats">
              <MapView
                style={styles.mapView}
                region={{
                  latitude: eventLocationLatitude,
                  longitude: eventLocationLongitude,
                  ...mapRegionDeltas,
                }}
                onRegionChangeComplete={region => {
                  setEventLocationLatitude(region.latitude);
                  setEventLocationLongitude(region.longitude);
                  setMapRegionDeltas({
                    latitudeDelta: region.latitudeDelta,
                    longitudeDelta: region.longitudeDelta,
                  });
                }}>
                <EventMarker
                  hasCallout={false}
                  event={
                    {
                      name: eventName.trim() || 'Exempel',
                      start: eventStartDate.toISOString(),
                      end: eventEndDate?.toISOString() || undefined,
                      location: {
                        latitude: eventLocationLatitude || startRegion.latitude,
                        longitude:
                          eventLocationLongitude || startRegion.longitude,
                        description:
                          eventLocationDescription || 'Exempeladress 42',
                        marker: eventLocationMarker || clockForTime(new Date()),
                      },
                    } as EventWithLocation
                  }
                />
              </MapView>
            </Field>

            <Field
              label="Platsbeskrivning"
              help="Denna visas i botten på Evenemangskortet.">
              <Input
                type={'text'}
                placeholder="Exempeladress 42"
                value={eventLocationDescription}
                onChangeText={setEventLocationDescription}
              />
            </Field>

            <Field
              label="Kartsymbol"
              help="Används som kartmarkör och visas i Evenemangskortet (se nedan)"
              onPress={() => {
                if (emojiInputRef.current) {
                  emojiInputRef.current.focus();
                }
              }}
              labelControl={
                <ZStack style={styles.emojiTextFieldWrapper}>
                  <View style={styles.emojiDisplayWrapper}>
                    <Text style={styles.emojiDisplay}>
                      {eventLocationMarker || clockForTime(eventStartDate)}
                    </Text>
                  </View>
                  <TextInput
                    placeholder={clockForTime(eventStartDate)}
                    value={eventLocationMarker || ''}
                    ref={emojiInputRef}
                    onKeyPress={e => {
                      // if non character key is pressed, return
                      if (
                        e.nativeEvent.key.length > 4 ||
                        e.nativeEvent.key === ' '
                      ) {
                        return;
                      }
                      setEventLocationMarker(e.nativeEvent.key);
                    }}
                    style={styles.emojiTextField}
                  />
                </ZStack>
              }
            />

            <Field label="Evenemangets kort">
              <Box style={styles.eventCardContainer}>
                <EventCard
                  event={
                    {
                      id: '',
                      name: eventName,
                      start: eventStartDate.toISOString(),
                      end: eventEndDate?.toISOString() || undefined,
                      location: {
                        latitude: eventLocationLatitude,
                        longitude: eventLocationLongitude,
                        description: eventLocationDescription,
                        marker: eventLocationMarker,
                      },
                    } as FutureUserEvent
                  }
                  initiallyOpen
                />
              </Box>
            </Field>
          </Fields>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (theme: ICustomTheme) =>
  StyleSheet.create({
    viewContainer: {
      flex: 1,
      backgroundColor: theme.colors.background[500],
    },
    contentContainer: {
      flexGrow: 1,
      padding: 10,
    },
    mapView: {
      width: '100%',
      aspectRatio: 4 / 3,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.text[50],
    },
    emojiTextFieldWrapper: {
      width: 40,
      height: 40,
    },
    emojiTextField: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: 40,
      height: 40,
      fontSize: 30,
      textAlign: 'center',
      alignSelf: 'center',
      opacity: 0,
    },
    emojiDisplayWrapper: {
      position: 'absolute',
      width: 40,
      height: 40,
      justifyContent: 'center', // Add this for vertical centering
    },
    emojiDisplay: {
      fontSize: 30,
      lineHeight: 40,
      alignSelf: 'center', // Ensure the text itself is centered
      color: theme.colors.text[500],
      padding: 0,
      margin: 0,
    },

    eventCardContainer: {
      borderWidth: 1,
      borderColor: theme.colors.text[50],
      borderRadius: 10,
    },
  });

export default EditEventForm;
