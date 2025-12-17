import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Apple Stocks-inspired Dark Theme
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#34c759', // Apple Green
    secondary: '#ff3b30', // Apple Red
    background: '#000000', // Pure Black
    surface: '#1c1c1e', // Dark Gray
    text: '#ffffff',
    onSurface: '#f2f2f7',
    error: '#ff3b30',
    success: '#34c759',
    warning: '#ff9500',
    card: '#1c1c1e',
    border: '#2c2c2e',
    positive: '#34c759',
    negative: '#ff3b30',
    placeholder: '#8e8e93',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#34c759',
    secondary: '#ff3b30',
    background: '#ffffff',
    surface: '#f2f2f7',
    text: '#000000',
    error: '#ff3b30',
    success: '#34c759',
    warning: '#ff9500',
    card: '#ffffff',
    border: '#e5e5ea',
    positive: '#34c759',
    negative: '#ff3b30',
    placeholder: '#8e8e93',
  },
};

// Use dark theme by default
export const theme = darkTheme;

