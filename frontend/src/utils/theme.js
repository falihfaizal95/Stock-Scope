import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { fontFamily } from './fonts';

// Apple Stocks-inspired Dark Theme
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#34c759', // Apple Green
    secondary: '#ff3b30', // Apple Red
    background: '#000000', // Pure Black
    surface: '#000000', // Pure Black
    text: '#ffffff',
    onSurface: '#f2f2f7',
    error: '#ff3b30',
    success: '#34c759',
    warning: '#ff9500',
    card: '#000000',
    border: '#121212',
    positive: '#34c759',
    negative: '#ff3b30',
    placeholder: '#8e8e93',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    surfaceVariant: '#000000',
    surfaceDisabled: '#000000',
    inverseSurface: '#000000',
    elevation: {
      level0: '#000000',
      level1: '#000000',
      level2: '#000000',
      level3: '#000000',
      level4: '#000000',
      level5: '#000000',
    },
  },
  fonts: {
    ...MD3DarkTheme.fonts,
    default: {
      ...MD3DarkTheme.fonts.default,
      fontFamily: fontFamily.regular,
    },
    headlineSmall: {
      ...MD3DarkTheme.fonts.headlineSmall,
      fontFamily: fontFamily.bold,
    },
    headlineMedium: {
      ...MD3DarkTheme.fonts.headlineMedium,
      fontFamily: fontFamily.bold,
    },
    headlineLarge: {
      ...MD3DarkTheme.fonts.headlineLarge,
      fontFamily: fontFamily.bold,
    },
    titleSmall: {
      ...MD3DarkTheme.fonts.titleSmall,
      fontFamily: fontFamily.medium,
    },
    titleMedium: {
      ...MD3DarkTheme.fonts.titleMedium,
      fontFamily: fontFamily.medium,
    },
    titleLarge: {
      ...MD3DarkTheme.fonts.titleLarge,
      fontFamily: fontFamily.bold,
    },
    bodySmall: {
      ...MD3DarkTheme.fonts.bodySmall,
      fontFamily: fontFamily.regular,
    },
    bodyMedium: {
      ...MD3DarkTheme.fonts.bodyMedium,
      fontFamily: fontFamily.regular,
    },
    bodyLarge: {
      ...MD3DarkTheme.fonts.bodyLarge,
      fontFamily: fontFamily.regular,
    },
    labelSmall: {
      ...MD3DarkTheme.fonts.labelSmall,
      fontFamily: fontFamily.medium,
    },
    labelMedium: {
      ...MD3DarkTheme.fonts.labelMedium,
      fontFamily: fontFamily.medium,
    },
    labelLarge: {
      ...MD3DarkTheme.fonts.labelLarge,
      fontFamily: fontFamily.medium,
    },
  },
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#34c759',
    secondary: '#ff3b30',
    background: '#000000',
    surface: '#000000',
    text: '#ffffff',
    error: '#ff3b30',
    success: '#34c759',
    warning: '#ff9500',
    card: '#000000',
    border: '#121212',
    positive: '#34c759',
    negative: '#ff3b30',
    placeholder: '#8e8e93',
    surfaceVariant: '#000000',
    surfaceDisabled: '#000000',
    inverseSurface: '#000000',
    elevation: {
      level0: '#000000',
      level1: '#000000',
      level2: '#000000',
      level3: '#000000',
      level4: '#000000',
      level5: '#000000',
    },
  },
};

// Use dark theme by default
export const theme = darkTheme;
