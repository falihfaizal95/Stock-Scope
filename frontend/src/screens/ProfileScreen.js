import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Text, Button, Divider } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useTheme } from 'react-native-paper';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const theme = useTheme();

  const handleSignOut = async () => {
    const result = await signOut();
    if (!result.success) {
      alert('Error signing out: ' + result.error);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.avatarText}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
        </View>
        <Text style={[styles.name, { color: theme.colors.text }]}>
          {user?.email || 'User'}
        </Text>
        <Text style={[styles.email, { color: theme.colors.placeholder }]}>
          {user?.email}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
          Account Information
        </Text>
        <Divider style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.placeholder }]}>
            User ID
          </Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>
            {user?.uid?.substring(0, 8)}...
          </Text>
        </View>
        <Divider style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.placeholder }]}>
            Email Verified
          </Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>
            {user?.emailVerified ? 'Yes' : 'No'}
          </Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
          About StockScope
        </Text>
        <Divider style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <Text style={[styles.aboutText, { color: theme.colors.placeholder }]}>
          StockScope is your personal stock market companion. Track your
          favorite stocks, stay updated with the latest market news, and make
          informed investment decisions.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleSignOut}
          style={styles.signOutButton}
          buttonColor={theme.colors.negative}
          textColor="#fff"
          labelStyle={{ fontSize: 16, fontWeight: '600' }}
        >
          Sign Out
        </Button>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.placeholder }]}>
          Version 1.0.0
        </Text>
        <Text style={[styles.footerText, { color: theme.colors.placeholder }]}>
          © 2024 StockScope
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 32,
    marginBottom: 16,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  divider: {
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  signOutButton: {
    marginBottom: 8,
  },
  footer: {
    alignItems: 'center',
    padding: 32,
  },
  footerText: {
    fontSize: 14,
    marginBottom: 4,
  },
});
