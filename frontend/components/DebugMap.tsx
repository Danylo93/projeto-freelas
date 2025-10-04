import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, TouchableOpacity } from 'react-native';

export const DebugMap: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (info: string) => {
    console.log(`🔍 [DEBUG] ${info}`);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  useEffect(() => {
    addDebugInfo(`Platform: ${Platform.OS}`);
    addDebugInfo(`Platform Version: ${Platform.Version}`);
    
    // Testar importação do react-native-maps
    try {
      const Maps = require('react-native-maps');
      addDebugInfo(`react-native-maps carregado: ${!!Maps}`);
      addDebugInfo(`Maps.default: ${!!Maps.default}`);
      addDebugInfo(`Maps.MapView: ${!!Maps.MapView}`);
      addDebugInfo(`Maps.Marker: ${!!Maps.Marker}`);
      
      if (Maps.default) {
        addDebugInfo('✅ Usando Maps.default');
      } else if (Maps.MapView) {
        addDebugInfo('✅ Usando Maps.MapView');
      } else {
        addDebugInfo('❌ Nenhum export encontrado');
      }
    } catch (error) {
      addDebugInfo(`❌ Erro ao carregar react-native-maps: ${error.message}`);
    }

    // Testar outras dependências
    try {
      const Constants = require('expo-constants');
      addDebugInfo(`expo-constants: ${!!Constants}`);
    } catch (error) {
      addDebugInfo(`❌ expo-constants: ${error.message}`);
    }

    try {
      const Location = require('expo-location');
      addDebugInfo(`expo-location: ${!!Location}`);
    } catch (error) {
      addDebugInfo(`❌ expo-location: ${error.message}`);
    }
  }, []);

  const testMapRender = () => {
    addDebugInfo('🧪 Testando renderização do mapa...');
    
    try {
      const Maps = require('react-native-maps');
      const MapView = Maps.default || Maps.MapView;
      
      if (MapView) {
        addDebugInfo('✅ MapView disponível para renderização');
      } else {
        addDebugInfo('❌ MapView não disponível');
      }
    } catch (error) {
      addDebugInfo(`❌ Erro no teste: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔍 Debug do Mapa</Text>
        <TouchableOpacity style={styles.button} onPress={testMapRender}>
          <Text style={styles.buttonText}>Testar Mapa</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.logContainer}>
        {debugInfo.map((info, index) => (
          <Text key={index} style={styles.logText}>
            {info}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  logContainer: {
    flex: 1,
    padding: 16,
  },
  logText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});

