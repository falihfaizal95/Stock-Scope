import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Text, Button, Divider } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useWatchlist } from '../context/WatchlistContext';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const { user, userProfile, signOut, updateProfile } = useAuth();
  const { watchlist } = useWatchlist();
  const navigation = useNavigation();
  const theme = useTheme();
  const [uploading, setUploading] = useState(false);

  const handleSignOut = async () => {
    const result = await signOut();
    if (!result.success) {
      alert('Error signing out: ' + result.error);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera roll permissions to upload your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      // For now, we'll just store the local URI
      // In production, you'd upload to Firebase Storage
      await updateProfile({ profilePicture: result.assets[0].uri });
      setUploading(false);
      Alert.alert('Success', 'Profile picture updated!');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
          {userProfile?.profilePicture ? (
            <Image
              source={{ uri: userProfile.profilePicture }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.avatarText}>
                {userProfile?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <View style={[styles.editBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.editBadgeText}>✎</Text>
          </View>
        </TouchableOpacity>
        <Text style={[styles.name, { color: theme.colors.text }]}>
          {userProfile?.fullName || user?.email || 'User'}
        </Text>
        <Text style={[styles.email, { color: theme.colors.placeholder }]}>
          {user?.email}
        </Text>
        {userProfile?.occupation && (
          <Text style={[styles.occupation, { color: theme.colors.placeholder }]}>
            {userProfile.occupation} • {userProfile.state}
          </Text>
        )}
      </View>

      {watchlist.length > 0 && (
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            Your Holdings ({watchlist.length})
          </Text>
          <Divider style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          {watchlist.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => navigation.navigate('StockDetail', { symbol: item.symbol })}
              style={styles.holdingItem}
            >
              <View style={styles.holdingInfo}>
                <Text style={[styles.holdingSymbol, { color: theme.colors.text }]}>
                  {item.symbol}
                </Text>
                <Text style={[styles.holdingName, { color: theme.colors.placeholder }]}>
                  {item.name}
                </Text>
              </View>
              <Text style={[styles.holdingArrow, { color: theme.colors.placeholder }]}>
                →
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
          Account Information
        </Text>
        <Divider style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        {userProfile?.fullName && (
          <>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.placeholder }]}>
                Full Name
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {userProfile.fullName}
              </Text>
            </View>
            <Divider style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          </>
        )}
        {userProfile?.birthday && (
          <>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.placeholder }]}>
                Birthday
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {userProfile.birthday}
              </Text>
            </View>
            <Divider style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          </>
        )}
        {userProfile?.occupation && (
          <>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.placeholder }]}>
                Occupation
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {userProfile.occupation}
              </Text>
            </View>
            <Divider style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          </>
        )}
        {userProfile?.state && (
          <>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.placeholder }]}>
                State
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {userProfile.state}
              </Text>
            </View>
            <Divider style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          </>
        )}
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
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#000',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1c1c1e',
  },
  editBadgeText: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    marginBottom: 4,
  },
  occupation: {
    fontSize: 14,
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
  holdingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  holdingInfo: {
    flex: 1,
  },
  holdingSymbol: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  holdingName: {
    fontSize: 14,
  },
  holdingArrow: {
    fontSize: 20,
  },
});
