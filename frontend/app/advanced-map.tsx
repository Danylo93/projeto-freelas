import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { AdvancedMapFallback } from '../components/AdvancedMapFallback';

export default function AdvancedMapScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <AdvancedMapFallback />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

