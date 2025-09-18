// Script para testar o fluxo interativo
// Execute este script para criar dados de teste e poder interagir com o sistema

const API_BASE_URL = 'https://a09f89583882.ngrok-free.app';

// Função para fazer login e obter token
async function login(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': '1',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('❌ Erro no login:', error);
    return null;
  }
}

// Função para criar uma solicitação de teste
async function createTestRequest(token, status = 'accepted') {
  try {
    const requestId = `req_interactive_test_${Date.now()}`;
    
    const response = await fetch(`${API_BASE_URL}/api/requests`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': '1',
      },
      body: JSON.stringify({
        id: requestId,
        client_id: '03a033c5-3814-4807-9930-3491026bd2db', // Cliente de teste
        provider_id: status !== 'searching' ? '13777d5d-4af2-4651-bc27-d5a555a42ed3_Eletricista' : null,
        category: 'Eletricista',
        description: 'Teste do fluxo interativo - problema elétrico',
        client_latitude: -23.5505,
        client_longitude: -46.6333,
        price: 85.0,
        status: status,
      }),
    });

    const data = await response.json();
    console.log(`✅ Solicitação criada: ${requestId} (Status: ${status})`);
    return data;
  } catch (error) {
    console.error('❌ Erro ao criar solicitação:', error);
    return null;
  }
}

// Função principal para configurar o teste
async function setupInteractiveTest() {
  console.log('🚀 Configurando teste interativo...');

  // 1. Login do cliente
  const clientToken = await login('danylo@teste.com', '123456');
  if (!clientToken) {
    console.error('❌ Falha no login do cliente');
    return;
  }
  console.log('✅ Cliente logado');

  // 2. Login do prestador
  const providerToken = await login('provider@teste.com', '123456');
  if (!providerToken) {
    console.error('❌ Falha no login do prestador');
    return;
  }
  console.log('✅ Prestador logado');

  // 3. Criar solicitação em diferentes estados para teste
  console.log('\n📋 Criando solicitações de teste...');

  // Solicitação aceita (prestador pode atualizar status)
  await createTestRequest(clientToken, 'accepted');
  
  // Solicitação chegou no local
  await createTestRequest(clientToken, 'arrived');
  
  // Solicitação em andamento
  await createTestRequest(clientToken, 'in_progress');
  
  // Solicitação concluída (cliente pode avaliar)
  await createTestRequest(clientToken, 'completed');

  console.log('\n🎉 Configuração concluída!');
  console.log('\n📱 COMO TESTAR:');
  console.log('1. Abra o app no seu dispositivo');
  console.log('2. Faça login como:');
  console.log('   - Cliente: danylo@teste.com / 123456');
  console.log('   - Prestador: provider@teste.com / 123456');
  console.log('3. Procure pelos botões flutuantes:');
  console.log('   - 🔄 Botão azul (Prestador): Atualizar Status');
  console.log('   - ⭐ Botão azul (Cliente): Avaliar Prestador');
  console.log('4. Teste as funcionalidades interativas!');
  
  console.log('\n🔍 TOKENS PARA DEBUG:');
  console.log('Cliente:', clientToken.substring(0, 50) + '...');
  console.log('Prestador:', providerToken.substring(0, 50) + '...');
}

// Executar o setup
setupInteractiveTest().catch(console.error);
