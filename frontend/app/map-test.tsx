import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { WorkingMap } from '../components/WorkingMap';

export default function MapTestScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <WorkingMap />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

