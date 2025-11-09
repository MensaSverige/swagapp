import { StyleSheet, Image } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import useStore from '../store/store';
import NonMemberInfo from '../components/NonMemberInfo';
import ParentEventDashboard from '../components/ParentEventDashboard';

export default function WelcomeScreen() {
    const { user } = useStore();
    return (
        <>
            <ParallaxScrollView useSafeArea={true}
                headerImage={
                    <Image
                        source={require('@/assets/images/mensa_sverige_1024_500.jpg')}
                        style={styles.headerImage}
                        resizeMode="cover"
                    />
                }
            >
                <ThemedView>
                    <ThemedText type="title">Mensa Sverige</ThemedText>
                    <ParentEventDashboard />
                </ThemedView>

            </ParallaxScrollView>

            {user && !user.isMember && (
                <NonMemberInfo />
            )}
        </>
    );
}

const styles = StyleSheet.create({
    headerImage: {
        width: '100%',
        height: '100%',
        alignSelf: 'center',
    },
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