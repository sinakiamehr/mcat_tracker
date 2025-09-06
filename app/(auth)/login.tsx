import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Provide fallback during SSR
  if (!isMounted) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  const handleLogin = async () => {
    // Skip during static export
    if (typeof window === 'undefined') {
      return;
    }

    if (!email || !password) {
      if (typeof window !== 'undefined') {
        window.alert('Please fill in all fields');
      }
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (typeof window !== 'undefined') {
          window.alert('Login Failed: ' + error.message);
        }
      } else {
        if (typeof window !== 'undefined') {
          window.location.href = '/(tabs)/dashboard';
        }
      }
    } catch (error) {
      if (typeof window !== 'undefined') {
        window.alert('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const navigateToSignup = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/(auth)/signup';
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '400px',
        margin: '0 auto',
        width: '100%'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#1E40AF',
          textAlign: 'center',
          marginBottom: '8px'
        }}>Welcome Back</h1>
        <p style={{
          fontSize: '16px',
          color: '#64748b',
          textAlign: 'center',
          marginBottom: '32px'
        }}>Sign in to continue your MCAT journey</p>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            display: 'block',
            marginBottom: '8px'
          }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px',
              backgroundColor: 'white'
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            display: 'block',
            marginBottom: '8px'
          }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px',
              backgroundColor: 'white'
            }}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading ? '#9ca3af' : '#1E40AF',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '16px'
          }}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

        <div style={{ textAlign: 'center' }}>
          <span style={{ color: '#64748b' }}>Don't have an account? </span>
          <button
            onClick={navigateToSignup}
            style={{
              background: 'none',
              border: 'none',
              color: '#1E40AF',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}