import React, { useCallback } from 'react';
import {
  Box,
  CloseIcon,
  Icon,
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent
} from '../../../gluestack-components';
import FutureUserEvent from '../types/futureUserEvent';
import EventCard from './EventCard';

interface EventCardModalProps {
  event: FutureUserEvent,
  open: boolean,
  onClose: () => void;
}

const ExternalEventCardModal: React.FC<EventCardModalProps> = ({
  event, open, onClose
}) => {
  const ref = React.useRef(null);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Modal
      size="lg"
      paddingVertical="$10"
      margin={0}
      finalFocusRef={ref}
      isOpen={open}
      onClose={handleClose}
    >
      <ModalBackdrop bg="$coolGray500" />
      <ModalContent>
        <ModalBody paddingHorizontal={0} paddingBottom={0}>
          <Box position="relative">
            <ModalCloseButton
              padding={15}
              position="absolute"
              top="$1"
              right="$1"
            >
              <Icon as={CloseIcon} />
            </ModalCloseButton>
            <EventCard
              event={event}
              staticallyOpen={true}
            />
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default React.memo(ExternalEventCardModal, (prevProps, nextProps) => {
  // Only re-render if the eventId changes or the open state changes
  return prevProps.event.id === nextProps.event.id && prevProps.open === nextProps.open;
});