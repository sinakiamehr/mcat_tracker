import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
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
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8fafc'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  const validateForm = () => {
    if (!email || !password || !confirmPassword || !fullName) {
      if (typeof window !== 'undefined') {
        window.alert('Please fill in all fields');
      }
      return false;
    }

    if (password !== confirmPassword) {
      if (typeof window !== 'undefined') {
        window.alert('Passwords do not match');
      }
      return false;
    }

    if (password.length < 6) {
      if (typeof window !== 'undefined') {
        window.alert('Password must be at least 6 characters long');
      }
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      if (typeof window !== 'undefined') {
        window.alert('Please enter a valid email address');
      }
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    // Skip during static export
    if (typeof window === 'undefined') {
      return;
    }

    if (!validateForm()) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        if (typeof window !== 'undefined') {
          window.alert('Signup Failed: ' + error.message);
        }
      } else {
        if (typeof window !== 'undefined') {
          window.alert('Success! Please check your email for verification link before signing in.');
          window.location.href = '/(auth)/login';
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

  const navigateToLogin = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/(auth)/login';
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
        }}>Create Account</h1>
        <p style={{
          fontSize: '16px',
          color: '#64748b',
          textAlign: 'center',
          marginBottom: '32px'
        }}>Start your MCAT preparation journey</p>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            display: 'block',
            marginBottom: '8px'
          }}>Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
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

        <div style={{ marginBottom: '16px' }}>
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
            placeholder="Create a password (min 6 characters)"
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
          }}>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
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
          onClick={handleSignup}
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
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        <div style={{ textAlign: 'center' }}>
          <span style={{ color: '#64748b' }}>Already have an account? </span>
          <button
            onClick={navigateToLogin}
            style={{
              background: 'none',
              border: 'none',
              color: '#1E40AF',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}