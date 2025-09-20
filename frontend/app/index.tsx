import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ServiçoApp</Text>
      <Text style={styles.subtitle}>Conectando você aos melhores profissionais</Text>
      <Text style={styles.status}>Frontend funcionando!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  status: {
    fontSize: 16,
    color: '#28a745',
    fontWeight: '600',
    textAlign: 'center',
  },
});