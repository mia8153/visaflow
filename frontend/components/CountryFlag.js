import React from 'react';
import { Image, StyleSheet } from 'react-native';

const CountryFlag = ({ code, size = 48 }) => {
  const flagUrl = `https://flagcdn.com/w80/${code.toLowerCase()}.png`;
  
  return (
    <Image
      source={{ uri: flagUrl }}
      style={[styles.flag, { width: size, height: size * 0.75 }]}
      resizeMode="cover"
    />
  );
};

const styles = StyleSheet.create({
  flag: {
    borderRadius: 4,
  },
});

export default CountryFlag;
