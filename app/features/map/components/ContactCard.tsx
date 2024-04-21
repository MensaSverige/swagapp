import React, { useEffect, useState } from 'react';
import { HStack, VStack, Heading, Pressable, Text } from '../../../gluestack-components';
import { Linking } from 'react-native';
import UserWithLocation from '../types/userWithLocation';
import { timeUntil } from '../../events/utilities/TimeLeft';
import { gluestackUIConfig } from '../../../gluestack-components/gluestack-ui.config';
import UserAvatar from './UserAvatar';

type ContactCardProps = {
    user: UserWithLocation;
    isSelected: boolean;
};

const ContactCard: React.FC<ContactCardProps> = ({ user, isSelected }) => {
    const [comparisonDate, setComparisonDate] = useState(new Date());
    useEffect(() => {
        let intervalId = null;

        if (isSelected) {
            intervalId = setInterval(() => {
                setComparisonDate(new Date());
            }, 1000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isSelected]);

    if (!user) {
        return null;
    }
    return (
        <HStack space="md">
            <UserAvatar firstName={user.firstName} lastName={user.lastName} avatar_url={user.avatar_url} />

            <VStack>
                <Heading size="sm" color={gluestackUIConfig.tokens.colors.primary200} >{user.firstName} {user.lastName}</Heading>
                {user.location.timestamp &&
                    <Text>{timeUntil(comparisonDate, user.location.timestamp)} sedan</Text>
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
    );
};

export default React.memo(ContactCard, (prevProps, nextProps) => {
    // Only re-render if the isSelected prop has changed
    return prevProps.isSelected === nextProps.isSelected;
});