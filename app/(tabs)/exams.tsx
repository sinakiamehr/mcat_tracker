import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const EXAM_TYPES = [
  'Full Length Practice Test',
  'Section Bank - Biology',
  'Section Bank - Chemistry',
  'Section Bank - Physics',
  'Section Bank - Psychology/Sociology',
  'Question Pack - Biology',
  'Question Pack - Chemistry',
  'Question Pack - Physics',
  'Question Pack - Psychology/Sociology',
  'CARS Practice',
  'Third Party Practice Test',
  'Custom Practice Set',
];

interface PracticeExam {
  id?: string;
  exam_type: string;
  score: number;
  max_score: number;
  subject_scores?: {
    biology?: number;
    chemistry?: number;
    physics?: number;
    psychology?: number;
    cars?: number;
  };
  completion_time_minutes?: number;
  created_at: string;
}

export default function Exams() {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [examHistory, setExamHistory] = useState<PracticeExam[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [examType, setExamType] = useState('');
  const [totalScore, setTotalScore] = useState('');
  const [biologyScore, setBiologyScore] = useState('');
  const [chemistryScore, setChemistryScore] = useState('');
  const [physicsScore, setPhysicsScore] = useState('');
  const [psychologyScore, setPsychologyScore] = useState('');
  const [carsScore, setCarsScore] = useState('');
  const [showExamTypeModal, setShowExamTypeModal] = useState(false);

  useEffect(() => {
    // Skip data loading during static export
    if (typeof window !== 'undefined') {
      loadExamHistory();
    }
  }, []);

  const loadExamHistory = async () => {
    // Skip during static export
    if (typeof window === 'undefined') return;
    
    try {
      const { data, error } = await supabase
        .from('practice_exams')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExamHistory(data || []);
    } catch (error) {
      console.error('Error loading exam history:', error);
    }
  };

  const resetForm = () => {
    setExamType('');
    setTotalScore('');
    setBiologyScore('');
    setChemistryScore('');
    setPhysicsScore('');
    setPsychologyScore('');
    setCarsScore('');
  };

  const validateForm = () => {
    if (!examType) {
      Alert.alert('Error', 'Please select an exam type.');
      return false;
    }
    // Date validation removed - using automatic created_at timestamp
    if (!totalScore && !biologyScore && !chemistryScore && !physicsScore && !psychologyScore && !carsScore) {
      Alert.alert('Error', 'Please enter at least one score.');
      return false;
    }
    return true;
  };

  const handleSaveExam = async () => {
    if (!validateForm()) return;
    
    // Skip during static export
    if (typeof window === 'undefined') return;

    setLoading(true);
    try {
      const subjectScores = {
        biology: biologyScore ? parseInt(biologyScore) : null,
        chemistry: chemistryScore ? parseInt(chemistryScore) : null,
        physics: physicsScore ? parseInt(physicsScore) : null,
        psychology: psychologyScore ? parseInt(psychologyScore) : null,
        cars: carsScore ? parseInt(carsScore) : null,
      };

      const examData = {
        exam_type: examType,
        score: totalScore ? parseInt(totalScore) : 0,
        max_score: 528,
        subject_scores: subjectScores,
        completion_time_minutes: null,
      };

      const { error } = await supabase
        .from('practice_exams')
        .insert([{
          ...examData,
          user_id: user?.id,
        }]);

      if (error) throw error;

      Alert.alert(
        'Exam Saved!',
        'Your practice exam results have been recorded.',
        [{ text: 'OK' }]
      );

      resetForm();
      setShowAddModal(false);
      loadExamHistory();
    } catch (error) {
      console.error('Error saving exam:', error);
      Alert.alert('Error', 'Failed to save exam results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getScoreColor = (score: number | null | undefined, maxScore: number = 528) => {
    if (!score) return '#9CA3AF';
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return '#10B981';
    if (percentage >= 70) return '#F59E0B';
    return '#EF4444';
  };

  const calculateAverageScore = () => {
    const scoresWithTotal = examHistory.filter(exam => exam.score);
    if (scoresWithTotal.length === 0) return null;
    const sum = scoresWithTotal.reduce((acc, exam) => acc + (exam.score || 0), 0);
    return Math.round(sum / scoresWithTotal.length);
  };

  const getRecentTrend = () => {
    const recentExams = examHistory.filter(exam => exam.score).slice(0, 3);
    if (recentExams.length < 2) return null;
    
    const latest = recentExams[0].score || 0;
    const previous = recentExams[1].score || 0;
    const change = latest - previous;
    
    return {
      change,
      isImproving: change > 0,
      isStable: change === 0,
    };
  };

  const averageScore = calculateAverageScore();
  const trend = getRecentTrend();

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Practice Exams</Text>
        <Text style={styles.subtitle}>Track your MCAT exam performance</Text>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{examHistory.length}</Text>
          <Text style={styles.statLabel}>Total Exams</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: averageScore ? getScoreColor(averageScore) : '#9CA3AF' }]}>
            {averageScore || '--'}
          </Text>
          <Text style={styles.statLabel}>Avg Score</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.trendContainer}>
            {trend && (
              <Ionicons 
                name={trend.isImproving ? 'trending-up' : trend.isStable ? 'remove' : 'trending-down'} 
                size={20} 
                color={trend.isImproving ? '#10B981' : trend.isStable ? '#9CA3AF' : '#EF4444'} 
              />
            )}
            <Text style={[
              styles.trendText,
              { color: trend ? (trend.isImproving ? '#10B981' : trend.isStable ? '#9CA3AF' : '#EF4444') : '#9CA3AF' }
            ]}>
              {trend ? (trend.isStable ? 'Stable' : `${Math.abs(trend.change)}`) : 'No trend'}
            </Text>
          </View>
          <Text style={styles.statLabel}>Recent Trend</Text>
        </View>
      </View>

      {/* Add Exam Button */}
      <View style={styles.addButtonContainer}>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>Log Practice Exam</Text>
        </TouchableOpacity>
      </View>

      {/* Exam History */}
      <View style={styles.historyContainer}>
        <Text style={styles.sectionTitle}>Exam History</Text>
        {examHistory.length > 0 ? (
          <View style={styles.examsList}>
            {examHistory.map((exam) => (
              <View key={exam.id} style={styles.examItem}>
                <View style={styles.examHeader}>
                  <Text style={styles.examType} numberOfLines={2}>{exam.exam_type}</Text>
                  <Text style={styles.examDate}>{formatDate(exam.created_at)}</Text>
                </View>
                
                {exam.score && (
                  <View style={styles.totalScoreContainer}>
                    <Text style={[styles.totalScore, { color: getScoreColor(exam.score) }]}>
                      {exam.score}/{exam.max_score || 528}
                    </Text>
                  </View>
                )}
                
                {exam.subject_scores && Object.keys(exam.subject_scores).length > 0 && (
                  <View style={styles.sectionScores}>
                    {exam.subject_scores.biology && (
                      <View style={styles.sectionScore}>
                        <Text style={styles.sectionLabel}>Bio</Text>
                        <Text style={styles.sectionValue}>{exam.subject_scores.biology}</Text>
                      </View>
                    )}
                    {exam.subject_scores.chemistry && (
                      <View style={styles.sectionScore}>
                        <Text style={styles.sectionLabel}>Chem</Text>
                        <Text style={styles.sectionValue}>{exam.subject_scores.chemistry}</Text>
                      </View>
                    )}
                    {exam.subject_scores.physics && (
                      <View style={styles.sectionScore}>
                        <Text style={styles.sectionLabel}>Phys</Text>
                        <Text style={styles.sectionValue}>{exam.subject_scores.physics}</Text>
                      </View>
                    )}
                    {exam.subject_scores.psychology && (
                      <View style={styles.sectionScore}>
                        <Text style={styles.sectionLabel}>Psyc</Text>
                        <Text style={styles.sectionValue}>{exam.subject_scores.psychology}</Text>
                      </View>
                    )}
                    {exam.subject_scores.cars && (
                      <View style={styles.sectionScore}>
                        <Text style={styles.sectionLabel}>CARS</Text>
                        <Text style={styles.sectionValue}>{exam.subject_scores.cars}</Text>
                      </View>
                    )}
                  </View>
                )}
                

              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No practice exams yet</Text>
            <Text style={styles.emptySubtext}>Log your first practice exam above</Text>
          </View>
        )}
      </View>

      {/* Add Exam Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Practice Exam</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.formContainer}>
              {/* Exam Type */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Exam Type *</Text>
                <TouchableOpacity 
                  style={styles.selectButton}
                  onPress={() => setShowExamTypeModal(true)}
                >
                  <Text style={[styles.selectButtonText, !examType && styles.placeholder]}>
                    {examType || 'Select exam type'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>



              {/* Total Score */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Total Score (out of 528)</Text>
                <TextInput
                  style={styles.textInput}
                  value={totalScore}
                  onChangeText={setTotalScore}
                  placeholder="Enter total score"
                  keyboardType="numeric"
                />
              </View>

              {/* Section Scores */}
              <Text style={styles.sectionHeader}>Section Scores (optional)</Text>
              
              <View style={styles.scoreRow}>
                <View style={styles.scoreInput}>
                  <Text style={styles.formLabel}>Biology</Text>
                  <TextInput
                    style={styles.textInput}
                    value={biologyScore}
                    onChangeText={setBiologyScore}
                    placeholder="Score"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.scoreInput}>
                  <Text style={styles.formLabel}>Chemistry</Text>
                  <TextInput
                    style={styles.textInput}
                    value={chemistryScore}
                    onChangeText={setChemistryScore}
                    placeholder="Score"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.scoreRow}>
                <View style={styles.scoreInput}>
                  <Text style={styles.formLabel}>Physics</Text>
                  <TextInput
                    style={styles.textInput}
                    value={physicsScore}
                    onChangeText={setPhysicsScore}
                    placeholder="Score"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.scoreInput}>
                  <Text style={styles.formLabel}>Psychology</Text>
                  <TextInput
                    style={styles.textInput}
                    value={psychologyScore}
                    onChangeText={setPsychologyScore}
                    placeholder="Score"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>CARS Score</Text>
                <TextInput
                  style={styles.textInput}
                  value={carsScore}
                  onChangeText={setCarsScore}
                  placeholder="Enter CARS score"
                  keyboardType="numeric"
                />
              </View>


            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, loading && styles.disabledButton]}
                onPress={handleSaveExam}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : 'Save Exam'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Exam Type Selection Modal */}
      <Modal
        visible={showExamTypeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowExamTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Exam Type</Text>
              <TouchableOpacity onPress={() => setShowExamTypeModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.examTypeList}>
              {EXAM_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.examTypeOption}
                  onPress={() => {
                    setExamType(type);
                    setShowExamTypeModal(false);
                  }}
                >
                  <Text style={styles.examTypeOptionText}>{type}</Text>
                  {examType === type && (
                    <Ionicons name="checkmark" size={20} color="#1E40AF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  addButtonContainer: {
    padding: 20,
    paddingTop: 10,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#1E40AF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  historyContainer: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  examsList: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  examItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  examType: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginRight: 12,
  },
  examDate: {
    fontSize: 14,
    color: '#64748b',
  },
  totalScoreContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  totalScore: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionScores: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  sectionScore: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
  },
  sectionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
  examNotes: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    fontStyle: 'italic',
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
    maxHeight: '90%',
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
  formContainer: {
    maxHeight: 400,
  },
  formGroup: {
    padding: 20,
    paddingBottom: 0,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#1E293B',
  },
  placeholder: {
    color: '#9CA3AF',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 20,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  scoreRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  scoreInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#F8FAFC',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#1E40AF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  disabledButton: {
    opacity: 0.6,
  },
  examTypeList: {
    maxHeight: 400,
  },
  examTypeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  examTypeOptionText: {
    fontSize: 16,
    color: '#1E293B',
    flex: 1,
  },
});