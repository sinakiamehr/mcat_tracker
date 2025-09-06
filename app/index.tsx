import { useEffect, useState } from 'react';

export default function Index() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Client-side redirect after component mounts
    if (typeof window !== 'undefined') {
      window.location.href = '/(auth)/login';
    }
  }, []);

  // Provide fallback during SSR and while redirecting
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f8fafc'
    }}>
      <div style={{
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '18px',
          marginBottom: '10px'
        }}>MCAT Study Tracker</div>
        <div style={{
          fontSize: '14px',
          color: '#64748b'
        }}>Loading...</div>
      </div>
    </div>
  );
}