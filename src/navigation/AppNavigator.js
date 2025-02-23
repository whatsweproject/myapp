import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import { Button } from 'react-native';
import { getAuth, signOut } from 'firebase/auth';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={({ navigation }) => ({
            title: 'My App',
            headerRight: () => (
              <Button
                onPress={() => {
                  const auth = getAuth();
                  signOut(auth)
                    .then(() => {
                      navigation.navigate('Login');
                    })
                    .catch((error) => {
                      console.error("Logout error:", error);
                    });
                }}
                title="Logout"
              />
            ),
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}