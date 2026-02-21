import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from 'react-native-paper';

export default function StockScopeLogo({ size = 40, style }) {
  const theme = useTheme();
  
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <LinearGradient
        colors={['#34c759', '#30d158', '#28cd41']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.logoContainer}
      >
        <View style={styles.logoInner}>
          <View style={styles.sShape}>
            <View style={styles.sTop} />
            <View style={styles.sMiddle} />
            <View style={styles.sBottom} />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#34c759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  logoInner: {
    width: '70%',
    height: '70%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sShape: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  sTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '35%',
    backgroundColor: '#000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 8,
  },
  sMiddle: {
    position: 'absolute',
    top: '32%',
    left: 0,
    width: '100%',
    height: '36%',
    backgroundColor: '#000',
    borderRadius: 8,
  },
  sBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '35%',
    backgroundColor: '#000',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopLeftRadius: 8,
  },
});
