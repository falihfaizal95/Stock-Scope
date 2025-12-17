import React from 'react';
import { StatusBar, Platform } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainNavigator from './src/navigation/MainNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { WatchlistProvider } from './src/context/WatchlistContext';
import { theme } from './src/utils/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <WatchlistProvider>
            <NavigationContainer
              theme={{
                dark: true,
                colors: {
                  primary: theme.colors.primary,
                  background: theme.colors.background,
                  card: theme.colors.surface,
                  text: theme.colors.text,
                  border: theme.colors.border,
                  notification: theme.colors.primary,
                },
              }}
            >
              <StatusBar
                barStyle="light-content"
                backgroundColor={theme.colors.background}
              />
              <MainNavigator />
            </NavigationContainer>
          </WatchlistProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

