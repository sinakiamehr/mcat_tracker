import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, []);

  // Provide fallback during SSR
  if (!isMounted) {
    return (
      <div style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <div style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', display: 'flex', height: '100vh' }}>
          <div style={{ marginTop: 16, fontSize: 16, color: '#64748b' }}>Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadStats(), loadRecentActivity()]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      if (typeof window !== 'undefined') {
        window.alert('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    const { data: studySessions } = await supabase
      .from('study_sessions')
      .select('duration_minutes, created_at')
      .eq('user_id', user?.id);

    const { data: practiceExams } = await supabase
      .from('practice_exams')
      .select('score, created_at')
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
      ? Math.round(practiceExams.reduce((sum, exam) => sum + exam.score, 0) / practiceExams.length)
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
      .select('id, test_type, score, created_at')
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
        subject: exam.test_type,
        score: exam.score,
        created_at: exam.created_at,
      });
    });

    // Sort by date and take top 5
    activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setRecentActivity(activities.slice(0, 5));
  };

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

  const handleSignOut = async () => {
    if (typeof window !== 'undefined') {
      if (window.confirm('Are you sure you want to sign out?')) {
        signOut();
      }
    }
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
      <div style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', display: 'flex', height: '100vh' }}>
        <div style={{ marginTop: 16, fontSize: 16, color: '#64748b' }}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, backgroundColor: '#f8fafc', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: 'white' }}>
        <div>
          <div style={{ fontSize: 16, color: '#64748b' }}>Welcome back!</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1E293B' }}>{user?.user_metadata?.full_name || 'Student'}</div>
        </div>
        <button onClick={handleSignOut} style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
          <span style={{ fontSize: 24, color: '#64748b' }}>⚪</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 16 }}>
          <div style={{ flex: 1, backgroundColor: 'white', padding: 20, borderRadius: 12, alignItems: 'center', marginHorizontal: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: 24, color: '#1E40AF' }}>⏰</span>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1E293B', marginTop: 8 }}>{stats.totalStudyHours}h</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Total Study</div>
          </div>
          <div style={{ flex: 1, backgroundColor: 'white', padding: 20, borderRadius: 12, alignItems: 'center', marginHorizontal: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: 24, color: '#059669' }}>📅</span>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1E293B', marginTop: 8 }}>{stats.weeklyStudyHours}h</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>This Week</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 16 }}>
          <div style={{ flex: 1, backgroundColor: 'white', padding: 20, borderRadius: 12, alignItems: 'center', marginHorizontal: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: 24, color: '#DC2626' }}>🎓</span>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1E293B', marginTop: 8 }}>{stats.practiceExamsCount}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Practice Exams</div>
          </div>
          <div style={{ flex: 1, backgroundColor: 'white', padding: 20, borderRadius: 12, alignItems: 'center', marginHorizontal: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: 24, color: '#D97706' }}>🏆</span>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1E293B', marginTop: 8 }}>{stats.averageScore}%</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Avg Score</div>
          </div>
        </div>
      </div>

      {/* Current Streak */}
      <div style={{ backgroundColor: 'white', margin: 20, marginTop: 0, padding: 20, borderRadius: 12, alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 28, color: '#F59E0B' }}>🔥</span>
          <div style={{ fontSize: 18, fontWeight: '600', color: '#1E293B', marginLeft: 8 }}>Current Streak</div>
        </div>
        <div style={{ fontSize: 32, fontWeight: 'bold', color: '#F59E0B', marginBottom: 4 }}>{stats.currentStreak} days</div>
        <div style={{ fontSize: 14, color: '#64748b', textAlign: 'center' }}>Keep it up! Study today to maintain your streak.</div>
      </div>

      {/* Quick Actions */}
      <div style={{ padding: 20, paddingTop: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 16 }}>Quick Actions</div>
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <button 
            style={{ flex: 1, backgroundColor: '#1E40AF', padding: 16, borderRadius: 12, alignItems: 'center', marginHorizontal: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
            onClick={() => router.push('/(tabs)/study')}
          >
            <span style={{ fontSize: 24, color: 'white' }}>📚</span>
            <div style={{ color: 'white', fontSize: 16, fontWeight: '600', marginTop: 8 }}>Start Study</div>
          </button>
          <button 
            style={{ flex: 1, backgroundColor: '#DC2626', padding: 16, borderRadius: 12, alignItems: 'center', marginHorizontal: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
            onClick={() => router.push('/(tabs)/practice')}
          >
            <span style={{ fontSize: 24, color: 'white' }}>🎓</span>
            <div style={{ color: 'white', fontSize: 16, fontWeight: '600', marginTop: 8 }}>Practice Exam</div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ padding: 20, paddingTop: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 16 }}>Recent Activity</div>
        {recentActivity.length > 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            {recentActivity.map((activity) => (
              <div key={activity.id} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 12, display: 'flex' }}>
                  <span style={{ fontSize: 20, color: activity.type === 'study' ? '#1E40AF' : '#DC2626' }}>
                    {activity.type === 'study' ? '📚' : '🎓'}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: '600', color: '#1E293B' }}>
                    {activity.type === 'study' ? 'Study Session' : 'Practice Exam'}
                  </div>
                  <div style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>{activity.subject}</div>
                  {activity.duration && (
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{activity.duration} minutes</div>
                  )}
                  {activity.score && (
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Score: {activity.score}%</div>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>{formatDate(activity.created_at)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ backgroundColor: 'white', padding: 40, borderRadius: 12, alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: 48, color: '#9CA3AF' }}>📅</span>
            <div style={{ fontSize: 18, fontWeight: '600', color: '#64748b', marginTop: 16 }}>No recent activity</div>
            <div style={{ fontSize: 14, color: '#9CA3AF', marginTop: 4, textAlign: 'center' }}>Start studying to see your progress here</div>
          </div>
        )}
      </div>
    </div>
  );
}