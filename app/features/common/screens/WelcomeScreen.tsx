import React from 'react';
import { Text, View } from 'react-native';
import SiteNews from './SiteNews';
import { Divider, Heading, ScrollView, VStack } from '../../../gluestack-components';
import StartscreenFaq from './StartscreenFaq';

const WelcomeScreen = () => {
    return (

        <VStack space="lg" h="100%" bg="$background0" flex={1} paddingHorizontal={20}>
            <ScrollView>
                <VStack space={"lg"}>
                    <Heading size="xl" >Välkommen till SWAG!</Heading>
                    <StartscreenFaq />
                    <Divider/>
                    <SiteNews />
                </VStack>
            </ScrollView>
        </VStack>

    );
};

export default WelcomeScreen;