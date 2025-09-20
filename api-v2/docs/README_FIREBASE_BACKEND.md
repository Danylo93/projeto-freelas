# 🔥 Backend Firebase Migration - API v2

Este documento descreve as mudanças implementadas no backend para suportar Firebase Realtime Database.

## 🚀 Mudanças Implementadas

### 1. **Novo Serviço Firebase**
- ✅ `firebase-service/` - Cliente Firebase para o backend
- ✅ `firebase_client.py` - Cliente principal com todas as operações
- ✅ `firebase_config.py` - Configuração flexível de credenciais
- ✅ Suporte a arquivo de credenciais ou variáveis de ambiente

### 2. **Serviços Atualizados**
- ✅ `request-service/main_firebase.py` - Versão com Firebase
- ✅ `provider-service/main_firebase.py` - Versão com Firebase
- ✅ Sincronização automática MongoDB ↔ Firebase
- ✅ Eventos Kafka mantidos para compatibilidade

### 3. **Docker & Infraestrutura**
- ✅ `docker-compose.yml` atualizado com Firebase service
- ✅ `migrate_to_firebase.py` - Script de migração automática
- ✅ Health checks para Firebase
- ✅ Configuração de ambiente flexível

## 📁 Estrutura de Dados Firebase

### **Requests**
```json
{
  "requests": {
    "{requestId}": {
      "id": "string",
      "clientId": "string",
      "category": "string",
      "description": "string",
      "address": "string",
      "clientLatitude": "number",
      "clientLongitude": "number",
      "price": "number",
      "status": "pending|offered|accepted|en_route|arrived|started|completed|cancelled",
      "providerId": "string",
      "providerName": "string",
      "providerRating": "number",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  }
}
```

### **Provider Locations**
```json
{
  "providerLocations": {
    "{providerId}": {
      "lat": "number",
      "lng": "number",
      "heading": "number",
      "updatedAt": "timestamp"
    }
  }
}
```

### **Offers**
```json
{
  "offers": {
    "{providerId}": {
      "{requestId}": {
        "requestId": "string",
        "providerId": "string",
        "price": "number",
        "message": "string",
        "estimatedTime": "number",
        "status": "pending|accepted|rejected",
        "createdAt": "timestamp",
        "acceptedAt": "timestamp",
        "rejectedAt": "timestamp"
      }
    }
  }
}
```

### **Users Status**
```json
{
  "users": {
    "{userId}": {
      "status": "online|offline",
      "lastSeen": "timestamp"
    }
  }
}
```

## 🔧 Configuração

### 1. **Variáveis de Ambiente**
Crie um arquivo `.env`:
```env
# Firebase Configuration
FIREBASE_DATABASE_URL=https://freelas-app-default-rtdb.firebaseio.com
FIREBASE_CREDENTIALS_PATH=/app/credentials/firebase-service-account.json

# Alternative: Use environment variables
FIREBASE_PROJECT_ID=freelas-app
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_CLIENT_ID=your_client_id

# MongoDB Configuration
MONGO_URL=mongodb://mongo:27017
DB_NAME=freelas

# Kafka Configuration
KAFKA_BOOTSTRAP=kafka:29092
```

### 2. **Credenciais Firebase**
#### Opção A: Arquivo de Credenciais
1. Baixe o arquivo de credenciais do Firebase Console
2. Coloque em `credentials/firebase-service-account.json`
3. Configure `FIREBASE_CREDENTIALS_PATH`

#### Opção B: Variáveis de Ambiente
1. Configure as variáveis no `.env`
2. O sistema usará automaticamente

#### Opção C: Application Default Credentials
1. Configure no ambiente de execução (GCP, etc.)
2. O sistema detectará automaticamente

### 3. **Regras de Segurança Firebase**
```json
{
  "rules": {
    "requests": {
      "$requestId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "providerLocations": {
      "$providerId": {
        ".read": "auth != null",
        ".write": "auth != null && $providerId == auth.uid"
      }
    },
    "offers": {
      "$providerId": {
        "$requestId": {
          ".read": "auth != null",
          ".write": "auth != null && ($providerId == auth.uid || root.child('requests').child($requestId).child('clientId').val() == auth.uid)"
        }
      }
    },
    "users": {
      "$userId": {
        ".read": "auth != null",
        ".write": "auth != null && $userId == auth.uid"
      }
    }
  }
}
```

