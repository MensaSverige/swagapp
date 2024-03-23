import React, {useEffect, useState} from 'react';
import {Text} from 'native-base';
import {getUser} from '../services/userService';

const DisplayNameByUsername: React.FC<{username: string}> = ({username}) => {
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    const fetchDisplayName = async () => {
      const user = await getUser(username).then(user => {
        if (user?.name) {
          setDisplayName(user.name);
        }
      });
    };

    fetchDisplayName();
  }, [username]);

  return <Text> {displayName} </Text>;
};

export default DisplayNameByUsername;
