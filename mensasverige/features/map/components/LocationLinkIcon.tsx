import React from 'react';
import { Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LocationLinkProps, openLocation } from '../functions/openLocation';

export const LocationLinkButton: React.FC<LocationLinkProps> = (props) => {
    if (!props.latitude && !props.longitude && !props.address && !props.landmark) {
        return null;
    }

    return (
        <Pressable onPress={() => openLocation(props)}>
            <MaterialIcons name="directions" size={28} color="#3b82f6" />
        </Pressable>
    );
};
