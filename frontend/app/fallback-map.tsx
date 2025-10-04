import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SimpleMapFallback } from '../components/SimpleMapFallback';

export default function FallbackMapScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <SimpleMapFallback />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

