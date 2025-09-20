# 🔥 Instruções de Configuração do Firebase

## ✅ Configurações Atualizadas

As configurações do Firebase foram atualizadas com as credenciais reais do projeto `uber-like-freelas`.

### **Frontend (React Native/Expo)**
- ✅ `app.json` atualizado com credenciais reais
- ✅ `utils/firebase.ts` configurado
- ✅ Todas as configurações sincronizadas

### **Backend (Python/FastAPI)**
- ✅ `firebase_config.py` atualizado
- ✅ URL do banco de dados corrigida
- ✅ Configurações de projeto atualizadas

## 🚀 Próximos Passos

### 1. **Configurar Regras de Segurança no Firebase Console**

1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Selecione o projeto `uber-like-freelas`
3. Vá para **Realtime Database** → **Rules**
4. Substitua as regras por:

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
    },
    "test": {
      ".read": true,
      ".write": true
    }
  }
}
```

### 2. **Configurar Credenciais do Backend**

#### Opção A: Arquivo de Credenciais
1. No Firebase Console, vá para **Project Settings** → **Service Accounts**
2. Clique em **Generate New Private Key**
3. Baixe o arquivo JSON
4. Coloque em `api-v2/credentials/firebase-service-account.json`
5. Configure no `.env`:
```env
FIREBASE_CREDENTIALS_PATH=/app/credentials/firebase-service-account.json
```

#### Opção B: Variáveis de Ambiente
Configure no `.env` do backend:
```env
FIREBASE_DATABASE_URL=https://uber-like-freelas-default-rtdb.firebaseio.com
FIREBASE_PROJECT_ID=uber-like-freelas
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_CLIENT_ID=your_client_id
```

### 3. **Testar Conexão**

#### Frontend
```bash
cd frontend
node test-firebase-connection.js
```

#### Backend
```bash
cd api-v2
python test-firebase-backend.py
```

### 4. **Executar Aplicação**

#### Frontend
```bash
cd frontend
npm install
npx expo start
```

#### Backend
```bash
cd api-v2
# Configurar .env com credenciais Firebase
docker-compose up --build
```

## 📊 Estrutura de Dados Firebase

### **Requests**
```
requests/{requestId}/
├── id, clientId, category, description, address
├── clientLatitude, clientLongitude, price
├── status, providerId, providerName, providerRating
└── createdAt, updatedAt
```

### **Provider Locations**
```
providerLocations/{providerId}/
├── lat, lng, heading
└── updatedAt
```

### **Offers**
```
offers/{providerId}/{requestId}/
├── requestId, providerId, price, message
├── status, estimatedTime
└── createdAt, acceptedAt, rejectedAt
```

### **Users Status**
```
users/{userId}/
├── status (online/offline)
└── lastSeen
```

## 🔧 Configurações Finais

### **Frontend (app.json)**
```json
{
  "extra": {
    "firebaseApiKey": "AIzaSyC7XUJDG7PXB3YUiSyh0WMbbqeiR81zNlg",
    "firebaseAuthDomain": "uber-like-freelas.firebaseapp.com",
    "firebaseDatabaseURL": "https://uber-like-freelas-default-rtdb.firebaseio.com",
    "firebaseProjectId": "uber-like-freelas",
    "firebaseStorageBucket": "uber-like-freelas.firebasestorage.app",
    "firebaseMessagingSenderId": "901683796826",
    "firebaseAppId": "1:901683796826:web:6db0585afabdf5e8383163",
    "firebaseMeasurementId": "G-04R96TSGKK"
  }
}
```

### **Backend (.env)**
```env
FIREBASE_DATABASE_URL=https://uber-like-freelas-default-rtdb.firebaseio.com
FIREBASE_PROJECT_ID=uber-like-freelas
FIREBASE_CREDENTIALS_PATH=/app/credentials/firebase-service-account.json
```

## 🎯 Testes de Validação

1. **Conexão Firebase** - Verificar se consegue conectar
2. **Escrita de Dados** - Testar criação de requests
3. **Leitura de Dados** - Verificar sincronização
4. **Tempo Real** - Testar atualizações em tempo real
5. **Regras de Segurança** - Validar permissões

## 🚨 Troubleshooting

### **Erro de Conexão**
- Verificar se o projeto Firebase está ativo
- Confirmar se as credenciais estão corretas
- Verificar se as regras de segurança permitem acesso

### **Erro de Permissões**
- Verificar regras de segurança no Firebase Console
- Confirmar se o usuário está autenticado
- Verificar se as credenciais têm permissões adequadas

### **Dados Não Sincronizados**
- Verificar logs do Firebase
- Confirmar se as operações estão sendo executadas
- Verificar se há erros de rede

## ✅ Checklist Final

- [ ] Regras de segurança configuradas
- [ ] Credenciais do backend configuradas
- [ ] Teste de conexão frontend executado
- [ ] Teste de conexão backend executado
- [ ] Aplicação frontend executando
- [ ] Aplicação backend executando
- [ ] Dados sincronizando em tempo real
- [ ] Animações funcionando
- [ ] Bottom sheets responsivos
- [ ] TabBar colada no rodapé

## 🎉 Resultado Esperado

Após seguir todas as instruções, você deve ter:
- ✅ Firebase Realtime Database funcionando
- ✅ Frontend e backend sincronizados
- ✅ Animações suaves no mapa
- ✅ Interface moderna e responsiva
- ✅ Sistema de tempo real robusto

A migração estará 100% completa e funcional! 🚀
