import React from 'react';
import { Colors } from '@/constants/Colors';


const ShowSettingsLabelIconColor = (value: boolean | undefined): string => {
  return value ? Colors.green200 : Colors.trueGray400;
};

export default ShowSettingsLabelIconColor;