import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, getStatusColor, getStatusText } from '../constants';
import CountryFlag from './CountryFlag';

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

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const TripCard = ({ trip, onDelete }) => {
  const daysLeft = calculateDaysLeft(trip.exit_date);
  const progress = calculateProgress(trip.entry_date, trip.exit_date);
  const statusColor = getStatusColor(daysLeft);

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(trip.id)}>
        <Ionicons name="close" size={20} color={Colors.textSecondary} />
      </TouchableOpacity>

      <View style={styles.header}>
        <CountryFlag code={trip.country_code} size={48} />
        <View style={styles.headerInfo}>
          <Text style={styles.countryName}>{trip.country}</Text>
          <View style={styles.visaBadge}>
            <Text style={styles.visaBadgeText}>{trip.visa_type}</Text>
          </View>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress}%`, backgroundColor: statusColor },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}% used</Text>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Entry Date</Text>
          <Text style={styles.detailValue}>{formatDate(trip.entry_date)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Exit By</Text>
          <Text style={[styles.detailValue, daysLeft <= 7 && styles.exitDateCritical]}>
            {formatDate(trip.exit_date)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Duration</Text>
          <Text style={styles.detailValue}>{trip.total_days} days</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  deleteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  headerInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  visaBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#e0e0ff',
    borderRadius: 12,
  },
  visaBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.gray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  exitDateCritical: {
    color: Colors.critical,
    fontWeight: '600',
  },
});

export default TripCard;
