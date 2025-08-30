import React from 'react';
import { VStack, Toast, ToastTitle, ToastDescription } from "../../../gluestack-components";
interface AutosaveToastProps {
  id: string;
}

const AutosaveErrorToast: React.FC<AutosaveToastProps> = ({ id}) => {
  const toastId = "toast-" + id;
  return (
    <Toast nativeID={toastId} action="warning" variant="outline" bg="$background100">
      <VStack space="xs">
        <ToastTitle>Kunde inte spara</ToastTitle>
        <ToastDescription>Något gick fel och dina ändringar har inte sparats.</ToastDescription>
      </VStack>
    </Toast>
  );
};

export default AutosaveErrorToast;