import React from 'react';
import { Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LocationLinkProps, openLocation } from '../functions/openLocation';

/**
 * Opens a place in the member's map app.
 *
 * `approximate` is for a place the backend geocoded rather than a venue
 * somebody typed: it still opens a map search, which is honest for a postal
 * code, but shows a plain marker instead of offering directions to a city
 * centre as if that were the address. Docs: docs/Geocoding.md
 */
export const LocationLinkButton: React.FC<LocationLinkProps & { approximate?: boolean }> = ({
    approximate = false,
    ...props
}) => {
    if (!props.latitude && !props.longitude && !props.address && !props.landmark) {
        return null;
    }

    return (
        <Pressable
            onPress={() => openLocation(props)}
            accessibilityRole="link"
            accessibilityLabel={approximate ? 'Visa ungefärlig plats på kartan' : 'Vägbeskrivning'}
        >
            <MaterialIcons name={approximate ? 'place' : 'directions'} size={28} color="#3b82f6" />
        </Pressable>
    );
};
