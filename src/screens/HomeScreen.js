// myapp/src/screens/HomeScreen.js
import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import SharedLink from './SharedLink';
import Notes from './Notes';
import { getAuth, signOut } from 'firebase/auth'; // Import Firebase auth methods
import { useNavigation } from '@react-navigation/native'; // Import useNavigation hook

const Tab = createMaterialTopTabNavigator();

function HomeScreen() {
  const navigation = useNavigation(); // Get navigation prop

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        navigation.navigate('Login'); // Navigate back to Login screen after logout
      })
      .catch((error) => {
        console.error("Logout error:", error);
      });
  };

  return (
    <Tab.Navigator>
      <Tab.Screen 
        name="Notes" 
        component={Notes}
        options={{
          tabBarLabel: 'Notes'
        }}
      />
      <Tab.Screen 
        name="SharedLink" 
        component={SharedLink}
        options={{
          tabBarLabel: 'Shared Links'
        }}
      />
    </Tab.Navigator>
  );
}

export default HomeScreen;