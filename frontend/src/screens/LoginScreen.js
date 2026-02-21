import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from 'react-native-paper';
import StockScopeLogo from '../components/StockScopeLogo';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [occupation, setOccupation] = useState('');
  const [state, setState] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const theme = useTheme();

  const handleSubmit = async () => {
    if (!email || !password) {
      alert('Please fill in all fields');
      return;
    }

    if (isSignUp) {
      if (!fullName || !birthday || !occupation || !state) {
        alert('Please fill in all sign up fields');
        return;
      }
    }

    setLoading(true);
    const result = isSignUp 
      ? await signUp(email, password, { fullName, birthday, occupation, state })
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
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Decorative Pattern Background */}
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
                    }
                  ]} 
                />
              ))}
            </View>

            <View style={styles.headerSection}>
              <StockScopeLogo size={80} />
              <Text style={styles.title}>
                StockScope
              </Text>
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
                    theme={{
                      colors: {
                        primary: theme.colors.primary,
                        background: 'transparent',
                        text: theme.colors.text,
                        placeholder: theme.colors.placeholder,
                        outline: theme.colors.border,
                      }
                    }}
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
                  theme={{
                    colors: {
                      primary: theme.colors.primary,
                      background: 'transparent',
                      text: theme.colors.text,
                      placeholder: theme.colors.placeholder,
                      outline: theme.colors.border,
                    }
                  }}
                />

                <TextInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  mode="outlined"
                  secureTextEntry
                  style={styles.input}
                  contentStyle={{ color: theme.colors.text }}
                  theme={{
                    colors: {
                      primary: theme.colors.primary,
                      background: 'transparent',
                      text: theme.colors.text,
                      placeholder: theme.colors.placeholder,
                      outline: theme.colors.border,
                    }
                  }}
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
                      theme={{
                        colors: {
                          primary: theme.colors.primary,
                          background: 'transparent',
                          text: theme.colors.text,
                          placeholder: theme.colors.placeholder,
                          outline: theme.colors.border,
                        }
                      }}
                    />

                    <TextInput
                      label="Occupation (Job/Student)"
                      value={occupation}
                      onChangeText={setOccupation}
                      mode="outlined"
                      placeholder="e.g., Software Engineer, Student"
                      style={styles.input}
                      contentStyle={{ color: theme.colors.text }}
                      theme={{
                        colors: {
                          primary: theme.colors.primary,
                          background: 'transparent',
                          text: theme.colors.text,
                          placeholder: theme.colors.placeholder,
                          outline: theme.colors.border,
                        }
                      }}
                    />

                    <TextInput
                      label="State"
                      value={state}
                      onChangeText={setState}
                      mode="outlined"
                      autoCapitalize="characters"
                      style={styles.input}
                      contentStyle={{ color: theme.colors.text }}
                      theme={{
                        colors: {
                          primary: theme.colors.primary,
                          background: 'transparent',
                          text: theme.colors.text,
                          placeholder: theme.colors.placeholder,
                          outline: theme.colors.border,
                        }
                      }}
                    />
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
                labelStyle={{ fontSize: 16, fontWeight: '700', letterSpacing: 0.5 }}
                contentStyle={{ paddingVertical: 8 }}
              >
                {isSignUp ? 'Create Account' : 'Log In'}
              </Button>

              <View style={styles.dividerContainer}>
                <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                <Text style={[styles.dividerText, { color: theme.colors.placeholder }]}>or</Text>
                <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
              </View>

              <Button
                mode="outlined"
                onPress={() => setIsSignUp(!isSignUp)}
                style={styles.switchButton}
                textColor={theme.colors.text}
                labelStyle={{ fontSize: 14, fontWeight: '600' }}
                contentStyle={{ paddingVertical: 8 }}
              >
                {isSignUp 
                  ? 'Already have an account? Sign In' 
                  : "Don't have an account? Sign Up"}
              </Button>

              {!isSignUp && (
                <Button
                  mode="text"
                  onPress={() => {}}
                  style={styles.helpButton}
                  textColor={theme.colors.placeholder}
                  labelStyle={{ fontSize: 13 }}
                >
                  Need help? Contact Support
                </Button>
              )}
            </View>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.colors.placeholder }]}>
                By continuing, you agree to StockScope's Terms of Service and Privacy Policy.
              </Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
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
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 56,
    fontWeight: '800',
    marginBottom: 12,
    color: '#ffffff',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    color: '#8e8e93',
    fontWeight: '500',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 32,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#34c759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  switchButton: {
    marginTop: 8,
    borderRadius: 12,
    borderColor: '#2c2c2e',
    borderWidth: 1.5,
  },
  helpButton: {
    marginTop: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
