import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';
import { Colors } from '../constants';

export default function Index() {
  const router = useRouter();
  const { loading, onboardingStep, user } = useApp();

  useEffect(() => {
    if (!loading) {
      if (onboardingStep >= 4 && user) {
        router.replace('/(tabs)/tracker');
      } else {
        router.replace('/onboarding');
      }
    }
  }, [loading, onboardingStep, user]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🛂</Text>
        </View>
        <Text style={styles.title}>VisaFlow</Text>
        <ActivityIndicator size="large" color={Colors.white} style={styles.loader} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: Colors.white,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 24,
  },
  loader: {
    marginTop: 16,
  },
});
