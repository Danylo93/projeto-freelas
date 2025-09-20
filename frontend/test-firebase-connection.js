// Script para testar conexão com Firebase
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, get } = require('firebase/database');

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC7XUJDG7PXB3YUiSyh0WMbbqeiR81zNlg",
  authDomain: "uber-like-freelas.firebaseapp.com",
  databaseURL: "https://uber-like-freelas-default-rtdb.firebaseio.com",
  projectId: "uber-like-freelas",
  storageBucket: "uber-like-freelas.firebasestorage.app",
  messagingSenderId: "901683796826",
  appId: "1:901683796826:web:6db0585afabdf5e8383163",
  measurementId: "G-04R96TSGKK"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Função para testar conexão
async function testFirebaseConnection() {
  try {
    console.log('🔥 Testando conexão com Firebase...');
    
    // Testar escrita
    const testRef = ref(database, 'test/connection');
    await set(testRef, {
      timestamp: new Date().toISOString(),
      message: 'Conexão Firebase funcionando!'
    });
    
    console.log('✅ Escrita no Firebase: OK');
    
    // Testar leitura
    const snapshot = await get(testRef);
    if (snapshot.exists()) {
      console.log('✅ Leitura do Firebase: OK');
      console.log('📊 Dados:', snapshot.val());
    } else {
      console.log('❌ Leitura do Firebase: FALHOU');
    }
    
    // Testar estrutura de dados do projeto
    const requestsRef = ref(database, 'requests');
    const requestsSnapshot = await get(requestsRef);
    console.log('📋 Requests existentes:', requestsSnapshot.exists() ? 'Sim' : 'Não');
    
    const providersRef = ref(database, 'providerLocations');
    const providersSnapshot = await get(providersRef);
    console.log('👥 Provider locations existentes:', providersSnapshot.exists() ? 'Sim' : 'Não');
    
    console.log('🎉 Teste de conexão Firebase concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao testar Firebase:', error);
  }
}

// Executar teste
testFirebaseConnection();
