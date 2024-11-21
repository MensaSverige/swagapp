import React from 'react';
import SiteNews from './SiteNews';
import { Divider, Heading, ScrollView, VStack } from '../../../gluestack-components';
import StartscreenFaq from './StartscreenFaq';
import NonMemberInfo from '../components/NonMemberInfo';
import useStore from '../store/store';

const WelcomeScreen = () => {
    const { user } = useStore();
    return (
        <VStack h="100%" flex={1}>
            <VStack space="lg" h="100%" bg="$background0" flex={1} paddingHorizontal={20}>
                <ScrollView>
                    <VStack space={"lg"}>
                        <Heading size="xl" >Välkommen till SWAG!</Heading>
                        <StartscreenFaq />
                        {/* <Divider/> */}
                        {/* <SiteNews /> */}
                    </VStack>
                </ScrollView>
            </VStack>
            {user && !user.isMember && (
                <NonMemberInfo />
            )}
        </VStack>
    );
};

export default WelcomeScreen;