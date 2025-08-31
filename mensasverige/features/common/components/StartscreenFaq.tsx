import React, { useEffect } from 'react';
import { LocationLinkButton } from '../../map/components/LocationLinkIcon';
import { ExternalRoot } from '../../../api_schema/types';
import { fetchExternalRoot } from '../../events/services/eventService';
import { View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

const StartscreenFaq = () => {
    const [eventInfo, setEventInfo] = React.useState<ExternalRoot>();

    useEffect(() => {
        fetchExternalRoot().then((eventInfo) => {
            setEventInfo(eventInfo);
        });
    }
        , []);
    return (
        <>
            {eventInfo && (
                <View>
                    {eventInfo && (
                        <>
                            <View>
                                <ThemedText>{eventInfo?.header1}</ThemedText>
                                <ThemedText>{eventInfo?.header2}</ThemedText>
                            </View>
                            {eventInfo && eventInfo.streetAddress && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 8 }}  >
                                    <ThemedText type='link'>{eventInfo?.streetAddress}</ThemedText>
                                    <LocationLinkButton address={eventInfo.streetAddress} />
                                </View>
                            )}
                        </>
                    )}

                </View>
            )}
        </>
    );
};

export default StartscreenFaq;
