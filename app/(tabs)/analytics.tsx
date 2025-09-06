import React, { useState, useEffect } from 'react';
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

  // Provide fallback during SSR
  if (!isMounted) {
    return (
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <div>Loading Analytics...</div>
      </div>
    );
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadAnalyticsData();
    }
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
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        paddingTop: '60px',
        backgroundColor: 'white',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#1E293B',
          marginBottom: '4px',
          margin: 0
        }}>Analytics</h1>
        <p style={{
          fontSize: '16px',
          color: '#64748b',
          margin: 0
        }}>Track your progress and performance</p>
      </div>

      {/* Period Selector */}
      <div style={{
        display: 'flex',
        padding: '20px',
        paddingBottom: '10px'
      }}>
        {(['week', 'month', 'all'] as const).map((period) => (
          <button
            key={period}
            style={{
              flex: 1,
              padding: '12px',
              margin: '0 4px',
              borderRadius: '8px',
              backgroundColor: selectedPeriod === period ? '#1E40AF' : '#F1F5F9',
              color: selectedPeriod === period ? 'white' : '#64748b',
              border: 'none',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
            onClick={() => setSelectedPeriod(period)}
          >
            {period === 'week' ? 'Week' : period === 'month' ? 'Month' : 'All Time'}
          </button>
        ))}
      </div>

      {/* Summary Stats */}
      <div style={{
        display: 'flex',
        padding: '20px',
        paddingTop: '10px'
      }}>
        <div style={{
          flex: 1,
          backgroundColor: 'white',
          padding: '16px',
          borderRadius: '12px',
          textAlign: 'center',
          margin: '0 4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '24px', color: '#1E40AF', marginBottom: '8px' }}>⏰</div>
          <div style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#1E293B',
            marginTop: '8px'
          }}>{Math.round(totalStudyHours * 10) / 10}h</div>
          <div style={{
            fontSize: '12px',
            color: '#64748b',
            marginTop: '4px'
          }}>Total Study Time</div>
        </div>
        <div style={{
          flex: 1,
          backgroundColor: 'white',
          padding: '16px',
          borderRadius: '12px',
          textAlign: 'center',
          margin: '0 4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '24px', color: '#10B981', marginBottom: '8px' }}>📈</div>
          <div style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#1E293B',
            marginTop: '8px'
          }}>{averageExamScore || '--'}</div>
          <div style={{
            fontSize: '12px',
            color: '#64748b',
            marginTop: '4px'
          }}>Avg Exam Score</div>
        </div>
        <div style={{
          flex: 1,
          backgroundColor: 'white',
          padding: '16px',
          borderRadius: '12px',
          textAlign: 'center',
          margin: '0 4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '24px', color: '#8B5CF6', marginBottom: '8px' }}>📄</div>
          <div style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#1E293B',
            marginTop: '8px'
          }}>{examData.length}</div>
          <div style={{
            fontSize: '12px',
            color: '#64748b',
            marginTop: '4px'
          }}>Practice Exams</div>
        </div>
      </div>

      {/* Charts Placeholder */}
      <div style={{
        backgroundColor: 'white',
        margin: '20px',
        marginTop: '10px',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#1E293B',
          marginBottom: '16px',
          textAlign: 'center',
          margin: '0 0 16px 0'
        }}>Analytics Dashboard</h3>
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: '#64748b'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <p style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
            Charts will be available soon
          </p>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: '20px' }}>
            Interactive charts and detailed analytics are coming in a future update
          </p>
        </div>
      </div>

      {/* Empty State */}
      {studyData.length === 0 && examData.length === 0 && (
        <div style={{
          backgroundColor: 'white',
          margin: '20px',
          padding: '40px',
          borderRadius: '16px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '64px', color: '#9CA3AF', marginBottom: '16px' }}>📈</div>
          <div style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#64748b',
            marginTop: '16px'
          }}>No data available</div>
          <div style={{
            fontSize: '14px',
            color: '#9CA3AF',
            marginTop: '8px',
            lineHeight: '20px'
          }}>
            Start logging study sessions and practice exams to see your analytics
          </div>
        </div>
      )}
    </div>
  );
}