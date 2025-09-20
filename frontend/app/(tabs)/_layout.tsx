import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContextNew';
import { useAuth } from '../../contexts/AuthContext';

export default function TabLayout() {
  const { theme } = useTheme();
  const { user } = useAuth();

  // Determine which tabs to show based on user type
  const isProvider = user?.user_type === 1;

  if (isProvider) {
    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.outlineVariant,
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
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
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
