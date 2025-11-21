
import React, { useEffect, useRef } from 'react';
// import ReactNativeMapView, { Marker } from 'react-native-maps';
// import MapView from 'react-native-maps';
import lightMapstyle from '../../map/styles/light';
import darkMapstyle from '../../map/styles/dark';
import useStore from '../../common/store/store';

const MapLocationPreview = ({ latitude, longitude, colorMode }: { latitude: number, longitude: number, colorMode: string }) => {    
    // const mapRef = useRef<ReactNativeMapView | null>(null);
    const { region } = useStore();
    
    useEffect(() => {
        // if (mapRef.current && latitude && longitude) {
        //     mapRef.current.animateToRegion({
        //         latitude: latitude,
        //         longitude: longitude,
        //         latitudeDelta: region.latitudeDelta,
        //         longitudeDelta: region.longitudeDelta,
        //     }, 350);
        // }
    }, [latitude, longitude]);
    return (
        null
    // <MapView
    //     style={{ height: 120 }}
    //     initialRegion={{
    //         latitude: latitude,
    //         longitude: longitude,
    //         latitudeDelta: 0.001,
    //         longitudeDelta: 0.001,
    //     }}
    //     customMapStyle={colorMode === 'dark' ? darkMapstyle : lightMapstyle}
    // >
    //     <Marker
    //         coordinate={{
    //             latitude: latitude,
    //             longitude: longitude,
    //         }}
    //     />
    // </MapView>
    );
};

export default MapLocationPreview;