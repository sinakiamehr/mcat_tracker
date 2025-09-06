import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Simple QueryClient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: false,
    },
  },
});

export default function RootLayout() {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // SSR fallback
  if (!isMounted) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }
  
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
});