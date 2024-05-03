import React, { useEffect, useState } from 'react';
import useStore from '../../common/store/store';
import { FilterProps, filterUsers, defaultFilter } from '../store/LocationSlice';
import { Button, Card, Heading, HStack, Input, InputField, Modal, ModalBackdrop, ModalBody, ModalCloseButton, ModalContent, ModalHeader, VStack, View, Text, InputSlot, InputIcon, SearchIcon, CloseIcon, Icon } from '../../../gluestack-components';
import Slider from '@react-native-community/slider';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { config } from '../../../gluestack-components/gluestack-ui.config';
import { ButtonText } from '@gluestack-ui/themed';

type FilterMarkersProps = {
    showFilterView: boolean;
    onClose: () => void;
};
export const FilterMarkersComponent: React.FC<FilterMarkersProps> = ({ showFilterView, onClose }) => {
    const ref = React.useRef(null);
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
            <Input bg="$background50"
                borderWidth={0}
                borderRadius={0}
            >
                <InputSlot pl="$4">
                    <Icon
                        size="xl"
                        as={SearchIcon}
                        color="$blueGray400"
                    />
                </InputSlot>
                <InputField
                    value={filter.name}
                    placeholder="Sök deltagare..."
                    onChangeText={(value) => setFilterAndCalculateNumberOfUsers({ ...filter, name: value })}
                    onEndEditing={saveFilter}
                />
                {filter.name && (
                    <InputSlot p="$4" mr="$2"
                        onPress={() => setFilterAndCalculateNumberOfUsers({ ...filter, name: '' })}
                    >
                        <InputIcon
                            size="xl"
                            as={CloseIcon}
                            color="$blueGray400"
                        />
                    </InputSlot>
                )}
            </Input>
            <Modal
                isOpen={showFilterView}
                onClose={() => {
                    cancelFilter();
                }}
                finalFocusRef={ref}
                size='lg'
            >
                <ModalBackdrop bg="$coolGray500" />
                <ModalContent >
                    <ModalHeader>
                        <Heading size="lg" color={config.tokens.colors.primary200} >Filter</Heading>
                        <ModalCloseButton
                            padding={15}>
                            <Icon as={CloseIcon} />
                        </ModalCloseButton>
                    </ModalHeader>
                    <ModalBody>
                        <VStack space="lg" h="100%" flex={1}>

                            <Card size="sm" variant="elevated" m="$0">
                                <Text>Online senaste <Text color="$vscode_numberLiteral">
                                    {filter.showHoursAgo || 1}
                                </Text> timmarna</Text>
                                <Slider
                                    style={{ height: 50 }}
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
                            <Text>Visar <Text color="$vscode_numberLiteral">{numberOfUsers}</Text> personer </Text>
                            <HStack space="lg" h="100%" flex={1} justifyContent="space-evenly" paddingBottom={20} >
                                <Button
                                    size="md"
                                    variant="outline"
                                    action="secondary"
                                    borderColor="$vscode_stringLiteral"
                                    isDisabled={false}
                                    isFocusVisible={false}
                                    onPress={() => setFilterAndCalculateNumberOfUsers({ ...defaultFilter, showHoursAgo: 24 })}                            >
                                    <ButtonText color='$vscode_stringLiteral'>Nollställ filter </ButtonText>
                                </Button>

                                <Button
                                    style={{ right: 10 }}
                                    size="md"
                                    variant="solid"
                                    action="primary"
                                    backgroundColor="$vscode_const"
                                    isDisabled={false}
                                    isFocusVisible={false}
                                    onPress={saveFilter}
                                >
                                    <ButtonText>Spara</ButtonText>
                                </Button>
                            </HStack>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal></View>
    );
};
