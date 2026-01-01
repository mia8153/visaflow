import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://visa-buddy-18.preview.emergentagent.com/api';

const AppContext = createContext(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  // Initialize user from storage
  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('visaflow_user_id');
      
      if (storedUserId) {
        const response = await fetch(`${API_URL}/users/${storedUserId}`);
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          
          // Load trips
          const tripsResponse = await fetch(`${API_URL}/trips/${storedUserId}`);
          if (tripsResponse.ok) {
            const tripsData = await tripsResponse.json();
            setTrips(tripsData);
          }
          
          if (userData.onboarding_completed) {
            setOnboardingStep(4);
          }
        }
      }
    } catch (error) {
      console.log('No existing user found:', error);
    }
    setLoading(false);
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const completeOnboarding = async (nationalityCode, nationalityName, notificationsEnabled) => {
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const newUser = await response.json();
        
        const updateResponse = await fetch(`${API_URL}/users/${newUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nationality_code: nationalityCode,
            nationality: nationalityName,
            notifications_enabled: notificationsEnabled,
            onboarding_completed: true,
          }),
        });
        
        if (updateResponse.ok) {
          const updatedUser = await updateResponse.json();
          setUser(updatedUser);
          await AsyncStorage.setItem('visaflow_user_id', newUser.id);
          setOnboardingStep(4);
          triggerConfetti();
        }
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const updateUser = async (updates) => {
    if (!user) return;
    
    try {
      const response = await fetch(`${API_URL}/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const addTrip = async (tripData) => {
    if (!user) return;
    
    const isFirstTrip = trips.length === 0;
    
    try {
      const response = await fetch(`${API_URL}/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...tripData,
          user_id: user.id,
        }),
      });
      
      if (response.ok) {
        const newTrip = await response.json();
        setTrips([...trips, newTrip]);
        
        if (isFirstTrip) {
          triggerConfetti();
        }
        
        // Schedule notifications
        scheduleNotifications(newTrip);
        
        return true;
      }
    } catch (error) {
      console.error('Error adding trip:', error);
    }
    return false;
  };

  const deleteTrip = async (tripId) => {
    try {
      const response = await fetch(`${API_URL}/trips/${tripId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setTrips(trips.filter(t => t.id !== tripId));
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
    }
  };

  const scheduleNotifications = async (trip) => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    const exitDate = new Date(trip.exit_date);
    const now = new Date();

    const alerts = [
      { days: 14, title: 'Visa Alert', body: `Your visa for ${trip.country} expires in 14 days` },
      { days: 7, title: '⚠️ Visa Warning', body: `Your visa for ${trip.country} expires in 1 week` },
      { days: 3, title: '🚨 URGENT', body: `Your visa for ${trip.country} expires in 3 days` },
      { days: 1, title: '🚨 CRITICAL', body: `Your visa for ${trip.country} expires TOMORROW` },
    ];

    for (const alert of alerts) {
      const triggerDate = new Date(exitDate);
      triggerDate.setDate(triggerDate.getDate() - alert.days);
      triggerDate.setHours(9, 0, 0, 0);

      if (triggerDate > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: alert.title,
            body: alert.body,
            sound: true,
          },
          trigger: triggerDate,
        });
      }
    }
  };

  const checkVisaRequirements = async (nationalityCode, destinationCode) => {
    try {
      const response = await fetch(`${API_URL}/check-requirements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nationality_code: nationalityCode,
          destination_code: destinationCode,
          travel_purpose: 'tourism',
        }),
      });
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error checking requirements:', error);
    }
    return null;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('visaflow_user_id');
    setUser(null);
    setTrips([]);
    setOnboardingStep(0);
  };

  const value = {
    user,
    trips,
    onboardingStep,
    setOnboardingStep,
    loading,
    showConfetti,
    triggerConfetti,
    completeOnboarding,
    updateUser,
    addTrip,
    deleteTrip,
    checkVisaRequirements,
    logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
