import React, {useEffect, useState} from 'react';
import {Text} from 'native-base';
import {getUser} from '../services/userService';

const DisplayNameByUsername: React.FC<{username: string}> = ({username}) => {
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    const fetchDisplayName = async () => {
      getUser(username)
        .then(user => {
          if (user?.name) {
            setDisplayName(user.name);
          }
        })
        .catch(error => {
          console.error('Failed to get display name:', error.message || error);
          setDisplayName('Okänd användare ⚠️');
        });
    };

    fetchDisplayName();
  }, [username]);

  return <Text> {displayName} </Text>;
};

export default DisplayNameByUsername;
