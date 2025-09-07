import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardStats {
  totalStudyHours: number;
  weeklyStudyHours: number;
  practiceExamsCount: number;
  averageScore: number;
  currentStreak: number;
}

interface RecentActivity {
  id: string;
  type: 'study' | 'practice';
  subject: string;
  duration?: number;
  score?: number;
  created_at: string;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudyHours: 0,
    weeklyStudyHours: 0,
    practiceExamsCount: 0,
    averageScore: 0,
    currentStreak: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const calculateStreak = (sessions: any[]) => {
    if (!sessions.length) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let currentDate = new Date(today);

    while (true) {
      const hasActivity = sessions.some(session => {
        const sessionDate = new Date(session.created_at);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === currentDate.getTime();
      });

      if (hasActivity) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const loadStats = async () => {
    const { data: studySessions } = await supabase
      .from('study_sessions')
      .select('duration_minutes, created_at')
      .eq('user_id', user?.id);

    const { data: practiceExams } = await supabase
      .from('practice_exams')
      .select('total_score, created_at')
      .eq('user_id', user?.id);

    // Calculate stats
    const totalMinutes = studySessions?.reduce((sum, session) => sum + session.duration_minutes, 0) || 0;
    const totalStudyHours = Math.round((totalMinutes / 60) * 10) / 10;

    // Weekly study hours (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyMinutes = studySessions?.filter(session => 
      new Date(session.created_at) >= weekAgo
    ).reduce((sum, session) => sum + session.duration_minutes, 0) || 0;
    const weeklyStudyHours = Math.round((weeklyMinutes / 60) * 10) / 10;

    const practiceExamsCount = practiceExams?.length || 0;
    const averageScore = practiceExams?.length 
      ? Math.round(practiceExams.reduce((sum, exam) => sum + exam.total_score, 0) / practiceExams.length)
      : 0;

    // Calculate current streak (consecutive days with study activity)
    const currentStreak = calculateStreak(studySessions || []);

    setStats({
      totalStudyHours,
      weeklyStudyHours,
      practiceExamsCount,
      averageScore,
      currentStreak,
    });
  };

  const loadRecentActivity = async () => {
    const { data: studySessions } = await supabase
      .from('study_sessions')
      .select('id, subject, duration_minutes, created_at')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(3);

    const { data: practiceExams } = await supabase
      .from('practice_exams')
      .select('id, exam_type, total_score, created_at')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(3);

    const activities: RecentActivity[] = [];

    studySessions?.forEach(session => {
      activities.push({
        id: session.id,
        type: 'study',
        subject: session.subject,
        duration: session.duration_minutes,
        created_at: session.created_at,
      });
    });

    practiceExams?.forEach(exam => {
      activities.push({
        id: exam.id,
        type: 'practice',
        subject: exam.exam_type,
        score: exam.total_score,
        created_at: exam.created_at,
      });
    });

    // Sort by date and take top 5
    activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setRecentActivity(activities.slice(0, 5));
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadStats(), loadRecentActivity()]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    loadDashboardData();
  }, []);

  // Provide fallback during loading
  if (!isMounted) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
        </View>
      </View>
    );
  }



  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.nameText}>{user?.user_metadata?.full_name || 'Student'}</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statsCard}>
            <Text style={styles.statsValue}>{stats.totalStudyHours}h</Text>
            <Text style={styles.statsLabel}>Total Study</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={styles.statsValue}>{stats.weeklyStudyHours}h</Text>
            <Text style={styles.statsLabel}>This Week</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statsCard}>
            <Text style={styles.statsValue}>{stats.practiceExamsCount}</Text>
            <Text style={styles.statsLabel}>Practice Exams</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={styles.statsValue}>{stats.averageScore}%</Text>
            <Text style={styles.statsLabel}>Avg Score</Text>
          </View>
        </View>
      </View>

      {/* Current Streak */}
      <View style={styles.streakCard}>
        <View style={styles.streakHeader}>
          <Text style={styles.streakIcon}>🔥</Text>
          <Text style={styles.streakTitle}>Current Streak</Text>
        </View>
        <Text style={styles.streakValue}>{stats.currentStreak} days</Text>
        <Text style={styles.streakDescription}>Keep it up! Study today to maintain your streak.</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity 
            style={[styles.quickActionButton, { backgroundColor: '#1E40AF' }]}
            onPress={() => router.push('/(tabs)/study')}
          >
            <Text style={styles.quickActionIcon}>📚</Text>
            <Text style={styles.quickActionText}>Start Study</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.quickActionButton, { backgroundColor: '#DC2626' }]}
            onPress={() => router.push('/(tabs)/practice')}
          >
            <Text style={styles.quickActionIcon}>🎓</Text>
            <Text style={styles.quickActionText}>Practice Exam</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.recentActivityContainer}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentActivity.length > 0 ? (
          <View style={styles.activityList}>
            {recentActivity.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Text style={[styles.activityIconText, { color: activity.type === 'study' ? '#1E40AF' : '#DC2626' }]}>
                    {activity.type === 'study' ? '📚' : '🎓'}
                  </Text>
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>
                    {activity.type === 'study' ? 'Study Session' : 'Practice Exam'}
                  </Text>
                  <Text style={styles.activitySubject}>{activity.subject}</Text>
                  {activity.duration && (
                    <Text style={styles.activityDetail}>{activity.duration} minutes</Text>
                  )}
                  {activity.score && (
                    <Text style={styles.activityDetail}>Score: {activity.score}%</Text>
                  )}
                </View>
                <Text style={styles.activityDate}>{formatDate(activity.created_at)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyActivityCard}>
            <Text style={styles.emptyActivityIcon}>📅</Text>
            <Text style={styles.emptyActivityTitle}>No recent activity</Text>
            <Text style={styles.emptyActivityText}>Start studying to see your progress here</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 16,
    color: '#64748b',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  signOutButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  signOutText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statsCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  streakCard: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakIcon: {
    fontSize: 28,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 8,
  },
  streakValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 4,
  },
  streakDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  quickActionsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
  },
  quickActionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  recentActivityContainer: {
    padding: 20,
    paddingTop: 0,
  },
  activityList: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityIconText: {
    fontSize: 20,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  activitySubject: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  activityDetail: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  activityDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyActivityCard: {
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
  emptyActivityIcon: {
    fontSize: 48,
    color: '#9CA3AF',
  },
  emptyActivityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
  },
  emptyActivityText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
});