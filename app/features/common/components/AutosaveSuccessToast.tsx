import React from 'react';
import { VStack, Toast, ToastTitle, ToastDescription } from "../../../gluestack-components";
interface AutosaveToastProps {
  id: string;
}

const AutosaveSuccessToast: React.FC<AutosaveToastProps> = ({ id}) => {
  const toastId = "toast-" + id;
  return (
    <Toast nativeID={toastId} action="success" variant="outline" >
      <VStack space="xs" style={{ flexDirection: 'row', marginRight: 10, width: 100, alignContent: 'center', justifyContent: 'center' }}>
        <ToastTitle>Sparat</ToastTitle>
      </VStack>
    </Toast>
  );
};

export default AutosaveSuccessToast;