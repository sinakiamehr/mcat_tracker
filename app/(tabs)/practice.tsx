import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PracticeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Practice Exams</Text>
        <Text style={styles.subtitle}>Take practice tests and review performance</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Full-Length Practice Tests</Text>
          <Text style={styles.placeholder}>Complete MCAT practice exams</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Section Practice</Text>
          <Text style={styles.placeholder}>Practice individual sections (Bio, Chem, Physics, CARS, Psych)</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Question Bank</Text>
          <Text style={styles.placeholder}>Practice questions by topic and difficulty</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Results</Text>
          <Text style={styles.placeholder}>Review your latest practice exam scores</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  placeholder: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});