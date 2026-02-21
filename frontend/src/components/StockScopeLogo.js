import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';

export default function StockScopeLogo({ size = 40, style }) {
  const theme = useTheme();
  
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <View style={[styles.logoCircle, { backgroundColor: theme.colors.primary }]}>
        <Text style={[styles.logoText, { fontSize: size * 0.5 }]}>S</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#34c759',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  logoText: {
    fontWeight: '800',
    color: '#000',
  },
});
