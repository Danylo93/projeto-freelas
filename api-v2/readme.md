# 🚀 API v2 - Backend Freelas Uber-like

Backend moderno com arquitetura de microserviços, integração Firebase Realtime Database e sincronização híbrida MongoDB + Firebase.

## 🏗️ Arquitetura

```
Frontend (React Native) ←→ Firebase Realtime Database ←→ Backend (Python)
                                ↓
                           MongoDB (Principal)
                                ↓
                            Kafka (Eventos)
```

## 🚀 Início Rápido

### 1. Instalação
```bash
# Instalar dependências
pip install firebase-admin python-dotenv fastapi uvicorn

# Configurar credenciais Firebase
cp config/firebase-credentials-example.json config/firebase-credentials.json
# Editar com suas credenciais reais
```

### 2. Executar
```bash
# Teste de conexão
python scripts/test-firebase-backend.py

# Executar com Docker
docker-compose up --build

# Executar individualmente
python services/common/request-service/main.py
python services/common/provider-service/main.py
```

## 📁 Estrutura

```
api-v2/
├── services/common/           # Microserviços
│   ├── firebase-service/     # Cliente Firebase
│   ├── request-service/      # Gerenciamento de solicitações
│   ├── provider-service/     # Gerenciamento de prestadores
│   └── ...
├── docs/                     # Documentação
├── scripts/                  # Scripts utilitários
├── config/                   # Configurações
├── tests/                    # Testes
└── logs/                     # Logs
```

## 🔥 Firebase Integration

### Configuração
- **Database URL**: `https://uber-like-freelas-default-rtdb.firebaseio.com`
- **Credenciais**: Configurar em `config/firebase-credentials.json`
- **Sincronização**: Híbrida MongoDB + Firebase

### Funcionalidades
- ✅ Tempo real com Firebase Realtime Database
- ✅ Sincronização automática MongoDB ↔ Firebase
- ✅ Eventos Kafka mantidos para compatibilidade
- ✅ Cleanup automático de listeners

## 🐳 Docker

```bash
# Executar todos os serviços
docker-compose up --build

# Executar apenas Firebase
docker-compose up firebase-service

# Ver logs
docker-compose logs -f
```

## 📊 Monitoramento

- **Health Checks**: Configurados para todos os serviços
- **Logs**: Centralizados em `logs/`
- **Métricas**: Via Firebase Analytics

## 🔧 Desenvolvimento

### Adicionar novo serviço
1. Criar diretório em `services/common/`
2. Implementar `main.py`
3. Adicionar ao `docker-compose.yml`
4. Configurar health check

### Testes
```bash
# Teste de conexão Firebase
python scripts/test-firebase-backend.py

# Teste de migração
python scripts/migrate_to_firebase.py
```

## 📚 Documentação

- [Firebase Backend](docs/README_FIREBASE_BACKEND.md)
- [Configuração Firebase](docs/firebase-config-updated.md)
- [Instruções de Setup](docs/FIREBASE_SETUP_INSTRUCTIONS.md)

## 🎯 Status

- ✅ **Firebase Integration**: 100% completo
- ✅ **Microserviços**: 100% migrados
- ✅ **Docker**: 100% configurado
- ✅ **Clean Code**: 100% aplicado

## 🚀 Próximos Passos

1. Configurar credenciais Firebase reais
2. Executar `docker-compose up --build`
3. Testar integração com frontend
4. Configurar monitoramento em produção

---

**Desenvolvido com ❤️ para o projeto Freelas Uber-like**
