# FreelasApp - Android

Aplicativo Android desenvolvido em Kotlin para conectar clientes e prestadores de serviços, baseado no design e funcionalidades do aplicativo 99.

## 🚀 Funcionalidades

### Para Clientes
- **Autenticação**: Login e cadastro com seleção de tipo de usuário
- **Geolocalização**: Localização atual e seleção de destino
- **Mapas Dinâmicos**: Integração com Google Maps com animações em tempo real
- **Direções e Rotas**: Cálculo de rotas com polylines animadas
- **Acompanhamento de Veículo**: Tracking em tempo real com marcador animado
- **Seleção de Serviços**: Múltiplas opções (FreelasPop, FreelasTaxi, FreelasMoto, etc.)
- **Sistema de Ofertas**: Criação de ofertas personalizadas (FreelasNegocia)
- **Aceitação de Ofertas**: Recebimento e aceitação de contra-ofertas dos prestadores
- **Acompanhamento em Tempo Real**: Status dinâmico dos serviços com animações
- **Instruções de Navegação**: Guias passo a passo durante o trajeto
- **Chamada para Motorista**: Botão de chamada direta
- **Avaliação de Serviços**: Sistema completo de avaliações e comentários

### Para Prestadores
- **Autenticação**: Login e cadastro como prestador
- **Status de Disponibilidade**: Toggle online/offline com animações
- **Recepção de Solicitações**: Visualização de novas solicitações em tempo real
- **Sistema de Contra-ofertas**: Criação de contra-ofertas para clientes
- **Navegação Inteligente**: Rotas otimizadas para busca e entrega
- **Acompanhamento de Trajeto**: Tracking em tempo real durante o serviço
- **Gerenciamento de Serviços**: Aceitar, iniciar e concluir serviços com status dinâmico
- **Ganhos Detalhados**: Visualização de ganhos diários, semanais e mensais
- **Avaliações**: Sistema de avaliações dos serviços concluídos
- **Chamada para Cliente**: Comunicação direta com clientes

## 🏗️ Arquitetura

O projeto segue os princípios de **Clean Architecture** e **MVVM**:

```
app/
├── data/
│   ├── model/          # Modelos de dados
│   ├── network/        # API e serviços de rede
│   ├── local/          # Armazenamento local (SharedPreferences)
│   └── repository/     # Repositórios para abstração de dados
├── ui/
│   ├── auth/           # Telas de autenticação
│   ├── client/         # Telas do cliente
│   ├── provider/       # Telas do prestador
│   ├── navigation/     # Navegação da aplicação
│   └── theme/          # Temas e estilos
├── di/                 # Injeção de dependências (Hilt)
└── service/            # Serviços (Firebase, etc.)
```

## 🛠️ Tecnologias Utilizadas

- **Kotlin** - Linguagem principal
- **Jetpack Compose** - UI moderna e declarativa
- **Hilt** - Injeção de dependências
- **Retrofit** - Cliente HTTP para APIs
- **Google Maps** - Integração com mapas
- **Firebase** - Notificações push
- **Coroutines** - Programação assíncrona
- **Material Design 3** - Design system

## 📱 Telas Implementadas

### Autenticação
- **Tela de Login/Cadastro**: Seleção de tipo de usuário (Cliente/Prestador)
- **Validação de Formulários**: Validação em tempo real
- **Gerenciamento de Estado**: Autenticação persistente

### Cliente
- **Tela Principal**: Mapa integrado com seleção de origem/destino
- **Seleção de Serviços**: Cards animados com opções (FreelasPop, FreelasTaxi, etc.)
- **Sistema de Ofertas**: Criação de ofertas personalizadas (FreelasNegocia)
- **Aguardando Prestadores**: Tela de busca com animações
- **Recebimento de Ofertas**: Lista de contra-ofertas com aceitação/rejeição
- **🆕 Tela de Acompanhamento**: Tracking em tempo real do veículo
  - Mapa animado com polylines em movimento
  - Marcador do veículo com rotação dinâmica
  - Informações de tempo e distância restante
  - Instruções de navegação passo a passo
  - Botão de chamada para o motorista
  - Cancelamento de corrida

