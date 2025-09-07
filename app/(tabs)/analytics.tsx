import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';



interface StudyData {
  date: string;
  hours: number;
  subject: string;
}

interface ExamData {
  created_at: string;
  score: number;
  max_score: number;
  subject_scores: {
    biology?: number;
    chemistry?: number;
    physics?: number;
    psychology?: number;
    cars?: number;
  };
  completion_time_minutes?: number;
}

const SUBJECTS = ['Biology', 'Chemistry', 'Physics', 'Psychology/Sociology', 'CARS'];
const SUBJECT_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];

export default function Analytics() {
  const { user } = useAuth();
  const [studyData, setStudyData] = useState<StudyData[]>([]);
  const [examData, setExamData] = useState<ExamData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('month');
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Provide fallback during loading
  if (!isMounted) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Analytics...</Text>
      </View>
    );
  }

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStudyData(),
        loadExamData(),
      ]);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudyData = async () => {
    try {
      let query = supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true });

      if (selectedPeriod === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('created_at', weekAgo.toISOString());
      } else if (selectedPeriod === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte('created_at', monthAgo.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      const processedData = (data || []).map(session => ({
        date: session.created_at,
        hours: session.duration_minutes / 60,
        subject: session.subject,
      }));

      setStudyData(processedData);
    } catch (error) {
      console.error('Error loading study data:', error);
    }
  };

  const loadExamData = async () => {
    try {
      let query = supabase
        .from('practice_exams')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true });

      if (selectedPeriod === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('created_at', weekAgo.toISOString());
      } else if (selectedPeriod === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte('created_at', monthAgo.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      setExamData(data || []);
    } catch (error) {
      console.error('Error loading exam data:', error);
    }
  };

  const getStudyHoursChartData = () => {
    const dailyHours: { [key: string]: number } = {};
    
    studyData.forEach(session => {
      const date = new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyHours[date] = (dailyHours[date] || 0) + session.hours;
    });

    const sortedDates = Object.keys(dailyHours).sort((a, b) => {
      const dateA = new Date(a + ', 2024');
      const dateB = new Date(b + ', 2024');
      return dateA.getTime() - dateB.getTime();
    });

    return {
      labels: sortedDates.slice(-7), // Show last 7 data points
      datasets: [{
        data: sortedDates.slice(-7).map(date => Math.round(dailyHours[date] * 10) / 10),
        strokeWidth: 3,
      }],
    };
  };

  const getSubjectDistributionData = () => {
    const subjectHours: { [key: string]: number } = {};
    
    studyData.forEach(session => {
      subjectHours[session.subject] = (subjectHours[session.subject] || 0) + session.hours;
    });

    return SUBJECTS.map((subject, index) => ({
      name: subject,
      hours: Math.round((subjectHours[subject] || 0) * 10) / 10,
      color: SUBJECT_COLORS[index],
      legendFontColor: '#64748b',
      legendFontSize: 12,
    })).filter(item => item.hours > 0);
  };

  const getExamScoresChartData = () => {
    const scoresWithDates = examData
      .filter(exam => exam.score)
      .map(exam => ({
        date: new Date(exam.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: exam.score,
      }))
      .slice(-6); // Show last 6 exams

    return {
      labels: scoresWithDates.map(item => item.date),
      datasets: [{
        data: scoresWithDates.map(item => item.score),
        strokeWidth: 3,
      }],
    };
  };

  const getSectionPerformanceData = () => {
    const sectionTotals = {
      biology: 0,
      chemistry: 0,
      physics: 0,
      psychology: 0,
      cars: 0,
    };
    const sectionCounts = {
      biology: 0,
      chemistry: 0,
      physics: 0,
      psychology: 0,
      cars: 0,
    };

    examData.forEach(exam => {
      if (exam.subject_scores) {
        if (exam.subject_scores.biology) {
          sectionTotals.biology += exam.subject_scores.biology;
          sectionCounts.biology++;
        }
        if (exam.subject_scores.chemistry) {
          sectionTotals.chemistry += exam.subject_scores.chemistry;
          sectionCounts.chemistry++;
        }
        if (exam.subject_scores.physics) {
          sectionTotals.physics += exam.subject_scores.physics;
          sectionCounts.physics++;
        }
        if (exam.subject_scores.psychology) {
          sectionTotals.psychology += exam.subject_scores.psychology;
          sectionCounts.psychology++;
        }
        if (exam.subject_scores.cars) {
          sectionTotals.cars += exam.subject_scores.cars;
          sectionCounts.cars++;
        }
      }
    });

    return {
      labels: ['Bio', 'Chem', 'Phys', 'Psyc', 'CARS'],
      datasets: [{
        data: [
          sectionCounts.biology ? Math.round(sectionTotals.biology / sectionCounts.biology) : 0,
          sectionCounts.chemistry ? Math.round(sectionTotals.chemistry / sectionCounts.chemistry) : 0,
          sectionCounts.physics ? Math.round(sectionTotals.physics / sectionCounts.physics) : 0,
          sectionCounts.psychology ? Math.round(sectionTotals.psychology / sectionCounts.psychology) : 0,
          sectionCounts.cars ? Math.round(sectionTotals.cars / sectionCounts.cars) : 0,
        ],
      }],
    };
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(30, 64, 175, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#1E40AF',
    },
  };

  const studyHoursData = getStudyHoursChartData();
  const subjectData = getSubjectDistributionData();
  const examScoresData = getExamScoresChartData();
  const sectionPerformanceData = getSectionPerformanceData();

  const totalStudyHours = studyData.reduce((sum, session) => sum + session.hours, 0);
  const averageExamScore = examData.length > 0 
    ? Math.round(examData.reduce((sum, exam) => sum + (exam.total_score || 0), 0) / examData.filter(exam => exam.total_score).length)
    : 0;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Track your progress and performance</Text>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(['week', 'month', 'all'] as const).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === period && styles.periodButtonTextActive
            ]}>
              {period === 'week' ? 'Week' : period === 'month' ? 'Month' : 'All Time'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryStats}>
        <View style={styles.statCard}>
          <Text style={[styles.statIcon, { color: '#1E40AF' }]}>⏰</Text>
          <Text style={styles.statValue}>{Math.round(totalStudyHours * 10) / 10}h</Text>
          <Text style={styles.statLabel}>Total Study Time</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statIcon, { color: '#10B981' }]}>📈</Text>
          <Text style={styles.statValue}>{averageExamScore || '--'}</Text>
          <Text style={styles.statLabel}>Avg Exam Score</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statIcon, { color: '#8B5CF6' }]}>📄</Text>
          <Text style={styles.statValue}>{examData.length}</Text>
          <Text style={styles.statLabel}>Practice Exams</Text>
        </View>
      </View>

      {/* Charts Placeholder */}
      <View style={styles.chartsContainer}>
        <Text style={styles.chartsTitle}>Analytics Dashboard</Text>
        <View style={styles.chartsPlaceholder}>
          <Text style={styles.chartsIcon}>📊</Text>
          <Text style={styles.chartsMainText}>
            Charts will be available soon
          </Text>
          <Text style={styles.chartsSubText}>
            Interactive charts and detailed analytics are coming in a future update
          </Text>
        </View>
      </View>

      {/* Empty State */}
      {studyData.length === 0 && examData.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📈</Text>
          <Text style={styles.emptyStateTitle}>No data available</Text>
          <Text style={styles.emptyStateSubtitle}>
            Start logging study sessions and practice exams to see your analytics
          </Text>
        </View>
      )}
    </ScrollView>
   );
 }
 
 const styles = StyleSheet.create({
   container: {
     flex: 1,
     backgroundColor: '#f8fafc',
   },
   header: {
     backgroundColor: 'white',
     paddingHorizontal: 20,
     paddingTop: 60,
     paddingBottom: 20,
     borderBottomWidth: 1,
     borderBottomColor: '#e2e8f0',
   },
   title: {
     fontSize: 28,
     fontWeight: 'bold',
     color: '#1e293b',
     textAlign: 'center',
   },
   subtitle: {
     fontSize: 16,
     color: '#64748b',
     textAlign: 'center',
     marginTop: 4,
   },
   periodSelector: {
     flexDirection: 'row',
     backgroundColor: '#f1f5f9',
     borderRadius: 12,
     padding: 4,
     marginHorizontal: 20,
     marginTop: 20,
   },
   periodButton: {
     flex: 1,
     paddingVertical: 12,
     borderRadius: 8,
     alignItems: 'center',
   },
   periodButtonActive: {
     backgroundColor: 'white',
   },
   periodButtonText: {
     fontSize: 14,
     fontWeight: '600',
     color: '#64748b',
   },
   periodButtonTextActive: {
     color: '#1e40af',
   },
   summaryStats: {
     flexDirection: 'row',
     padding: 20,
     paddingTop: 10,
   },
   statCard: {
     flex: 1,
     backgroundColor: 'white',
     padding: 16,
     borderRadius: 12,
     alignItems: 'center',
     marginHorizontal: 4,
     shadowColor: '#000',
     shadowOffset: {
       width: 0,
       height: 2,
     },
     shadowOpacity: 0.1,
     shadowRadius: 4,
     elevation: 3,
   },
   statIcon: {
     fontSize: 24,
     marginBottom: 8,
   },
   statValue: {
     fontSize: 20,
     fontWeight: 'bold',
     color: '#1E293B',
     marginTop: 8,
   },
   statLabel: {
     fontSize: 12,
     color: '#64748b',
     marginTop: 4,
   },
   chartsContainer: {
     backgroundColor: 'white',
     margin: 20,
     marginTop: 10,
     borderRadius: 16,
     padding: 16,
     shadowColor: '#000',
     shadowOffset: {
       width: 0,
       height: 2,
     },
     shadowOpacity: 0.1,
     shadowRadius: 4,
     elevation: 3,
   },
   chartsTitle: {
     fontSize: 18,
     fontWeight: '600',
     color: '#1E293B',
     marginBottom: 16,
     textAlign: 'center',
   },
   chartsPlaceholder: {
     padding: 40,
     alignItems: 'center',
   },
   chartsIcon: {
     fontSize: 48,
     marginBottom: 16,
   },
   chartsMainText: {
     fontSize: 16,
     fontWeight: '600',
     color: '#64748b',
     marginBottom: 8,
   },
   chartsSubText: {
     fontSize: 14,
     lineHeight: 20,
     color: '#64748b',
     textAlign: 'center',
   },
   emptyState: {
     backgroundColor: 'white',
     margin: 20,
     padding: 40,
     borderRadius: 16,
     alignItems: 'center',
     shadowColor: '#000',
     shadowOffset: {
       width: 0,
       height: 2,
     },
     shadowOpacity: 0.1,
     shadowRadius: 4,
     elevation: 3,
   },
   emptyStateIcon: {
     fontSize: 64,
     color: '#9CA3AF',
     marginBottom: 16,
   },
   emptyStateTitle: {
     fontSize: 20,
     fontWeight: '600',
     color: '#64748b',
     marginTop: 16,
   },
   emptyStateSubtitle: {
     fontSize: 14,
     color: '#9CA3AF',
     marginTop: 8,
     lineHeight: 20,
     textAlign: 'center',
   },
 });