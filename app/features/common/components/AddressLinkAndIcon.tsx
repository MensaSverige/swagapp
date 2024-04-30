import React from 'react';
import { Pressable, Platform, Linking } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faDiamondTurnRight } from '@fortawesome/free-solid-svg-icons';
import { config } from '../../../gluestack-components/gluestack-ui.config';
import { HStack, Text } from '../../../gluestack-components';

interface AddressLinkAndIconProps {
    latitude?: number;
    longitude?: number;
    address?: string;
    landmark?: string;
}

const AddressLinkAndIcon: React.FC<AddressLinkAndIconProps> = ({ latitude, longitude, address, landmark }) => {
    if (!latitude && !longitude && !address && !landmark) {
        return;
    }

    return (
        <Pressable
            onPress={() => {
                let query = '';
                if (landmark) {
                    query += landmark;
                }
                if (address) {
                    query += (query ? ', ' : '') + address;
                }
                if (!query) {
                    query = `${latitude?.toString()},${longitude?.toString()}`;
                }
                const url = Platform.select({
                    ios: `maps:0,0?q=${encodeURIComponent(query)}`,
                    android: `geo:0,0?q=${encodeURIComponent(query)}`
                });
                if (!url) {
                    return;
                }
                console.log('Opening location link:', url);
                Linking.openURL(url);
            }}
        >
            {address &&
                <HStack flex={1}  space="md" justifyContent="space-between" alignItems="center">
                    <Text color="$blue400">
                        {address.includes(', Sweden')
                            ? address.replace(', Sweden', '')
                            : address}
                    </Text>
                    <FontAwesomeIcon icon={faDiamondTurnRight} size={18} color={config.tokens.colors.blue400} />

                </HStack>

            }
        </Pressable>
    );
};

export default AddressLinkAndIcon;