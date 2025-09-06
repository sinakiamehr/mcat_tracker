import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const screenWidth = Dimensions.get('window').width;

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
              selectedPeriod === period && styles.selectedPeriodButton,
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === period && styles.selectedPeriodButtonText,
            ]}>
              {period === 'week' ? 'Week' : period === 'month' ? 'Month' : 'All Time'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Ionicons name="time-outline" size={24} color="#1E40AF" />
          <Text style={styles.summaryNumber}>{Math.round(totalStudyHours * 10) / 10}h</Text>
          <Text style={styles.summaryLabel}>Total Study Time</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="trending-up" size={24} color="#10B981" />
          <Text style={styles.summaryNumber}>{averageExamScore || '--'}</Text>
          <Text style={styles.summaryLabel}>Avg Exam Score</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="document-text" size={24} color="#8B5CF6" />
          <Text style={styles.summaryNumber}>{examData.length}</Text>
          <Text style={styles.summaryLabel}>Practice Exams</Text>
        </View>
      </View>

      {/* Study Hours Chart */}
      {studyHoursData.labels.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Daily Study Hours</Text>
          <LineChart
            data={studyHoursData}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {/* Subject Distribution */}
      {subjectData.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Study Time by Subject</Text>
          <PieChart
            data={subjectData}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            accessor="hours"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        </View>
      )}

      {/* Exam Scores Trend */}
      {examScoresData.labels.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Exam Score Progression</Text>
          <LineChart
            data={examScoresData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
            }}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {/* Section Performance */}
      {sectionPerformanceData.datasets[0].data.some(score => score > 0) && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Average Section Scores</Text>
          <BarChart
            data={sectionPerformanceData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
            }}
            style={styles.chart}
            yAxisSuffix=""
            showValuesOnTopOfBars
          />
        </View>
      )}

      {/* Empty State */}
      {studyData.length === 0 && examData.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="analytics-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>No data available</Text>
          <Text style={styles.emptySubtext}>
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
  periodSelector: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 10,
  },
  periodButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  selectedPeriodButton: {
    backgroundColor: '#1E40AF',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  selectedPeriodButtonText: {
    color: 'white',
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
  },
  summaryCard: {
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
  summaryNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 10,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  emptyState: {
    backgroundColor: 'white',
    margin: 20,
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
});