# 🚀 Guia Completo - Freelas API v2 Complete

## 📋 Pré-requisitos

1. **Insomnia REST Client** instalado
2. **Backend rodando** (`docker-compose up`)
3. **Stripe configurado** com chaves de teste (para pagamentos)
4. **Ngrok** (opcional, para produção)

## 📥 Importar Coleção

1. Abra o Insomnia
2. Clique em **"Import/Export"** → **"Import Data"**
3. Selecione o arquivo `insomnia_freelas_complete.json`
4. A coleção **"🚀 Freelas - API v2 Complete"** será importada

## 🌍 Ambientes Disponíveis

### **🌍 Base Environment**
- Configurações compartilhadas entre todos os ambientes
- Variáveis de autenticação, samples e estrutura de serviços

### **Local Development** (Azul)
- `base_url`: `http://localhost:8000`
- Para desenvolvimento local padrão

### **🐳 Local (Docker)** (Verde)
- `base_url`: `http://localhost:8000`
- Para desenvolvimento local com Docker

### **Production** (Vermelho)
- `base_url`: `https://a09f89583882.ngrok-free.app`
- Para testes em produção com ngrok (atualize a URL conforme necessário)

## 🏗️ Estrutura da Coleção

### **🌐 Gateway HTTP**
Todos os endpoints através do API Gateway (porta 8000)

#### **🔐 Authentication**
- `1️⃣ Register Client` - Registra novo cliente
- `2️⃣ Login Client` - Login do cliente
- `3️⃣ Register Provider` - Registra novo prestador  
- `4️⃣ Login Provider` - Login do prestador

#### **👷 Providers**
- `5️⃣ Create Provider Profile` - Cria perfil do prestador
- `📋 Get Provider Profile` - Obtém perfil
- `🔄 Update Provider Status` - Atualiza status (online/offline)
- `📍 List Nearby Providers` - Lista prestadores próximos

#### **📋 Requests**
- `6️⃣ Create Service Request` - Cliente cria solicitação
- `🔍 Get Request Details` - Detalhes da solicitação
- `7️⃣ Accept Request (Provider)` - Prestador aceita
- `🔄 Update Request Status` - Atualiza status
- `✅ Complete Service` - Finaliza serviço

#### **💳 Payments**
- `8️⃣ Create Payment Intent` - Cria intenção de pagamento
- `9️⃣ Confirm Payment` - Confirma pagamento
- `💳 List Payment Methods` - Lista métodos de pagamento
- `💰 Get Payment Status` - Status do pagamento
- `❌ Cancel Payment` - Cancela pagamento

#### **🎯 Matching**
- `🔍 Find Providers` - Busca prestadores para solicitação
- `📋 Get Active Request` - Obtém solicitação ativa

#### **🔔 Notifications**
- `📤 Send Notification` - Envia notificação
- `📥 Get User Notifications` - Lista notificações

#### **⚙️ Admin**
- `📊 System Stats` - Estatísticas do sistema
- `👥 List All Users` - Lista todos os usuários

### **🔧 Serviços Diretos**
Acesso direto aos microserviços (para debug)

## 🔄 Fluxo Completo de Teste

### **FASE 1: Configuração Inicial**

1. **Selecionar Ambiente**: Escolha `Local Development`, `🐳 Local (Docker)` ou `Production`

2. **Register Client**: Execute e copie `user_id` para `samples.client.user_id`

3. **Login Client**: Execute e copie `token` para `auth.client_token`

4. **Register Provider**: Execute e copie `user_id` para `samples.provider.user_id`

5. **Login Provider**: Execute e copie `token` para `auth.provider_token`

6. **Create Provider Profile**: Execute e copie `id` para `samples.provider.provider_id`

### **FASE 2: Fluxo de Serviço**

7. **Create Service Request**: Execute e copie `id` para `samples.request.id`

8. **Find Providers**: Busca prestadores disponíveis

9. **Accept Request (Provider)**: Prestador aceita a solicitação

### **FASE 3: Fluxo de Pagamento**

10. **Create Payment Intent**: Execute e copie `id` para `samples.payment.intent_id`

11. **Confirm Payment**: Confirma o pagamento

12. **Get Payment Status**: Verifica se foi aprovado

### **FASE 4: Execução e Finalização**

13. **Update Request Status**: Marca como "in_progress"

14. **Send Notification**: Notifica cliente sobre progresso

15. **Complete Service**: Finaliza o serviço

16. **Get User Notifications**: Verifica notificações

## 🎯 Cenários de Teste

### **✅ Fluxo Feliz Completo**
1. Registrar cliente e prestador
2. Criar solicitação de serviço
3. Buscar e aceitar prestador
4. Processar pagamento
5. Executar serviço
6. Finalizar e notificar

### **❌ Cenários de Erro**
- **Pagamento recusado**: Use cartão de teste `4000000000000002`
- **Prestador indisponível**: Teste sem prestadores online
- **Token inválido**: Teste com tokens expirados
- **Serviço não encontrado**: Use IDs inexistentes

## 🔧 Configuração de Variáveis

### **Tokens de Autenticação**
```json
{
  "auth": {
    "client_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "provider_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "admin_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
}
```

### **IDs de Recursos**
```json
{
  "samples": {
    "client": { "user_id": "uuid-do-cliente" },
    "provider": { 
      "user_id": "uuid-do-prestador",
      "provider_id": "uuid-do-perfil-prestador"
    },
    "request": { "id": "uuid-da-solicitacao" },
    "payment": { "intent_id": "pi_stripe_id" }
  }
}
```

## 🚨 Troubleshooting

### **Erro 401 - Unauthorized**
- Verifique se o token está correto
- Refaça o login se necessário

### **Erro 404 - Not Found**
- Confirme se os IDs estão corretos nas variáveis
- Verifique se o recurso foi criado anteriormente

### **Erro 500 - Internal Server Error**
- Verifique se o backend está rodando
- Confira os logs: `docker-compose logs -f`

### **Erro de Conexão**
- **Local**: Confirme se Docker está rodando
- **Produção**: Verifique se ngrok está ativo e URL está correta

## 📊 Monitoramento

Durante os testes, monitore:

1. **Logs do Backend**: `docker-compose logs -f`
2. **Banco MongoDB**: Verifique as collections
3. **Stripe Dashboard**: Acompanhe pagamentos de teste
4. **Kafka**: Monitore mensagens entre serviços

---

**🎉 Agora você tem acesso completo a TODOS os serviços do ecossistema Freelas!**
