import React from 'react';
import { Platform, Linking } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faDiamondTurnRight } from '@fortawesome/free-solid-svg-icons';
import { config } from '../../../gluestack-components/gluestack-ui.config';
import { HStack, Pressable, Text } from '../../../gluestack-components';
import { LocationLinkProps, openLocation } from '../functions/openLocation';


export const AddressLinkAndIcon: React.FC<LocationLinkProps> = (props) => {
    if (!props.displayName) {
        return null;
    }

    return (
        <Pressable height={50} width="$full" onPress={() => openLocation(props)}>
            <HStack flex={1} space="md" justifyContent="flex-start" alignItems="center" >
                <Text color="$blue400">
                    {props.displayName}
                </Text>
                <FontAwesomeIcon icon={faDiamondTurnRight} size={18} color={config.tokens.colors.blue400} />

            </HStack>

        </Pressable>
    );
};