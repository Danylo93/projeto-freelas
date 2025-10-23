# FreelasApp - Frontend Mobile

Aplicativo mobile desenvolvido com Expo/React Native, replicando todas as funcionalidades do projeto Android.

## 🚀 Funcionalidades

### ✅ Implementadas

- **Sistema de Autenticação**
  - Login e registro de usuários
  - Diferenciação entre Cliente e Prestador
  - Gerenciamento de estado com Zustand

- **Tela do Cliente**
  - Mapa interativo com localização
  - Seleção de categorias de serviço
  - Solicitação de serviços
  - Sistema de pagamento integrado

- **Tela do Prestador**
  - Dashboard com estatísticas
  - Controle online/offline
  - Visualização de ganhos
  - Informações do veículo

- **Sistema de Pagamento**
  - Múltiplos métodos de pagamento (PIX, Cartão, Dinheiro)
  - Processamento simulado
  - Histórico de transações

- **Rastreamento em Tempo Real**
  - Mapa com animações
  - Simulação de movimento do veículo
  - Informações do motorista
  - Instruções de navegação

- **Sistema de Avaliação**
  - Avaliação por estrelas
  - Categorias contextuais
  - Comentários opcionais
  - Feedback visual

- **Animações e UX**
  - Transições suaves
  - Animações de entrada
  - Feedback visual
  - Design responsivo

## 🛠 Tecnologias

- **Expo** - Framework React Native
- **React Native** - Desenvolvimento mobile
- **TypeScript** - Tipagem estática
- **Zustand** - Gerenciamento de estado
- **React Native Maps** - Mapas e geolocalização
- **React Native Reanimated** - Animações
- **Expo Location** - Geolocalização
- **React Native Paper** - Componentes Material Design
- **React Native Elements** - Componentes UI

## 📱 Telas

1. **Splash Screen** - Tela de inicialização com animações
2. **Auth Screen** - Login e registro
3. **Client Home** - Tela principal do cliente
4. **Payment Screen** - Processamento de pagamento
5. **Tracking Screen** - Acompanhamento em tempo real
6. **Rating Screen** - Avaliação do serviço
7. **Provider Home** - Dashboard do prestador

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+
- Expo CLI
- Android Studio (para Android)
- Xcode (para iOS)

### Instalação

```bash
# Instalar dependências
npm install

# Iniciar o projeto
npm start

# Executar no Android
npm run android

# Executar no iOS
npm run ios

# Executar no Web
npm run web
```

## 📁 Estrutura do Projeto

```
frontend/
├── app/                    # Telas do Expo Router
│   ├── _layout.tsx         # Layout principal
│   ├── splash.tsx          # Tela de splash
│   ├── auth.tsx           # Autenticação
│   ├── client.tsx         # Tela do cliente
│   ├── provider.tsx       # Tela do prestador
│   ├── payment.tsx        # Pagamento
│   ├── tracking.tsx       # Rastreamento
│   └── rating.tsx         # Avaliação
├── src/
│   ├── types/             # Tipos TypeScript
│   ├── stores/            # Stores Zustand
│   └── components/        # Componentes reutilizáveis
├── assets/                # Recursos (imagens, fontes)
└── package.json          # Dependências
```

## 🎨 Design System

### Cores
- **Primária**: #2196F3 (Azul)
- **Secundária**: #4CAF50 (Verde)
- **Erro**: #F44336 (Vermelho)
- **Sucesso**: #4CAF50 (Verde)
- **Aviso**: #FF9800 (Laranja)

### Tipografia
- **Títulos**: 24px, Bold
- **Subtítulos**: 18px, Medium
- **Corpo**: 16px, Regular
- **Legendas**: 14px, Regular

## 🔧 Configurações

### Permissões
- **Localização**: Necessária para mapas e rastreamento
- **Câmera**: Para fotos de perfil
- **Notificações**: Para alertas de serviço

### APIs
- **Google Maps**: Para mapas e geolocalização
- **Expo Location**: Para acesso à localização
- **AsyncStorage**: Para persistência local

## 📱 Funcionalidades por Tela

### Cliente
- ✅ Visualização de mapa
- ✅ Seleção de categoria de serviço
- ✅ Solicitação de serviço
- ✅ Processamento de pagamento
- ✅ Acompanhamento em tempo real
- ✅ Avaliação do serviço

### Prestador
- ✅ Dashboard com estatísticas
- ✅ Controle de status online/offline
- ✅ Visualização de ganhos
- ✅ Informações do veículo
- ✅ Horários de trabalho

## 🚀 Próximos Passos

- [ ] Integração com backend real
- [ ] Notificações push
- [ ] Chat em tempo real
- [ ] Histórico de corridas
- [ ] Perfil do usuário
- [ ] Configurações avançadas

## 📄 Licença

Este projeto é privado e proprietário.

## 👥 Equipe

Desenvolvido com ❤️ pela equipe FreelasApp