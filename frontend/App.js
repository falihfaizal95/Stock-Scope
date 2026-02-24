import React from 'react';
import { StatusBar, Platform } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainNavigator from './src/navigation/MainNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { WatchlistProvider } from './src/context/WatchlistContext';
import { PortfolioProvider } from './src/context/PortfolioContext';
import { ThemeModeProvider, useThemeMode } from './src/context/ThemeModeContext';

// Import web-specific styles
if (Platform.OS === 'web') {
  require('./src/navigation/tabStyles.css');
  const { applyGlobalFonts } = require('./src/styles/globalStyles');
  applyGlobalFonts();
}

function AppContent() {
  const { theme, isDarkMode } = useThemeMode();

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <WatchlistProvider>
            <PortfolioProvider>
              <NavigationContainer
              theme={{
                dark: isDarkMode,
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
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                backgroundColor={theme.colors.background}
              />
              <MainNavigator />
            </NavigationContainer>
            </PortfolioProvider>
          </WatchlistProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ThemeModeProvider>
      <AppContent />
    </ThemeModeProvider>
  );
}
