import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { Colors } from '../../constants';
import { CountryPicker, CountryFlag } from '../../components';

const verdictConfig = {
  visa_free: { icon: 'checkmark-circle', title: 'No visa required', color: Colors.success },
  evisa: { icon: 'phone-portrait', title: 'eVisa Required', color: Colors.primary },
  visa_on_arrival: { icon: 'airplane', title: 'Visa on Arrival', color: Colors.warning },
  embassy_visa: { icon: 'business', title: 'Embassy Visa Required', color: Colors.critical },
  unknown: { icon: 'help-circle', title: 'Requirements Unknown', color: Colors.textSecondary },
};

export default function RequirementsScreen() {
  const { user, checkVisaRequirements, addTrip } = useApp();
  const router = useRouter();
  
  const [nationalityCode, setNationalityCode] = useState(user?.nationality_code || '');
  const [nationalityName, setNationalityName] = useState(user?.nationality || '');
  const [destinationCode, setDestinationCode] = useState('');
  const [destinationName, setDestinationName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [purpose, setPurpose] = useState('tourism');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleCheck = async () => {
    if (!nationalityCode || !destinationCode) return;
    
    setLoading(true);
    const data = await checkVisaRequirements(nationalityCode, destinationCode);
    setResult(data);
    setLoading(false);
  };

  const handleAddToTracker = async () => {
    const visaType = result?.verdict === 'visa_free' ? 'Visa-Free' :
      result?.verdict === 'evisa' ? 'eVisa' :
      result?.verdict === 'visa_on_arrival' ? 'Visa on Arrival' :
      'Tourist Visa';

    const success = await addTrip({
      country: destinationName,
      country_code: destinationCode,
      visa_type: visaType,
      entry_date: startDate.toISOString().split('T')[0],
      exit_date: endDate.toISOString().split('T')[0],
      extensions_available: 0,
    });

    if (success) {
      Alert.alert('Success', 'Trip added to tracker!', [
        { text: 'View Tracker', onPress: () => router.push('/(tabs)/tracker') },
        { text: 'OK' },
      ]);
    }
  };

  const verdict = result ? verdictConfig[result.verdict] || verdictConfig.unknown : null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>TRAVEL DETAILS</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Your Nationality</Text>
            <CountryPicker
              value={nationalityCode}
              onSelect={(code, name) => {
                setNationalityCode(code);
                setNationalityName(name);
              }}
              placeholder="Select nationality"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Destination</Text>
            <CountryPicker
              value={destinationCode}
              onSelect={(code, name) => {
                setDestinationCode(code);
                setDestinationName(name);
                setResult(null);
              }}
              placeholder="Where are you traveling?"
            />
          </View>

          <View style={styles.dateRow}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Start Date</Text>
              <TouchableOpacity
                style={styles.datePicker}
                onPress={() => setShowStartPicker(true)}
              >
                <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>End Date</Text>
              <TouchableOpacity
                style={styles.datePicker}
                onPress={() => setShowEndPicker(true)}
              >
                <Text style={styles.dateText}>{formatDate(endDate)}</Text>
                <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Trip Purpose</Text>
            <View style={styles.purposeRow}>
              {['tourism', 'business', 'transit'].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.purposeButton, purpose === p && styles.purposeButtonActive]}
                  onPress={() => setPurpose(p)}
                >
                  <Text style={[styles.purposeText, purpose === p && styles.purposeTextActive]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.checkButton,
              (!nationalityCode || !destinationCode) && styles.checkButtonDisabled,
            ]}
            onPress={handleCheck}
            disabled={!nationalityCode || !destinationCode || loading}
          >
            <Text style={styles.checkButtonText}>
              {loading ? 'Checking...' : 'Check Requirements'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results Card */}
        {result && verdict && (
          <View style={styles.card}>
            <View style={styles.resultHeader}>
              <View style={[styles.resultIconContainer, { backgroundColor: `${verdict.color}20` }]}>
                <Ionicons name={verdict.icon} size={28} color={verdict.color} />
              </View>
              <View style={styles.resultInfo}>
                <Text style={[styles.resultTitle, { color: verdict.color }]}>
                  {verdict.title}
                </Text>
                {result.permitted_days && (
                  <Text style={styles.resultSubtitle}>
                    {result.permitted_days} days permitted
                  </Text>
                )}
              </View>
            </View>

            {result.cost_usd && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Cost</Text>
                <Text style={styles.detailValue}>${result.cost_usd} USD</Text>
              </View>
            )}

            {result.processing_days && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Processing</Text>
                <Text style={styles.detailValue}>{result.processing_days} business days</Text>
              </View>
            )}

            {result.conditions && result.conditions.length > 0 && (
              <View style={styles.conditionsSection}>
                <Text style={styles.conditionsTitle}>CONDITIONS</Text>
                {result.conditions.map((condition, i) => (
                  <View key={i} style={styles.conditionRow}>
                    <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                    <Text style={styles.conditionText}>{condition}</Text>
                  </View>
                ))}
              </View>
            )}

            {result.application_link && (
              <TouchableOpacity
                style={styles.applyLink}
                onPress={() => Linking.openURL(result.application_link)}
              >
                <Text style={styles.applyLinkText}>Apply Online →</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.lastUpdated}>Last updated: {result.last_updated}</Text>

            <View style={styles.warningBox}>
              <Ionicons name="warning-outline" size={16} color="#92400e" />
              <Text style={styles.warningText}>
                Always verify with the embassy before travel. Requirements may change.
              </Text>
            </View>

            {result.found && (
              <TouchableOpacity style={styles.addToTrackerButton} onPress={handleAddToTracker}>
                <Text style={styles.addToTrackerText}>Add Trip to Tracker</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Help Card */}
        <View style={styles.card}>
          <Text style={styles.helpTitle}>Need Help?</Text>
          <Text style={styles.helpText}>
            Our visa database covers 50+ countries. For specific questions, consult the
            destination country's embassy or consulate.
          </Text>
        </View>
      </ScrollView>

      {/* Date Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowStartPicker(false);
            if (date) setStartDate(date);
          }}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          minimumDate={startDate}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowEndPicker(false);
            if (date) setEndDate(date);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 60,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  datePicker: {
    height: 48,
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  purposeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  purposeButton: {
    flex: 1,
    height: 40,
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purposeButtonActive: {
    backgroundColor: Colors.primary,
  },
  purposeText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  purposeTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  checkButton: {
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  checkButtonDisabled: {
    backgroundColor: Colors.gray,
  },
  checkButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  resultIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  conditionsSection: {
    marginTop: 16,
  },
  conditionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  conditionText: {
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },
  applyLink: {
    backgroundColor: '#f0f0ff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  applyLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  lastUpdated: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#92400e',
    flex: 1,
  },
  addToTrackerButton: {
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  addToTrackerText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
