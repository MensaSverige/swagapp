import { StyleSheet, Image } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import useStore from '../store/store';
import NonMemberInfo from '../components/NonMemberInfo';
import ParentEventDashboard from '../../events/components/ParentEventDashboard';
import MainEventsStartPage from '../../events/components/MainEventsStartPage';
import EventHeader from '../../events/components/EventHeader';
import { useMainEvents, useSelectedMainEvent } from '../../events/hooks/useMainEvents';

export default function WelcomeScreen() {
    const user = useStore(s => s.user);
    const { mainEvents, loading } = useMainEvents();
    const { selectedMainEvent } = useSelectedMainEvent();

    return (
        <>
            {selectedMainEvent ? (
                <>
                    <EventHeader />
                    <ParallaxScrollView>
                        <ParentEventDashboard mainEvent={selectedMainEvent} />
                    </ParallaxScrollView>
                </>
            ) : (
                <ParallaxScrollView
                    headerImage={
                        <Image
                            source={require('@/assets/images/mensa_sverige_1024_500.jpg')}
                            style={styles.headerImage}
                            resizeMode="cover"
                        />
                    }
                >
                    <MainEventsStartPage mainEvents={mainEvents} loading={loading} />
                </ParallaxScrollView>
            )}

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
