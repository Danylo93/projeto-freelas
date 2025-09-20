const fs = require('fs');
const path = require('path');

// Lista de arquivos e diretórios para remover
const filesToRemove = [
  // Contextos antigos de Socket.IO
  'contexts/RealtimeContext.tsx',
  'contexts/RealtimeFallbackContext.tsx',
  'contexts/ImprovedRealtimeContext.tsx',
  'contexts/HybridRealtimeContext.tsx',
  'contexts/SimpleSocketIOContext.tsx',
  'contexts/SocketContext.tsx',
  'contexts/SocketIORealtimeContext.tsx',
  
  // Componentes antigos
  'components/ConnectionDebug.tsx',
  'components/SearchingAnimation.tsx', // versão antiga
  
  // Arquivos de documentação antigos
  'CORRECAO_FINAL_CONECTIVIDADE.md',
  'CORRECAO_LOOP_SOCKETIO.md',
  'CORRECOES_FINAIS_APLICADAS.md',
  'CORRECOES_FINAIS_COMPLETAS.md',
  'CORRECOES_FINAIS_IMPLEMENTADAS.md',
  'CORRECOES_NOTIFICACOES_IMPLEMENTADAS.md',
  'CORRECOES_PROVIDER_IMPLEMENTADAS.md',
  'FRONTEND_WEBSOCKET_FIXES.md',
  'IMPLEMENTACOES_FINAIS_COMPLETAS.md',
  'LIMPEZA_COMPLETA_APLICADA.md',
  'PROBLEMA_CORRIGIDO_NAVEGACAO.md',
  'PROBLEMAS_RESOLVIDOS.md',
  'SOLUCAO_FINAL_WEBSOCKET.md',
  'SOLUCAO_NGROK.md',
  'TEST_CONNECTIVITY.md',
  'TESTE_APOS_CORRECOES.md',
  'TESTE_CORRIGIDO_DETALHES.md',
  'TESTE_FLUXO_COMPLETO_UBER.md',
  'TESTE_NOTIFICACOES_PRESTADOR.md',
  'TESTE_UBER_STYLE.md',
  'TESTE_WEBSOCKET.md',
  'FINAL_SOLUTION_SUMMARY.md',
  'SISTEMA_COMPLETO_IMPLEMENTADO.md',
  'SISTEMA_NOTIFICACOES_COMPLETO.md',
  'SISTEMA_UBER_COMPLETO.md',
  'DESIGN_SYSTEM_IMPLEMENTATION.md',
  'FLUXO_COMPLETO_GOOGLE_MAPS.md',
  'INSTRUCOES_UBER_STYLE.md',
  
  // Arquivos de teste antigos
  'test-interactive-flow.js',
  'InternalBytecode.js',
  
  // Arquivo .env copy
  '.env copy',
];

// Lista de diretórios para limpar (manter estrutura mas remover arquivos desnecessários)
const directoriesToClean = [
  'components/uber',
  'components/common',
];

function removeFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (fs.existsSync(fullPath)) {
    try {
      if (fs.statSync(fullPath).isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`✅ Removed directory: ${filePath}`);
      } else {
        fs.unlinkSync(fullPath);
        console.log(`✅ Removed file: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Error removing ${filePath}:`, error.message);
    }
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
  }
}

function cleanDirectory(dirPath) {
  const fullPath = path.join(__dirname, '..', dirPath);
  
  if (fs.existsSync(fullPath)) {
    try {
      const files = fs.readdirSync(fullPath);
      files.forEach(file => {
        const filePath = path.join(fullPath, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          // Remove diretórios vazios ou com arquivos desnecessários
          const subFiles = fs.readdirSync(filePath);
          if (subFiles.length === 0) {
            fs.rmdirSync(filePath);
            console.log(`✅ Removed empty directory: ${path.join(dirPath, file)}`);
          }
        } else {
          // Remove arquivos de teste ou temporários
          if (file.includes('.test.') || file.includes('.spec.') || file.includes('.temp')) {
            fs.unlinkSync(filePath);
            console.log(`✅ Removed test file: ${path.join(dirPath, file)}`);
          }
        }
      });
    } catch (error) {
      console.error(`❌ Error cleaning directory ${dirPath}:`, error.message);
    }
  }
}

function main() {
  console.log('🧹 Starting cleanup of unused files...\n');
  
  // Remove arquivos específicos
  filesToRemove.forEach(file => {
    removeFile(file);
  });
  
  // Limpa diretórios
  directoriesToClean.forEach(dir => {
    cleanDirectory(dir);
  });
  
  console.log('\n✅ Cleanup completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Review the changes');
  console.log('2. Update imports in remaining files');
  console.log('3. Test the application');
  console.log('4. Commit the changes');
}

if (require.main === module) {
  main();
}

module.exports = { removeFile, cleanDirectory };