## 🚀 Como Usar

### 1. **Migração Automática**
```bash
# Executar script de migração
python migrate_to_firebase.py

# Ou migrar manualmente
cp services/common/request-service/main_firebase.py services/common/request-service/main.py
cp services/common/provider-service/main_firebase.py services/common/provider-service/main.py
```

### 2. **Executar com Docker**
```bash
# Subir todos os serviços
docker-compose up --build

# Subir apenas Firebase service
docker-compose up firebase-service

# Ver logs do Firebase
docker-compose logs firebase-service
```

### 3. **Testar Conexão**
```bash
# Testar health check
curl http://localhost:8000/healthz

# Testar endpoint de request
curl -X POST http://localhost:8000/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"id":"test123","client_id":"user123","category":"plumbing","description":"Test","client_latitude":-23.5505,"client_longitude":-46.6333}'
```

## 📊 Endpoints Atualizados

### **Request Service**
- `POST /requests` - Cria request (MongoDB + Firebase)
- `PUT /requests/{id}/status` - Atualiza status (MongoDB + Firebase)
- `POST /requests/{id}/accept` - Aceita request (MongoDB + Firebase)
- `POST /requests/{id}/offer` - Cria oferta (Firebase)
- `POST /requests/{id}/client-accept` - Cliente aceita oferta

### **Provider Service**
- `PUT /providers/{id}/location` - Atualiza localização (MongoDB + Firebase)
- `PUT /providers/{id}/status` - Atualiza status (MongoDB + Firebase)
- `GET /providers/{id}/location` - Obtém localização do Firebase
- `POST /providers/{id}/status` - Status online/offline (Firebase)

## 🔄 Sincronização de Dados

### **Estratégia Híbrida**
1. **MongoDB** - Fonte principal de dados
2. **Firebase** - Dados em tempo real para o frontend
3. **Kafka** - Eventos para outros serviços

### **Fluxo de Sincronização**
```
Frontend Request → API Gateway → Service → MongoDB + Firebase → Kafka Event
```

### **Operações Firebase**
- ✅ `create_request()` - Cria request no Firebase
- ✅ `update_request_status()` - Atualiza status
- ✅ `update_provider_location()` - Atualiza localização
- ✅ `create_offer()` - Cria oferta
- ✅ `update_offer_status()` - Atualiza status da oferta
- ✅ `set_provider_online_status()` - Status online/offline

## 🐛 Troubleshooting

### 1. **Erro de Conexão Firebase**
```bash
# Verificar logs
docker-compose logs firebase-service

# Verificar credenciais
docker exec -it firebase-service python -c "from firebase_service.firebase_client import firebase_client; print('Firebase OK')"
```

### 2. **Erro de Permissões**
- Verificar regras de segurança do Firebase
- Verificar se as credenciais têm permissões adequadas
- Verificar se o projeto Firebase está ativo

### 3. **Dados Não Sincronizados**
- Verificar logs dos serviços
- Verificar se o Firebase está acessível
- Verificar se as operações estão sendo executadas

## 📈 Performance

### **Otimizações Implementadas**
- ✅ Operações assíncronas
- ✅ Throttling de atualizações de localização
- ✅ Cache de credenciais Firebase
- ✅ Health checks automáticos

### **Métricas Recomendadas**
- Latência Firebase: < 100ms
- Taxa de sucesso: > 99%
- Tempo de sincronização: < 500ms
- Uso de memória: < 200MB por serviço

## 🔮 Próximos Passos

1. **Monitoramento** - Adicionar métricas e alertas
2. **Cache** - Implementar cache Redis para Firebase
3. **Retry Logic** - Adicionar retry automático para falhas
4. **Batch Operations** - Otimizar operações em lote
5. **Offline Support** - Suporte offline com sincronização

## 📝 Notas Importantes

- O Firebase é usado apenas para dados em tempo real
- MongoDB continua sendo a fonte principal de dados
- Kafka mantém compatibilidade com outros serviços
- A migração é gradual e não quebra funcionalidades existentes
- Todos os endpoints mantêm compatibilidade com versões anteriores
