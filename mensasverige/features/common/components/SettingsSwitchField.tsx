import React from 'react';
import { View, Switch, Text } from 'react-native';

interface SettingsSwitchProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const SettingsSwitchField: React.FC<SettingsSwitchProps> = ({
  label,
  value,
  onValueChange,
}) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
    <Text>{label}</Text>
    <Switch value={value} onValueChange={onValueChange} />
  </View>
);

export default SettingsSwitchField;
