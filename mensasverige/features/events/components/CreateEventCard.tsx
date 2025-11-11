import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Event } from '../../../api_schema/types';
import { DisplayTime } from '../utilities/DisplayTime';
import { displayLocaleTimeStringDate } from '../utils/eventUtils';
import { MaterialIcons } from '@expo/vector-icons';
import { EditButton } from '../../common/components/EditButton';
import { DatepickerField } from '../../common/components/DatepickerField';
import { createEvent } from '../services/eventService';
import EventDateTimeDisplay from './EventDateTimeDisplay';
import { Colors } from '@/constants/Colors';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateText: {
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 18,
    marginBottom: 0,
    color: Colors.blueGray500
  },
  timeText: {
    fontSize: 14,
    color: Colors.teal600,
    marginBottom: 12,
    paddingTop: 2,
  },
  eventImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: Colors.background50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.blueGray200,
    borderStyle: 'dashed',
  },
  placeholderContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    marginBottom: 8,
  },
  placeholderTextMain: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.blueGray500,
    marginBottom: 4,
  },
  placeholderTextSub: {
    fontSize: 14,
    color: Colors.blueGray400,
    textAlign: 'center',
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 0,
    color: '#111827',
  },
  headingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: Colors.blueGray500,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.blueGray200,
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.blueGray700,
  },
  vstack: {
    flex: 1,
  },
  hstack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editableField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editableInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.blueGray700,
    borderWidth: 1,
    borderColor: Colors.blueGray200,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginRight: 8,
  },
  editableInputLarge: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editableInputHeading: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholderText: {
    color: Colors.blueGray400,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: Colors.teal600,
  },
  cancelButton: {
    backgroundColor: Colors.blueGray500,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  editModeContainer: {
    backgroundColor: Colors.background50,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.blueGray500,
    marginBottom: 4,
  },
});

interface EditableFieldProps {
  label: string;
  value: string;
  placeholder: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (value: string) => void;
  multiline?: boolean;
  style?: any;
}

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  placeholder,
  isEditing,
  onEdit,
  onSave,
  multiline = false,
  style,
}) => {
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onSave(editValue);
  };

  if (isEditing) {
    return (
      <View style={styles.editModeContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.editableField}>
          <TextInput
            style={[
              styles.editableInput,
              multiline && styles.editableInputLarge,
              style,
            ]}
            value={editValue}
            onChangeText={setEditValue}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            multiline={multiline}
            onBlur={handleSave}
            onEndEditing={handleSave}
            autoFocus
          />
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity onPress={onEdit} style={styles.editableField}>
      <Text style={[
        value ? { color: '#374151' } : styles.placeholderText,
        style,
      ]}>
        {value || placeholder}
      </Text>
      <EditButton onPress={onEdit} />
    </TouchableOpacity>
  );
};

interface CreateEventCardProps {
  onEventCreated?: (event: Event) => void;
  onCancel?: () => void;
  hideButtons?: boolean;
}

