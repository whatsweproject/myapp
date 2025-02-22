import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Share } from 'react-native';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from '@react-navigation/native';
import { db } from '../../firebase';
import { getAuth } from 'firebase/auth';

const SharedLinks = () => {
  const [links, setLinks] = useState([]);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchLinks = async () => {
      if (!user) return;
      const q = query(collection(db, 'sharedLinks'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      setLinks(querySnapshot.docs.map(doc => doc.data().url));
    };
    fetchLinks();
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      const handleClipboardLink = async () => {
        if (!user) return;
        const url = await Clipboard.getStringAsync();
        if (url && url.startsWith('http')) {
          await addDoc(collection(db, 'sharedLinks'), { url, userId: user.uid });
          setLinks(prevLinks => [...prevLinks, url]);
        }
      };
      handleClipboardLink();
    }, [user])
  );

  const shareApp = async () => {
    try {
      await Share.share({
        message: 'Check out this app to save shared links!',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <View>
      <Text>Share a link from any social media platform and it will appear here.</Text>
      <FlatList
        data={links}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => <Text>{item}</Text>}
      />
    </View>
  );
};

export default SharedLinks;
