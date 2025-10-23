# 🚀 Freelas Flutter App

App Flutter completo para o ecossistema Freelas - conectando clientes e prestadores de serviços, funcionando como o Uber.

## 📱 Funcionalidades

### 👤 Para Clientes
- ✅ **Autenticação** - Login/registro seguro
- ✅ **Busca de Serviços** - Categorias organizadas
- ✅ **Mapa Interativo** - Visualização de prestadores próximos
- ✅ **Solicitação de Serviços** - Criação e acompanhamento
- 🔄 **Rastreamento em Tempo Real** - Localização do prestador
- 🔄 **Pagamentos Stripe** - Processamento seguro
- 🔄 **Chat em Tempo Real** - Comunicação direta
- 🔄 **Avaliações** - Sistema de rating
- 🔄 **Histórico** - Serviços anteriores

### 👷 Para Prestadores
- ✅ **Dashboard Completo** - Visão geral dos ganhos
- ✅ **Status Online/Offline** - Controle de disponibilidade
- ✅ **Solicitações** - Aceitar/recusar serviços
- ✅ **Mapa de Navegação** - Rota até o cliente
- 🔄 **Atualização de Status** - Progresso do serviço
- 🔄 **Ganhos Detalhados** - Relatórios financeiros
- 🔄 **Perfil Profissional** - Portfólio e avaliações

### 🔧 Recursos Técnicos
- ✅ **Arquitetura Limpa** - Separação de responsabilidades
- ✅ **State Management** - Riverpod para gerenciamento de estado
- ✅ **Navegação** - GoRouter para roteamento
- ✅ **Armazenamento** - Hive para persistência local
- ✅ **API Integration** - Dio + Retrofit para HTTP
- ✅ **Mapas** - Google Maps integrado
- 🔄 **WebSocket** - Socket.IO para tempo real
- 🔄 **Push Notifications** - Firebase Cloud Messaging
- 🔄 **Pagamentos** - Stripe Flutter SDK

## 🏗️ Arquitetura

```
lib/
├── core/                    # Configurações e serviços centrais
│   ├── config/             # Configurações da app
│   ├── router/             # Roteamento
│   ├── services/           # Serviços compartilhados
│   └── theme/              # Tema e estilos
├── features/               # Funcionalidades por domínio
│   ├── auth/               # Autenticação
│   ├── client/             # Funcionalidades do cliente
│   ├── provider/           # Funcionalidades do prestador
│   ├── splash/             # Tela inicial
│   ├── payments/           # Sistema de pagamentos
│   ├── chat/               # Chat em tempo real
│   └── shared/             # Widgets compartilhados
└── main.dart               # Ponto de entrada
```

## 🚀 Como Executar

### Pré-requisitos
- Flutter 3.0+
- Dart 3.0+
- Android Studio / VS Code
- Conta Google Cloud (para Maps)
- Conta Firebase (para notificações)
- Conta Stripe (para pagamentos)

### 1. Clone o repositório
```bash
git clone <repository-url>
cd flutter_freelas
```

### 2. Instale as dependências
```bash
flutter pub get
```

### 3. Configure as APIs

#### Google Maps
1. Crie um projeto no [Google Cloud Console](https://console.cloud.google.com)
2. Ative a Maps SDK for Android/iOS
3. Crie uma API Key
4. Adicione a key em `lib/core/config/app_config.dart`:
```dart
static const String googleMapsApiKey = 'SUA_API_KEY_AQUI';
```

#### Firebase
1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Configure para Android/iOS
3. Baixe os arquivos de configuração:
   - `android/app/google-services.json`
   - `ios/Runner/GoogleService-Info.plist`
4. Execute: `flutterfire configure`

#### Stripe
1. Crie uma conta no [Stripe](https://stripe.com)
2. Obtenha as chaves de teste
3. Configure em `lib/core/config/app_config.dart`:
```dart
static const String stripePublishableKey = 'pk_test_...';
```

### 4. Configure o Backend
Certifique-se de que o backend está rodando:
```bash
# No diretório do projeto principal
docker-compose up
```

### 5. Execute o app
```bash
flutter run
```

## 🔧 Configuração de Desenvolvimento

### Ambiente Local
```dart
// lib/core/config/app_config.dart
static const bool isDevelopment = true;
static const String baseUrl = 'http://localhost:8000';
```

### Ambiente de Produção
```dart
// lib/core/config/app_config.dart
static const bool isDevelopment = false;
static const String baseUrl = 'https://sua-api.ngrok-free.app';
```

## 📦 Dependências Principais

### UI & Navigation
- `flutter_riverpod` - State management
- `go_router` - Roteamento
- `google_maps_flutter` - Mapas
- `cached_network_image` - Cache de imagens

### HTTP & API
- `dio` - Cliente HTTP
- `retrofit` - Geração de código para APIs
- `json_annotation` - Serialização JSON

### Storage & Persistence
- `hive` - Banco local
- `shared_preferences` - Preferências
- `path_provider` - Caminhos do sistema

### Real-time & Notifications
- `socket_io_client` - WebSocket
- `firebase_messaging` - Push notifications
- `flutter_local_notifications` - Notificações locais

### Payments & Media
- `flutter_stripe` - Pagamentos
- `image_picker` - Seleção de imagens
- `permission_handler` - Permissões

## 🎯 Fluxos Principais

### Fluxo do Cliente
1. **Login/Registro** → Autenticação
2. **Seleção de Categoria** → Escolha do serviço
3. **Visualização no Mapa** → Prestadores próximos
4. **Solicitação** → Criação do pedido
5. **Acompanhamento** → Status em tempo real
6. **Pagamento** → Processamento via Stripe
7. **Avaliação** → Feedback do serviço

### Fluxo do Prestador
1. **Login/Registro** → Autenticação
2. **Status Online** → Disponibilidade
3. **Recebimento** → Notificação de solicitação
4. **Aceitação** → Confirmação do serviço
5. **Navegação** → Rota até o cliente
6. **Execução** → Atualização de status
7. **Finalização** → Conclusão e pagamento

## 🔄 Integração com API v2

O app está totalmente integrado com a API v2 do backend:

### Endpoints Utilizados
- `POST /auth/login` - Login
- `POST /auth/register` - Registro
- `GET /providers/nearby` - Prestadores próximos
- `POST /requests` - Criar solicitação
- `PUT /requests/{id}/accept` - Aceitar serviço
- `POST /payments/create-intent` - Criar pagamento
- `GET /notifications` - Notificações

### WebSocket Events
- `new_request` - Nova solicitação
- `request_accepted` - Serviço aceito
- `location_updated` - Localização atualizada
- `request_completed` - Serviço finalizado

## 🧪 Testes

```bash
# Executar todos os testes
flutter test

# Testes com coverage
flutter test --coverage

# Testes de integração
flutter drive --target=test_driver/app.dart
```

## 📱 Build para Produção

### Android
```bash
flutter build apk --release
# ou
flutter build appbundle --release
```

### iOS
```bash
flutter build ios --release
```

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro de Maps**: Verifique se a API Key está configurada
2. **Erro de Firebase**: Confirme os arquivos de configuração
3. **Erro de Conexão**: Verifique se o backend está rodando
4. **Erro de Build**: Execute `flutter clean && flutter pub get`

### Logs Úteis
```bash
# Logs detalhados
flutter run --verbose

# Logs do dispositivo
flutter logs
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'Adiciona nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

---

**🎉 App Flutter completo integrado com API v2 - funcionando como o Uber!**
