# 🚀 Guia Completo - Teste do Fluxo de Pagamento

## 📋 Pré-requisitos

1. **Insomnia REST Client** instalado
2. **Backend rodando** (docker-compose up)
3. **Stripe configurado** com chaves de teste
4. **Ngrok** ou URL pública do backend

## 📥 Importar Coleção

1. Abra o Insomnia
2. Clique em **"Import/Export"** → **"Import Data"**
3. Selecione o arquivo `insomnia_payment_flow.json`
4. A coleção **"🚀 Freelas - Payment Flow Complete"** será importada

## 🌍 Configurar Environment

Antes de testar, configure as variáveis no environment **"🌍 Base Environment"**:

```json
{
  "base_url": "http://192.168.100.8:8000",
  "client_email": "joao.cliente@exemplo.com",
  "client_password": "123456",
  "provider_email": "joao.eletricista@exemplo.com",
  "provider_password": "123456"
}
```

**⚠️ IMPORTANTE:** Substitua `192.168.100.8` pelo IP da sua máquina se for diferente.

## 🔄 Fluxo Completo de Teste

### **FASE 1: Configuração Inicial**

#### 1️⃣ **Register Client**
- **Endpoint:** `POST /api/auth/register`
- **Descrição:** Registra um novo cliente
- **Ação:** Execute e copie o `user_id` retornado para `client_user_id`

#### 2️⃣ **Login Client**
- **Endpoint:** `POST /api/auth/login`
- **Descrição:** Faz login e obtém token
- **Ação:** Execute e copie o `token` para `client_token`

#### 3️⃣ **Register Provider**
- **Endpoint:** `POST /api/auth/register`
- **Descrição:** Registra um prestador
- **Ação:** Execute e copie o `user_id` para `provider_user_id`

#### 4️⃣ **Login Provider**
- **Endpoint:** `POST /api/auth/login`
- **Descrição:** Login do prestador
- **Ação:** Execute e copie o `token` para `provider_token`

#### 5️⃣ **Create Provider Profile**
- **Endpoint:** `POST /api/providers`
- **Descrição:** Cria perfil do prestador
- **Ação:** Execute e copie o `id` retornado para `provider_id`

### **FASE 2: Fluxo de Serviço**

#### 6️⃣ **Create Service Request**
- **Endpoint:** `POST /api/requests`
- **Descrição:** Cliente solicita serviço
- **Ação:** Execute e copie o `id` para `request_id`

#### 7️⃣ **Accept Request (Provider)**
- **Endpoint:** `PUT /api/requests/{request_id}/accept`
- **Descrição:** Prestador aceita a solicitação
- **Resultado:** Status muda para "accepted"

### **FASE 3: Fluxo de Pagamento**

#### 8️⃣ **Create Payment Intent**
- **Endpoint:** `POST /api/payments/create-intent`
- **Descrição:** Cria intenção de pagamento (R$ 150,00)
- **Ação:** Execute e copie o `id` para `payment_intent_id`

#### 9️⃣ **List Payment Methods**
- **Endpoint:** `GET /api/payments/payment-methods`
- **Descrição:** Lista métodos de pagamento disponíveis
- **Resultado:** Mostra cartões e PIX disponíveis

#### 🔟 **Confirm Payment**
- **Endpoint:** `POST /api/payments/payment-intents/{id}/confirm`
- **Descrição:** Confirma o pagamento
- **Resultado:** Status "succeeded" = pagamento aprovado

### **FASE 4: Execução do Serviço**

#### 1️⃣1️⃣ **Update Request Status**
- **Endpoint:** `PUT /api/requests/{request_id}/status`
- **Body:** `{"status": "in_progress"}`
- **Descrição:** Marca serviço como em andamento

#### 1️⃣2️⃣ **Complete Service**
- **Endpoint:** `PUT /api/requests/{request_id}/status`
- **Body:** `{"status": "completed"}`
- **Descrição:** Finaliza o serviço

### **FASE 5: Verificações**

#### 🔍 **Get Request Details**
- **Endpoint:** `GET /api/requests/{request_id}`
- **Descrição:** Verifica status final da solicitação

#### 💰 **Get Payment Status**
- **Endpoint:** `GET /api/payments/payment-intents/{id}`
- **Descrição:** Confirma status do pagamento

## 🎯 Cenários de Teste

### **✅ Fluxo Feliz**
1. Registrar cliente e prestador
2. Criar solicitação de serviço
3. Prestador aceita
4. Cliente paga
5. Serviço é executado
6. Serviço é finalizado

### **❌ Cenários de Erro**
- **Pagamento recusado:** Use cartão de teste `4000000000000002`
- **Prestador indisponível:** Teste sem prestadores cadastrados
- **Token inválido:** Teste com token expirado

## 🔧 Troubleshooting

### **Erro 401 - Unauthorized**
- Verifique se o token está correto no header Authorization
- Refaça o login se necessário

### **Erro 404 - Not Found**
- Verifique se os IDs estão corretos nas variáveis
- Confirme se o recurso foi criado anteriormente

### **Erro 500 - Internal Server Error**
- Verifique se o backend está rodando
- Confira os logs do Docker

## 📊 Monitoramento

Durante os testes, monitore:

1. **Logs do Backend:** `docker-compose logs -f`
2. **Banco de dados:** Verifique as collections no MongoDB
3. **Stripe Dashboard:** Acompanhe os pagamentos de teste
4. **Kafka (se configurado):** Monitore as mensagens

## 🎉 Resultado Esperado

Ao final do fluxo completo, você deve ter:

- ✅ Cliente registrado e autenticado
- ✅ Prestador registrado e disponível
- ✅ Solicitação de serviço criada
- ✅ Pagamento processado com sucesso
- ✅ Serviço marcado como concluído
- ✅ Todos os status atualizados corretamente

---

**🚀 Agora você pode testar todo o fluxo de pagamento do app Freelas no Insomnia!**
