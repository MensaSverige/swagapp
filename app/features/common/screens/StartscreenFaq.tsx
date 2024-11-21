import React from 'react';
import { Card, Text, VStack } from '../../../gluestack-components';
import {LocationLinkButton} from '../../map/components/LocationLinkIcon';

const StartscreenFaq = () => {
    return (
        <Card size="sm" padding={0} borderRadius="$lg" borderColor='$info600' variant="outline" m="$0">
            <VStack>
            <Card size="sm" variant="ghost" m="$0" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ flexShrink: 1 }}><Text color="$info600" style={{ fontWeight: 'bold' }}>Huvudhotell:</Text> Donners Hotell Visby</Text>
                    <LocationLinkButton landmark='Donners Hotell Visby' address='Donners Plats 6, 621 59, Visby' />
                </Card>
                <Card size="sm" variant="ghost" m="$0" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ flexShrink: 1 }}><Text color="$info600" style={{ fontWeight: 'bold' }}>Datum Halvårsträff:</Text> 22–24 november 2024</Text>
                </Card>
                <Card size="sm" variant="ghost" m="$0" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ flexShrink: 1 }}><Text color="$info600" style={{ fontWeight: 'bold' }}>Datum Årsträff:</Text> 29 maj - 6 juni 2025</Text>
                </Card>
            </VStack>
        </Card>
    );
};

export default StartscreenFaq;
