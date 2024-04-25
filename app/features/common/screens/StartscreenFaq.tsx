import React from 'react';
import { Card, Text, VStack } from '../../../gluestack-components';

const StartscreenFaq = () => {
    return (
        <Card size="md" borderRadius="$lg" borderColor='$info600'  variant="outline" m="$0">
            <VStack>
                <Text><Text color="$info600" style={{fontWeight: 'bold',}}>Datum:</Text> 9/5 - 12/5</Text>
                <Text><Text color="$info600" style={{fontWeight: 'bold'}}>Huvudhotell:</Text> Scandic Grand Örebro, Fabriksgatan 21–23</Text>
                <Text><Text color="$info600" style={{fontWeight: 'bold'}}>Årsmöte:</Text> Lördagen den 11 maj klockan 10:30, Conventum, Club 700</Text>
                <Text><Text color="$info600" style={{fontWeight: 'bold'}}>Officiell invigning:</Text> Torsdagskvällen klockan 17, Club 700 på Conventum</Text>
                <Text><Text color="$info600" style={{fontWeight: 'bold'}}>Stora Mensafester:</Text> Lördagskvällen, två middagsalternativ – en festmiddag och en maskeradmiddag</Text>
            </VStack>
        </Card>
    );
};

export default StartscreenFaq;

//https://events.mensa.se/swag2024/