import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { firebase } from '../../firebase';
import { useAuth } from '../context/AuthContext';

const ReceiveLinks = ({ navigation }) => {
  const [sharedLinks, setSharedLinks] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    // Handle incoming links when the app is already open
    const handleUrl = ({ url }) => {
      handleSharedContent(url);
    };

    // Listen for incoming links
    Linking.addEventListener('url', handleUrl);

    // Check if app was opened from a shared link
    Linking.getInitialURL().then(url => {
      if (url) {
        handleSharedContent(url);
      }
    });

    // Load existing shared links from Firebase
    loadSharedLinks();

    return () => {
      // Clean up event listener
      Linking.removeEventListener('url', handleUrl);
    };
  }, []);

  const loadSharedLinks = async () => {
    try {
      const linksRef = firebase.firestore()
        .collection('users')
        .doc(user.uid)
        .collection('sharedLinks');

      // Real-time listener for shared links
      linksRef.orderBy('timestamp', 'desc').onSnapshot(snapshot => {
        const links = [];
        snapshot.forEach(doc => {
          links.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setSharedLinks(links);
      });
    } catch (error) {
      console.error('Error loading shared links:', error);
    }
  };

  const handleSharedContent = async (url) => {
    try {
      const linksRef = firebase.firestore()
        .collection('users')
        .doc(user.uid)
        .collection('sharedLinks');

      await linksRef.add({
        url,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        title: url // You could add link preview functionality to get actual titles
      });
    } catch (error) {
      console.error('Error saving shared link:', error);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.linkItem}
      onPress={() => Linking.openURL(item.url)}
    >
      <Text style={styles.linkTitle}>{item.title}</Text>
      <Text style={styles.linkUrl}>{item.url}</Text>
      <Text style={styles.timestamp}>
        {item.timestamp ? new Date(item.timestamp.toDate()).toLocaleDateString() : ''}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Shared Links</Text>
      <FlatList
        data={sharedLinks}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  list: {
    flex: 1,
  },
  linkItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  linkUrl: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
});

export default ReceiveLinks;
