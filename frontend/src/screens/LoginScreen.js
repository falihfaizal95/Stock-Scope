import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Modal,
} from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from 'react-native-paper';
import StockScopeLogo from '../components/StockScopeLogo';
import { COUNTRIES, getStatesForCountry } from '../constants/locationData';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [occupation, setOccupation] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [countryName, setCountryName] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [statePickerVisible, setStatePickerVisible] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [stateSearch, setStateSearch] = useState('');
  const { signIn, signUp } = useAuth();
  const theme = useTheme();

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

  const handleSubmit = async () => {
    if (!email || !password) {
      alert('Please fill in all required fields');
      return;
    }

    if (isSignUp) {
      if (!fullName || !birthday || !occupation || !countryCode || !stateRegion) {
        alert('Please complete name, birthday, occupation, country, and state');
        return;
      }
    }

    setLoading(true);
    const result = isSignUp
      ? await signUp(email, password, {
          fullName,
          birthday,
          occupation,
          country: countryCode,
          countryName,
          state: stateRegion,
        })
      : await signIn(email, password);

    setLoading(false);
    if (!result.success) {
      alert(result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#000000', '#1a1a2e', '#16213e']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.patternContainer}>
              {[...Array(20)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.patternDot,
                    {
                      left: `${(i * 5) % 100}%`,
                      top: `${(i * 7) % 100}%`,
                      opacity: 0.1 + (i % 3) * 0.05,
                    },
                  ]}
                />
              ))}
            </View>

            <View style={styles.headerSection}>
              <StockScopeLogo size={80} />
              <Text style={styles.title}>StockScope</Text>
              <Text style={styles.subtitle}>
                {isSignUp ? 'Start Your Investment Journey' : 'Welcome Back'}
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: 'rgba(28, 28, 30, 0.95)' }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                {isSignUp ? 'Create Account' : 'Log in to StockScope'}
              </Text>
              <Text style={[styles.cardSubtitle, { color: theme.colors.placeholder }]}>
                {isSignUp
                  ? 'Join thousands of investors tracking the market'
                  : 'Access your portfolio and market insights'}
              </Text>

              <View style={styles.inputContainer}>
                {isSignUp && (
                  <TextInput
                    label="Full Legal Name"
                    value={fullName}
                    onChangeText={setFullName}
                    mode="outlined"
                    autoCapitalize="words"
                    style={styles.input}
                    contentStyle={{ color: theme.colors.text }}
                  />
                )}

                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  contentStyle={{ color: theme.colors.text }}
                />

                <TextInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  mode="outlined"
                  secureTextEntry
                  style={styles.input}
                  contentStyle={{ color: theme.colors.text }}
                />

                {isSignUp && (
                  <>
                    <TextInput
                      label="Birthday (MM/DD/YYYY)"
                      value={birthday}
                      onChangeText={setBirthday}
                      mode="outlined"
                      placeholder="MM/DD/YYYY"
                      style={styles.input}
                      contentStyle={{ color: theme.colors.text }}
                    />

                    <TextInput
                      label="Occupation (Job/Student)"
                      value={occupation}
                      onChangeText={setOccupation}
                      mode="outlined"
                      style={styles.input}
                      contentStyle={{ color: theme.colors.text }}
                    />

                    <TouchableOpacity
                      style={[styles.selectorInput, { borderColor: theme.colors.border }]}
                      onPress={() => setCountryPickerVisible(true)}
                    >
                      <Text style={[styles.selectorLabel, { color: theme.colors.placeholder }]}>Country</Text>
                      <Text
                        style={[
                          styles.selectorValue,
                          { color: countryName ? theme.colors.text : theme.colors.placeholder },
                        ]}
                      >
                        {countryName || 'Select country'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.selectorInput, { borderColor: theme.colors.border }]}
                      onPress={() => {
                        if (!countryCode) {
                          alert('Select country first');
                          return;
                        }
                        setStatePickerVisible(true);
                      }}
                    >
                      <Text style={[styles.selectorLabel, { color: theme.colors.placeholder }]}>State / Region</Text>
                      <Text
                        style={[
                          styles.selectorValue,
                          { color: stateRegion ? theme.colors.text : theme.colors.placeholder },
                        ]}
                      >
                        {stateRegion || 'Select state/region'}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={loading}
                disabled={loading}
                style={styles.button}
                buttonColor={theme.colors.primary}
                textColor="#000"
              >
                {isSignUp ? 'Create Account' : 'Log In'}
              </Button>

              <Button
                mode="outlined"
                onPress={() => setIsSignUp(!isSignUp)}
                style={styles.switchButton}
                textColor={theme.colors.text}
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </Button>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>

      <Modal visible={countryPickerVisible} transparent animationType="slide">
        <View style={styles.pickerBackdrop}>
          <View style={[styles.pickerCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.pickerTitle, { color: theme.colors.text }]}>Select Country</Text>
            <TextInput
              mode="outlined"
              value={countrySearch}
              onChangeText={setCountrySearch}
              placeholder="Search country"
              style={styles.pickerSearch}
            />
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              style={styles.pickerList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, { borderBottomColor: theme.colors.border }]}
                  onPress={() => {
                    setCountryCode(item.code);
                    setCountryName(item.name);
                    setStateRegion('');
                    setCountryPickerVisible(false);
                    setCountrySearch('');
                  }}
                >
                  <Text style={[styles.pickerItemText, { color: theme.colors.text }]}>
                    {item.name} ({item.code})
                  </Text>
                </TouchableOpacity>
              )}
            />
            <Button onPress={() => setCountryPickerVisible(false)} textColor={theme.colors.placeholder}>
              Close
            </Button>
          </View>
        </View>
      </Modal>

      <Modal visible={statePickerVisible} transparent animationType="slide">
        <View style={styles.pickerBackdrop}>
          <View style={[styles.pickerCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.pickerTitle, { color: theme.colors.text }]}>Select State / Region</Text>
            <TextInput
              mode="outlined"
              value={stateSearch}
              onChangeText={setStateSearch}
              placeholder="Search state/region"
              style={styles.pickerSearch}
            />
            <FlatList
              data={filteredStates}
              keyExtractor={(item) => item}
              style={styles.pickerList}
              ListEmptyComponent={
                <Text style={[styles.pickerEmptyText, { color: theme.colors.placeholder }]}>
                  No predefined list for this country yet.
                </Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, { borderBottomColor: theme.colors.border }]}
                  onPress={() => {
                    setStateRegion(item);
                    setStateSearch('');
                    setStatePickerVisible(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, { color: theme.colors.text }]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <Button onPress={() => setStatePickerVisible(false)} textColor={theme.colors.placeholder}>
              Close
            </Button>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    minHeight: height,
  },
  content: {
    alignItems: 'center',
    position: 'relative',
  },
  patternContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    opacity: 0.3,
  },
  patternDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#34c759',
  },
  headerSection: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  title: {
    fontSize: 56,
    fontWeight: '800',
    marginBottom: 12,
    color: '#fff',
    letterSpacing: -1,
  },
  subtitle: { fontSize: 18, color: '#8e8e93', fontWeight: '500' },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 32,
    marginBottom: 20,
  },
  cardTitle: { fontSize: 28, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  cardSubtitle: { fontSize: 14, marginBottom: 24, textAlign: 'center' },
  inputContainer: { marginBottom: 16 },
  input: { marginBottom: 16, backgroundColor: 'transparent' },
  selectorInput: {
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectorLabel: { fontSize: 11, marginBottom: 4, fontWeight: '600' },
  selectorValue: { fontSize: 15, fontWeight: '600' },
  button: { marginTop: 8, marginBottom: 12, borderRadius: 12 },
  switchButton: { marginTop: 8, borderRadius: 12, borderWidth: 1.5 },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  pickerCard: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    maxHeight: '72%',
  },
  pickerTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
  pickerSearch: { marginBottom: 10 },
  pickerList: { marginBottom: 8 },
  pickerItem: { paddingVertical: 12, borderBottomWidth: 1 },
  pickerItemText: { fontSize: 15, fontWeight: '600' },
  pickerEmptyText: { paddingVertical: 14, fontSize: 13 },
});

