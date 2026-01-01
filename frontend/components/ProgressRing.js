import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, getStatusColor } from '../constants';

const ProgressRing = ({ progress, daysLeft, size = 250, strokeWidth = 16 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const color = getStatusColor(daysLeft);
  const isPulsing = daysLeft <= 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Background Ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* Progress Ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          opacity={isPulsing ? 0.8 : 1}
        />
      </Svg>
      <View style={styles.centerContent}>
        <Text style={styles.daysNumber}>{daysLeft < 0 ? 0 : daysLeft}</Text>
        <Text style={styles.daysLabel}>DAYS LEFT</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysNumber: {
    fontSize: 80,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    lineHeight: 80,
  },
  daysLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 4,
  },
});

export default ProgressRing;