### Prestador
- **Tela Principal**: Mapa com status de disponibilidade animado
- **Ganhos**: Cards com estatísticas detalhadas
- **Solicitações**: Lista de novas solicitações em tempo real
- **Serviços Ativos**: Gerenciamento com navegação integrada
- **Ofertas**: Sistema de contra-ofertas dinâmico
- **🆕 Tela de Execução**: Acompanhamento durante o serviço
  - Navegação para localização do cliente
  - Marcação de chegada
  - Início da viagem
  - Navegação para destino
  - Conclusão do serviço
  - Comunicação com cliente

## 🎨 Design

O design é inspirado no aplicativo 99, com:
- **Cores**: Amarelo primário (#FFD700) e azul (#1976D2)
- **Tipografia**: Fonte Inter para melhor legibilidade
- **Componentes**: Cards arredondados e botões destacados
- **Layout**: Design responsivo e intuitivo

## 🔧 Configuração

### Pré-requisitos
- Android Studio Hedgehog ou superior
- SDK Android 24+ (Android 7.0)
- Google Maps API Key
- Firebase project configurado

### Instalação

1. Clone o repositório
2. Configure sua Google Maps API Key em `local.properties`:
   ```
   MAPS_API_KEY=sua_api_key_aqui
   ```

3. Configure o arquivo `google-services.json` do Firebase

4. Execute o projeto:
   ```bash
   ./gradlew assembleDebug
   ```

## 🌐 API

O aplicativo consome a API REST do backend FastAPI:
- Base URL: `http://10.0.2.2:8000/api/` (emulador)
- Autenticação via JWT Bearer Token
- Endpoints para serviços, ofertas, prestadores e localização

## 📋 Permissões

O aplicativo requer as seguintes permissões:
- `ACCESS_FINE_LOCATION` - Localização precisa
- `ACCESS_COARSE_LOCATION` - Localização aproximada
- `CAMERA` - Validação de serviços
- `READ_EXTERNAL_STORAGE` - Acesso a fotos
- `POST_NOTIFICATIONS` - Notificações push

## ✨ **Funcionalidades Avançadas Implementadas**

### 🗺️ **Mapas e Navegação**
- **Polylines Animadas**: Rotas que se desenham em tempo real
- **Marcadores Dinâmicos**: Veículos que rotacionam conforme a direção
- **Tracking em Tempo Real**: Atualização contínua da posição
- **Instruções de Navegação**: Guias passo a passo durante o trajeto
- **Simulação de Movimento**: Animação realista do veículo
- **Estados de Serviço**: Transições visuais entre diferentes fases

### 📱 **Animações e UX**
- **Transições Suaves**: Animações entre telas e estados
- **Indicadores de Loading**: Feedback visual durante operações
- **Pulsing Effects**: Indicadores de status com pulsação
- **Scale Animations**: Efeitos de escala para elementos interativos
- **Progress Indicators**: Barras de progresso animadas

### 🔄 **Tempo Real**
- **WebSocket Integration**: Comunicação em tempo real
- **Location Updates**: Atualizações contínuas de localização
- **Status Synchronization**: Sincronização de estados entre clientes
- **Live Notifications**: Notificações instantâneas

## 🚀 Funcionalidades Futuras

- [x] ~~Sistema de direções e rotas animadas~~
- [x] ~~Acompanhamento de veículo em tempo real~~
- [x] ~~Animações dinâmicas do mapa~~
- [x] ~~Polylines animadas~~
- [x] ~~Marcadores animados~~
- [x] ~~Tracking em tempo real~~
- [ ] Chat em tempo real entre cliente e prestador
- [ ] Pagamentos integrados (PIX, cartão)
- [ ] Sistema de avaliações detalhado
- [ ] Histórico de serviços
- [ ] Modo escuro
- [ ] Múltiplos idiomas
- [ ] Suporte offline
- [ ] Integração com Google Directions API real
- [ ] Otimização de rotas em tempo real
- [ ] Previsão de tráfego

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👥 Equipe

Desenvolvido como parte do ecossistema FreelasApp para conectar clientes e prestadores de serviços de forma eficiente e moderna.
