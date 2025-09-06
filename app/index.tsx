import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, Platform } from 'react-native';

export default function Index() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Provide fallback during SSR
  if (!isMounted && Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // TODO: Check authentication status here
  // For now, redirect to login
  return <Redirect href="/(auth)/login" />;
}