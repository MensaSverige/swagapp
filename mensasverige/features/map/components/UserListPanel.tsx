import React, { useEffect, useRef, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Pressable, Animated, Dimensions, StyleSheet } from 'react-native';
import useStore from '../../common/store/store';
import UserWithLocation from '../types/userWithLocation';
import UserListItem from './UserListItem';
import { SearchParticipants } from './SearchParticipants';
import { getCoordinateDistance } from '../functions/getCoordinateDistance';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';
import { FilterProps, filterUsers, defaultFilter } from '../store/LocationSlice';
import Slider from '@react-native-community/slider';
import { ThemedText } from '@/components/ThemedText';

const { width: screenWidth } = Dimensions.get('window');
const PANEL_WIDTH = screenWidth * 0.85;

const STATUS_ORDER: Record<string, number> = { online: 0, away: 1, offline: 2 };

type Props = {
    visible: boolean;
    onClose: () => void;
    onUserPress: (user: UserWithLocation) => void;
    onFilterApplied?: () => void;
};

export const UserListPanel: React.FC<Props> = ({ visible, onClose, onUserPress, onFilterApplied }) => {
    const colorScheme = useColorScheme() ?? 'light';
    const bottom = useBottomTabOverflow();
    const { filteredUsers, usersShowingLocation, currentLocation, hasLocationPermission, selectedUser, userFilter, setUserFilter } = useStore();

    const [filter, setFilter] = useState<FilterProps>(userFilter);
    const [numberOfFilteredUsers, setNumberOfFilteredUsers] = useState(filteredUsers.length);
    const [searchText, setSearchText] = useState('');

    const slideAnim = useRef(new Animated.Value(PANEL_WIDTH)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        setNumberOfFilteredUsers(filterUsers(usersShowingLocation, filter).length);
        setFilter(userFilter);
    }, [visible, userFilter]);

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
                Animated.timing(overlayOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, { toValue: PANEL_WIDTH, duration: 250, useNativeDriver: true }),
                Animated.timing(overlayOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
            ]).start();
        }
    }, [visible]);

    const hasLocation = hasLocationPermission &&
        (currentLocation.latitude !== 0 || currentLocation.longitude !== 0);

    const sortedUsers = useMemo(() => {
        return [...filteredUsers].sort((a, b) => {
            const sd = STATUS_ORDER[a.onlineStatus] - STATUS_ORDER[b.onlineStatus];
            if (sd !== 0) return sd;
            if (!hasLocation) return 0;
            return getCoordinateDistance(currentLocation, a.location)
                - getCoordinateDistance(currentLocation, b.location);
        });
    }, [filteredUsers, currentLocation, hasLocation]);

    const displayedUsers = useMemo(() => {
        if (!searchText) return sortedUsers;
        const q = searchText.toLowerCase();
        return sortedUsers.filter(u =>
            `${u.firstName} ${u.lastName}`.toLowerCase().includes(q)
        );
    }, [sortedUsers, searchText]);

    const setFilterAndCount = (newFilter: FilterProps) => {
        setFilter(newFilter);
        setNumberOfFilteredUsers(filterUsers(usersShowingLocation, newFilter).length);
    };

    const saveFilter = () => {
        setUserFilter(filter);
        onFilterApplied?.();
    };

    const handleSearchChange = (text: string) => setSearchText(text);
    const handleSearchClear = () => setSearchText('');

    if (!visible) return null;

    const styles = createStyles(colorScheme);

    return (
        <View style={[StyleSheet.absoluteFillObject, { zIndex: 1000 }]}>
            <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
                <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
            </Animated.View>

            <Animated.View style={[styles.panel, {
                transform: [{ translateX: slideAnim }],
                top: 0,
                bottom: bottom,
            }]}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <MaterialIcons name="close" size={24} color={colorScheme === 'dark' ? '#ffffff' : '#000000'} />
                </TouchableOpacity>

                <View style={styles.sectionHeader}>
                    <ThemedText type="subtitle">Filter</ThemedText>
                </View>

                <View style={styles.filterContent}>
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
                                    setFilterAndCount({ ...filter, showHoursAgo: value })
                                }
                            />
                        </View>
                    </View>

                    <Text style={styles.resultText}>
                        Visar <Text style={styles.numberHighlight}>{numberOfFilteredUsers}</Text> personer
                    </Text>

                    <View style={styles.filterButtons}>
                        <TouchableOpacity
                            style={[styles.button, styles.buttonOutline]}
                            onPress={() => setFilterAndCount({ ...defaultFilter, showHoursAgo: 24 })}
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
                </View>

                <View style={styles.divider} />

                <View style={styles.searchRow}>
                    <SearchParticipants
                        value={searchText}
                        onChangeText={handleSearchChange}
                        onClear={handleSearchClear}
                    />
                </View>

                <Text style={styles.countText}>
                    {displayedUsers.length} {displayedUsers.length === 1 ? 'person' : 'personer'} synliga
                </Text>

                <FlatList
                    data={displayedUsers}
                    keyExtractor={u => u.userId}
                    renderItem={({ item }) => (
                        <UserListItem
                            user={item}
                            distance={hasLocation ? getCoordinateDistance(currentLocation, item.location) : null}
                            onPress={onUserPress}
                            isSelected={selectedUser?.userId === item.userId}
                        />
                    )}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                />
            </Animated.View>
        </View>
    );
};

const createStyles = (colorScheme: string) => StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    panel: {
        position: 'absolute',
        right: 0,
        width: PANEL_WIDTH,
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
    sectionHeader: {
        paddingHorizontal: 20,
        paddingTop: 30,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
    },
    filterContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
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
        marginBottom: 8,
    },
    numberHighlight: {
        color: Colors.primary400,
        fontWeight: 'bold',
    },
    filterButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        padding: 10,
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
        fontSize: 14,
        fontWeight: '600',
    },
    buttonTextOutline: {
        color: Colors.primary300,
    },
    buttonTextSolid: {
        color: '#ffffff',
    },
    divider: {
        height: 1,
        backgroundColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
        marginTop: 8,
    },
    searchRow: {
        borderBottomWidth: 1,
        borderBottomColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
    },
    countText: {
        fontSize: 13,
        color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
        marginLeft: 60,
    },
});
