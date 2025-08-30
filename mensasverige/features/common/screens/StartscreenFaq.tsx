import React, { useEffect } from 'react';
import { Card, Heading, Text, VStack } from '../../../gluestack-components';
import { LocationLinkButton } from '../../map/components/LocationLinkIcon';
import { ExternalRoot } from '../../../api_schema/types';
import { fetchExternalRoot } from '../../events/services/eventService';

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
                <Card size="sm" padding={0} borderRadius="$lg" borderColor='$info600' variant="outline" m="$0">
                    <VStack>
                        {eventInfo && (
                            <>
                                <Card size="sm" variant="ghost" m="$0" style={{ flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    <Heading size="xl" >{eventInfo?.header1}</Heading>
                                    <Heading size="sm" >{eventInfo?.header2}</Heading>
                                </Card>
                                <Card size="sm" variant="ghost" m="$0" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Text style={{ flexShrink: 1 }}><Text style={{ fontWeight: 'bold' }}>{eventInfo?.streetAddress}</Text> </Text>
                                    {eventInfo && eventInfo.streetAddress && eventInfo.city && (
                                        <LocationLinkButton address={eventInfo.streetAddress} />
                                    )}
                                </Card>
                            </>
                        )}
                    </VStack>
                </Card>
            )}
        </>
    );
};

export default StartscreenFaq;
