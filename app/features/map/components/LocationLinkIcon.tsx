import React from 'react';
import { Pressable } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faDiamondTurnRight } from '@fortawesome/free-solid-svg-icons';
import { config } from '../../../gluestack-components/gluestack-ui.config';
import { LocationLinkProps, openLocation } from '../functions/openLocation';

export const LocationLinkButton: React.FC<LocationLinkProps> = (props) => {
    if (!props.latitude && !props.longitude && !props.address && !props.landmark) {
        return null;
    }

    return (
        <Pressable onPress={() => openLocation(props)}>
            <FontAwesomeIcon icon={faDiamondTurnRight} size={28} color={config.tokens.colors.blue400} />
        </Pressable>
    );
};
