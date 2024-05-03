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
import ExternalEventCard from './ExternalEventCard';
import { ExternalEventDetails } from '../../../api_schema/types';

interface EventDetailsProps {
  event: ExternalEventDetails,
  open: boolean,
  onClose: () => void;
}

const ExternalEventCardModal: React.FC<EventDetailsProps> = ({
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
              position="absolute"
              top="$1"
              right="$1"
            >
              <Icon as={CloseIcon} />
            </ModalCloseButton>
            <ExternalEventCard
              eventDetails={event}
            />
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default React.memo(ExternalEventCardModal, (prevProps, nextProps) => {
  // Only re-render if the eventId changes or the open state changes
  return prevProps.event.eventId === nextProps.event.eventId && prevProps.open === nextProps.open;
});