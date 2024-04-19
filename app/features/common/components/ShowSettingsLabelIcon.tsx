import React from 'react';
import { gluestackUIConfig } from '../../../gluestack-components/gluestack-ui.config';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { IconProp } from '@fortawesome/fontawesome-svg-core';


const ShowSettingsLabelIconColor = (value: boolean | undefined): IconProp => {
  return value ? faEye : faEyeSlash;
};

export default ShowSettingsLabelIconColor;