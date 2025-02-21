// myapp/src/screens/HomeScreen.js
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { getAuth, signOut } from 'firebase/auth'; // Import Firebase auth methods
import { useNavigation } from '@react-navigation/native'; // Import useNavigation hook

const HomeScreen = () => {
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
    <View style={styles.container}>
      <Text style={styles.welcomeText}>  Welcome to the Application! </Text>
      <Button title="Logout" onPress={handleLogout} /> {/* Logout button */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0', // Optional: Change background color
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20, // Add some space below the welcome text
  },
});

export default HomeScreen;