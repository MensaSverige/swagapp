import React, { useEffect, useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import useStore from '../../common/store/store';
import { FilterProps, filterUsers, defaultFilter } from '../store/LocationSlice';
import Slider from '@react-native-community/slider';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const createStyles = (colorScheme: string) => StyleSheet.create({
  searchContainer: {
    backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#ffffff',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colorScheme === 'dark' ? '#ffffff' : '#000000',
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#ffffff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary200,
  },
  closeButton: {
    padding: 8,
  },
  card: {
    backgroundColor: colorScheme === 'dark' ? '#374151' : '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
  },
  sliderContainer: {
    marginVertical: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
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
    backgroundColor: Colors.primary300,
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
  resultText: {
    fontSize: 14,
    color: colorScheme === 'dark' ? '#d1d5db' : '#6b7280',
    textAlign: 'center',
  },
  numberHighlight: {
    color: Colors.primary400,
    fontWeight: 'bold',
  },
});

type FilterMarkersProps = {
    showFilterView: boolean;
    onClose: () => void;
};
export const FilterMarkersComponent: React.FC<FilterMarkersProps> = ({ showFilterView, onClose }) => {
    const ref = React.useRef(null);
    const colorScheme = useColorScheme();
    const styles = createStyles(colorScheme ?? 'light');
    const { userFilter, usersShowingLocation, filteredUsers, setUserFilter } = useStore();
    const [filter, setFilter] = useState<FilterProps>(userFilter);
    const [numberOfUsers, setNumberOfUsers] = useState(filteredUsers.length);

    useEffect(() => {
        // Update the number of users showing location when the filtersettings is shown
        setNumberOfUsers(filterUsers(usersShowingLocation, filter).length);
        setFilter(userFilter);
    }, [showFilterView]);

    const saveFilter = () => {
        setUserFilter(filter);
        onClose();
    };

    const cancelFilter = () => {
        setFilter(userFilter);
        onClose();
    };

    const setFilterAndCalculateNumberOfUsers = (filter: FilterProps) => {
        setFilter(filter);
        const num = filterUsers(usersShowingLocation, filter).length;
        setNumberOfUsers(num);
    }

    return (
        <View>
            <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={20} color={Colors.trueGray400 || '#9ca3af'} />
                <TextInput
                    style={styles.searchInput}
                    value={filter.name}
                    placeholder="Sök deltagare..."
                    placeholderTextColor={Colors.trueGray400 || '#9ca3af'}
                    onChangeText={(value: string) => setFilterAndCalculateNumberOfUsers({ ...filter, name: value })}
                    onEndEditing={saveFilter}
                />
                {filter.name && (
                    <TouchableOpacity 
                        style={styles.clearButton}
                        onPress={() => setFilterAndCalculateNumberOfUsers({ ...filter, name: '' })}
                    >
                        <MaterialIcons name="close" size={20} color={Colors.trueGray400 || '#9ca3af'} />
                    </TouchableOpacity>
                )}
            </View>
            
            <Modal
                visible={showFilterView}
                transparent={true}
                animationType="slide"
                onRequestClose={cancelFilter}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filter</Text>
                            <TouchableOpacity style={styles.closeButton} onPress={cancelFilter}>
                                <MaterialIcons 
                                    name="close" 
                                    size={24} 
                                    color={colorScheme === 'dark' ? '#ffffff' : '#000000'} 
                                />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={{ flex: 1 }}>
                            <View style={styles.card}>
                                <Text style={{ color: colorScheme === 'dark' ? '#ffffff' : '#000000', marginBottom: 8 }}>
                                    Online senaste <Text style={styles.numberHighlight}>
                                        {filter.showHoursAgo || 1}
                                    </Text> timmarna
                                </Text>
                                <View style={styles.sliderContainer}>
                                    <Slider
                                        style={{ height: 50 }}
                                        value={filter.showHoursAgo}
                                        minimumValue={0}
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
                            
                            <View style={styles.buttonContainer}>
                                <TouchableOpacity
                                    style={[styles.button, styles.buttonOutline]}
                                    onPress={() => setFilterAndCalculateNumberOfUsers({ ...defaultFilter, showHoursAgo: 24 })}
                                >
                                    <Text style={[styles.buttonText, styles.buttonTextOutline]}>
                                        Nollställ filter
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.button, styles.buttonSolid]}
                                    onPress={saveFilter}
                                >
                                    <Text style={[styles.buttonText, styles.buttonTextSolid]}>
                                        Spara
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};
