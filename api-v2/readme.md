# API v2 — Guia rápido

## 1. Subir a infraestrutura de apoio

Na pasta `api-v2/` rode:

```bash
docker compose up -d
```

Isso sobe Kafka (com UI em http://localhost:8085), Redis e MongoDB além dos serviços da API.

## 2. Rodar os microserviços com hot-reload (modo desenvolvimento)

Cada serviço pode ser iniciado localmente para desenvolvimento rápido.
Abra terminais separados e execute:

```bash
# Prestadores
cd services/common/provider-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8011

# Solicitações
cd services/common/request-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8012

# Matching (escuta Kafka e atualiza Mongo)
cd services/common/matching-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8013

# Autenticação
cd services/common/auth-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8014

# Gateway HTTP/WebSocket
cd services/common/socket-gateway
pip install -r requirements.txt
uvicorn main:app --reload --port 8015
```

As variáveis de ambiente já possuem valores padrão para o stack docker (`mongo`, `kafka:29092`, etc.). Ajuste conforme necessário.

## 3. Fluxo de eventos estilo Uber

1. **Atualizar localização do prestador** – publica `provider.location` em Kafka.
   ```bash
   curl -X PUT http://localhost:8011/providers/prov-001/location \
     -H "Content-Type: application/json" \
     -d '{"latitude":-23.561684,"longitude":-46.655981}'
   ```
2. **Criar solicitação** – salva em Mongo e envia para o tópico `service.requests` e `requests.lifecycle.v1`.
   ```bash
   curl -X POST http://localhost:8012/requests \
     -H "Content-Type: application/json" \
     -d '{
       "id":"req-123",
       "client_id":"cli-123",
       "category":"plumber",
       "client_latitude":-23.5622,
       "client_longitude":-46.6555,
       "price":120.0
     }'
   ```
3. **Matching automático** – o matching-service escuta `service.requests`, busca o prestador disponível mais próximo (via Mongo) e marca o provider como `busy`, atualizando a solicitação para `offered`. Também publica `request.offered` em `requests.lifecycle.v1`.
4. **Aceitar manualmente** – se o aplicativo do prestador aceitar:
   ```bash
   curl -X PUT http://localhost:8012/requests/req-123/accept \
     -H "Content-Type: application/json" \
     -d '{"provider_id":"prov-001"}'
   ```
5. **Atualizar status da corrida** – gera eventos de tracking:
   ```bash
   curl -X PUT http://localhost:8012/requests/req-123/status \
     -H "Content-Type: application/json" \
     -d '{"status":"en_route"}'
   ```

## 4. Gateway e WebSocket

- Gateway HTTP: http://localhost:8015/healthz
- Principais rotas: `/api/providers`, `/api/requests`, `/api/auth/login`, `/api/auth/register`, `/api/auth/me`
- Socket.IO: conecte em `http://localhost:8015` passando `{ auth: { user_id, user_type } }`.
  - Salas sugeridas: `provider:{provider_id}` para ofertas e `request:{request_id}` para lifecycle.

## 5. Serviços disponíveis

| Serviço            | Porta | Descrição                                        |
| ------------------ | ----- | ------------------------------------------------ |
| provider-service   | 8011  | CRUD + localização/status de prestadores         |
| request-service    | 8012  | Gestão do ciclo de vida das solicitações         |
| matching-service   | 8013  | Consome Kafka e atribui prestadores automaticamente |
| auth-service       | 8014  | Registro, login e consulta de perfil             |
| socket-gateway     | 8015  | BFF que unifica rotas HTTP e Socket.IO           |

Todos os serviços expõem `/healthz` para checagens.
