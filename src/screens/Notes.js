import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, Platform } from 'react-native';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { Audio } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { db } from '../../firebase';
import { getAuth } from 'firebase/auth';
import { OPENAI_API_KEY } from '../config/openai';
import * as FileSystem from 'expo-file-system';

const NotesTab = () => {
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState([]);
  const [recording, setRecording] = useState(null);
  const [activeTab, setActiveTab] = useState('write');
  const auth = getAuth();
  const user = auth.currentUser;
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  useEffect(() => {
    const fetchNotes = async () => {
      if (!user) return;
      
      try {
        const q = query(
          collection(db, 'notes'), 
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const fetchedNotes = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Fetched notes with IDs:', fetchedNotes);
        setNotes(fetchedNotes);
      } catch (error) {
        console.error('Error fetching notes:', error);
        alert('Failed to load notes');
      }
    };

    fetchNotes();
  }, [user]);

  const saveNote = async () => {
    if (!note.trim() || !user) return;

    try {
      const newNote = { 
        text: note, 
        userId: user.uid, 
        type: 'text',
        timestamp: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'notes'), newNote);
      
      setNotes(prevNotes => [...prevNotes, { 
        ...newNote, 
        id: docRef.id 
      }]);
      setNote('');
      alert('Note saved successfully!');
    } catch (error) {
      console.error('Error saving note:', error);
      alert(`Failed to save note: ${error.message}`);
    }
  };

  const startRecording = async () => {
    try {
      setNote('');
      
      // Request permissions - important for Android
      const permissionResponse = await Audio.requestPermissionsAsync();
      if (permissionResponse.status !== 'granted') {
        throw new Error('Permission to access microphone was denied');
      }

      // Configure audio - updated settings for mobile
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false
      });
      
      // Use specific recording options for mobile
      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      });

      setRecording(recording);
      setNote('Recording... Speak now');
    } catch (err) {
      console.error('Failed to start recording:', err);
      alert('Failed to start recording: ' + err.message);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setNote('Processing audio...');
      setIsTranscribing(true);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log('Recording URI:', uri);

      if (!uri) {
        throw new Error('No recording URI available');
      }

      // Create form data
      const formData = new FormData();
      
      // Create Blob from file
      const response = await fetch(uri);
      const blob = await response.blob();
      
      formData.append('file', blob, 'recording.m4a');
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: formData,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!openaiResponse.ok) {
          const errorText = await openaiResponse.text();
          console.log('Error response:', errorText);
          throw new Error(`Transcription failed: ${openaiResponse.status} - ${errorText}`);
        }

        const data = await openaiResponse.json();
        setNote(data.text || 'Transcription not available');

      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out after 30 seconds');
        }
        throw fetchError;
      }

    } catch (err) {
      console.error('Failed to stop recording or transcribe:', err);
      setNote('Failed to transcribe audio: ' + (err.message || 'Unknown error'));
    } finally {
      setRecording(null);
      setIsTranscribing(false);
    }
  };

  const deleteNote = async (noteId) => {
    try {
      console.log('Attempting to delete note with ID:', noteId);
      if (!noteId) {
        console.error('No note ID provided');
        return;
      }

      const noteRef = doc(db, 'notes', noteId);
      await deleteDoc(noteRef);
      
      setNotes(prevNotes => {
        const updatedNotes = prevNotes.filter(note => note.id !== noteId);
        console.log('Notes after deletion:', updatedNotes);
        return updatedNotes;
      });
      
      alert('Note deleted successfully!');
    } catch (error) {
      console.error('Error deleting note:', error);
      alert(`Failed to delete note: ${error.message}`);
    }
  };

  const confirmDelete = (noteId) => {
    setSelectedNoteId(noteId);
    setModalVisible(true);
  };

  useEffect(() => {
    if (selectedNoteId) {
      Alert.alert(
        'Confirm Delete',
        'Do you want to delete this note?',
        [
          {
            text: 'No',
            onPress: () => setSelectedNoteId(null),
            style: 'cancel'
          },
          {
            text: 'Yes',
            onPress: () => {
              deleteNote(selectedNoteId);
              setSelectedNoteId(null);
            }
          }
        ]
      );
    }
  }, [selectedNoteId]);

  return (
    <View style={styles.container}>
      <View style={styles.tabButtons}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'write' && styles.activeTab]}
          onPress={() => setActiveTab('write')}>
          <Text style={styles.tabText}>Write Note</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'view' && styles.activeTab]}
          onPress={() => setActiveTab('view')}>
          <Text style={styles.tabText}>View Notes</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'write' ? (
        <View style={styles.writeSection}>
          <Text style={styles.sectionTitle}>Write or Record Your Thoughts</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.textInput,
                isTranscribing && styles.transcribingInput
              ]}
              placeholder={recording ? "Recording..." : "Write a note..."}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              editable={!recording && !isTranscribing}
            />
            <View style={styles.actionButtons}>
              <View style={styles.saveButton}>
                <Button title="Save" onPress={saveNote} />
              </View>
              <TouchableOpacity 
                style={styles.recordButton}
                onPress={recording ? stopRecording : startRecording}>
                <MaterialIcons 
                  name={recording ? "stop" : "mic"} 
                  size={24} 
                  color={recording ? "red" : "black"} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.viewSection}>
          <Text style={styles.sectionTitle}>Saved Notes</Text>
          <FlatList
            data={notes.sort((a, b) => 
              new Date(b.timestamp) - new Date(a.timestamp)
            )}
            keyExtractor={(item) => item.id || String(Math.random())}
            renderItem={({ item }) => {
              console.log('Rendering note with ID:', item.id);
              return (
                <View style={styles.noteItem}>
                  <View style={styles.noteContent}>
                    <MaterialIcons 
                      name={item.type === 'audio' ? "mic" : "note"} 
                      size={24} 
                      style={styles.noteIcon}
                    />
                    <Text style={styles.noteText}>
                      {item.type === 'text' ? item.text : `Audio Note: ${item.transcription || 'Processing...'}`}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => confirmDelete(item.id)}
                  >
                    <MaterialIcons name="delete" size={24} color="red" />
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Do you want to delete this note?</Text>
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setModalVisible(false)}
              />
              <Button
                title="Delete"
                onPress={() => {
                  deleteNote(selectedNoteId);
                  setModalVisible(false);
                }}
                color="red"
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    marginTop: Platform.OS === 'ios' ? 40 : 20,
  },
  tabButtons: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    marginHorizontal: 5,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  textInput: {
    height: 150,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    marginRight: 10,
  },
  recordButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f0f0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  viewSection: {
    flex: 1,
  },
  noteItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  noteIcon: {
    marginRight: 10,
    color: '#666',
  },
  noteText: {
    flex: 1,
    fontSize: 16,
    marginRight: 10,
  },
  deleteButton: {
    padding: 8,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center'
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%'
  },
  transcribingInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
});

export default NotesTab;
