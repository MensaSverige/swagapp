import React from 'react';
import {TouchableOpacity} from 'react-native';
import {Box, Row, Text} from 'native-base';
import {faTrashAlt} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';

export const SmallDeleteButton: React.FC<{onPress: () => void}> = ({
  onPress,
}) => {
  return (
    <Row alignItems={'center'}>
      <Text>Ta bort</Text>
      <Box ml={1}>
        <TouchableOpacity onPress={onPress}>
          <FontAwesomeIcon icon={faTrashAlt} />
        </TouchableOpacity>
      </Box>
    </Row>
  );
};
