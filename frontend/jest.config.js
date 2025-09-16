module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|expo(nent)?|@expo|expo-router|expo-modules-core|expo-asset|expo-application|expo-constants|expo-file-system|expo-font|expo-keep-awake|expo-linking|expo-location|expo-notifications|expo-splash-screen|expo-status-bar|expo-system-ui|expo-web-browser|expo-blur|expo-haptics|expo-image|@expo/vector-icons|@expo/metro-runtime|react-native-reanimated|react-native-gesture-handler|react-native-safe-area-context|react-native-screens|react-native-web|react-native-webview|@react-navigation/.*|react-native-worklets|@react-native-community/.*)'
  ],
  testPathIgnorePatterns: ['<rootDir>/.expo/', '<rootDir>/node_modules/'],
  moduleDirectories: ['node_modules', '<rootDir>'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
