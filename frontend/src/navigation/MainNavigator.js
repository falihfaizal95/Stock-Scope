import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import WatchlistScreen from '../screens/WatchlistScreen';
import NewsScreen from '../screens/NewsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import StockDetailScreen from '../screens/StockDetailScreen';
import NewsDetailScreen from '../screens/NewsDetailScreen';
import LoginScreen from '../screens/LoginScreen';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home-variant' : 'home-variant-outline';
          } else if (route.name === 'Search') {
            iconName = 'magnify';
          } else if (route.name === 'Watchlist') {
            iconName = focused ? 'clock-time-four' : 'clock-time-four-outline';
          } else if (route.name === 'News') {
            iconName = focused ? 'newspaper' : 'newspaper-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return (
            <MaterialCommunityIcons 
              name={iconName} 
              size={focused ? 26 : 24} 
              color={color}
              style={{
                transition: 'all 0.2s ease-in-out',
                transform: focused ? [{ scale: 1.1 }] : [{ scale: 1 }],
              }}
            />
          );
        },
        tabBarActiveTintColor: '#34c759', // Apple Green
        tabBarInactiveTintColor: '#8e8e93',
        tabBarStyle: {
          backgroundColor: '#1c1c1e',
          borderTopWidth: 0,
          borderTopColor: 'transparent',
          paddingBottom: 12,
          paddingTop: 8,
          height: 70,
          elevation: 0,
          shadowOpacity: 0,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
          letterSpacing: 0.15,
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
          borderRadius: 12,
          marginHorizontal: 2,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchScreen}
        options={{
          tabBarLabel: 'Search',
        }}
      />
      <Tab.Screen 
        name="Watchlist" 
        component={WatchlistScreen}
        options={{
          tabBarLabel: 'Watchlist',
        }}
      />
      <Tab.Screen 
        name="News" 
        component={NewsScreen}
        options={{
          tabBarLabel: 'News',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
      <Tab.Screen 
        name="StockDetail" 
        component={StockDetailScreen}
        options={{
          tabBarLabel: 'Stock',
          tabBarButton: () => null, // Hide from tab bar but keep in navigator
        }}
      />
      <Tab.Screen 
        name="NewsDetail" 
        component={NewsDetailScreen}
        options={{
          tabBarLabel: 'Article',
          tabBarButton: () => null, // Hide from tab bar but keep in navigator
        }}
      />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  const { user } = useAuth();

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: '#000000' },
      }}
    >
      {user ? (
        <>
          <Stack.Screen name="MainTabs" component={HomeTabs} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
