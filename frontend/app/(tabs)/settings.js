import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { Colors } from '../../constants';
import { CountryPicker } from '../../components';

// Subscription Screen Component
const SubscriptionScreen = ({ trialDaysLeft, onBack }) => (
  <View style={styles.container}>
    <SafeAreaView style={styles.header} edges={['top']}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="chevron-back" size={24} color={Colors.white} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Subscription</Text>
      <View style={{ width: 40 }} />
    </SafeAreaView>

    <ScrollView contentContainerStyle={styles.subContent}>
      {trialDaysLeft > 0 && (
        <View style={styles.trialBanner}>
          <Text style={styles.trialText}>
            <Text style={styles.trialBold}>{trialDaysLeft} days</Text> left in free trial
          </Text>
        </View>
      )}

      <View style={styles.pricingRow}>
        <View style={styles.priceCard}>
          <Text style={styles.planName}>Monthly</Text>
          <Text style={styles.planPrice}>$9.99</Text>
          <Text style={styles.planPeriod}>per month</Text>
          <TouchableOpacity style={styles.subscribeButton}>
            <Text style={styles.subscribeButtonText}>Subscribe</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.priceCard, styles.priceCardFeatured]}>
          <View style={styles.saveBadge}>
            <Text style={styles.saveBadgeText}>SAVE $60!</Text>
          </View>
          <Text style={styles.planName}>Annual</Text>
          <Text style={styles.planPrice}>$59</Text>
          <Text style={styles.planPeriod}>per year</Text>
          <TouchableOpacity style={styles.subscribeButtonFeatured}>
            <Text style={styles.subscribeButtonTextFeatured}>Subscribe</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.restoreButton}>
        <Text style={styles.restoreText}>Restore Purchases</Text>
      </TouchableOpacity>
    </ScrollView>
  </View>
);

// Nationality Settings Screen Component
const NationalitySettingsScreen = ({ currentNationality, onSave, onBack }) => {
  const [nationality, setNationality] = useState(currentNationality || '');
  const [nationalityName, setNationalityName] = useState('');

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.header} edges={['top']}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Passport Info</Text>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      <View style={styles.settingsContent}>
        <View style={styles.settingsCard}>
          <Text style={styles.settingsLabel}>Nationality</Text>
          <CountryPicker
            value={nationality}
            onSelect={(code, name) => {
              setNationality(code);
              setNationalityName(name);
            }}
            placeholder="Select your nationality"
          />

          <TouchableOpacity
            style={[styles.saveButton, !nationality && styles.saveButtonDisabled]}
            onPress={() => nationality && onSave(nationality, nationalityName)}
            disabled={!nationality}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Main Settings Screen
export default function SettingsScreen() {
  const router = useRouter();
  const { user, updateUser, logout } = useApp();
  const [showSubscription, setShowSubscription] = useState(false);
  const [showNationality, setShowNationality] = useState(false);

  const getTrialDaysLeft = () => {
    if (!user?.trial_start) return 7;
    const trialStart = new Date(user.trial_start);
    const trialEnd = new Date(trialStart);
    trialEnd.setDate(trialEnd.getDate() + 7);
    const daysLeft = Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  const handleToggleNotifications = async () => {
    await updateUser({ notifications_enabled: !user?.notifications_enabled });
  };

  if (showSubscription) {
    return (
      <SubscriptionScreen
        trialDaysLeft={getTrialDaysLeft()}
        onBack={() => setShowSubscription(false)}
      />
    );
  }

  if (showNationality) {
    return (
      <NationalitySettingsScreen
        currentNationality={user?.nationality_code}
        onSave={(code, name) => {
          updateUser({ nationality_code: code, nationality: name });
          setShowNationality(false);
        }}
        onBack={() => setShowNationality(false)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.headerSpacer} />
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.settingsContent}>
        <View style={styles.settingsCard}>
          {/* Notifications */}
          <TouchableOpacity style={styles.settingsRow} onPress={handleToggleNotifications}>
            <View style={styles.settingsRowLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="notifications-outline" size={22} color={Colors.primary} />
              </View>
              <Text style={styles.settingsRowText}>Push Notifications</Text>
            </View>
            <Switch
              value={user?.notifications_enabled || false}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: Colors.gray, true: Colors.success }}
              thumbColor={Colors.white}
            />
          </TouchableOpacity>

          {/* Passport Info */}
          <TouchableOpacity style={styles.settingsRow} onPress={() => setShowNationality(true)}>
            <View style={styles.settingsRowLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="document-outline" size={22} color={Colors.primary} />
              </View>
              <Text style={styles.settingsRowText}>Passport Information</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          {/* Privacy */}
          <TouchableOpacity style={styles.settingsRow}>
            <View style={styles.settingsRowLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="shield-outline" size={22} color={Colors.primary} />
              </View>
              <Text style={styles.settingsRowText}>Privacy & Security</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          {/* Subscription */}
          <TouchableOpacity style={styles.settingsRow} onPress={() => setShowSubscription(true)}>
            <View style={styles.settingsRowLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="card-outline" size={22} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.settingsRowText}>Subscription</Text>
                <Text style={styles.subscriptionStatus}>
                  {user?.subscription_status === 'trial'
                    ? `${getTrialDaysLeft()} days left in trial`
                    : user?.subscription_status === 'active'
                    ? 'Active'
                    : 'Expired'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          {/* Help */}
          <TouchableOpacity style={[styles.settingsRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingsRowLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="help-circle-outline" size={22} color={Colors.primary} />
              </View>
              <Text style={styles.settingsRowText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={Colors.critical} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
  },
  mainHeaderTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
    paddingVertical: 24,
  },
  settingsContent: {
    padding: 16,
    paddingBottom: 100,
  },
  settingsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f0f0ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsRowText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  subscriptionStatus: {
    fontSize: 12,
    color: Colors.success,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.critical,
  },
  settingsLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    padding: 16,
    paddingBottom: 0,
  },
  saveButton: {
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    marginTop: 24,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.gray,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  subContent: {
    padding: 16,
  },
  trialBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  trialText: {
    color: Colors.white,
    fontSize: 16,
  },
  trialBold: {
    fontWeight: 'bold',
  },
  pricingRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  priceCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  priceCardFeatured: {
    borderWidth: 2,
    borderColor: Colors.primary,
    position: 'relative',
  },
  saveBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: Colors.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  saveBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
    marginTop: 8,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  planPeriod: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  subscribeButton: {
    width: '100%',
    height: 40,
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribeButtonText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  subscribeButtonFeatured: {
    width: '100%',
    height: 40,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribeButtonTextFeatured: {
    color: Colors.white,
    fontWeight: '600',
  },
  restoreButton: {
    alignItems: 'center',
    padding: 16,
  },
  restoreText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
});
