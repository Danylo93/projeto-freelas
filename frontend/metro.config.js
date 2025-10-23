const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Adicionar suporte para arquivos SVG
config.resolver.assetExts.push('svg');

// Configurar resolver para dependências nativas
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;