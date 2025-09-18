# 🔧 Teste de Conectividade WebSocket

## ❌ Problema Identificado

O erro 403 no WebSocket indica que há um problema de autenticação ou configuração no backend. Implementei várias soluções:

### ✅ **Soluções Implementadas:**

1. **Contexto Híbrido** (`HybridRealtimeContext`)
   - Tenta WebSocket primeiro
   - Fallback para Socket.IO se WebSocket falhar
   - Suporte a ambos os protocolos

2. **Endpoint WebSocket no Backend**
   - Adicionado `/ws` endpoint no `backend/server.py`
   - Validação JWT completa
   - Compatibilidade com frontend

3. **Configuração Atualizada**
   - Arquivo `.env` com todas as variáveis necessárias
   - URLs corretas para ngrok
   - Headers para bypass do ngrok

## 🧪 Como Testar

### **1. Verificar Backend**
```bash
# Verificar se o backend está rodando
curl https://a09f89583882.ngrok-free.app/api/health

# Testar endpoint de auth
curl -X POST https://a09f89583882.ngrok-free.app/api/auth/register \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: 1" \
  -d '{"name":"Test","email":"test@test.com","phone":"123","user_type":2}'
```

### **2. Testar WebSocket (Browser)**
```javascript
// Abrir console do navegador e testar
const ws = new WebSocket('wss://a09f89583882.ngrok-free.app/ws?token=SEU_TOKEN&user_id=SEU_USER_ID&user_type=2');

ws.onopen = () => console.log('✅ WebSocket conectado');
ws.onmessage = (e) => console.log('📨 Mensagem:', JSON.parse(e.data));
ws.onerror = (e) => console.error('❌ Erro:', e);
ws.onclose = (e) => console.log('❌ Fechado:', e.code, e.reason);
```

### **3. Testar Socket.IO (Browser)**
```javascript
// Incluir Socket.IO no HTML
// <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>

const socket = io('https://a09f89583882.ngrok-free.app', {
  auth: {
    user_id: 'SEU_USER_ID',
    user_type: 2,
    token: 'SEU_TOKEN'
  }
});

socket.on('connect', () => console.log('✅ Socket.IO conectado'));
socket.on('disconnect', () => console.log('❌ Socket.IO desconectado'));
```

## 🔍 Diagnóstico de Problemas

### **Erro 403 - Forbidden**
Possíveis causas:
1. **Token JWT inválido ou expirado**
2. **Ngrok bloqueando WebSocket**
3. **Backend não configurado corretamente**
4. **Headers de autenticação incorretos**

### **Soluções:**

#### **1. Verificar Token JWT**
```bash
# Decodificar token JWT (use jwt.io)
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." | base64 -d
```

#### **2. Configurar Ngrok**
```bash
# Adicionar configuração no ngrok.yml
authtoken: SEU_TOKEN
tunnels:
  api:
    addr: 8001
    proto: http
    bind_tls: true
    inspect: false
```

#### **3. Verificar Backend**
```bash
# Logs do backend
docker logs backend-container

# Ou se rodando diretamente
python backend/server.py
```

#### **4. Testar Conectividade**
```bash
# Ping do servidor
ping a09f89583882.ngrok-free.app

# Testar HTTPS
curl -I https://a09f89583882.ngrok-free.app

# Testar WebSocket upgrade
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Version: 13" \
     -H "Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==" \
     https://a09f89583882.ngrok-free.app/ws
```

## 🚀 Próximos Passos

### **Se WebSocket ainda não funcionar:**

1. **Use apenas Socket.IO**
   ```typescript
   // Em HybridRealtimeContext.tsx, comentar tryWebSocketConnection
   // e usar apenas trySocketIOConnection
   ```

2. **Verificar configuração do Ngrok**
   - Ngrok pode ter limitações para WebSocket
   - Considere usar túnel HTTP apenas

3. **Implementar polling como fallback**
   ```typescript
   // Implementar long-polling se WebSocket falhar
   const pollForUpdates = async () => {
     const response = await fetch('/api/poll');
     // Processar updates
   };
   ```

## 📱 Teste no App

1. **Abra o app Expo**
2. **Vá para `/uber-style`**
3. **Verifique os logs:**
   ```
   ✅ [REALTIME] WebSocket conectado
   ou
   ✅ [REALTIME] Socket.IO conectado
   ```

4. **Se ainda der erro 403:**
   - Verifique se o backend está rodando
   - Confirme a URL do ngrok
   - Teste com um token novo (faça login novamente)

## 🔧 Debug Avançado

### **Logs Detalhados**
```typescript
// Adicionar em HybridRealtimeContext.tsx
console.log('🔍 [DEBUG] User:', user);
console.log('🔍 [DEBUG] Token:', token?.substring(0, 20) + '...');
console.log('🔍 [DEBUG] Socket URL:', SOCKET_URL);
```

### **Interceptar Requisições**
```typescript
// Usar proxy para debug
const originalFetch = global.fetch;
global.fetch = (...args) => {
  console.log('🌐 [FETCH]', args[0]);
  return originalFetch(...args);
};
```

### **Monitorar Rede**
- Use React Native Debugger
- Ative "Network Inspect"
- Monitore tentativas de conexão WebSocket

## ✅ Status Atual

- ✅ **Backend**: Endpoint WebSocket adicionado
- ✅ **Frontend**: Contexto híbrido implementado
- ✅ **Configuração**: Variáveis de ambiente atualizadas
- ✅ **Fallback**: Socket.IO como alternativa
- 🔄 **Teste**: Aguardando validação

O sistema agora deve funcionar com WebSocket ou Socket.IO, dependendo do que o backend suportar melhor!
