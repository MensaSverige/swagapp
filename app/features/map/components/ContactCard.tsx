import React, { useEffect, useState } from 'react';
import { HStack, VStack, Heading, Pressable, Text, Modal, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Icon, CloseIcon } from '../../../gluestack-components';
import { Linking } from 'react-native';
import UserWithLocation from '../types/userWithLocation';
import { timeUntil } from '../../events/utilities/TimeLeft';
import { gluestackUIConfig } from '../../../gluestack-components/gluestack-ui.config';
import UserAvatar, { getOnlineStatusColor } from './UserAvatar';

type ContactCardProps = {
    user: UserWithLocation;
    showCard: boolean;
    onClose: () => void;
};

const ContactCard: React.FC<ContactCardProps> = ({ user, showCard, onClose }) => {
    const ref = React.useRef(null);
    const [comparisonDate, setComparisonDate] = useState(new Date());
    useEffect(() => {
        let intervalId = null;

        if (showCard) {
            intervalId = setInterval(() => {
                setComparisonDate(new Date());
            }, 1000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [showCard]);

    if (!user) {
        return null;
    }
    return (
        <Modal
            isOpen={showCard}
            onClose={onClose}
            finalFocusRef={ref}
            size='lg'
            style={{
                justifyContent: 'flex-end',
                bottom: 60,
            }}
        >
            <ModalContent>
  
                <ModalBody>
                <ModalCloseButton style={{ alignItems: 'flex-end' }}>
                        <Icon as={CloseIcon} />
                    </ModalCloseButton>
                    <HStack space="xl">
                        
                        <UserAvatar firstName={user.firstName} lastName={user.lastName} avatar_url={user.avatar_url} onlineStatus={user.onlineStatus} />
                        <VStack>
                            <Heading size="sm" color={gluestackUIConfig.tokens.colors.primary200} >{user.firstName} {user.lastName}</Heading>
                            {user.location.timestamp &&
                                <Text color={getOnlineStatusColor(user.onlineStatus)}>{timeUntil(comparisonDate, user.location.timestamp, true)} sedan</Text>
                            }
                            {user.contact_info?.email && user.contact_info.email.trim() !== '' && (
                                <Pressable
                                    onPress={() => {
                                        Linking.openURL(`mailto:${user.contact_info?.email}`);
                                    }}
                                >
                                    <Text>{user.contact_info.email} </Text>
                                </Pressable>
                            )}
                            {user.contact_info?.phone && user.contact_info.phone.trim() !== '' && (
                                <Pressable
                                    onPress={() => {
                                        Linking.openURL(`tel:${user.contact_info?.phone}`);
                                    }}
                                >
                                    <Text>{user.contact_info.phone}</Text>
                                </Pressable>
                            )}
                        </VStack>
                    </HStack>
                </ModalBody>
                <ModalFooter>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default React.memo(ContactCard, (prevProps, nextProps) => {
    // Only re-render if the isSelected prop has changed
    return prevProps.showCard === nextProps.showCard;
});