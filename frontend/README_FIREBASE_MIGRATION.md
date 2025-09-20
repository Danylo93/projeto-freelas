# Migração para Firebase Realtime Database

Este documento descreve as mudanças implementadas para migrar de Socket.IO/WebSocket para Firebase Realtime Database.

## 🚀 Mudanças Implementadas

### 1. Configuração do Firebase
- ✅ Instalação das dependências do Firebase
- ✅ Configuração do Firebase Realtime Database
- ✅ Contexto Firebase Realtime (`FirebaseRealtimeContext`)
- ✅ Hooks personalizados para facilitar o uso

### 2. Correções de UX/UI
- ✅ TabBar colada no rodapé (position absolute)
- ✅ Splash screen corrigido
- ✅ Componentes modernos com animações
- ✅ Bottom sheets responsivos
- ✅ Sistema de toast com haptic feedback

### 3. Componentes Criados
- ✅ `FirebaseAnimatedMapView` - Mapa com animações suaves
- ✅ `ModernBottomSheet` - Bottom sheet moderno
- ✅ `SearchingAnimation` - Animação de busca com Lottie
- ✅ `ModernToast` - Sistema de notificações
- ✅ `useInFlightGuard` - Hook para evitar loops

### 4. Melhorias de Performance
- ✅ In-flight guards para evitar requisições duplicadas
- ✅ Cleanup automático de listeners
- ✅ Animações otimizadas com Reanimated
- ✅ Throttling de atualizações de localização

## 📁 Estrutura de Dados Firebase

### Requests
```
requests/{requestId}/
├── id: string
├── category: string
├── description: string
├── address: string
├── status: 'pending' | 'offered' | 'accepted' | 'en_route' | 'arrived' | 'started' | 'completed' | 'cancelled'
├── price?: number
├── providerId?: string
├── providerName?: string
├── providerRating?: number
├── createdAt: number
└── updatedAt: number
```

### Provider Locations
```
providerLocations/{providerId}/
├── lat: number
├── lng: number
├── heading?: number
└── updatedAt: number
```

### Offers
```
offers/{providerId}/{requestId}/
├── requestId: string
├── providerId: string
├── status: 'pending' | 'accepted' | 'rejected'
├── price: number
├── message?: string
├── createdAt: number
├── acceptedAt?: number
└── rejectedAt?: number
```

## 🔧 Configuração

### 1. Variáveis de Ambiente
Adicione ao seu `.env`:
```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 2. Configuração do Firebase
1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative o Realtime Database
3. Configure as regras de segurança:
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
    }
  }
}
```

## 🎯 Como Usar

### 1. Contexto Firebase
```tsx
import { useFirebaseRealtime } from '../contexts/FirebaseRealtimeContext';

const { 
  isConnected, 
  subscribeToRequest, 
  updateRequestStatus,
  updateProviderLocation 
} = useFirebaseRealtime();
```

### 2. Hooks Personalizados
```tsx
import { useRealtimeRequest } from '../hooks/useFirebaseRealtime';

useRealtimeRequest(requestId, (data) => {
  console.log('Request updated:', data);
});
```

### 3. In-flight Guards
```tsx
import { useInFlightGuard } from '../hooks/useInFlightGuard';

const { startOperation, endOperation, isOperationInFlight } = useInFlightGuard();

const handleAction = async () => {
  if (isOperationInFlight('my_operation')) return;
  
  if (!startOperation('my_operation')) return;
  
  try {
    // Sua operação aqui
  } finally {
    endOperation('my_operation');
  }
};
```

## 🎨 Componentes Modernos

### 1. Mapa Animado
```tsx
<FirebaseAnimatedMapView
  providerId={providerId}
  clientLocation={location}
  showPolyline={true}
  followProvider={true}
  onLocationUpdate={(location) => console.log(location)}
/>
```

### 2. Bottom Sheet
```tsx
<ModernBottomSheet
  snapPoints={['20%', '45%', '85%']}
  onClose={() => setVisible(false)}
>
  <YourContent />
</ModernBottomSheet>
```

### 3. Toast
```tsx
<ModernToast
  visible={toast.visible}
  message={toast.message}
  type="success"
  onHide={() => setToast({ visible: false, message: '', type: 'info' })}
/>
```

## 🔄 Migração Gradual

### Fase 1: Implementação Paralela
- ✅ Firebase configurado e funcionando
- ✅ Contextos antigos mantidos para compatibilidade
- ✅ Novos componentes criados

### Fase 2: Migração de Telas
- ✅ Tela home atualizada (`home-firebase.tsx`)
- 🔄 Migrar outras telas gradualmente
- 🔄 Remover contextos antigos

### Fase 3: Limpeza
- 🔄 Remover dependências do Socket.IO
- 🔄 Limpar código não utilizado
- 🔄 Otimizar performance

## 🐛 Troubleshooting

### 1. Erro de Conexão Firebase
- Verifique as credenciais no `app.json`
- Confirme que o Realtime Database está ativo
- Verifique as regras de segurança

### 2. Animações não funcionam
- Verifique se o `react-native-reanimated` está configurado
- Execute `npx expo install --fix` se necessário

### 3. Bottom Sheet não aparece
- Verifique se o `react-native-gesture-handler` está configurado
- Adicione o `GestureHandlerRootView` no root

## 📊 Performance

### Otimizações Implementadas
- ✅ Throttling de atualizações de localização (1-2s)
- ✅ Cleanup automático de listeners
- ✅ In-flight guards para evitar loops
- ✅ Animações nativas com Reanimated
- ✅ Lazy loading de componentes

### Métricas Recomendadas
- Latência de conexão: < 100ms
- FPS das animações: > 60fps
- Uso de memória: < 150MB
- Tempo de resposta: < 500ms

## 🚀 Próximos Passos

1. **Testes**: Implementar testes unitários e de integração
2. **Monitoramento**: Adicionar analytics e crash reporting
3. **Offline**: Implementar suporte offline com cache local
4. **Push Notifications**: Integrar FCM para notificações
5. **Analytics**: Adicionar tracking de eventos

## 📝 Notas Importantes

- O Firebase Realtime Database é mais eficiente que Socket.IO para este caso de uso
- As animações são otimizadas para performance nativa
- O sistema de in-flight guards previne loops e requisições duplicadas
- Todos os componentes seguem o design system do projeto
- A migração é gradual e não quebra funcionalidades existentes
