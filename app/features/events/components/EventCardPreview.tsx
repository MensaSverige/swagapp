import React from 'react';
import EventCard from '../components/EventCard';
import FutureUserEvent from '../types/futureEvent';
import {
  Button,
  ButtonText,
  Center,
  CloseIcon,
  Heading,
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Icon,
  HStack
} from '../../../gluestack-components';


interface EventCardPreviewProps {
  event: FutureUserEvent,
  showPreview: boolean;
  onClose: () => void;
  onSave: () => void;
}

const EventCardPreview: React.FC<EventCardPreviewProps> = ({
  event,
  showPreview,
  onClose, 
  onSave
}) => {
  const ref = React.useRef(null);
  return (
    <Modal
      size="lg"
      isOpen={showPreview}
      onClose={onClose}
      finalFocusRef={ref}
    >
      <ModalBackdrop bg="$coolGray500" />
      <ModalContent>
        <ModalHeader>
          <Heading size="lg">Förhandsgranska event </Heading>
          <ModalCloseButton>
            <Icon as={CloseIcon} />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <EventCard
            event={event}
            initiallyOpen
          />
        </ModalBody>
        <ModalFooter>
          <HStack space="lg" h="100%" flex={1} justifyContent="space-evenly" paddingBottom={20} >
            <Button
              size="md"
              variant="outline"
              action="secondary"
              borderColor="$vscode_stringLiteral"
              isDisabled={false}
              isFocusVisible={false}
            >
              <ButtonText color='$vscode_stringLiteral'>Avbryt </ButtonText>
            </Button>

            <Button
              style={{ right: 10 }}
              size="md"
              variant="solid"
              action="primary"
              backgroundColor="$vscode_const"
              isDisabled={false}
              isFocusVisible={false}
            >
              <ButtonText>Spara</ButtonText>
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EventCardPreview;