import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Modal, FlatList } from 'react-native';
import { Text, Button, Divider, TextInput, Switch } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useWatchlist } from '../context/WatchlistContext';
import { usePortfolio } from '../context/PortfolioContext';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from 'react-native-paper';
import { useThemeMode } from '../context/ThemeModeContext';
import * as ImagePicker from 'expo-image-picker';
import { COUNTRIES, getStatesForCountry } from '../constants/locationData';

export default function ProfileScreen() {
  const { user, userProfile, signOut, updateProfile } = useAuth();
  const { watchlist } = useWatchlist();
  const { portfolio } = usePortfolio();
  const { isDarkMode, toggleThemeMode } = useThemeMode();
  const navigation = useNavigation();
  const theme = useTheme();
  const [locationPromptVisible, setLocationPromptVisible] = useState(false);
  const [countryCode, setCountryCode] = useState(userProfile?.country || '');
  const [countryName, setCountryName] = useState(userProfile?.countryName || '');
  const [stateRegion, setStateRegion] = useState(userProfile?.state || '');
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [statePickerVisible, setStatePickerVisible] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [stateSearch, setStateSearch] = useState('');
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);
  const [editFullName, setEditFullName] = useState(userProfile?.fullName || '');
  const [editBirthday, setEditBirthday] = useState(userProfile?.birthday || '');
  const [editOccupation, setEditOccupation] = useState(userProfile?.occupation || '');
  const [editCountryName, setEditCountryName] = useState(userProfile?.countryName || '');
  const [editStateRegion, setEditStateRegion] = useState(userProfile?.state || '');

  useEffect(() => {
    setCountryCode(userProfile?.country || '');
    setCountryName(userProfile?.countryName || '');
    setStateRegion(userProfile?.state || '');
    setEditFullName(userProfile?.fullName || '');
    setEditBirthday(userProfile?.birthday || '');
    setEditOccupation(userProfile?.occupation || '');
    setEditCountryName(userProfile?.countryName || '');
    setEditStateRegion(userProfile?.state || '');
    if (user && userProfile && (!userProfile.country || !userProfile.state)) {
      setLocationPromptVisible(true);
    }
  }, [user, userProfile]);

  const selectableStates = useMemo(() => getStatesForCountry(countryCode), [countryCode]);
  const filteredCountries = useMemo(
    () =>
      COUNTRIES.filter((country) =>
        country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        country.code.toLowerCase().includes(countrySearch.toLowerCase())
      ),
    [countrySearch]
  );
  const filteredStates = useMemo(
    () => selectableStates.filter((item) => item.toLowerCase().includes(stateSearch.toLowerCase())),
    [selectableStates, stateSearch]
  );

  const handleSignOut = async () => {
    const result = await signOut();
    if (!result.success) {
      alert(`Error signing out: ${result.error}`);
    }
  };

  const saveLocationPrompt = async () => {
    if (!countryCode || !stateRegion) {
      alert('Please select your country and state/region');
      return;
    }
    const result = await updateProfile({
      country: countryCode,
      countryName,
      state: stateRegion,
    });
    if (!result.success) {
      alert(result.error || 'Failed to update location');
      return;
    }
    setLocationPromptVisible(false);
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
      await updateProfile({ profilePicture: result.assets[0].uri });
      Alert.alert('Success', 'Profile picture updated!');
    }
  };

  const savePersonalInfo = async () => {
    const payload = {
      fullName: editFullName.trim(),
      birthday: editBirthday.trim(),
      occupation: editOccupation.trim(),
      countryName: editCountryName.trim(),
      state: editStateRegion.trim(),
    };
    const result = await updateProfile(payload);
    if (!result.success) {
      Alert.alert('Update failed', result.error || 'Unable to update profile.');
      return;
    }
    setIsEditingPersonalInfo(false);
    Alert.alert('Saved', 'Personal information updated.');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity
          onPress={pickImage}
          style={[styles.avatarContainer, { borderColor: theme.colors.border }]}
          activeOpacity={0.82}
        >
          {userProfile?.profilePicture ? (
            <Image source={{ uri: userProfile.profilePicture }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.avatarText}>
                {userProfile?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={[styles.name, { color: theme.colors.text }]}>{userProfile?.fullName || user?.email || 'User'}</Text>
        <Text style={[styles.email, { color: theme.colors.placeholder }]}>{user?.email}</Text>
        {userProfile?.occupation && (
          <Text style={[styles.occupation, { color: theme.colors.placeholder }]}>
            {userProfile.occupation} • {userProfile.state || 'N/A'}
          </Text>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Paper Trading Portfolio</Text>
        <Divider style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.placeholder }]}>Cash</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>${(portfolio?.cash || 0).toFixed(2)}</Text>
        </View>
        <Divider style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.placeholder }]}>Holdings</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>{portfolio?.holdings?.length || 0}</Text>
        </View>
      </View>

      {portfolio?.holdings?.length > 0 && (
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Your Holdings ({portfolio.holdings.length})</Text>
          <Divider style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          {portfolio.holdings.map((item, index) => (
            <TouchableOpacity
              key={`${item.symbol}-${index}`}
              onPress={() => navigation.navigate('StockDetail', { symbol: item.symbol })}
              style={[styles.holdingItem, { borderColor: theme.colors.border }]}
            >
              <View>
                <Text style={[styles.holdingSymbol, { color: theme.colors.text }]}>{item.symbol}</Text>
                <Text style={[styles.holdingName, { color: theme.colors.placeholder }]}>
                  {item.shares} shares @ ${Number(item.avgPrice || 0).toFixed(2)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {watchlist.length > 0 && (
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Watchlist ({watchlist.length})</Text>
          <Divider style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          {watchlist.slice(0, 6).map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => navigation.navigate('StockDetail', { symbol: item.symbol })}
              style={[styles.holdingItem, { borderColor: theme.colors.border }]}
            >
              <View>
                <Text style={[styles.holdingSymbol, { color: theme.colors.text }]}>{item.symbol}</Text>
                <Text style={[styles.holdingName, { color: theme.colors.placeholder }]}>
                  Added {item.addedAt ? new Date(item.addedAt).toLocaleDateString() : 'recently'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Account Information</Text>
        <Divider style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.placeholder }]}>Full Name</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>{userProfile?.fullName || 'N/A'}</Text>
        </View>
        <Divider style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.placeholder }]}>Birthday</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>{userProfile?.birthday || 'N/A'}</Text>
        </View>
        <Divider style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.placeholder }]}>Occupation</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>{userProfile?.occupation || 'N/A'}</Text>
        </View>
        <Divider style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.placeholder }]}>Country</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>{userProfile?.countryName || 'N/A'}</Text>
        </View>
        <Divider style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.placeholder }]}>State</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>{userProfile?.state || 'N/A'}</Text>
        </View>
        <View style={styles.editActions}>
          <Button
            mode={isEditingPersonalInfo ? 'outlined' : 'contained'}
            onPress={() => setIsEditingPersonalInfo((prev) => !prev)}
            buttonColor={isEditingPersonalInfo ? undefined : theme.colors.primary}
            textColor={isEditingPersonalInfo ? theme.colors.text : '#000'}
          >
            {isEditingPersonalInfo ? 'Cancel edit' : 'Edit personal info'}
          </Button>
        </View>
        {isEditingPersonalInfo ? (
          <View style={styles.editForm}>
            <TextInput
              mode="outlined"
              label="Full Name"
              value={editFullName}
              onChangeText={setEditFullName}
              style={styles.editInput}
            />
            <TextInput
              mode="outlined"
              label="Birthday"
              value={editBirthday}
              onChangeText={setEditBirthday}
              placeholder="MM/DD/YYYY"
              style={styles.editInput}
            />
            <TextInput
              mode="outlined"
              label="Occupation"
              value={editOccupation}
              onChangeText={setEditOccupation}
              style={styles.editInput}
            />
            <TextInput
              mode="outlined"
              label="Country"
              value={editCountryName}
              onChangeText={setEditCountryName}
              style={styles.editInput}
            />
            <TextInput
              mode="outlined"
              label="State / Region"
              value={editStateRegion}
              onChangeText={setEditStateRegion}
              style={styles.editInput}
            />
            <Button mode="contained" onPress={savePersonalInfo} buttonColor={theme.colors.primary} textColor="#000">
              Save changes
            </Button>
          </View>
        ) : null}
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Settings</Text>
        <Divider style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.text }]}>Dark Mode</Text>
          <Switch value={isDarkMode} onValueChange={toggleThemeMode} color={theme.colors.primary} />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button mode="contained" onPress={handleSignOut} buttonColor={theme.colors.negative} textColor="#fff">
          Sign Out
        </Button>
      </View>

      <Modal visible={locationPromptVisible} transparent animationType="slide">
        <View style={styles.locationBackdrop}>
          <View style={[styles.locationCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.locationTitle, { color: theme.colors.text }]}>Complete Your Location</Text>
            <Text style={[styles.locationSubtitle, { color: theme.colors.placeholder }]}>
              Please enter your country and state/region.
            </Text>
            <TouchableOpacity style={[styles.locationSelector, { borderColor: theme.colors.border }]} onPress={() => setCountryPickerVisible(true)}>
              <Text style={[styles.locationLabel, { color: theme.colors.placeholder }]}>Country</Text>
              <Text style={[styles.locationValue, { color: countryName ? theme.colors.text : theme.colors.placeholder }]}>
                {countryName || 'Select country'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.locationSelector, { borderColor: theme.colors.border }]}
              onPress={() => {
                if (!countryCode) return alert('Select country first');
                if (selectableStates.length > 0) {
                  setStatePickerVisible(true);
                }
              }}
            >
              <Text style={[styles.locationLabel, { color: theme.colors.placeholder }]}>State / Region</Text>
              <Text style={[styles.locationValue, { color: stateRegion ? theme.colors.text : theme.colors.placeholder }]}>
                {stateRegion || (selectableStates.length > 0 ? 'Select state/region' : 'Enter state/region below')}
              </Text>
            </TouchableOpacity>
            {selectableStates.length === 0 && countryCode ? (
              <TextInput
                mode="outlined"
                value={stateRegion}
                onChangeText={setStateRegion}
                placeholder="Enter state/region"
                style={{ marginBottom: 10 }}
              />
            ) : null}
            <Button mode="contained" onPress={saveLocationPrompt} buttonColor={theme.colors.primary} textColor="#000">
              Save
            </Button>
          </View>
        </View>
      </Modal>

      <Modal visible={countryPickerVisible} transparent animationType="slide">
        <View style={styles.locationBackdrop}>
          <View style={[styles.locationPickerCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.locationTitle, { color: theme.colors.text }]}>Select Country</Text>
            <TextInput mode="outlined" value={countrySearch} onChangeText={setCountrySearch} placeholder="Search country" />
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.locationRow, { borderBottomColor: theme.colors.border }]}
                  onPress={() => {
                    setCountryCode(item.code);
                    setCountryName(item.name);
                    setStateRegion('');
                    setCountryPickerVisible(false);
                    setCountrySearch('');
                  }}
                >
                  <Text style={{ color: theme.colors.text }}>{item.name} ({item.code})</Text>
                </TouchableOpacity>
              )}
            />
            <Button onPress={() => setCountryPickerVisible(false)}>Close</Button>
          </View>
        </View>
      </Modal>

      <Modal visible={statePickerVisible} transparent animationType="slide">
        <View style={styles.locationBackdrop}>
          <View style={[styles.locationPickerCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.locationTitle, { color: theme.colors.text }]}>Select State / Region</Text>
            <TextInput mode="outlined" value={stateSearch} onChangeText={setStateSearch} placeholder="Search state/region" />
            <FlatList
              data={filteredStates}
              keyExtractor={(item) => item}
              ListEmptyComponent={
                <Text style={{ color: theme.colors.placeholder, paddingVertical: 10 }}>
                  No predefined list for this country yet.
                </Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.locationRow, { borderBottomColor: theme.colors.border }]}
                  onPress={() => {
                    setStateRegion(item);
                    setStateSearch('');
                    setStatePickerVisible(false);
                  }}
                >
                  <Text style={{ color: theme.colors.text }}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <Button onPress={() => setStatePickerVisible(false)}>Close</Button>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', padding: 24, marginBottom: 16 },
  avatarContainer: { marginBottom: 16, borderRadius: 56, padding: 6, borderWidth: 1 },
  avatar: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  avatarText: { fontSize: 40, fontWeight: 'bold', color: '#000' },
  name: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  email: { fontSize: 15, marginBottom: 4 },
  occupation: { fontSize: 13 },
  card: { marginHorizontal: 16, marginBottom: 16, borderRadius: 12, padding: 20 },
  cardTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  divider: { marginVertical: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 16 },
  infoValue: { fontSize: 14, fontWeight: '600' },
  editActions: { marginTop: 14 },
  editForm: { marginTop: 14 },
  editInput: { marginBottom: 2 },
  buttonContainer: { paddingHorizontal: 16, marginTop: 8, marginBottom: 20 },
  holdingItem: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1 },
  holdingSymbol: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  holdingName: { fontSize: 14 },
  locationBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.62)',
    justifyContent: 'center',
    padding: 20,
  },
  locationCard: { borderRadius: 16, padding: 16 },
  locationPickerCard: { borderRadius: 16, padding: 16, maxHeight: '75%' },
  locationTitle: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  locationSubtitle: { fontSize: 13, marginBottom: 12 },
  locationSelector: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  locationLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  locationValue: { fontSize: 15, fontWeight: '600' },
  locationRow: { paddingVertical: 11, borderBottomWidth: 1 },
});
