import React, { useEffect, useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useStore from '../../common/store/store';
import { FilterProps, filterUsers, defaultFilter } from '../store/LocationSlice';
import Slider from '@react-native-community/slider';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const createStyles = (colorScheme: string, topInset: number) => StyleSheet.create({
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
    maxWidth: 400,
    maxHeight: '80%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? '#4b5563' : '#e5e7eb',
  },
  sliderContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
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
    marginBottom: 4,
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
    const insets = useSafeAreaInsets();
    const styles = createStyles(colorScheme ?? 'light', insets.top);
    const { userFilter, usersShowingLocation, filteredUsers, setUserFilter } = useStore();
    const [filter, setFilter] = useState<FilterProps>(userFilter);
    const [numberOfUsers, setNumberOfUsers] = useState(filteredUsers.length);

    useEffect(() => {
        // Update the number of users showing location when the filtersettings is shown
        setNumberOfUsers(filterUsers(usersShowingLocation, filter).length);
        setFilter(userFilter);
    }, [showFilterView, userFilter]);

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
                        
                        <View style={styles.card}>
                            <Text style={{ color: colorScheme === 'dark' ? '#ffffff' : '#000000', marginBottom: 6, fontSize: 15, fontWeight: '500' }}>
                                Online senaste <Text style={styles.numberHighlight}>
                                    {filter.showHoursAgo || 1}
                                </Text> timmarna
                            </Text>
                            <View style={styles.sliderContainer}>
                                <Slider
                                    style={{ height: 35 }}
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
                                onPress={() => setFilterAndCalculateNumberOfUsers({ ...defaultFilter, name: filter.name, showHoursAgo: 24 })}
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
            </Modal>
    );
};
