import React from 'react';
import { gluestackUIConfig } from '../../../gluestack-components/gluestack-ui.config';


const ShowSettingsLabelIconColor = (value: boolean | undefined): string => {
  return value ? gluestackUIConfig.tokens.colors.green200 : gluestackUIConfig.tokens.colors.blueGray400;
};

export default ShowSettingsLabelIconColor;