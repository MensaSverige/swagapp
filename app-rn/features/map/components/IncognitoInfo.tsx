import React from 'react';
import useStore from '../../common/store/store';
import { HStack, Heading, Text, VStack } from '../../../gluestack-components';
import { faUserSecret } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { config } from '../../../gluestack-components/gluestack-ui.config';

const IncognitoInfo: React.FC = () => {   
    const { user } = useStore();

    if (!user || user.settings.show_location !== "NO_ONE") {

        return null;
    }
    return (
        <HStack bgColor='$background50'  space="lg" style={{ paddingTop:10, paddingBottom: 20, paddingHorizontal: 30, justifyContent: 'flex-start', alignItems: 'center' }}>
            <FontAwesomeIcon icon={faUserSecret} size={30} style={{ color: config.tokens.colors.blue400 }} />
            <VStack style={{ marginRight:30}}>
            <Heading size="lg" color={ config.tokens.colors.primary200} >Inkognito</Heading>
            <Text>Andra kan inte se dig på kartan, och du kan bara se de som valt att dela sin position publikt.</Text>
            </VStack>
        </HStack>
    );
};

export default IncognitoInfo;