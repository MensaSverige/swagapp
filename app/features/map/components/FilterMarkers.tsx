import React, { useState } from 'react';
import useStore from '../../common/store/store';
import { FilterProps, filterUsers } from '../store/LocationSlice';
import { Button, Card, Heading, Input, InputField, Modal, ModalBackdrop, ModalBody, ModalCloseButton, ModalContent, ModalHeader, Pressable, VStack, View, Text } from '../../../gluestack-components';
import Slider from '@react-native-community/slider';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faClose,  faSearch } from '@fortawesome/free-solid-svg-icons';
import { config } from '../../../gluestack-components/gluestack-ui.config';
import { ButtonText, useColorMode } from '@gluestack-ui/themed';

type FilterMarkersProps = {
    showFilterView: boolean;
    onClose: () => void;
};
export const FilterMarkersComponent: React.FC<FilterMarkersProps> = ({ showFilterView, onClose }) => {
    const ref = React.useRef(null);
    const { userFilter, usersShowingLocation, filteredUsers, setUserFilter } = useStore();
    const [filter, setFilter] = useState<FilterProps>(userFilter);
    const [numberOfUsers, setNumberOfUsers] = useState(filteredUsers.length);

    const handleFilter = () => {
        setUserFilter(filter);
        onClose();
    };
    const setFilterAndCalculateNumberOfUsers = (filter: FilterProps) => {
        setFilter(filter);
        const num = filterUsers(usersShowingLocation, filter).length;
        setNumberOfUsers(num);
    }

    return (
        <View>
            <Input bg="$background50"
                borderWidth={0}
                borderRadius={0}
                style={{ paddingTop: 4}}
            >
                <FontAwesomeIcon icon={faSearch} size={28} style={{ marginTop: 4, color: config.tokens.colors.blue400 }} />
                <InputField
                    value={filter.name}
                    
                    onChangeText={(value) => setFilterAndCalculateNumberOfUsers({ ...filter, name: value })}
                    onEndEditing={handleFilter}
                />
                {filter.name && (

                    <Pressable
                        style={{ marginRight: 10 }}
                        onPress={() => setFilterAndCalculateNumberOfUsers({ ...filter, name: '' })}
                    >
                        <FontAwesomeIcon icon={faClose} size={28} style={{ marginTop: 5, color: config.tokens.colors.blue400 }}/>
                    </Pressable>
                )}
            </Input>
            <Modal
                isOpen={showFilterView}
                onClose={() => {
                    handleFilter();
                }}
                finalFocusRef={ref}
                size='lg'
            >
                <ModalBackdrop />
                <ModalContent >
                    <ModalHeader>
                        <Heading size="lg" color={config.tokens.colors.primary200} >Filter</Heading>
                        <ModalCloseButton>
                            <FontAwesomeIcon icon={faClose} size={20} style={{ color: config.tokens.colors.blue400, }} />
                        </ModalCloseButton>
                    </ModalHeader>
                    <ModalBody>
                        <VStack space="lg" h="100%" flex={1}>

                            <Card size="sm" variant="elevated" m="$0">
                                <Text>Online senaste {filter.showHoursAgo || 1} timmarna</Text>
                                <Slider
                                    style={{ height: 40 }}
                                    value={filter.showHoursAgo}
                                    minimumValue={0}
                                    maximumValue={24}
                                    step={1}
                                    thumbTintColor={config.tokens.colors.blue400}
                                    minimumTrackTintColor={config.tokens.colors.blue400}
                                    maximumTrackTintColor={config.tokens.colors.blueGray200}
                                    onValueChange={value =>
                                        setFilterAndCalculateNumberOfUsers({ ...filter, showHoursAgo: value })
                                    }
                                />

                            </Card>
                            <Text>Visar {numberOfUsers} personer </Text>

                            <Button
                                size="md"
                                variant="solid"
                                action="primary"
                                isDisabled={false}
                                isFocusVisible={false}
                                onPress={() => setFilterAndCalculateNumberOfUsers({ name: '', showHoursAgo: 24 })}
                            >
                                <ButtonText>Nollställ filter </ButtonText>
                            </Button>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal></View>
    );
};
