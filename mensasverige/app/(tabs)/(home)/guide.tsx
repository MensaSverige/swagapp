import React, { useRef, useEffect } from 'react';
import { ScrollView, View, StyleSheet, useColorScheme, Image, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Collapsible } from '@/components/Collapsible';
import { SWAG_GUIDE_SECTIONS } from '@/features/events/constants/swagGuideContent';
import { Colors } from '@/constants/Colors';

// Add image files to assets/images/ then uncomment the matching line to activate
// eslint-disable-next-line @typescript-eslint/no-require-imports
const SECTION_IMAGES: Partial<Record<string, number>> = {
    buddies: require('@/assets/images/swag-buddy-band.jpg'),
};

export default function SwagGuideScreen() {
    const { initialSection } = useLocalSearchParams<{ initialSection?: string }>();
    const scrollViewRef = useRef<ScrollView>(null);
    const sectionPositions = useRef<Record<string, number>>({});
    const colorScheme = useColorScheme();
    const { width: windowWidth } = useWindowDimensions();
    // 16px container padding each side + 24px Collapsible indent
    const imageWidth = windowWidth - 56;

    useEffect(() => {
        if (!initialSection) return;
        const timer = setTimeout(() => {
            const y = sectionPositions.current[initialSection];
            if (y !== undefined) {
                scrollViewRef.current?.scrollTo({ y, animated: true });
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [initialSection]);

    return (
        <ScrollView ref={scrollViewRef} style={styles.scrollView}>
            <ThemedView style={styles.container}>
                <ThemedText type="title" style={styles.mainTitle}>SWAG-guiden</ThemedText>
                <ThemedText style={[styles.intro, { color: colorScheme === 'dark' ? Colors.coolGray300 : Colors.coolGray700 }]}>
                    Här hittar du praktisk information om årsträffen – från förberedelser och schema till tips om hur du får ut så mycket som möjligt av SWAG.
                </ThemedText>

                {SWAG_GUIDE_SECTIONS.map(section => (
                    <View
                        key={section.id}
                        style={styles.sectionWrapper}
                        onLayout={(e) => {
                            sectionPositions.current[section.id] = e.nativeEvent.layout.y;
                        }}
                    >
                        <Collapsible title={section.title} initialOpen={section.id === initialSection}>
                            {SECTION_IMAGES[section.id] != null ? (
                                <Image source={SECTION_IMAGES[section.id]!} style={[styles.sectionBannerImage, { width: imageWidth }]} resizeMode="cover" />
                            ) : null}
                            {section.subsections.map((sub, i) => (
                                <View key={i} style={styles.subsection}>
                                    {sub.title ? (
                                        <ThemedText type="defaultSemiBold" style={styles.subsectionTitle}>
                                            {sub.title}
                                        </ThemedText>
                                    ) : null}
                                    <ThemedText style={[
                                        styles.body,
                                        { color: colorScheme === 'dark' ? Colors.coolGray300 : Colors.coolGray700 }
                                    ]}>
                                        {sub.body}
                                    </ThemedText>
                                </View>
                            ))}
                        </Collapsible>
                    </View>
                ))}

                <View style={styles.bottomPadding} />
            </ThemedView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    container: {
        padding: 16,
    },
    mainTitle: {
        marginBottom: 8,
    },
    intro: {
        lineHeight: 22,
        marginBottom: 20,
    },
    sectionWrapper: {
        marginBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.coolGray200,
        paddingBottom: 12,
    },
    subsection: {
        marginBottom: 12,
    },
    sectionBannerImage: {
        height: 180,
        borderRadius: 8,
        marginBottom: 10,
    },
    subsectionTitle: {
        marginBottom: 4,
    },
    body: {
        lineHeight: 22,
    },
    bottomPadding: {
        height: 40,
    },
});
