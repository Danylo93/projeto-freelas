#!/usr/bin/env node

/**
 * Script de Verificação Mobile - Freelas
 * Executa verificações de qualidade para o projeto mobile
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Iniciando verificação mobile...\n');

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const checkCommand = (command, description) => {
  try {
    log(`\n${colors.blue}🔍 ${description}...${colors.reset}`);
    execSync(command, { stdio: 'pipe', cwd: process.cwd() });
    log(`✅ ${description}: OK`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description}: FALHOU`, 'red');
    log(`   Erro: ${error.message}`, 'red');
    return false;
  }
};

// Verificações
let allPassed = true;

// 1. TypeScript
allPassed &= checkCommand('npx tsc --noEmit', 'TypeScript check');

// 2. ESLint
allPassed &= checkCommand('npx eslint . --ext .ts,.tsx,.js,.jsx', 'ESLint check');

// 3. Jest Tests
allPassed &= checkCommand('npx jest --passWithNoTests', 'Jest tests');

// 4. Expo Doctor
try {
  allPassed &= checkCommand('npx expo-doctor', 'Expo Doctor');
} catch (error) {
  log('⚠️ Expo Doctor não disponível, pulando...', 'yellow');
}

// 5. Verificar estrutura de arquivos
log(`\n${colors.blue}🔍 Verificando estrutura de arquivos...${colors.reset}`);

const requiredFiles = [
  'src/theme/index.ts',
  'src/providers/ThemeProvider.tsx',
  'src/providers/AppProviders.tsx',
  'app/_layout.tsx',
  'package.json',
  'app.json'
];

let structureOk = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    log(`✅ ${file}: OK`, 'green');
  } else {
    log(`❌ ${file}: FALTANDO`, 'red');
    structureOk = false;
  }
});

allPassed &= structureOk;

// 6. Verificar imports do tema
log(`\n${colors.blue}🔍 Verificando imports do tema...${colors.reset}`);

try {
  const result = execSync('grep -r "ThemeContextNew" --include="*.tsx" --include="*.ts" . || true', { 
    stdio: 'pipe', 
    cwd: process.cwd() 
  });
  
  if (result.toString().trim()) {
    log('❌ Ainda há imports de ThemeContextNew:', 'red');
    log(result.toString(), 'red');
    allPassed = false;
  } else {
    log('✅ Nenhum import de ThemeContextNew encontrado', 'green');
  }
} catch (error) {
  log('⚠️ Erro ao verificar imports, pulando...', 'yellow');
}

// Resultado final
log(`\n${colors.bold}${'='.repeat(50)}${colors.reset}`);
if (allPassed) {
  log('🎉 VERIFICAÇÃO MOBILE: TODOS OS TESTES PASSARAM!', 'green');
  log('✅ Projeto pronto para desenvolvimento', 'green');
  process.exit(0);
} else {
  log('❌ VERIFICAÇÃO MOBILE: ALGUNS TESTES FALHARAM!', 'red');
  log('🔧 Corrija os problemas antes de continuar', 'red');
  process.exit(1);
}
