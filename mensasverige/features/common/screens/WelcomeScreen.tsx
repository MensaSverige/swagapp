import { StyleSheet, Image, View } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import useStore from '../store/store';
import NonMemberInfo from '../components/NonMemberInfo';
import ParentEventDashboard from '../../events/components/ParentEventDashboard';

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
                <ParentEventDashboard />
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