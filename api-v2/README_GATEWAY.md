# API Gateway - Configuração

Este projeto agora usa um API Gateway que centraliza todas as requisições em uma única URL, resolvendo o problema do ngrok que só permite uma URL.

## Como usar

### 1. Configurar o Frontend

Crie um arquivo `.env` na pasta `frontend/` com:

```env
# URL da API via ngrok (substitua pela sua URL do ngrok)
EXPO_PUBLIC_API_URL=https://your-ngrok-url.ngrok.io
```

### 2. Executar a API

```bash
cd api-v2
docker-compose up --build
```

### 3. Expor via ngrok

```bash
ngrok http 8000
```

Use a URL do ngrok no arquivo `.env` do frontend.

## Estrutura das URLs

Todas as requisições agora passam pelo gateway na porta 8000:

- **Autenticação**: `http://localhost:8000/api/auth/*`
- **Prestadores**: `http://localhost:8000/api/providers/*`
- **Solicitações**: `http://localhost:8000/api/requests/*`
- **Pagamentos**: `http://localhost:8000/api/payments/*`
- **Matching**: `http://localhost:8000/api/matching/*`
- **Admin**: `http://localhost:8000/api/admin/*`

## Compatibilidade

O gateway também suporta URLs diretas para compatibilidade:

- `http://localhost:8000/providers/*`
- `http://localhost:8000/requests/*`
- `http://localhost:8000/auth/*`

## Health Check

- Gateway: `http://localhost:8000/healthz`
- Todos os serviços: `http://localhost:8000/api/health`

## Vantagens

1. **Uma única URL**: Resolve o problema do ngrok
2. **CORS configurado**: Funciona com frontend web
3. **Load balancing**: Pode distribuir carga entre serviços
4. **Logs centralizados**: Todas as requisições passam pelo gateway
5. **Health checks**: Monitora todos os serviços
6. **Compatibilidade**: Mantém URLs antigas funcionando
