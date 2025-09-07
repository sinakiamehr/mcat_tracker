import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // During static export, don't redirect or show loading
  if (typeof window === 'undefined') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        height: '100vh',
        width: '100vw'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #1E40AF',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return <>{children}</>;
};