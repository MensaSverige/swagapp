import {NativeBaseProvider} from 'native-base';
import React from 'react';
import {SignupForm} from './components/SignupForm';

function App(): JSX.Element {
  return (
    <NativeBaseProvider>
      <SignupForm />
    </NativeBaseProvider>
  );
}

export default App;
