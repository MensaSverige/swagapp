import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactNativeMapView, { Marker } from 'react-native-maps';
import MapView from 'react-native-maps';
import { View, Text, TextInput, TouchableOpacity, useColorScheme, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import lightMapstyle from '../../map/styles/light';
import darkMapstyle from '../../map/styles/dark';
import useStore from '../../common/store/store';
import { EditButton } from '../../common/components/EditButton';
import { getGeoLocation } from '../../map/services/locationService';
import MapLocationPreview from '../../map/components/MapLocationPreview';
import { Colors } from '@/constants/Colors';


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
        <View style={{ flex: 1, gap: 16, width: '100%', height: '100%' }}>
            {isEditing ? (
                <View style={{
                    backgroundColor: Colors.background50,
                    borderRadius: 8,
                    padding: 12,
                }}>
                    <Text style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: Colors.blueGray500,
                        marginBottom: 8,
                    }}>Adress</Text>
                    <View style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        borderWidth: 1, 
                        borderColor: '#ccc', 
                        borderRadius: 8, 
                        paddingHorizontal: 12,
                        backgroundColor: Colors.white,
                    }}>
                        <TextInput
                            style={{ flex: 1, paddingVertical: 12 }}
                            defaultValue={locationForm.address || ''}
                            placeholder={placeholderText}
                            onChangeText={(value: string) => {
                                setLocationField((locationForm) => ({ ...locationForm, address: value }));
                            }}
                            onEndEditing={searchLocation}
                            autoFocus
                        />
                        <TouchableOpacity 
                            style={{ paddingRight: 12 }} 
                            onPress={searchLocation}
                        >
                            <Ionicons 
                                name="search" 
                                size={20} 
                                color="#007AFF"
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View style={{ paddingTop: 10 }}>
                    {locationForm.address && locationForm.latitude && locationForm.longitude && (
                        <MapLocationPreview 
                            latitude={locationForm.latitude}
                            longitude={locationForm.longitude}
                            colorMode={colorMode || 'light'}
                        />
                    )}
                    <TouchableOpacity 
                        onPress={onEdit || (() => {})}
                        style={{ 
                            flexDirection: 'row', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            gap: 16,                     
                        }}>
                        {locationForm.address ? (
                            <Text>
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

const styles = StyleSheet.create({
      placeholderText: {
    color: Colors.blueGray400,
    fontStyle: 'italic',
  },
});
export default EventMapField;