#!/usr/bin/env node

const { spawn } = require('child_process');
const axios = require('axios');

console.log('🚀 Iniciando Expo com ngrok...');

// Função para verificar se a porta está disponível
async function checkPort(port) {
  try {
    await axios.get(`http://localhost:${port}`);
    return true;
  } catch (error) {
    return false;
  }
}

// Função para iniciar o Expo
function startExpo() {
  console.log('📱 Iniciando Expo...');
  const expo = spawn('npx', ['expo', 'start', '--port', '8080'], {
    stdio: 'inherit',
    shell: true
  });

  expo.on('error', (error) => {
    console.error('❌ Erro ao iniciar Expo:', error);
  });

  return expo;
}

// Função para iniciar ngrok
function startNgrok() {
  console.log('🌐 Iniciando ngrok...');
  const ngrok = spawn('npx', ['ngrok', 'http', '8080'], {
    stdio: 'inherit',
    shell: true
  });

  ngrok.on('error', (error) => {
    console.error('❌ Erro ao iniciar ngrok:', error);
    console.log('💡 Instale o ngrok: npm install -g ngrok');
  });

  return ngrok;
}

// Função principal
async function main() {
  try {
    // Verificar se a porta 8080 está disponível
    const portAvailable = await checkPort(8080);
    if (portAvailable) {
      console.log('⚠️  Porta 8080 já está em uso. Tentando porta 8081...');
    }

    // Iniciar Expo
    const expoProcess = startExpo();
    
    // Aguardar um pouco para o Expo inicializar
    setTimeout(() => {
      console.log('⏳ Aguardando Expo inicializar...');
      
      // Iniciar ngrok após 5 segundos
      setTimeout(() => {
        const ngrokProcess = startNgrok();
        
        // Cleanup ao sair
        process.on('SIGINT', () => {
          console.log('\n🛑 Parando processos...');
          expoProcess.kill();
          ngrokProcess.kill();
          process.exit(0);
        });
      }, 5000);
    }, 2000);

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

main();
