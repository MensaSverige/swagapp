import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactNativeMapView, { Marker } from 'react-native-maps';
import MapView from 'react-native-maps';
import { UserEventLocation } from '../../../api_schema/types';
import lightMapstyle from '../../map/styles/light';
import darkMapstyle from '../../map/styles/dark';
import { useColorMode } from '@gluestack-ui/themed';
import useStore from '../../common/store/store';
import { Input, InputField, InputIcon, InputSlot, SearchIcon, Text, VStack } from '../../../gluestack-components';
import { HStack } from 'native-base';
import { EditButton } from '../../common/components/EditButton';
import { getGeoLocation } from '../../map/services/locationService';

interface EventMapFieldProps {
    location: UserEventLocation;
    onLocationChanged: (location: UserEventLocation) => void;
}

const EventMapField: React.FC<EventMapFieldProps> = ({
    location,
    onLocationChanged,
}) => {
    const mapRef = useRef<ReactNativeMapView | null>(null);
    const colorMode = useColorMode();
    const { region } = useStore();
    const [addressEditEnabled, setAddressEditEnabled] = useState(true);
    const [locationForm, setLocationField] = useState({ ...location });
    if (!locationForm) {
        return null;
    }
    useEffect(() => {
        if (mapRef.current && locationForm && locationForm.latitude && locationForm.longitude) {
            mapRef.current.animateToRegion({
                latitude: locationForm.latitude,
                longitude: locationForm.longitude,
                latitudeDelta: region.latitudeDelta,
                longitudeDelta: region.longitudeDelta,
            }, 350);
        }
    }, [locationForm.latitude, locationForm.longitude]);

    const searchLocation = useCallback(() => {
        if (!locationForm.address || locationForm.address.trim() === '') {
            console.log('Invalid address');
            return;
        }
        getGeoLocation(locationForm.address).then((location) => {
            if (location) {

                setLocationField((locationForm) => ({
                    ...locationForm,
                    latitude: location.latitude,
                    longitude: location.longitude,
                    address: location.formatted_address
                }));
                  
            }
        })
        .finally(() => {
            onLocationChanged(locationForm); 
            setAddressEditEnabled(false)
        });
    }, [locationForm.address]);


    return (
        <VStack style={{ flex: 1 }} width="100%" height="100%">
            {addressEditEnabled && (
            <Input>
                <InputField
                    type="text"
                    defaultValue={locationForm.address || ''}
                    placeholder="Fabriksgatan 19, 702 23 Örebro"
                    onChangeText={(value) => {
                        setLocationField((locationForm) => ({ ...locationForm, address: value }));
                    }}
                    onEndEditing={searchLocation}
                />
                <InputSlot pr="$3" onPress={searchLocation}>
                    <InputIcon
                        as={SearchIcon}
                        color="$primary500"
                    />
                </InputSlot>
            </Input>
            )}
            {!addressEditEnabled && locationForm.address && locationForm.latitude && locationForm.longitude && (
                <VStack>
                    <MapView
                        style={{ height: 120 }}
                        initialRegion={{
                            latitude: locationForm.latitude,
                            longitude: locationForm.longitude,
                            latitudeDelta: 0.001,
                            longitudeDelta: 0.001,
                        }}
                        customMapStyle={colorMode === 'dark'
                            ? darkMapstyle
                            : lightMapstyle}>
                        <Marker
                            coordinate={{
                                latitude: locationForm.latitude,
                                longitude: locationForm.longitude,
                            }}
                        />
                    </MapView>
                    <HStack space="md" justifyContent="space-between" alignItems="center">
                        <Text>
                            {locationForm.address.includes(", Sweden") ? locationForm.address.replace(", Sweden", "") : locationForm.address}
                        </Text>

                        <EditButton
                            onPress={() => setAddressEditEnabled(true)}
                        />
                    </HStack>
                </VStack>
            )}
        </VStack>

    );
}
export default EventMapField;