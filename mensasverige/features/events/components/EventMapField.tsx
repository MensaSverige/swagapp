import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EditButton } from '../../common/components/EditButton';
import { getGeoLocation } from '../../map/services/locationService';
import MapLocationPreview from '../../map/components/MapLocationPreview';
import { createEditableFieldStyles } from '../../common/styles/editableFieldStyles';


const placeholderText = "Elmiavägen 8, 554 54, Jönkoping";
export type MapLocation = {
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
};
interface EventMapFieldProps {
    location: MapLocation;
    onLocationChanged: (location: MapLocation) => void;
    isEditing?: boolean;
    onEdit?: () => void;
}

const EventMapField: React.FC<EventMapFieldProps> = ({
    location,
    onLocationChanged,
    isEditing = false,
    onEdit,
}) => {
    
    const colorMode = useColorScheme();
    const styles = createEditableFieldStyles(colorMode);
    
    const [locationForm, setLocationField] = useState({ ...location });
    
    // Update internal state when location prop changes
    useEffect(() => {
        setLocationField({ ...location });
    }, [location]);

    if (!locationForm) {
        return null;
    }


    const searchLocation = useCallback(() => {
        // If address is empty, clear the entire location
        if (!locationForm.address || locationForm.address.trim() === '') {
            const clearedLocation = { 
                address: null,
                latitude: null, 
                longitude: null 
            };
            setLocationField(clearedLocation);
            onLocationChanged(clearedLocation);
            return;
        }
        
        //reset location so old coordinates is not shown in case of error in maps request
        const tempLocation = { ...locationForm, latitude: null, longitude: null };
        setLocationField(tempLocation);
        
        getGeoLocation(locationForm.address).then((location) => {
            if (location) {
                const newLocationForm = { 
                    ...locationForm,
                    latitude: location.latitude,
                    longitude: location.longitude,
                    address: location.formatted_address, 
                };
                setLocationField(newLocationForm);
                onLocationChanged(newLocationForm);
            }
        })
    }, [locationForm, onLocationChanged]);

    return (
        <View style={styles.mapContainer}>
            {isEditing ? (
                <View style={styles.editModeContainer}>
                    <Text style={styles.fieldLabel}>Adress</Text>
                    <View style={styles.mapInputWithIcon}>
                        <TextInput
                            style={styles.mapTextInputWithIcon}
                            value={locationForm.address || ''}
                            placeholder={placeholderText}
                            onChangeText={(value: string) => {
                                setLocationField((locationForm) => ({ ...locationForm, address: value }));
                            }}
                            onEndEditing={searchLocation}
                            autoFocus
                        />
                        <TouchableOpacity 
                            style={styles.mapSearchIconButton} 
                            onPress={searchLocation}
                        >
                            <Ionicons 
                                name="search" 
                                size={18} 
                                color="#666"
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View style={styles.mapPreviewContainer}>
                    {locationForm.address && locationForm.latitude && locationForm.longitude && (
                        <MapLocationPreview 
                            latitude={locationForm.latitude}
                            longitude={locationForm.longitude}
                            colorMode={colorMode || 'light'}
                        />
                    )}
                    <TouchableOpacity 
                        onPress={onEdit || (() => {})}
                        style={styles.mapDisplayContainer}>
                        {locationForm.address ? (
                            <Text style={styles.mapDisplayText}>
                                {locationForm.address.includes(", Sweden") ? locationForm.address.replace(", Sweden", "") : locationForm.address}
                            </Text>
                        ) :  (
                            <Text style={styles.placeholderText}>
                               {placeholderText}
                            </Text>
                        )}

                        <EditButton
                            onPress={onEdit || (() => {})}
                        />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

export default EventMapField;