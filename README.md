# Projeto Freelas (API v2 + Frontend Mobile)

Este monorepo contém:
- `api-v2/`: microserviços FastAPI (auth, provider, request, matching, gateway, payment/Stripe)
- `frontend/`: app React Native (Expo) com Google Maps, Stripe e Supabase

## Pré-requisitos
- Docker + Docker Compose
- Node.js 18+ e Yarn 1.x
- Chaves:
  - Google Maps (já configurada no `frontend/app.json`)
  - Stripe: `STRIPE_SECRET_KEY` (backend), `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` (frontend)
  - Supabase: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Subir API v2 local
```bash
cd api-v2
docker compose up --build
```
Serviços expostos:
- Auth: http://localhost:8014
- Provider: http://localhost:8011
- Request: http://localhost:8012
- Matching: http://localhost:8013
- Gateway (HTTP + Socket.IO): http://localhost:8015
- Payment (Stripe): http://localhost:8016
- Kafka UI: http://localhost:8085
- Mongo: mongodb://localhost:27017

Dicas:
- Configure `.env` de cada serviço conforme necessário (URLs e segredos)
- O gateway expõe rotas HTTP sob `/api/*` e Socket.IO em `/socket.io`

## Rodar o app mobile (Expo)
```bash
cd frontend
yarn
# Configure variáveis em .env.local ou ambiente do Expo/EAS
# EXPO_PUBLIC_API_GATEWAY_URL=http://localhost:8015
# EXPO_PUBLIC_AUTH_SERVICE_URL=http://localhost:8015/api/auth
# EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
# EXPO_PUBLIC_SUPABASE_URL=...
# EXPO_PUBLIC_SUPABASE_ANON_KEY=...
yarn start
```

- Android: use `adb reverse tcp:8015 tcp:8015` para acessar o gateway pelo emulador
- iOS: utilize o IP da máquina (ex.: `http://192.168.x.x:8015`) nas variáveis públicas

## Painel Admin (Web)
```bash
cd admin
pnpm i # ou npm i / yarn
pnpm dev # ou npm run dev / yarn dev
```

- URL padrão: http://localhost:5173 (preview: 5174)
- Configure `VITE_API_GATEWAY_URL=http://localhost:8015`
- Use as rotas expostas via gateway (`/api/admin/*`, `/api/auth/*`)

## Pagamentos (Stripe)
- Backend: `payment-service` expõe `POST /payments/create-intent`
- Frontend: inicializado via `PaymentProvider` com publishable key
- Para produção, configure webhooks do Stripe apontando para `/payments/webhook`

## Tempo real (WebSocket)
- Gateway publica eventos Kafka em Socket.IO: `location_updated`, `lifecycle`, `presence`, `chat_message`
- Frontend já possui `SocketContext` para consumir eventos

## Próximos passos sugeridos
- RBAC avançado (cliente/prestador/admin)
- Webhooks e Connect (repasse/saques) no Stripe
- Push notifications (Expo/FCM/APNs)
- Painel Admin (categorias, precificação, regiões, métricas)
