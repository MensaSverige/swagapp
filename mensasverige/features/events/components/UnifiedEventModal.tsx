import React, { useCallback, useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import EventCard from './UnifiedEventCard';
import CreateEventCard from './CreateEventCard';
import { canUserEditEvent } from '../utils/eventPermissions';
import useStore from '@/features/common/store/store';
import { MaterialIcons } from '@expo/vector-icons';
import { ExtendedEvent } from '../types/eventUtilTypes';
import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';

interface EventDetailsProps {
  event?: ExtendedEvent,
  open: boolean,
  onClose: () => void;
  onEventUpdated?: (event: ExtendedEvent) => void;
  onEventCreated?: (event: ExtendedEvent) => void;
  mode?: 'view' | 'edit' | 'create';
  initialEditMode?: boolean;
}

const UnifiedEventModal: React.FC<EventDetailsProps> = ({
  event, 
  open, 
  onClose, 
  onEventUpdated,
  onEventCreated,
  mode = 'view',
  initialEditMode = false
}) => {
  const { user } = useStore();
  const colorScheme = useColorScheme();
  const ref = React.useRef(null);
  const [isEditing, setIsEditing] = useState(mode === 'edit' || mode === 'create' || initialEditMode);

  const canEdit = mode === 'create' || (event && canUserEditEvent(event, user));
  const isCreateMode = mode === 'create';
  const isViewMode = mode === 'view';

  const styles = createStyles(colorScheme ?? 'light');
  const backgroundColor = useThemeColor({}, 'background');
  const iconColor = useThemeColor({}, 'icon');

  const handleClose = useCallback(() => {
    setIsEditing(false);
    onClose();
  }, [onClose]);

  const handleStartEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleEventUpdated = useCallback((updatedEvent: ExtendedEvent) => {
    setIsEditing(false);
    onEventUpdated?.(updatedEvent);
    onClose();
  }, [onEventUpdated, onClose]);

  const handleEventCreated = useCallback((createdEvent: ExtendedEvent) => {
    setIsEditing(false);
    onEventCreated?.(createdEvent);
    onClose();
  }, [onEventCreated, onClose]);

  return (
    <Modal
      visible={open}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        {/* Card that is capped to the screen and can shrink */}
        <ThemedView style={styles.modalContent}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
          >
            <ThemedText style={styles.closeButtonText}>×</ThemedText>
          </TouchableOpacity>
          
          {/* Show edit button only in view mode when user can edit */}
          {isViewMode && canEdit && !isEditing && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleStartEdit}
            >
              <MaterialIcons name="edit" size={20} color={iconColor} />
            </TouchableOpacity>
          )}
          <View style={styles.bodyWrapper}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            {/* Render content based on mode and editing state */}
            {isEditing || isCreateMode ? (
              <CreateEventCard
                existingEvent={isCreateMode ? undefined : event}
                onEventUpdated={isCreateMode ? undefined : handleEventUpdated}
                onEventCreated={isCreateMode ? handleEventCreated : undefined}
                onCancel={() => {
                  if (isCreateMode) {
                    onClose();
                  } else {
                    setIsEditing(false);
                  }
                }}
              />
            ) : event ? (
              <EventCard
                event={event}
              />
            ) : null}
          </ScrollView>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
};

export default React.memo(UnifiedEventModal, (prevProps, nextProps) => {
  // Only re-render if key props change
  return prevProps.event?.id === nextProps.event?.id && 
         prevProps.open === nextProps.open &&
         prevProps.mode === nextProps.mode &&
         prevProps.onEventUpdated === nextProps.onEventUpdated &&
         prevProps.onEventCreated === nextProps.onEventCreated;
});

const createStyles = (colorScheme: string) => {
  return StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 60,
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: colorScheme === 'dark' ? Colors.dark.background50 : Colors.light.background0,
      borderRadius: 12,
      alignSelf: 'stretch',
      maxHeight: '100%',
      flexShrink: 1,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 8,
    },
    bodyWrapper: {
      maxHeight: '100%',
      minHeight: 0,
      flexShrink: 1,
      padding: 12,
    },
    scrollContent: {
      padding: 4,
      gap: 8,
    },
    closeButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      zIndex: 10,
      backgroundColor: colorScheme === 'dark' ? Colors.dark.background100 : Colors.light.background0,
      borderRadius: 20,
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    editButton: {
      position: 'absolute',
      top: 8,
      right: 56,
      zIndex: 10,
      backgroundColor: colorScheme === 'dark' ? Colors.dark.background100 : Colors.light.background0,
      borderRadius: 20,
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    closeButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
    },
  });
};


// Export with both names for compatibility
export { UnifiedEventModal as EventCardModal };