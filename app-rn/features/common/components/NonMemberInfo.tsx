import React from 'react';
import useStore from '../../common/store/store';
import {
    AlertDialog,
    AlertDialogBackdrop,
    Button,
    ButtonText,
    HStack,
    Heading,
    Text,
    VStack,
} from '../../../gluestack-components';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { config } from '../../../gluestack-components/gluestack-ui.config';
import { TouchableOpacity } from 'react-native';

const NonMemberInfo: React.FC = () => {
    const { user } = useStore();

    const [showMoreInfo, setShowMoreInfo] = React.useState(false);

    if (!user || user.settings.show_location !== 'NO_ONE') {
        return null;
    }
    return (
        <>
            <TouchableOpacity
                onPress={() => {
                    setShowMoreInfo(true);
                }}>
                <HStack
                    bgColor="$background50"
                    space="md"
                    style={{
                        height: 48,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                    <FontAwesomeIcon
                        icon={faInfoCircle}
                        size={20}
                        style={{ color: config.tokens.colors.blue400 }}
                    />
                    <Heading size="sm" color={config.tokens.colors.primary300}>
                        Begränsad funktionalitet
                    </Heading>
                </HStack>
            </TouchableOpacity>
            <AlertDialog isOpen={showMoreInfo} onClose={() => setShowMoreInfo(false)}>
                <AlertDialogBackdrop bgColor='$coolGray500' />
                <AlertDialog.Content>
                    <AlertDialog.Header>
                        <Heading size="md">Begränsad funktionalitet</Heading>
                    </AlertDialog.Header>
                    <AlertDialog.Body>
                        <VStack gap={10}>
                            <Text>Som internationell medlem eller medföljande har du i dagsläget begränsad funktionalitet på grund av sekretess kring sociala funktioner.</Text>
                            <Text>Vi arbetar med förändringar för att låta internationella medlemmar och medföljande deltaga i fler av appens funktioner.</Text>
                        </VStack>
                    </AlertDialog.Body>
                    <AlertDialog.Footer>
                        <Button.Group space="sm">
                            <Button onPress={() => setShowMoreInfo(false)} flex={1}>
                                <ButtonText style={{textAlign: 'center'}}>Stäng</ButtonText>
                            </Button>
                        </Button.Group>
                    </AlertDialog.Footer>
                </AlertDialog.Content>
            </AlertDialog>
        </>
    );
};

export default NonMemberInfo;
