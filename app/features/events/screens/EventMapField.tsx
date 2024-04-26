import React from 'react';
import ReactNativeMapView, { Marker } from 'react-native-maps';
import MapView from 'react-native-maps';
import { UserEventLocation } from '../../../api_schema/types';

interface EventMapFieldProps {
    latitude: number;
    longitude: number;
    // eventLocation: UserEventLocation;
    // setEventLocationLatitude: (latitude: number) => void;
    // setEventLocationLongitude: (longitude: number) => void;
    // setMapRegionDeltas: (deltas: any) => void;
    // eventName: string;
    // eventStartDate: Date;
    // eventEndDate: Date | null;
    // eventLocationDescription: string;
    // eventLocationMarker: any; // replace 'any' with the actual type
    // startRegion: any; // replace 'any' with the actual type
}

const EventMapField: React.FC<EventMapFieldProps> = ({
    latitude: eventLocationLatitude,
    longitude: eventLocationLongitude,
    // mapRegionDeltas,
    // eventLocation,
    // setEventLocationLatitude,
    // setEventLocationLongitude,
    // setMapRegionDeltas,
    // eventName,
    // eventStartDate,
    // eventEndDate,
    // eventLocationDescription,
    // eventLocationMarker,
    // startRegion,
}) => {

    return (
        <MapView

        >
            <Marker
                coordinate={{
                    latitude: eventLocationLatitude,
                    longitude: eventLocationLongitude,
                }}
                title="Eventplats"
                //description={eventLocationDescription}
            />
            {/* <EventMarker
                hasCallout={false}
                event={
                    {
                        name: eventName.trim() || 'Exempel',
                        start: eventStartDate.toISOString(),
                        end: eventEndDate?.toISOString() || undefined,
                        location: {
                            latitude: eventLocationLatitude || startRegion.latitude,
                            longitude:
                                eventLocationLongitude || startRegion.longitude,
                            description:
                                eventLocationDescription || 'Exempeladress 42',
                            marker: eventLocationMarker || clockForTime(new Date()),
                        },
                    } as EventWithLocation
                }
            /> */}
        </MapView>

    );
}
export default EventMapField;