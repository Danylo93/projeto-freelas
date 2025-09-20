#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🚀 Iniciando Expo em modo local...');
console.log('📱 Use o Expo Go para escanear o QR Code');
console.log('🌐 Certifique-se de que seu celular está na mesma rede Wi-Fi');

// Iniciar Expo em modo local
const expo = spawn('npx', ['expo', 'start', '--localhost'], {
  stdio: 'inherit',
  shell: true
});

expo.on('error', (error) => {
  console.error('❌ Erro ao iniciar Expo:', error);
});

expo.on('close', (code) => {
  console.log(`📱 Expo finalizado com código: ${code}`);
});

// Cleanup ao sair
process.on('SIGINT', () => {
  console.log('\n🛑 Parando Expo...');
  expo.kill();
  process.exit(0);
});
