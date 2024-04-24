import React, { useEffect, useState } from 'react';
import { HStack, VStack, Heading, Pressable, Text, Modal, ModalContent, ModalCloseButton, ModalBody, Icon, CloseIcon } from '../../../gluestack-components';
import { Linking, Platform } from 'react-native';
import UserWithLocation from '../types/userWithLocation';
import { timeUntil } from '../../events/utilities/TimeLeft';
import { gluestackUIConfig } from '../../../gluestack-components/gluestack-ui.config';
import UserAvatar, { getOnlineStatusColor } from './UserAvatar';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faDiamondTurnRight, faEnvelope, faLocationArrow, faMap, faPhone } from '@fortawesome/free-solid-svg-icons';

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
            <ModalContent
                bg="$background50"
            >
                <ModalBody >
                    <ModalCloseButton style={{ alignItems: 'flex-end' }}>
                        <Icon as={CloseIcon} />
                    </ModalCloseButton>
                    <HStack space="xl" >

                        <UserAvatar firstName={user.firstName} lastName={user.lastName} avatar_url={user.avatar_url} onlineStatus={user.onlineStatus} />
                        <VStack style={{ flex: 1 }}>
                            <Heading size="sm" color={gluestackUIConfig.tokens.colors.primary200} >{user.firstName} {user.lastName}</Heading>
                            {user.location.timestamp &&
                                <Text color={getOnlineStatusColor(user.onlineStatus)}>{timeUntil(comparisonDate, user.location.timestamp)} sedan</Text>
                            }

                            <HStack space="xl" style={{ flex: 1, marginTop: 10, marginBottom: 20, marginRight: 30, alignItems: 'center', justifyContent: 'flex-end' }}>
                                {user.contact_info?.phone && user.contact_info.phone.trim() !== '' && (
                                    <Pressable
                                        style={{ marginRight: 10 }}
                                        onPress={() => {
                                            Linking.openURL(`tel:${user.contact_info?.phone}`);
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faPhone} size={24} color={gluestackUIConfig.tokens.colors.green500} />
                                    </Pressable>
                                )}
                                {user.contact_info?.email && user.contact_info.email.trim() !== '' && (
                                    <Pressable
                                        style={{ marginRight: 10 }}
                                        onPress={() => {
                                            Linking.openURL(`mailto:${user.contact_info?.email}`);
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faEnvelope} size={28} color={gluestackUIConfig.tokens.colors.warmGray400} />
                                    </Pressable>
                                )}

                                {user.location && (
                                    <Pressable
                                        onPress={() => {
                                            const url = Platform.select({
                                                ios: `maps:0,0?q=${user.location.latitude},${user.location.longitude}`,
                                                android: `geo:0,0?q=${user.location.latitude},${user.location.longitude}`
                                            });
                                            if (!url) {
                                                return;
                                            }
                                            Linking.openURL(url);
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faDiamondTurnRight} size={28} color={gluestackUIConfig.tokens.colors.blue400} />
                                    </Pressable>
                                )}
                            </HStack>
                        </VStack>
                    </HStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default React.memo(ContactCard, (prevProps, nextProps) => {
    // Only re-render if the showCard or colorMode prop has changed
    return prevProps.showCard === nextProps.showCard;
});