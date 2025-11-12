import React, { useCallback, useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Text,
  Dimensions
} from 'react-native';
import EventCard from './UnifiedEventCard';
import CreateEventCard from './CreateEventCard';
import { Event } from '../../../api_schema/types';
import { canUserEditEvent } from '../utils/eventPermissions';
import useStore from '@/features/common/store/store';
import { MaterialIcons } from '@expo/vector-icons';

interface EventDetailsProps {
  event?: Event,
  open: boolean,
  onClose: () => void;
  onEventUpdated?: (event: Event) => void;
  onEventCreated?: (event: Event) => void;
  mode?: 'view' | 'edit' | 'create';
  initialEditMode?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxWidth: screenWidth - 40,
    maxHeight: screenHeight - 80,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalBody: {
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
    color: '#666',
  },
});

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
  const ref = React.useRef(null);
  const [isEditing, setIsEditing] = useState(mode === 'edit' || mode === 'create' || initialEditMode);

  const canEdit = mode === 'create' || (event && canUserEditEvent(event, user));
  const isCreateMode = mode === 'create';
  const isViewMode = mode === 'view';

  const handleClose = useCallback(() => {
    setIsEditing(false);
    onClose();
  }, [onClose]);

  const handleStartEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleEventUpdated = useCallback((updatedEvent: Event) => {
    setIsEditing(false);
    onEventUpdated?.(updatedEvent);
    onClose();
  }, [onEventUpdated, onClose]);

  const handleEventCreated = useCallback((createdEvent: Event) => {
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
      presentationStyle="fullScreen"
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <TouchableOpacity
          style={styles.modalContent}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalBody}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            
            {/* Show edit button only in view mode when user can edit */}
            {isViewMode && canEdit && !isEditing && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleStartEdit}
              >
                <MaterialIcons name="edit" size={20} color="#666" />
              </TouchableOpacity>
            )}
            
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
                isInModal={true}
              />
            ) : event ? (
              <EventCard
                event={event}
              />
            ) : null}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
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

// Export with both names for compatibility
export { UnifiedEventModal as EventCardModal };