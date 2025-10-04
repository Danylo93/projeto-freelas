const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Adicionar suporte para react-native-maps
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Configuração específica para react-native-maps
config.resolver.alias = {
  'react-native-maps': 'react-native-maps',
};

module.exports = config;