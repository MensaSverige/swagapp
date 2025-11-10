import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactNativeMapView, { Marker } from 'react-native-maps';
import MapView from 'react-native-maps';
import { View, Text, TextInput, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserEventLocation } from '../../../api_schema/types';
import lightMapstyle from '../../map/styles/light';
import darkMapstyle from '../../map/styles/dark';
import useStore from '../../common/store/store';
import { EditButton } from '../../common/components/EditButton';
import { getGeoLocation } from '../../map/services/locationService';
import MapLocationPreview from '../../map/components/MapLocationPreview';

interface EventMapFieldProps {
    location: UserEventLocation;
    onLocationChanged: (location: UserEventLocation) => void;
}

const EventMapField: React.FC<EventMapFieldProps> = ({
    location,
    onLocationChanged,
}) => {
    
    const colorMode = useColorScheme();
    
    const [addressEditEnabled, setAddressEditEnabled] = useState(location?.address ? false : true);
    const [locationForm, setLocationField] = useState({ ...location });
    if (!locationForm) {
        return null;
    }


    const searchLocation = useCallback(() => {
        if (!locationForm.address || locationForm.address.trim() === '') {
            console.log('Invalid address');
            return;
        }
        //reset location so old coordinates is not shown in case of error in maps request
        locationForm.latitude = null;
        locationForm.longitude = null;
        setAddressEditEnabled(false);
        getGeoLocation(locationForm.address).then((location) => {
            if (location) {
                const newLocationForm = { 
                    ...locationForm,
                    latitude: location.latitude,
                    longitude: location.longitude,
                    address: location.formatted_address, 
                };
                setLocationField(newLocationForm);
                onLocationChanged(newLocationForm)
            }
        })
    }, [locationForm.address, locationForm.latitude, locationForm.longitude, addressEditEnabled]);

    return (
        <View style={{ flex: 1, gap: 16, width: '100%', height: '100%' }}>
            {addressEditEnabled && (
                <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    borderWidth: 1, 
                    borderColor: '#ccc', 
                    borderRadius: 8, 
                    paddingHorizontal: 12 
                }}>
                    <TextInput
                        style={{ flex: 1, paddingVertical: 12 }}
                        defaultValue={locationForm.address || ''}
                        placeholder="Fabriksgatan 19, 702 23 Örebro"
                        onChangeText={(value: string) => {
                            setLocationField((locationForm) => ({ ...locationForm, address: value }));
                        }}
                        onEndEditing={searchLocation}
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
            )}

            <View style={{ paddingTop: 10 }}>
                {!addressEditEnabled && locationForm.address && locationForm.latitude && locationForm.longitude && (
                    <MapLocationPreview 
                        latitude={locationForm.latitude}
                        longitude={locationForm.longitude}
                        colorMode={colorMode || 'light'}
                    />
                )}
                {!addressEditEnabled && locationForm.address && (
                    <View style={{ 
                        flexDirection: 'row', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        gap: 16 
                    }}>
                        <Text>
                            {locationForm.address.includes(", Sweden") ? locationForm.address.replace(", Sweden", "") : locationForm.address}
                        </Text>

                        <EditButton
                            onPress={() => setAddressEditEnabled(true)}
                        />
                    </View>
                )}

            </View>

        </View>

    );
}
export default EventMapField;