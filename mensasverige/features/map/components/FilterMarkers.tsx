import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Animated, Dimensions } from 'react-native';
import useStore from '../../common/store/store';
import { FilterProps, filterUsers, defaultFilter } from '../store/LocationSlice';
import Slider from '@react-native-community/slider';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';
import { ThemedText } from '@/components/ThemedText';

const { width: screenWidth } = Dimensions.get('window');

type FilterMarkersProps = {
    showFilterView: boolean;
    onClose: () => void;
    onFilterApplied?: () => void;
};

export const FilterMarkersComponent: React.FC<FilterMarkersProps> = ({ showFilterView, onClose, onFilterApplied }) => {
    const colorScheme = useColorScheme() ?? 'light';
    const bottom = useBottomTabOverflow();
    const { userFilter, usersShowingLocation, filteredUsers, setUserFilter } = useStore();
    const [filter, setFilter] = useState<FilterProps>(userFilter);
    const [numberOfUsers, setNumberOfUsers] = useState(filteredUsers.length);

    const slideAnim = useRef(new Animated.Value(screenWidth * 0.75)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        setNumberOfUsers(filterUsers(usersShowingLocation, filter).length);
        setFilter(userFilter);
    }, [showFilterView, userFilter]);

    useEffect(() => {
        if (showFilterView) {
            Animated.parallel([
                Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
                Animated.timing(overlayOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, { toValue: screenWidth * 0.75, duration: 250, useNativeDriver: true }),
                Animated.timing(overlayOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
            ]).start();
        }
    }, [showFilterView]);

    if (!showFilterView) return null;

    const saveFilter = () => {
        setUserFilter(filter);
        onClose();
        onFilterApplied?.();
    };

    const cancelFilter = () => {
        setFilter(userFilter);
        onClose();
    };

    const setFilterAndCalculateNumberOfUsers = (newFilter: FilterProps) => {
        setFilter(newFilter);
        setNumberOfUsers(filterUsers(usersShowingLocation, newFilter).length);
    };

    const styles = createStyles(colorScheme);

    return (
        <View style={[StyleSheet.absoluteFillObject, { zIndex: 1001 }]}>
            <Animated.View style={[styles.overlay, { opacity: overlayOpacity, top: 0, bottom: 0 }]}>
                <Pressable style={StyleSheet.absoluteFillObject} onPress={cancelFilter} />
            </Animated.View>

            <Animated.View style={[styles.sideMenu, {
                transform: [{ translateX: slideAnim }],
                top: 0,
                bottom: bottom,
            }]}>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={cancelFilter}
                >
                    <MaterialIcons name="close" size={24} color={colorScheme === 'dark' ? '#ffffff' : '#000000'} />
                </TouchableOpacity>

                <View style={styles.menuHeader}>
                    <ThemedText type="subtitle">Filter</ThemedText>
                </View>

                <View style={styles.menuContent}>
                    <View style={styles.card}>
                        <ThemedText>
                            Online senaste{' '}
                            <Text style={styles.numberHighlight}>{filter.showHoursAgo ?? 1}</Text>
                            {' '}timmarna
                        </ThemedText>
                        <View style={styles.sliderContainer}>
                            <Slider
                                style={{ height: 35 }}
                                value={filter.showHoursAgo}
                                minimumValue={1}
                                maximumValue={24}
                                step={1}
                                thumbTintColor={Colors.blue400 || '#60a5fa'}
                                minimumTrackTintColor={Colors.blue400 || '#60a5fa'}
                                maximumTrackTintColor={Colors.trueGray200 || '#e5e7eb'}
                                onValueChange={(value: number) =>
                                    setFilterAndCalculateNumberOfUsers({ ...filter, showHoursAgo: value })
                                }
                            />
                        </View>
                    </View>

                    <Text style={styles.resultText}>
                        Visar <Text style={styles.numberHighlight}>{numberOfUsers}</Text> personer
                    </Text>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.buttonOutline]}
                        onPress={() => setFilterAndCalculateNumberOfUsers({ ...defaultFilter, name: filter.name, showHoursAgo: 24 })}
                    >
                        <Text style={[styles.buttonText, styles.buttonTextOutline]}>Nollställ filter</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, styles.buttonSolid]}
                        onPress={saveFilter}
                    >
                        <Text style={[styles.buttonText, styles.buttonTextSolid]}>Spara</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );
};

const createStyles = (colorScheme: string) => StyleSheet.create({
    overlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    sideMenu: {
        position: 'absolute',
        right: 0,
        width: screenWidth * 0.75,
        backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    closeButton: {
        position: 'absolute',
        top: 5,
        right: 15,
        zIndex: 1,
        padding: 8,
    },
    menuHeader: {
        paddingHorizontal: 20,
        paddingTop: 30,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
    },
    menuContent: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    card: {
        backgroundColor: colorScheme === 'dark' ? '#374151' : '#f9fafb',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colorScheme === 'dark' ? '#4b5563' : '#e5e7eb',
    },
    sliderContainer: {
        marginTop: 8,
        marginBottom: 4,
    },
    resultText: {
        fontSize: 14,
        color: colorScheme === 'dark' ? '#d1d5db' : '#6b7280',
        textAlign: 'center',
        marginBottom: 4,
    },
    numberHighlight: {
        color: Colors.primary400,
        fontWeight: 'bold',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
    },
    button: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonOutline: {
        borderWidth: 1,
        borderColor: Colors.primary300,
        backgroundColor: 'transparent',
    },
    buttonSolid: {
        backgroundColor: Colors.primary500,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    buttonTextOutline: {
        color: Colors.primary300,
    },
    buttonTextSolid: {
        color: '#ffffff',
    },
});
