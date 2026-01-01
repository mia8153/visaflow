import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '../../context/AppContext';
import { Colors, getStatusColor, getStatusText, VISA_TYPES } from '../../constants';
import { ProgressRing, TripCard, CountryPicker } from '../../components';

const { width } = Dimensions.get('window');

const calculateDaysLeft = (exitDate) => {
  const now = new Date();
  const exit = new Date(exitDate);
  const diffTime = exit - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const calculateProgress = (entryDate, exitDate) => {
  const entry = new Date(entryDate);
  const exit = new Date(exitDate);
  const now = new Date();
  const totalDays = (exit - entry) / (1000 * 60 * 60 * 24);
  const daysUsed = (now - entry) / (1000 * 60 * 60 * 24);
  return Math.min(100, Math.max(0, (daysUsed / totalDays) * 100));
};

// Add Trip Modal Component
const AddTripModal = ({ visible, onClose, onSave }) => {
  const [country, setCountry] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [visaType, setVisaType] = useState('');
  const [entryDate, setEntryDate] = useState(new Date());
  const [exitDate, setExitDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const [showEntryPicker, setShowEntryPicker] = useState(false);
  const [showExitPicker, setShowExitPicker] = useState(false);
  const [showVisaPicker, setShowVisaPicker] = useState(false);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const calculateDuration = () => {
    const days = Math.ceil((exitDate - entryDate) / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} days` : '';
  };

  const handleSave = () => {
    if (!countryCode || !visaType) return;
    
    onSave({
      country,
      country_code: countryCode,
      visa_type: visaType,
      entry_date: entryDate.toISOString().split('T')[0],
      exit_date: exitDate.toISOString().split('T')[0],
      extensions_available: 0,
    });
    
    // Reset form
    setCountry('');
    setCountryCode('');
    setVisaType('');
    setEntryDate(new Date());
    setExitDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={modalStyles.header}>
              <Text style={modalStyles.title}>Add Trip</Text>
              <TouchableOpacity style={modalStyles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={modalStyles.form}>
              <View style={modalStyles.field}>
                <Text style={modalStyles.label}>Country *</Text>
                <CountryPicker
                  value={countryCode}
                  onSelect={(code, name) => {
                    setCountryCode(code);
                    setCountry(name);
                  }}
                  placeholder="Select destination"
                />
              </View>

              <View style={modalStyles.field}>
                <Text style={modalStyles.label}>Visa Type *</Text>
                <TouchableOpacity
                  style={[modalStyles.picker, !countryCode && modalStyles.pickerDisabled]}
                  onPress={() => countryCode && setShowVisaPicker(true)}
                  disabled={!countryCode}
                >
                  <Text style={[modalStyles.pickerText, !visaType && modalStyles.placeholder]}>
                    {visaType || 'Select visa type'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={modalStyles.field}>
                <Text style={modalStyles.label}>Entry Date *</Text>
                <TouchableOpacity
                  style={modalStyles.picker}
                  onPress={() => setShowEntryPicker(true)}
                >
                  <Text style={modalStyles.pickerText}>{formatDate(entryDate)}</Text>
                  <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={modalStyles.field}>
                <Text style={modalStyles.label}>Exit Date *</Text>
                <TouchableOpacity
                  style={modalStyles.picker}
                  onPress={() => setShowExitPicker(true)}
                >
                  <Text style={modalStyles.pickerText}>{formatDate(exitDate)}</Text>
                  <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={modalStyles.field}>
                <Text style={modalStyles.label}>Duration</Text>
                <View style={[modalStyles.picker, modalStyles.pickerDisabled]}>
                  <Text style={modalStyles.placeholderText}>{calculateDuration()}</Text>
                </View>
              </View>
            </View>

            <View style={modalStyles.buttons}>
              <TouchableOpacity style={modalStyles.cancelButton} onPress={onClose}>
                <Text style={modalStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modalStyles.saveButton, (!countryCode || !visaType) && modalStyles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={!countryCode || !visaType}
              >
                <Text style={modalStyles.saveButtonText}>Save Trip</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Date Pickers */}
          {showEntryPicker && (
            <DateTimePicker
              value={entryDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                setShowEntryPicker(false);
                if (date) setEntryDate(date);
              }}
            />
          )}
          {showExitPicker && (
            <DateTimePicker
              value={exitDate}
              mode="date"
              minimumDate={entryDate}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                setShowExitPicker(false);
                if (date) setExitDate(date);
              }}
            />
          )}

          {/* Visa Type Picker Modal */}
          <Modal visible={showVisaPicker} transparent animationType="fade">
            <TouchableOpacity
              style={modalStyles.visaPickerOverlay}
              activeOpacity={1}
              onPress={() => setShowVisaPicker(false)}
            >
              <View style={modalStyles.visaPickerContainer}>
                {VISA_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      modalStyles.visaPickerItem,
                      visaType === type && modalStyles.visaPickerItemSelected,
                    ]}
                    onPress={() => {
                      setVisaType(type);
                      setShowVisaPicker(false);
                    }}
                  >
                    <Text style={modalStyles.visaPickerText}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>
        </View>
      </View>
    </Modal>
  );
};

// Empty State Component
const EmptyState = ({ onAddTrip }) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIcon}>
      <Text style={styles.emptyIconText}>✈️</Text>
    </View>
    <Text style={styles.emptyTitle}>No active trips yet</Text>
    <Text style={styles.emptySubtitle}>
      Add your first trip to start tracking your visa countdown
    </Text>
    <TouchableOpacity style={styles.addButton} onPress={onAddTrip}>
      <Ionicons name="add" size={24} color={Colors.white} />
      <Text style={styles.addButtonText}>Add Trip</Text>
    </TouchableOpacity>
  </View>
);

export default function TrackerScreen() {
  const { trips, deleteTrip, addTrip, showConfetti, triggerConfetti } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [tick, setTick] = useState(0);
  const confettiRef = useRef(null);

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const activeTrip = trips.find(t => t.status === 'active');

  const handleAddTrip = async (tripData) => {
    const success = await addTrip(tripData);
    if (success) {
      setModalVisible(false);
    }
  };

  const daysLeft = activeTrip ? calculateDaysLeft(activeTrip.exit_date) : 0;
  const progress = activeTrip ? calculateProgress(activeTrip.entry_date, activeTrip.exit_date) : 0;
  const statusColor = getStatusColor(daysLeft);
  const statusText = getStatusText(daysLeft);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>VisaFlow</Text>

        {!activeTrip ? (
          <EmptyState onAddTrip={() => setModalVisible(true)} />
        ) : (
          <View style={styles.content}>
            {/* Progress Ring */}
            <View style={styles.ringContainer}>
              <ProgressRing progress={progress} daysLeft={daysLeft} />
            </View>

            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
            </View>

            {/* Trip Card */}
            <TripCard trip={activeTrip} onDelete={deleteTrip} />

            {/* Add Another Trip Button */}
            <TouchableOpacity
              style={styles.addAnotherButton}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add" size={20} color={Colors.primary} />
              <Text style={styles.addAnotherText}>Add Another Trip</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <AddTripModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleAddTrip}
      />

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 100,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
  content: {
    alignItems: 'center',
  },
  ringContainer: {
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    backgroundColor: Colors.lightGray,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyIconText: {
    fontSize: 48,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 280,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  addAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  addAnotherText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    paddingHorizontal: 24,
    gap: 16,
  },
  field: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  picker: {
    height: 48,
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerDisabled: {
    backgroundColor: Colors.gray,
  },
  pickerText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  placeholder: {
    color: Colors.textSecondary,
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  buttons: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  saveButton: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: Colors.gray,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  visaPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  visaPickerContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    width: '80%',
    overflow: 'hidden',
  },
  visaPickerItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  visaPickerItemSelected: {
    backgroundColor: '#f0f0ff',
  },
  visaPickerText: {
    fontSize: 16,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
});
