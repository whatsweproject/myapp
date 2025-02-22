import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity } from 'react-native';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { Audio } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import { db } from '../../firebase';
import { getAuth } from 'firebase/auth';
import openai from '../config/openai';
import * as FileSystem from 'expo-file-system';

const NotesTab = () => {
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState([]);
  const [recording, setRecording] = useState(null);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchNotes = async () => {
      if (!user) return;
      const q = query(collection(db, 'notes'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      setNotes(querySnapshot.docs.map(doc => doc.data()));
    };
    fetchNotes();
  }, [user]);

  const saveNote = async () => {
    if (note && user) {
      const newNote = { text: note, userId: user.uid, type: 'text' };
      await addDoc(collection(db, 'notes'), newNote);
      setNotes([...notes, newNote]);
      setNote('');
    }
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      setRecording(recording);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (recording && user) {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const transcription = await transcribeAudio(uri);
      const newNote = { audioUri: uri, transcription, userId: user.uid, type: 'audio' };
      await addDoc(collection(db, 'notes'), newNote);
      setNotes([...notes, newNote]);
      setRecording(null);
    }
  };

  const transcribeAudio = async (audioUri) => {
    try {
      const file = await FileSystem.uploadAsync(audioUri, {
        httpMethod: 'POST',
        headers: {
          'Authorization': `Bearer YOUR_OPENAI_API_KEY`,
          'Content-Type': 'audio/mpeg',
        },
      });
      const transcription = await openai.audio.transcriptions.create({
        file: file.uri,
        model: 'whisper-1',
      });
      return transcription.text || 'Transcription not available';
    } catch (error) {
      console.error('Error transcribing audio:', error);
      return 'Transcription failed';
    }
  };

  return (
    <View>
      <Text>Write or Record Your Thoughts</Text>
      <TextInput
        placeholder="Write a note..."
        value={note}
        onChangeText={setNote}
      />
      <Button title="Save Note" onPress={saveNote} />
      <Button title={recording ? "Stop Recording" : "Start Recording"} onPress={recording ? stopRecording : startRecording} />
      
      <Text>Previous Notes:</Text>
      <FlatList
        data={notes}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity>
            <Text>{item.type === 'text' ? item.text : `Audio Note: ${item.transcription || 'Processing...'}`}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default NotesTab;
