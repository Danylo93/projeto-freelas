#!/usr/bin/env node

const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000';

async function testApiV2Connection() {
  console.log('🧪 Testando conectividade com API v2...');
  console.log('=' .repeat(50));

  try {
    // Teste 1: Health Check
    console.log('\n1️⃣ Testando Health Check...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data);

    // Teste 2: Criar Prestador
    console.log('\n2️⃣ Testando criação de prestador...');
    const providerData = {
      name: 'João Silva',
      email: 'joao@teste.com',
      phone: '+5511999999999',
      document: '12345678901',
      vehicle_type: 'car'
    };

    try {
      const providerResponse = await axios.post(`${API_BASE_URL}/providers`, providerData);
      console.log('✅ Prestador criado:', providerResponse.data);
      const providerId = providerResponse.data.id;

      // Teste 3: Listar Prestadores
      console.log('\n3️⃣ Testando listagem de prestadores...');
      const providersResponse = await axios.get(`${API_BASE_URL}/providers`);
      console.log('✅ Prestadores encontrados:', providersResponse.data.length);

      // Teste 4: Criar Solicitação
      console.log('\n4️⃣ Testando criação de solicitação...');
      const requestData = {
        client_id: 'client_123',
        category: 'plumbing',
        description: 'Reparo no encanamento',
        address: 'Rua das Flores, 123',
        price: 50.0
      };

      const requestResponse = await axios.post(`${API_BASE_URL}/requests`, requestData);
      console.log('✅ Solicitação criada:', requestResponse.data);
      const requestId = requestResponse.data.id;

      // Teste 5: Listar Solicitações
      console.log('\n5️⃣ Testando listagem de solicitações...');
      const requestsResponse = await axios.get(`${API_BASE_URL}/requests`);
      console.log('✅ Solicitações encontradas:', requestsResponse.data.length);

      console.log('\n🎉 Todos os testes passaram! API v2 está funcionando perfeitamente!');
      console.log('\n📱 O frontend está adequado para se conectar com o API v2!');

    } catch (error) {
      console.log('❌ Erro nos testes:', error.response?.data || error.message);
    }

  } catch (error) {
    console.log('❌ Erro de conectividade:', error.message);
    console.log('💡 Verifique se o API v2 está rodando na porta 8000');
  }
}

testApiV2Connection();