const CreateEventCard: React.FC<CreateEventCardProps> = ({ 
  onEventCreated, 
  onCancel,
  hideButtons = false 
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Event data state
  const [eventData, setEventData] = useState<Partial<Event>>({
    name: '',
    description: '',
    locationDescription: '',
    address: '',
    start: new Date().toISOString(),
    end: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
    imageUrl: '',
    price: 0,
    official: false,
    attending: false,
    bookable: true,
    maxAttendees: null,
  });

  const updateField = useCallback((field: string, value: any) => {
    setEventData(prev => ({ ...prev, [field]: value }));
    setEditingField(null);
  }, []);

  const handleDateChange = useCallback((field: 'start' | 'end') => (date?: Date) => {
    if (date) {
      setEventData(prev => ({ ...prev, [field]: date.toISOString() }));
    }
  }, []);

  const validateAndCreateEvent = async () => {
    // Basic validation
    if (!eventData.name?.trim()) {
      Alert.alert('Error', 'Event name is required');
      return;
    }
    
    if (!eventData.start) {
      Alert.alert('Error', 'Start date is required');
      return;
    }

    if (eventData.end && new Date(eventData.end) <= new Date(eventData.start)) {
      Alert.alert('Error', 'End date must be after start date');
      return;
    }

    setIsCreating(true);

    try {
      // Create event object with required fields
      const eventToCreate: Event = {
        id: '', // Will be generated by the server
        name: eventData.name,
        description: eventData.description || null,
        locationDescription: eventData.locationDescription || null,
        address: eventData.address || null,
        start: eventData.start,
        end: eventData.end || null,
        imageUrl: eventData.imageUrl || null,
        price: eventData.price || 0,
        official: false, // User-created events are not official
        attending: false,
        bookable: eventData.bookable || true,
        maxAttendees: eventData.maxAttendees || null,
        showAttendees: 'none' as any, // Default value
        cancelled: null,
        bookingStart: null,
        bookingEnd: null,
        locationMarker: null,
        latitude: null,
        longitude: null,
        parentEvent: null,
        admin: [],
        hosts: [],
        tags: [],
        attendees: [],
        queue: [],
        extras: {},
      };

      const createdEvent = await createEvent(eventToCreate);
      onEventCreated?.(createdEvent);
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const startDate = eventData.start ? new Date(eventData.start) : new Date();
  const endDate = eventData.end ? new Date(eventData.end) : null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        {/* Date and Time - Editable */}
        {editingField === 'dateTime' ? (
          <View style={styles.editModeContainer}>
            <Text style={styles.fieldLabel}>Välj datum och tid</Text>
            <DatepickerField
              label="Starttid"
              date={startDate}
              minimumDate={new Date()}
              onDateChange={handleDateChange('start')}
            />
            <DatepickerField
              label="Sluttid"
              date={endDate || undefined}
              minimumDate={startDate}
              onDateChange={handleDateChange('end')}
            />
            <TouchableOpacity 
              style={[styles.button, styles.createButton, { marginTop: 12, paddingVertical: 8 }]}
              onPress={() => setEditingField(null)}
            >
              <Text style={[styles.buttonText, { fontSize: 14 }]}>Klar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <EventDateTimeDisplay
            start={eventData.start || new Date().toISOString()}
            end={eventData.end}
            isEditable={true}
            onEdit={() => setEditingField('dateTime')}
          />
        )}

        {/* Divider after date/time fields */}
        <View style={styles.divider} />

        <View style={styles.vstack}>
          {/* Image Container - Always shown */}
          <TouchableOpacity 
            style={styles.imageContainer}
            onPress={() => setEditingField('imageUrl')}
            activeOpacity={0.8}
          >
            {eventData.imageUrl ? (
              <>
                <Image
                  style={styles.eventImage}
                  source={{ uri: eventData.imageUrl }}
                  onError={() => {
                    Alert.alert('Invalid Image', 'The provided image URL is not valid');
                    updateField('imageUrl', '');
                  }}
                />
              </>
            ) : (
              <View style={styles.imagePlaceholder}>
                <View style={styles.placeholderContent}>
                  <MaterialIcons 
                    name="add-photo-alternate" 
                    size={48} 
                    color={Colors.blueGray600}
                    style={styles.placeholderIcon}
                  />
                  <Text style={styles.placeholderTextMain}>Lägg till bild</Text>
                  <Text style={styles.placeholderTextSub}>Tryck för att lägga till en bild</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* Event Name */}
          <View style={styles.headingContainer}>
            <View style={{ flex: 1 }}>
              <EditableField
                label="Event Name"
                value={eventData.name || ''}
                placeholder="Aktivitetens namn *"
                isEditing={editingField === 'name'}
                onEdit={() => setEditingField('name')}
                onSave={(value) => updateField('name', value)}
                style={styles.editableInputHeading}
              />
            </View>
          </View>

          {/* Location */}
          <EditableField
            label="Location"
            value={eventData.locationDescription || eventData.address || ''}
            placeholder="Scandic Elmia, Rum 107"
            isEditing={editingField === 'location'}
            onEdit={() => setEditingField('location')}
            onSave={(value) => updateField('locationDescription', value)}
          />

          {/* Address */}
          <EditableField
            label="Address"
            value={eventData.address || ''}
            placeholder="Elmiavägen 8, 554 54, Jönkoping"
            isEditing={editingField === 'address'}
            onEdit={() => setEditingField('address')}
            onSave={(value) => updateField('address', value)}
          />

          {/* Price */}
          {/* <EditableField
            label="Price (SEK)"
            value={eventData.price?.toString() || '0'}
            placeholder="0"
            isEditing={editingField === 'price'}
            onEdit={() => setEditingField('price')}
            onSave={(value) => updateField('price', parseInt(value) || 0)}
          /> */}

          {/* Max Attendees */}
          <EditableField
            label="Max Attendees"
            value={eventData.maxAttendees?.toString() || ''}
            placeholder="Max antal personer"
            isEditing={editingField === 'maxAttendees'}
            onEdit={() => setEditingField('maxAttendees')}
            onSave={(value) => updateField('maxAttendees', value ? parseInt(value) : null)}
          />

          <View style={styles.divider} />

          {/* Event Description */}
          <EditableField
            label="Description"
            value={eventData.description || ''}
            placeholder="Beskrivning av aktiviteten"
            isEditing={editingField === 'description'}
            onEdit={() => setEditingField('description')}
            onSave={(value) => updateField('description', value)}
            multiline
          />

          {/* Action Buttons */}
          {!hideButtons && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
                disabled={isCreating}
              >
                <Text style={styles.buttonText}>Avbryt</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.createButton]}
                onPress={validateAndCreateEvent}
                disabled={isCreating || !eventData.name?.trim()}
              >
                {isCreating ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.buttonText}>Skicka inbjudan</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default CreateEventCard;