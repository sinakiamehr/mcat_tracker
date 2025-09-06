import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';

// Create QueryClient with SSR-safe configuration
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: false,
    },
  },
});

let queryClient: QueryClient | null = null;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return createQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!queryClient) queryClient = createQueryClient();
    return queryClient;
  }
}

export default function RootLayout() {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // SSR fallback
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
  
  return (
    <AuthProvider>
      <QueryClientProvider client={getQueryClient()}>
        <StatusBar style="auto" />
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="study" options={{ headerShown: false }} />
          <Stack.Screen name="practice" options={{ headerShown: false }} />
          <Stack.Screen name="analytics" options={{ headerShown: false }} />
          <Stack.Screen name="goals" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
        </Stack>
      </QueryClientProvider>
    </AuthProvider>
  );
}