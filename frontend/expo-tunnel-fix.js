#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🔧 Solucionando problema do tunnel do Expo...');
console.log('📱 Iniciando com configurações otimizadas...');

// Configurações para resolver o problema do tunnel
const expoArgs = [
  'expo',
  'start',
  '--tunnel',
  '--max-workers', '1',
  '--reset-cache'
];

console.log('🚀 Comando:', `npx ${expoArgs.join(' ')}`);

const expo = spawn('npx', expoArgs, {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    EXPO_DEBUG: '1',
    EXPO_TUNNEL_TIMEOUT: '60000'
  }
});

expo.on('error', (error) => {
  console.error('❌ Erro ao iniciar Expo:', error);
  console.log('💡 Tentando alternativa sem tunnel...');
  
  // Tentar sem tunnel como fallback
  const fallback = spawn('npx', ['expo', 'start', '--lan'], {
    stdio: 'inherit',
    shell: true
  });
  
  fallback.on('error', (fallbackError) => {
    console.error('❌ Erro no fallback:', fallbackError);
  });
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
