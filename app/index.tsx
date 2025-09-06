import { Redirect } from 'expo-router';

export default function Index() {
  // TODO: Check authentication status here
  // For now, redirect to login
  return <Redirect href="/(auth)/login" />;
}