import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Goal {
  id: string;
  user_id: string;
  goal_type: 'target_score' | 'study_hours' | 'practice_exams' | 'subject_focus';
  title: string;
  description?: string;
  target_value: number;
  current_value: number;
  target_date: string;
  is_completed: boolean;
  created_at: string;
}

const GOAL_TYPES = [
  { key: 'target_score', label: 'Target MCAT Score', icon: 'trophy-outline' },
  { key: 'study_hours', label: 'Study Hours Goal', icon: 'time-outline' },
  { key: 'practice_exams', label: 'Practice Exams Goal', icon: 'document-text-outline' },
  { key: 'subject_focus', label: 'Subject Focus Goal', icon: 'school-outline' },
];

export default function Goals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    goal_type: 'target_score' as Goal['goal_type'],
    title: '',
    description: '',
    target_value: '',
    target_date: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error loading goals:', error);
      Alert.alert('Error', 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = async (goal: Goal) => {
    let currentValue = 0;

    try {
      switch (goal.goal_type) {
        case 'study_hours':
          const { data: studyData } = await supabase
            .from('study_sessions')
            .select('duration_minutes')
            .eq('user_id', user?.id)
            .gte('session_date', new Date(goal.created_at).toISOString().split('T')[0]);
          
          currentValue = (studyData || []).reduce((sum, session) => sum + session.duration_minutes, 0) / 60;
          break;

        case 'practice_exams':
          const { data: examData } = await supabase
            .from('practice_exams')
            .select('id')
            .eq('user_id', user?.id)
            .gte('exam_date', new Date(goal.created_at).toISOString().split('T')[0]);
          
          currentValue = examData?.length || 0;
          break;

        case 'target_score':
          const { data: latestExam } = await supabase
            .from('practice_exams')
            .select('total_score')
            .eq('user_id', user?.id)
            .order('exam_date', { ascending: false })
            .limit(1);
          
          currentValue = latestExam?.[0]?.total_score || 0;
          break;

        default:
          currentValue = goal.current_value;
      }

      // Update the goal's current value
      await supabase
        .from('goals')
        .update({ current_value: currentValue })
        .eq('id', goal.id);

      return currentValue;
    } catch (error) {
      console.error('Error calculating progress:', error);
      return goal.current_value;
    }
  };

  const addGoal = async () => {
    if (!newGoal.title.trim() || !newGoal.target_value || !newGoal.target_date) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('goals')
        .insert({
          user_id: user?.id,
          goal_type: newGoal.goal_type,
          title: newGoal.title.trim(),
          description: newGoal.description.trim(),
          target_value: parseFloat(newGoal.target_value),
          current_value: 0,
          target_date: newGoal.target_date,
          is_completed: false,
        });

      if (error) throw error;

      setShowAddModal(false);
      setNewGoal({
        goal_type: 'target_score',
        title: '',
        description: '',
        target_value: '',
        target_date: '',
      });
      loadGoals();
    } catch (error) {
      console.error('Error adding goal:', error);
      Alert.alert('Error', 'Failed to add goal');
    } finally {
      setSaving(false);
    }
  };

  const deleteGoal = async (goalId: string) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('goals')
                .delete()
                .eq('id', goalId);

              if (error) throw error;
              loadGoals();
            } catch (error) {
              console.error('Error deleting goal:', error);
              Alert.alert('Error', 'Failed to delete goal');
            }
          },
        },
      ]
    );
  };

  const toggleGoalCompletion = async (goal: Goal) => {
    try {
      const { error } = await supabase
        .from('goals')
        .update({ is_completed: !goal.is_completed })
        .eq('id', goal.id);

      if (error) throw error;
      loadGoals();
    } catch (error) {
      console.error('Error updating goal:', error);
      Alert.alert('Error', 'Failed to update goal');
    }
  };

  const getProgressPercentage = (goal: Goal) => {
    if (goal.target_value === 0) return 0;
    return Math.min((goal.current_value / goal.target_value) * 100, 100);
  };

  const getGoalTypeIcon = (goalType: Goal['goal_type']) => {
    const type = GOAL_TYPES.find(t => t.key === goalType);
    return type?.icon || 'flag-outline';
  };

  const formatTargetDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isGoalOverdue = (targetDate: string) => {
    return new Date(targetDate) < new Date() && !goals.find(g => g.target_date === targetDate)?.is_completed;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#1E40AF" />
        <Text style={styles.loadingText}>Loading goals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Goals</Text>
        <Text style={styles.subtitle}>Set and track your MCAT preparation goals</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>Add Goal</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {goals.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="flag-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>No goals set yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first goal to start tracking your MCAT preparation progress
            </Text>
          </View>
        ) : (
          goals.map((goal) => {
            const progress = getProgressPercentage(goal);
            const isOverdue = isGoalOverdue(goal.target_date);
            
            return (
              <View key={goal.id} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <View style={styles.goalTitleRow}>
                    <Ionicons
                      name={getGoalTypeIcon(goal.goal_type) as any}
                      size={24}
                      color={goal.is_completed ? '#10B981' : '#1E40AF'}
                    />
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                    <TouchableOpacity
                      onPress={() => deleteGoal(goal.id)}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                  {goal.description && (
                    <Text style={styles.goalDescription}>{goal.description}</Text>
                  )}
                </View>

                <View style={styles.goalProgress}>
                  <View style={styles.progressInfo}>
                    <Text style={styles.progressText}>
                      {Math.round(goal.current_value * 10) / 10} / {goal.target_value}
                      {goal.goal_type === 'study_hours' ? ' hours' : 
                       goal.goal_type === 'practice_exams' ? ' exams' : 
                       goal.goal_type === 'target_score' ? ' points' : ''}
                    </Text>
                    <Text style={[styles.progressPercentage, goal.is_completed && styles.completedText]}>
                      {Math.round(progress)}%
                    </Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${progress}%`,
                          backgroundColor: goal.is_completed ? '#10B981' : '#1E40AF',
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.goalFooter}>
                  <Text style={[styles.targetDate, isOverdue && styles.overdueDate]}>
                    Target: {formatTargetDate(goal.target_date)}
                    {isOverdue && ' (Overdue)'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => toggleGoalCompletion(goal)}
                    style={[
                      styles.completeButton,
                      goal.is_completed && styles.completedButton,
                    ]}
                  >
                    <Ionicons
                      name={goal.is_completed ? 'checkmark-circle' : 'checkmark-circle-outline'}
                      size={20}
                      color={goal.is_completed ? '#10B981' : '#64748b'}
                    />
                    <Text style={[
                      styles.completeButtonText,
                      goal.is_completed && styles.completedButtonText,
                    ]}>
                      {goal.is_completed ? 'Completed' : 'Mark Complete'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Goal</Text>
            <TouchableOpacity onPress={addGoal} disabled={saving}>
              <Text style={[styles.saveButton, saving && styles.disabledButton]}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.fieldLabel}>Goal Type</Text>
            <View style={styles.goalTypeContainer}>
              {GOAL_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.goalTypeButton,
                    newGoal.goal_type === type.key && styles.selectedGoalType,
                  ]}
                  onPress={() => setNewGoal({ ...newGoal, goal_type: type.key as Goal['goal_type'] })}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={20}
                    color={newGoal.goal_type === type.key ? 'white' : '#64748b'}
                  />
                  <Text style={[
                    styles.goalTypeText,
                    newGoal.goal_type === type.key && styles.selectedGoalTypeText,
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Title *</Text>
            <TextInput
              style={styles.textInput}
              value={newGoal.title}
              onChangeText={(text) => setNewGoal({ ...newGoal, title: text })}
              placeholder="Enter goal title"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={newGoal.description}
              onChangeText={(text) => setNewGoal({ ...newGoal, description: text })}
              placeholder="Enter goal description (optional)"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.fieldLabel}>Target Value *</Text>
            <TextInput
              style={styles.textInput}
              value={newGoal.target_value}
              onChangeText={(text) => setNewGoal({ ...newGoal, target_value: text })}
              placeholder={newGoal.goal_type === 'study_hours' ? 'Hours' : 
                          newGoal.goal_type === 'practice_exams' ? 'Number of exams' :
                          newGoal.goal_type === 'target_score' ? 'Score (e.g., 520)' : 'Value'}
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />

            <Text style={styles.fieldLabel}>Target Date *</Text>
            <TextInput
              style={styles.textInput}
              value={newGoal.target_date}
              onChangeText={(text) => setNewGoal({ ...newGoal, target_date: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
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
    marginBottom: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    backgroundColor: 'white',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  goalCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalHeader: {
    marginBottom: 16,
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 12,
  },
  deleteButton: {
    padding: 4,
  },
  goalDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  goalProgress: {
    marginBottom: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#64748b',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
  },
  completedText: {
    color: '#10B981',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetDate: {
    fontSize: 14,
    color: '#64748b',
  },
  overdueDate: {
    color: '#EF4444',
    fontWeight: '600',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
  },
  completedButton: {
    backgroundColor: '#F0FDF4',
  },
  completeButtonText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  completedButtonText: {
    color: '#10B981',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  cancelButton: {
    fontSize: 16,
    color: '#64748b',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
  },
  disabledButton: {
    color: '#9CA3AF',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
    marginTop: 16,
  },
  goalTypeContainer: {
    marginBottom: 8,
  },
  goalTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  selectedGoalType: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  goalTypeText: {
    fontSize: 16,
    color: '#64748b',
    marginLeft: 12,
  },
  selectedGoalTypeText: {
    color: 'white',
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
});