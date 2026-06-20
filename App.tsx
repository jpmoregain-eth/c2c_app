import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider } from 'react-native-paper';
import { theme } from './src/services/theme';
import { ContactProvider } from './src/services/ContactContext';
import { RootStackParamList } from './src/types';

import CameraScreen from './src/screens/CameraScreen';
import ContactsScreen from './src/screens/ContactsScreen';
import ContactDetailScreen from './src/screens/ContactDetailScreen';
import ProcessingScreen from './src/screens/ProcessingScreen';
import BatchScreen from './src/screens/BatchScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <ContactProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Contacts"
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen
              name="Contacts"
              component={ContactsScreen}
            />
            <Stack.Screen
              name="Camera"
              component={CameraScreen}
            />
            <Stack.Screen
              name="Batch"
              component={BatchScreen}
            />
            <Stack.Screen
              name="Processing"
              component={ProcessingScreen}
            />
            <Stack.Screen
              name="ContactDetail"
              component={ContactDetailScreen}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ContactProvider>
    </PaperProvider>
  );
}
