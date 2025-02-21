// myapp/src/screens/SignupScreen.js
import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { TextInput, Button, Text, Provider as PaperProvider } from 'react-native-paper';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const SignupScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignup = () => {
    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match!");
      return;
    }

    const auth = getAuth();
    createUserWithEmailAndPassword(auth, email, password)
      .then(() => {
        Alert.alert("Signup successful! Please check your email for confirmation.");
        // Optionally, navigate to another screen or perform other actions
      })
      .catch((error) => {
        if (error.code === 'auth/email-already-in-use') {
          Alert.alert(
            "Email already exists!",
            "Click 'Forgot Password' if you need to reset your password."
          );
        } else {
          Alert.alert(error.message);
        }
      });
  };

  return (
    <PaperProvider>
      <View style={{ padding: 20 }}>
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          style={{ marginBottom: 10 }}
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          secureTextEntry
          style={{ marginBottom: 10 }}
        />
        <TextInput
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          mode="outlined"
          secureTextEntry
          style={{ marginBottom: 10 }}
        />
        <Button mode="contained" onPress={handleSignup}>
          Sign Up
        </Button>
      </View>
    </PaperProvider>
  );
};

export default SignupScreen;