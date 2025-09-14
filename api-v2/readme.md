Como rodar

Subir infra

docker compose up -d
# kafka-ui: http://localhost:8085


Rodar serviços (local ou container):
– Local rápido (em 4 terminais diferentes):

cd services/provider-service && pip install -r requirements.txt && uvicorn main:app --reload --port 8011
cd services/request-service  && pip install -r requirements.txt && uvicorn main:app --reload --port 8012
cd services/auth-service && pip install -r requirements.txt && python main.py
cd services/socket-gateway  && pip install -r requirements.txt && uvicorn main:asgi_app --reload --port 8013

10) Testes rápidos (Insomnia / curl)
(A) Atualizar localização do prestador (simular online perto da Paulista)
POST http://localhost:8011/v1/providers/location
Content-Type: application/json

{
  "provider_id": "prov-001",
  "lat": -23.561684,
  "lng": -46.655981,
  "status": "available"
}

(B) Criar uma solicitação (cliente perto da Paulista)
POST http://localhost:8012/v1/requests
Content-Type: application/json

{
  "request_id": "req-123",
  "client_id": "cli-123",
  "category": "plumber",
  "price": 120.0,
  "lat": -23.5622,
  "lng": -46.6555
}


O auth-service vai capturar request.created, procurar providers nos anéis H3, publicar request.offered para o prov-001.
Se ninguém aceitar em 8s, ele publica request.accepted automaticamente para o primeiro candidato (apenas neste MVP).

(C) Aceitar manualmente (se quiser simular aceite do provider no seu app)
POST http://localhost:8012/v1/requests/req-123/accept
Content-Type: application/json

{ "provider_id": "prov-001" }

(D) Atualizar status (para emitir eventos no tracking)
POST http://localhost:8012/v1/requests/req-123/status
Content-Type: application/json

{ "status": "en_route" }   // depois: arrived | started | completed

11) Integração com seu Mobile atual

Socket URL: http://<seu_host>:8013

Ao logar, chame:

const socket = io(SOCKET_URL, { auth: { user_id, user_type } });
socket.emit('join', { /* opcional se quiser nomes de sala custom */});


Prestador: junte-se à sala provider:{provider_id} (recebe offer).

Cliente & Prestador: ao abrir a corrida, junte-se à sala request:{request_id} (recebe accepted, status e — se você publicar — provider_location_update).

Rota estilo Uber: continue usando seu CustomMapView com origin = prestador e destination = cliente.


 outra versão :

 Como rodar

Na raiz api-v2/:

docker compose up --build


Aguarde subir. Endpoints para testar no navegador/Insomnia:

Gateway (BFF):

GET http://localhost:8015/healthz

GET http://localhost:8015/api/providers

POST http://localhost:8015/api/requests

POST http://localhost:8015/api/auth/login

Serviços diretos:

GET http://localhost:8011/healthz (provider)

GET http://localhost:8012/healthz (request)

GET http://localhost:8014/healthz (auth)

Seed rápido de prestador:

curl -X POST http://localhost:8011/providers \
  -H "Content-Type: application/json" \
  -d '{
    "id":"prov-1",
    "name":"Encanador João",
    "category":"plumber",
    "price":120.0,
    "description":"Serviço de encanamento",
    "latitude":-23.5615,
    "longitude":-46.6560,
    "status":"available",
    "rating":4.8,
    "user_id":"prov-user-1"
  }'


Criar request via gateway:

curl -X POST http://localhost:8015/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "id":"req-1",
    "client_id":"cli-123",
    "provider_id":"prov-user-1",
    "category":"plumber",
    "description":"Minha pia quebrou",
    "client_latitude":-23.5610,
    "client_longitude":-46.6550,
    "price":120.0
  }'