import React from 'react';
import { Card, HStack, Text, VStack } from '../../../gluestack-components';
import LocationLinkButton from '../components/LocationLinkIcon';

const StartscreenFaq = () => {
    return (
        <Card size="sm" padding={0} borderRadius="$lg" borderColor='$info600' variant="outline" m="$0">
            <VStack>
                <Card size="sm" variant="ghost" m="$0" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ flexShrink: 1 }}><Text color="$info600" style={{ fontWeight: 'bold' }}>Huvudhotell:</Text> Scandic Grand Örebro, Fabriksgatan 21–23</Text>
                    <LocationLinkButton landmark='Scandic Grand Örebro' address='Fabriksgatan 21-23, 702 23 Örebro' />
                </Card>
                <Card size="sm" variant="ghost" m="$0" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ flexShrink: 1 }}><Text color="$info600" style={{ fontWeight: 'bold' }}>Årsmöte:</Text> Lördagen den 11 maj klockan 10:30, Conventum, Club 700</Text>
                    <LocationLinkButton landmark="Conventum Club 700" address='Drottninggatan 42, 702 22 Örebro' />
                </Card>
                <Card size="sm" variant="ghost" m="$0" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ flexShrink: 1 }}><Text color="$info600" style={{ fontWeight: 'bold' }}>Officiell invigning:</Text> Torsdagskvällen klockan 17, Club 700 på Conventum</Text>
                    <LocationLinkButton landmark="Conventum Club 700" address='Drottninggatan 42, 702 22 Örebro' />
                </Card>
            </VStack>
        </Card>
    );
};

export default StartscreenFaq;
