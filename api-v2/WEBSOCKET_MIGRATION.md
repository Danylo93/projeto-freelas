# Migração de Socket.IO para WebSocket Nativo

## Resumo das Mudanças

Este documento descreve a migração do Socket.IO para WebSocket nativo na API-v2, resolvendo problemas de conectividade e simplificando a arquitetura.

## Mudanças Implementadas

### 1. API Gateway (api-gateway)

#### Arquivos Modificados:
- `main.py` - Removido Socket.IO, implementado WebSocket nativo
- `websocket_handler.py` - Gerenciador de conexões WebSocket
- `requirements.txt` - Removido python-socketio, adicionado PyJWT

#### Principais Mudanças:
- ✅ Removido `python-socketio` das dependências
- ✅ Implementado WebSocket nativo via FastAPI
- ✅ Atualizado sistema de notificações para usar WebSocket
- ✅ Mantida compatibilidade com eventos existentes
- ✅ Adicionado suporte a salas (rooms) para comunicação

#### Endpoints WebSocket:
- `ws://localhost:8000/ws` - Conexão principal
- Parâmetros: `user_id`, `user_type`, `token`

### 2. Frontend

#### Arquivos Modificados:
- `contexts/RealtimeContext.tsx` - Atualizado para WebSocket nativo
- `contexts/ImprovedRealtimeContext.tsx` - Melhorado com reconexão automática
- `utils/config.ts` - Atualizado para porta 8000
- `utils/socketConfig.ts` - Removido Socket.IO, configurado WebSocket

#### Principais Mudanças:
- ✅ Removido Socket.IO client
- ✅ Implementado WebSocket nativo do navegador
- ✅ Atualizado URLs para porta 8000 (API Gateway)
- ✅ Melhorado sistema de reconexão automática
- ✅ Mantida compatibilidade com eventos existentes

## Configuração

### Variáveis de Ambiente

#### Frontend (.env):
```bash
# API Gateway (WebSocket)
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_SOCKET_URL=http://localhost:8000

# Para desenvolvimento com ngrok
EXPO_PUBLIC_API_URL=https://your-ngrok-url.ngrok.io
```

#### Backend (docker-compose.yml):
```yaml
api-gateway:
  ports: ["8000:8000"]
  environment:
    - AUTH_SERVICE_URL=http://auth-service:8014
    - PROVIDER_SERVICE_URL=http://provider-service:8011
    # ... outros serviços
```

## Como Testar

### 1. Iniciar Backend
```bash
cd api-v2
docker-compose up api-gateway
```

### 2. Testar WebSocket
```bash
cd api-v2
python test_websocket_connection.py
```

### 3. Testar Frontend
```bash
cd frontend
npm start
# ou
yarn start
```

## Eventos WebSocket Suportados

### Mensagens do Cliente para Servidor:
- `ping` - Heartbeat
- `join_room` - Entrar em sala
- `leave_room` - Sair de sala
- `send_message` - Enviar mensagem
- `location_update` - Atualizar localização
- `request_status_update` - Atualizar status da solicitação

### Mensagens do Servidor para Cliente:
- `pong` - Resposta ao ping
- `room_joined` - Confirmação de entrada na sala
- `room_left` - Confirmação de saída da sala
- `message` - Mensagem recebida
- `new_request` - Nova solicitação (para prestadores)
- `request_accepted` - Solicitação aceita (para clientes)
- `request_completed` - Serviço concluído
- `location_updated` - Localização atualizada
- `request_status_updated` - Status da solicitação atualizado

## Vantagens da Migração

### 1. **Simplicidade**
- WebSocket nativo é mais simples que Socket.IO
- Menos dependências e overhead
- Melhor performance

### 2. **Compatibilidade**
- WebSocket é suportado nativamente pelo navegador
- Não precisa de bibliotecas externas
- Funciona em todos os ambientes

### 3. **Manutenibilidade**
- Código mais limpo e direto
- Menos abstrações
- Mais fácil de debugar

### 4. **Performance**
- Menos overhead de protocolo
- Conexão mais direta
- Melhor para mobile

## Troubleshooting

### Problemas Comuns:

#### 1. WebSocket não conecta
```bash
# Verificar se API Gateway está rodando
curl http://localhost:8000/healthz

# Verificar logs
docker-compose logs api-gateway
```

#### 2. Frontend não conecta
```bash
# Verificar variáveis de ambiente
echo $EXPO_PUBLIC_API_URL

# Verificar se porta está correta
# Deve ser 8000, não 8016
```

#### 3. Notificações não chegam
```bash
# Verificar se usuário está conectado
# Verificar logs do WebSocket
# Testar com script de teste
python test_websocket_connection.py
```

## Próximos Passos

1. **Testes Extensivos**
   - Testar em diferentes dispositivos
   - Testar com ngrok
   - Testar reconexão automática

2. **Monitoramento**
   - Adicionar métricas de conexão
   - Logs estruturados
   - Alertas de falha

3. **Otimizações**
   - Compressão de mensagens
   - Rate limiting
   - Pool de conexões

## Rollback

Se necessário reverter para Socket.IO:

1. Restaurar `python-socketio` no requirements.txt
2. Reverter mudanças no main.py
3. Restaurar Socket.IO client no frontend
4. Atualizar URLs para porta 8016

## Conclusão

A migração para WebSocket nativo resolve os problemas de conectividade e simplifica significativamente a arquitetura. O sistema agora é mais robusto, performático e fácil de manter.

