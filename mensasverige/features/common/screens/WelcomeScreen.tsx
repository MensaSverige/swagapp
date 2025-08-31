import { StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import StartscreenFaq from '../components/StartscreenFaq';
import SiteNews from '../components/SiteNews';
import useStore from '../store/store';
import NonMemberInfo from '../components/NonMemberInfo';

export default function WelcomeScreen() {
    const { user } = useStore();
    return (
        <>
            <ParallaxScrollView>
                <ThemedView style={{ paddingBottom: 80 }}>
                    <ThemedText type="title">Välkommen!</ThemedText>

                    <StartscreenFaq />

                    <SiteNews />

                </ThemedView>
            </ParallaxScrollView>
            {user && !user.isMember && (
                <NonMemberInfo />
            )}
        </>
    );
}

const styles = StyleSheet.create({

});


// import React from 'react';
// import SiteNews from './SiteNews';
// import StartscreenFaq from './StartscreenFaq';
// import NonMemberInfo from '../components/NonMemberInfo';
// import useStore from '../store/store';

// const WelcomeScreen = () => {
//     const { user } = useStore();
//     return (
//         <VStack h="100%" flex={1}>
//             <VStack space="lg" h="100%" bg="$background0" flex={1} paddingHorizontal={20}>
//                 <ScrollView>
//                     <VStack space={"lg"}>
//                         <StartscreenFaq />
//                         <Divider/>
//                         <SiteNews />
//                     </VStack>
//                 </ScrollView>
//             </VStack>
//             {user && !user.isMember && (
//                 <NonMemberInfo />
//             )}
//         </VStack>
//     );
// };

// export default WelcomeScreen;