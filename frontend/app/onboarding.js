import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useApp } from '../context/AppContext';
import { Colors } from '../constants';
import { CountryPicker } from '../components';

const { width, height } = Dimensions.get('window');

// Welcome Screen
const WelcomeScreen = ({ onNext }) => (
  <View style={styles.screenContainer}>
    <View style={styles.iconContainer}>
      <Text style={styles.largeIcon}>🛂</Text>
    </View>
    <Text style={styles.title}>VisaFlow</Text>
    <Text style={styles.subtitle}>
      Never overstay your visa again. Track deadlines, get alerts, stay compliant.
    </Text>
    <TouchableOpacity style={styles.primaryButtonWhite} onPress={onNext}>
      <Text style={styles.primaryButtonTextBlue}>Get Started</Text>
    </TouchableOpacity>
  </View>
);

// Notifications Screen
const NotificationsScreen = ({ onNext, onEnable }) => {
  const handleEnable = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      onEnable(status === 'granted');
    } catch (error) {
      console.log('Notification permission error:', error);
    }
    onNext();
  };

  return (
    <SafeAreaView style={styles.lightScreen}>
      <View style={styles.centerContent}>
        <View style={styles.iconCircle}>
          <Ionicons name="notifications-outline" size={40} color={Colors.primary} />
        </View>
        <Text style={styles.darkTitle}>Stay Informed</Text>
        <Text style={styles.darkSubtitle}>
          Enable notifications to receive critical alerts at 14, 7, 3, and 1 days before your visa expires.
        </Text>
        <TouchableOpacity style={styles.primaryButtonBlue} onPress={handleEnable}>
          <Text style={styles.primaryButtonTextWhite}>Enable Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onNext}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Profile Setup Screen (Name + Nationality)
const ProfileSetupScreen = ({ onComplete }) => {
  const [firstName, setFirstName] = useState('');
  const [nationality, setNationality] = useState('');
  const [nationalityName, setNationalityName] = useState('');

  const isValid = firstName.trim().length > 0 && nationality;

  const handleComplete = () => {
    if (isValid) {
      onComplete(firstName.trim(), nationality, nationalityName);
    }
  };

  return (
    <SafeAreaView style={styles.lightScreen}>
      <KeyboardAvoidingView 
        style={styles.centerContent}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.iconCircle}>
          <Ionicons name="person-outline" size={40} color={Colors.primary} />
        </View>
        <Text style={styles.darkTitle}>Set Up Your Profile</Text>
        <Text style={styles.darkSubtitle}>
          Tell us a bit about yourself to personalize your experience.
        </Text>
        
        <View style={styles.formContainer}>
          {/* First Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your first name"
              placeholderTextColor={Colors.textSecondary}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          {/* Nationality Picker */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nationality</Text>
            <CountryPicker
              value={nationality}
              onSelect={(code, name) => {
                setNationality(code);
                setNationalityName(name);
              }}
              placeholder="Select your nationality"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.primaryButtonBlue, !isValid && styles.buttonDisabled]}
          onPress={handleComplete}
          disabled={!isValid}
        >
          <Text style={styles.primaryButtonTextWhite}>Complete Setup</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default function Onboarding() {
  const router = useRouter();
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiRef = useRef(null);

  const handleComplete = async (firstName, code, name) => {
    await completeOnboarding(firstName, code, name, notificationsEnabled);
    setShowConfetti(true);
    if (confettiRef.current) {
      confettiRef.current.start();
    }
    setTimeout(() => {
      router.replace('/(tabs)/tracker');
    }, 2500);
  };

  return (
    <View style={{ flex: 1 }}>
      {step === 0 && (
        <View style={styles.blueBackground}>
          <WelcomeScreen onNext={() => setStep(1)} />
        </View>
      )}
      {step === 1 && (
        <NotificationsScreen
          onNext={() => setStep(2)}
          onEnable={setNotificationsEnabled}
        />
      )}
      {step === 2 && <ProfileSetupScreen onComplete={handleComplete} />}
      
      {showConfetti && (
        <ConfettiCannon
          ref={confettiRef}
          count={200}
          origin={{ x: width / 2, y: 0 }}
          autoStart={true}
          fadeOut={true}
          colors={[Colors.primary, Colors.success, Colors.warning]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  blueBackground: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  lightScreen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  screenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    backgroundColor: Colors.white,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    backgroundColor: '#f0f0ff',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  largeIcon: {
    fontSize: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 16,
    textAlign: 'center',
  },
  darkTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 48,
    maxWidth: 300,
    lineHeight: 26,
  },
  darkSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 300,
    lineHeight: 24,
  },
  primaryButtonWhite: {
    width: '100%',
    maxWidth: 300,
    height: 56,
    backgroundColor: Colors.white,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonBlue: {
    width: '100%',
    maxWidth: 300,
    height: 56,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: Colors.gray,
  },
  primaryButtonTextBlue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
  },
  primaryButtonTextWhite: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  skipText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  formContainer: {
    width: '100%',
    maxWidth: 350,
    marginBottom: 32,
    gap: 20,
  },
  inputContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  textInput: {
    height: 48,
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.textPrimary,
  },
});
