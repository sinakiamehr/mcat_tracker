import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const MCAT_SUBJECTS = [
  'Biology',
  'Chemistry',
  'Physics',
  'Psychology',
  'Sociology',
  'Biochemistry',
  'Organic Chemistry',
  'Critical Analysis',
];

interface StudySession {
  id?: string;
  subject: string;
  duration_minutes: number;
  notes?: string;
  created_at?: string;
}

export default function Study() {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [time, setTime] = useState(0); // in seconds
  const [selectedSubject, setSelectedSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [recentSessions, setRecentSessions] = useState<StudySession[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadRecentSessions();
  }, []);

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTime(time => time + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused]);

  const loadRecentSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentSessions(data || []);
    } catch (error) {
      console.error('Error loading recent sessions:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (!selectedSubject) {
      setShowSubjectModal(true);
      return;
    }
    setIsActive(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    if (time < 60) {
      Alert.alert(
        'Session Too Short',
        'Study sessions must be at least 1 minute long to be saved.',
        [{ text: 'OK', onPress: () => resetTimer() }]
      );
      return;
    }

    Alert.alert(
      'End Study Session',
      `Save this ${Math.floor(time / 60)} minute study session?`,
      [
        { text: 'Discard', style: 'destructive', onPress: () => resetTimer() },
        { text: 'Save', onPress: () => saveSession() },
      ]
    );
  };

  const saveSession = async () => {
    try {
      const session: StudySession = {
        subject: selectedSubject,
        duration_minutes: Math.floor(time / 60),
        notes: notes.trim() || null,
      };

      const { error } = await supabase
        .from('study_sessions')
        .insert([{
          ...session,
          user_id: user?.id,
        }]);

      if (error) throw error;

      Alert.alert(
        'Session Saved!',
        `Great job! You studied ${session.subject} for ${session.duration_minutes} minutes.`,
        [{ text: 'OK' }]
      );

      resetTimer();
      loadRecentSessions();
    } catch (error) {
      console.error('Error saving session:', error);
      Alert.alert('Error', 'Failed to save study session. Please try again.');
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsPaused(false);
    setTime(0);
    setSelectedSubject('');
    setNotes('');
  };

  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject);
    setShowSubjectModal(false);
  };

  const formatSessionDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Study Session</Text>
        <Text style={styles.subtitle}>Track your MCAT preparation time</Text>
      </View>

      {/* Timer Display */}
      <View style={styles.timerContainer}>
        <View style={styles.timerCircle}>
          <Text style={styles.timerText}>{formatTime(time)}</Text>
          {selectedSubject && (
            <Text style={styles.subjectText}>{selectedSubject}</Text>
          )}
        </View>
      </View>

      {/* Subject Selection */}
      {!isActive && (
        <View style={styles.subjectContainer}>
          <Text style={styles.sectionTitle}>Select Subject</Text>
          <TouchableOpacity 
            style={styles.subjectButton}
            onPress={() => setShowSubjectModal(true)}
          >
            <Ionicons name="book-outline" size={20} color="#1E40AF" />
            <Text style={styles.subjectButtonText}>
              {selectedSubject || 'Choose a subject'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
      )}

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        {!isActive ? (
          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Ionicons name="play" size={24} color="white" />
            <Text style={styles.buttonText}>Start Study</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.activeControls}>
            <TouchableOpacity 
              style={[styles.controlButton, styles.pauseButton]} 
              onPress={handlePause}
            >
              <Ionicons name={isPaused ? 'play' : 'pause'} size={20} color="white" />
              <Text style={styles.controlButtonText}>
                {isPaused ? 'Resume' : 'Pause'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.controlButton, styles.stopButton]} 
              onPress={handleStop}
            >
              <Ionicons name="stop" size={20} color="white" />
              <Text style={styles.controlButtonText}>Stop</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Notes Section */}
      {isActive && (
        <View style={styles.notesContainer}>
          <TouchableOpacity 
            style={styles.notesButton}
            onPress={() => setShowNotesModal(true)}
          >
            <Ionicons name="document-text-outline" size={20} color="#1E40AF" />
            <Text style={styles.notesButtonText}>
              {notes ? 'Edit Notes' : 'Add Notes'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Recent Sessions */}
      <View style={styles.recentContainer}>
        <Text style={styles.sectionTitle}>Recent Sessions</Text>
        {recentSessions.length > 0 ? (
          <View style={styles.sessionsContainer}>
            {recentSessions.map((session) => (
              <View key={session.id} style={styles.sessionItem}>
                <View style={styles.sessionIcon}>
                  <Ionicons name="book" size={20} color="#1E40AF" />
                </View>
                <View style={styles.sessionContent}>
                  <Text style={styles.sessionSubject}>{session.subject}</Text>
                  <Text style={styles.sessionDuration}>
                    {session.duration_minutes} minutes
                  </Text>
                  {session.notes && (
                    <Text style={styles.sessionNotes} numberOfLines={2}>
                      {session.notes}
                    </Text>
                  )}
                </View>
                <Text style={styles.sessionDate}>
                  {formatSessionDate(session.created_at!)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No study sessions yet</Text>
            <Text style={styles.emptySubtext}>Start your first study session above</Text>
          </View>
        )}
      </View>

      {/* Subject Selection Modal */}
      <Modal
        visible={showSubjectModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSubjectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Subject</Text>
              <TouchableOpacity onPress={() => setShowSubjectModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.subjectList}>
              {MCAT_SUBJECTS.map((subject) => (
                <TouchableOpacity
                  key={subject}
                  style={styles.subjectOption}
                  onPress={() => handleSubjectSelect(subject)}
                >
                  <Text style={styles.subjectOptionText}>{subject}</Text>
                  {selectedSubject === subject && (
                    <Ionicons name="checkmark" size={20} color="#1E40AF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Notes Modal */}
      <Modal
        visible={showNotesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNotesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Session Notes</Text>
              <TouchableOpacity onPress={() => setShowNotesModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes about your study session..."
              multiline
              textAlignVertical="top"
            />
            <TouchableOpacity 
              style={styles.saveNotesButton}
              onPress={() => setShowNotesModal(false)}
            >
              <Text style={styles.saveNotesText}>Save Notes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  timerContainer: {
    alignItems: 'center',
    padding: 40,
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  timerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  subjectText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  subjectContainer: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  subjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subjectButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    marginLeft: 12,
  },
  controlsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  startButton: {
    flexDirection: 'row',
    backgroundColor: '#1E40AF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  activeControls: {
    flexDirection: 'row',
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  pauseButton: {
    backgroundColor: '#F59E0B',
  },
  stopButton: {
    backgroundColor: '#DC2626',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  notesContainer: {
    padding: 20,
    paddingTop: 0,
  },
  notesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notesButtonText: {
    fontSize: 16,
    color: '#1E40AF',
    marginLeft: 8,
  },
  recentContainer: {
    padding: 20,
  },
  sessionsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sessionContent: {
    flex: 1,
  },
  sessionSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  sessionDuration: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  sessionNotes: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  sessionDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyState: {
    backgroundColor: 'white',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  subjectList: {
    maxHeight: 400,
  },
  subjectOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  subjectOptionText: {
    fontSize: 16,
    color: '#1E293B',
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: '#1E293B',
    minHeight: 120,
  },
  saveNotesButton: {
    backgroundColor: '#1E40AF',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveNotesText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});