import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useTheme } from '../../src/providers/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';

export default function TabLayout() {
  const themeContext = useTheme();
  const theme = themeContext.theme;
  const { user } = useAuth();

  // Determine which tabs to show based on user type
  const isProvider = user?.user_type === 1;

  if (isProvider) {
    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.outlineVariant,
            borderTopWidth: 1,
            paddingVertical: 8,
            paddingHorizontal: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 8,
            zIndex: 100,
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        }}
      >
        <Tabs.Screen
          name="provider-home"
          options={{
            title: 'Início',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size, color }}>🏠</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="home"
          options={{
            title: 'Serviços',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size, color }}>🔧</Text>
            ),
          }}
        />
      </Tabs>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
          borderTopWidth: 1,
          paddingVertical: 8,
          paddingHorizontal: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 8,
          zIndex: 100,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="provider-home"
        options={{
          title: 'Serviços',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🔧</Text>
          ),
        }}
      />
    </Tabs>
  );
}
