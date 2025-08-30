import React from 'react';
import { VStack, Toast, ToastTitle, ToastDescription } from "../../../gluestack-components";
import { ActivityIndicator, View } from 'react-native';
interface AutosaveToastProps {
  id: string;
}

const AutosaveToast: React.FC<AutosaveToastProps> = ({ id }) => {
  const toastId = "toast-" + id;
  return (
    <Toast nativeID={toastId} action="info" variant="outline" bg="$background50" >
      <VStack space="xs" style={{ flexDirection: 'row', marginRight: 10, width: 100, alignContent: 'center', justifyContent: 'center'  }}>
          <ToastTitle>Sparar </ToastTitle>
          <ActivityIndicator style={{ marginLeft: 5 }} />
      </VStack>
    </Toast>
  );
}


export default AutosaveToast;