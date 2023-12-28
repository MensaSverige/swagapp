import React, {useCallback, useEffect, useState} from 'react';
import {Dimensions, Platform} from 'react-native';
import {Text, Button, StyleSheet, SafeAreaView} from 'react-native';
import MapView, {Region} from 'react-native-maps';
import {Event} from '../../types/event';
import useStore from '../../store/store';
import {
  Box,
  Center,
  ICustomTheme,
  Input,
  KeyboardAvoidingView,
  ScrollView,
  View,
  Spinner,
  Switch,
  TextArea,
  useTheme,
} from 'native-base';
import DatePicker from 'react-native-date-picker';
import {RouteProp} from '@react-navigation/native';
import apiClient from '../../apiClient';
import {useEventsController} from '../../services/eventsController';
import {clockForTime} from '../../functions/events';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import EmojiSelector from 'react-native-emoji-selector';
import EventMarker from '../Map/markers/EventMarker';
import EventWithLocation from '../../types/eventWithLocation';
import Field from '../Field';
import Fields from '../Fields';
import EventCard from '../cards/EventCard';
import FutureUserEvent from '../../types/futureUserEvent';

export type EventFormProps = {
  event: FutureUserEvent | null;
};

const initializeNewEvent = (region: Region): FutureUserEvent => {
  const initialStartTime = new Date(Date.now());
  initialStartTime.setMinutes(0);
  initialStartTime.setSeconds(0);
  initialStartTime.setMilliseconds(0);
  initialStartTime.setHours(initialStartTime.getHours() + 2);
  return {
    id: '',
    name: '',
    location: {
      description: '',
      marker: '',
      latitude: region.latitude,
      longitude: region.longitude,
    },
    start: initialStartTime.toISOString(),
    end: '',
    description: '',
  } as FutureUserEvent;
};

const EditEventForm: React.FC<
  EventFormProps & {
    navigation: NativeStackNavigationProp<RootStackParamList, 'EventForm'>;
    route: RouteProp<RootStackParamList, 'EventForm'>;
  }
