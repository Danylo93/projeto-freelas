import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import Constants from 'expo-constants';

// Firebase configuration
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || "AIzaSyC7XUJDG7PXB3YUiSyh0WMbbqeiR81zNlg",
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || "uber-like-freelas.firebaseapp.com",
  databaseURL: Constants.expoConfig?.extra?.firebaseDatabaseURL || "https://uber-like-freelas-default-rtdb.firebaseio.com",
  projectId: Constants.expoConfig?.extra?.firebaseProjectId || "uber-like-freelas",
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket || "uber-like-freelas.firebasestorage.app",
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId || "901683796826",
  appId: Constants.expoConfig?.extra?.firebaseAppId || "1:901683796826:web:6db0585afabdf5e8383163",
  measurementId: Constants.expoConfig?.extra?.firebaseMeasurementId || "G-04R96TSGKK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
export const database = getDatabase(app);

export default app;