> = ({navigation, route}) => {
  const event = route.params.event;

  const theme = useTheme() as ICustomTheme;
  const styles = createStyles(theme);

  const startRegion = useStore(state => state.region);

  const [emojiPickerVisible, setEmojiPickerVisible] = useState<boolean>(false);

  const [mapRegion, setMapRegion] = useState({
    latitude: startRegion.latitude,
    longitude: startRegion.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // These two are used for updating end date when start date changes
  const [eventLength, setEventLength] = useState<number | null>(null);
  const [previousStart, setPreviousStart] = useState<string | null>(null);

  // Used to check if end date has changed, for updating event length
  const [previousEnd, setPreviousEnd] = useState<string | null>(null);
  const [endEnabled, setEndEnabled] = useState<boolean>(false);

  // Event data, and saving it
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const {fetchData} = useEventsController();
  const [eventData, setEventData] = useState<Event>(
    event ? {...event} : initializeNewEvent(startRegion),
  );

  // Field validation states
  const [nameFieldEdited, setNameFieldEdited] = useState<boolean>(false);
  const [nameValid, setNameValid] = useState<boolean>(
    (event && event.name !== '') || false,
  );
  const [formValid, setFormValid] = useState<boolean>(false);

  const trimEventTexts = (e: Event) =>
    ({
      ...e,
      name: e.name.trim(),
      description: e.description?.trim() || undefined,
      location: {
        ...e.location,
        description: e.location?.description?.trim(),
        marker: e.location?.marker?.trim(),
      },
    } as Event);

  // Validate form
  useEffect(() => {
    // Add future fields here
    if (event && eventData) {
      // You can only save changed events.
      setFormValid(
        nameValid &&
          (event.name !== eventData.name ||
            event.description !== eventData.description ||
            event.start !== eventData.start ||
            event.end !== eventData.end ||
            event.location?.description !== eventData.location?.description ||
            event.location?.marker !== eventData.location?.marker ||
            event.location?.latitude !== eventData.location?.latitude ||
            event.location?.longitude !== eventData.location?.longitude),
      );
      console.log(
        'Event start:',
        event.start,
        'Event data start:',
        eventData.start,
      );
    } else {
      setFormValid(nameValid);
    }
  }, [
    event,
    eventData,
    eventData.description,
    eventData.end,
    eventData.location?.description,
    eventData.location?.latitude,
    eventData.location?.longitude,
    eventData.location?.marker,
    eventData.name,
    eventData.start,
    nameValid,
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
          <Button
            title="Spara"
            disabled={!formValid}
            onPress={() => {
              if (!formValid) {
                return;
              }
              const timmedEventData = trimEventTexts(eventData);

              setIsSaving(true);
              (event
                ? // when editing
                  apiClient.put(`/user_event/${event.id}`, timmedEventData)
                : // when creating
                  apiClient.post('/user_event', timmedEventData)
              )
                .then(res => {
                  if (res.status !== 200 && res.status !== 201) {
                    throw new Error(
                      'Det gick inte att spara evenemanget. Försök igen.',
                    );
                  }
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
            }}
          />
        ),
    });
  }, [event, eventData, fetchData, formValid, isSaving, navigation]);

  useEffect(() => {
    if (event) {
      setEventData(event);
      setMapRegion({
        latitude: event.location?.latitude || startRegion.latitude,
        longitude: event.location?.longitude || startRegion.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } else {
      const newEvent = initializeNewEvent(startRegion);
      setEventData(newEvent);
    }
  }, [event]);

  useEffect(() => {
    setEventData({
      ...eventData,
      location: {
        ...eventData.location,
        latitude: startRegion.latitude,
        longitude: startRegion.longitude,
      },
    });
  }, [startRegion.latitude, startRegion.longitude]);

  // Adjust end date when start date changes
  const handleStartDateChange = useCallback(
    (date: Date) => {
      const datestring = date?.toISOString() || '';
      setEventData(prevEventData => ({
        ...prevEventData,
        start: datestring,
      }));

      if (datestring !== previousStart && eventData.end) {
        const newEnd = new Date(date);
        newEnd.setHours(newEnd.getHours() + (eventLength || 0));
        setEventData({...eventData, end: newEnd.toISOString()});
        setPreviousStart(date?.toISOString() || '');
      }
    },
    [eventData.start, eventLength, previousStart],
  );

  // Calculate event length when end date changes,
  const handleEndDateChange = useCallback(
    (date: Date) => {
      const datestring = date?.toISOString() || '';
      setEventData(prevEventData => ({
        ...prevEventData,
        end: datestring,
      }));

      if (datestring !== previousEnd && eventData.start) {
        const newLength =
          (new Date(date).getTime() - new Date(eventData.start).getTime()) /
          3600000;
        setEventLength(newLength);
        setPreviousEnd(datestring);
      }
    },
    [eventData.end, eventData.start, previousEnd],
  );

  // Set end time to an hour after start, if endEnabled becomes true and end is empty
  useEffect(() => {
    if (endEnabled && !eventData.end) {
      const newEnd = new Date(eventData.start);
      newEnd.setHours(newEnd.getHours() + 1);
      setEventData({...eventData, end: newEnd.toISOString()});
    } else if (!endEnabled && eventData.end) {
      setEventData({...eventData, end: undefined});
    }
  }, [endEnabled]);

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
                nameFieldEdited && !nameValid
                  ? 'Titeln får inte vara tom.'
                  : undefined
              }>
              <Input
                type={'text'}
                placeholder="Evenemangets titel"
                value={eventData.name}
                onChangeText={(text: string) => {
                  setEventData({...eventData, name: text});
                  setNameValid(text.trim().length > 0);
                }}
                onBlur={() => {
                  setNameFieldEdited(true);
                }}
              />
            </Field>

            <Field label="Beskrivning" help="Visas i Evenemangskortet">
              <TextArea
                placeholder="Beskrivning av evenemanget"
                value={eventData.description}
                onChangeText={(text: string) =>
                  setEventData({...eventData, description: text})
                }
                autoCompleteType={'off'}
              />
            </Field>

            <Field label="Start-tid" required>
              <DatePicker
                style={[styles.datepicker]}
                date={new Date(eventData?.start || Date.now())}
                mode="datetime"
                locale="sv"
                is24hourSource="locale"
                onDateChange={handleStartDateChange}
              />
            </Field>

            <Field
              label={<Text>Sluttid</Text>}
              labelControl={
                <Switch
                  isChecked={endEnabled}
                  onToggle={() => setEndEnabled(!endEnabled)}
                />
              }>
              {endEnabled && eventData?.end && (
                <DatePicker
                  style={[styles.datepicker]}
                  date={new Date(eventData.end)}
                  mode="datetime"
                  locale="sv"
                  is24hourSource="locale"
                  onDateChange={handleEndDateChange}
                />
              )}
            </Field>

            <Field label="Plats">
              <MapView
                style={styles.mapView}
                region={{
                  ...mapRegion,
                  latitude:
                    eventData.location?.latitude || startRegion.latitude,
                  longitude:
                    eventData.location?.longitude || startRegion.longitude,
                }}
                onRegionChangeComplete={region => {
                  setEventData({
                    ...eventData,
                    location: {
                      ...eventData.location,
                      latitude: region.latitude,
                      longitude: region.longitude,
                    },
                  });
                  setMapRegion(region);
                }}>
                <EventMarker
                  hasCallout={false}
                  event={
                    ({
                      ...eventData,
                      name: eventData?.name?.trim() || 'Exempel',
                      location: {
                        ...eventData.location,
                        latitude:
                          eventData.location?.latitude || startRegion.latitude,
                        longitude:
                          eventData.location?.longitude ||
                          startRegion.longitude,
                        description:
                          eventData.location?.description?.trim() ||
                          'Exempeladress 42',
                        marker:
                          eventData.location?.marker ||
                          clockForTime(Date.now().toString()),
                      },
                    } as EventWithLocation) ||
                    ({
                      name: 'Exempel',
                      start: Date.now().toString(),
                      end: '',
                      location: {
                        latitude: startRegion.latitude,
                        longitude: startRegion.longitude,
                        description: 'Exempeladress 42',
                        marker: clockForTime(Date.now().toString()),
                      },
                    } as EventWithLocation)
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
                value={eventData.location?.description}
                onChangeText={(text: string) =>
                  setEventData({
                    ...eventData,
                    location: eventData.location
                      ? {...eventData.location, description: text}
                      : {
                          latitude: startRegion.latitude,
                          longitude: startRegion.longitude,
                          description: text,
                        },
                  })
                }
              />
            </Field>

            <Field
              label="Kartsymbol"
              help="Används som kartmarkör och visas i Evenemangskortet (se nedan)">
              <Center w={'100%'} h={'150px'}>
                <Text style={styles.largeEmojiView}>
                  {eventData?.location?.marker ||
                    clockForTime(eventData?.start || Date.now().toString())}
                </Text>
              </Center>
              <Button
                title="Byt symbol"
                onPress={() => {
                  setEmojiPickerVisible(true);
                }}
              />
            </Field>

            <Field label="Evenemangets kort">
              <Box style={styles.eventCardContainer}>
                <EventCard
                  event={eventData as EventWithLocation}
                  initiallyOpen
                />
              </Box>
            </Field>
          </Fields>
        </ScrollView>
        {emojiPickerVisible && (
          <View style={[styles.emojiContainer]}>
            <EmojiSelector
              onEmojiSelected={(emoji: string) => {
                setEventData({
                  ...eventData,
                  location: eventData.location
                    ? {...eventData.location, marker: emoji}
                    : {
                        latitude: startRegion.latitude,
                        longitude: startRegion.longitude,
                        marker: emoji,
                      },
                });
                setEmojiPickerVisible(false);
              }}
            />
          </View>
        )}
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
    emojiContainer: {
      flex: 1,
      position: 'absolute',
      backgroundColor: theme.colors.background[500],
    },
    datepicker: {
      width: Dimensions.get('window').width,
    },
    mapView: {
      width: '100%',
      aspectRatio: 4 / 3,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.text[50],
    },
    largeEmojiView: {
      fontSize: 100,
      textAlign: 'center',
      color: theme.colors.text[50],
    },
    eventCardContainer: {
      borderWidth: 1,
      borderColor: theme.colors.text[50],
      borderRadius: 10,
    },
  });

export default EditEventForm;
