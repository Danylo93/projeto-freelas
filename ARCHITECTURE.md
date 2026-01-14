# Diagnóstico e Arquitetura do Projeto

## 1. Diagnóstico Atual

### Backend (`backend/server.py`)
- **Arquitetura Monolítica (God File)**: Toda a lógica, modelos de banco de dados, regras de negócio e rotas estão em um único arquivo `server.py`.
- **Acoplamento Alto**: Regras de negócio estão misturadas com a camada HTTP (FastAPI) e acesso a dados (Motor/MongoDB).
- **Testabilidade Baixa**: Difícil escrever testes unitários puros pois a lógica depende de `db` e `socketio` globais.
- **Escalabilidade Limitada**: Como está tudo acoplado, não é possível escalar apenas o módulo de "Matching" ou "Location" separadamente.
- **Realtime**: Socket.IO está embutido diretamente nas rotas, dificultando a extração para um serviço de gateway.

### Mobile (`frontend/`)
- **Estrutura Básica**: Usa Expo Router, o que é bom, mas a lógica de negócio provavelmente reside dentro dos componentes de UI.
- **Falta de Camadas**: Não há evidência clara de separação entre "Data" (API calls), "Domain" (Regras) e "Presentation" (UI).

## 2. Nova Arquitetura Sugerida

Propomos uma migração para uma **Clean Architecture** organizando o backend inicialmente como um **Monólito Modular**. Isso permite separar responsabilidades sem a complexidade operacional de manter 10 microserviços no dia 1.

### Visão Macro
```mermaid
graph TD
    ClientApp[Mobile App] --> API_Gateway[API Gateway / Load Balancer]
    API_Gateway --> RealtimeSvc[Realtime Service / Socket Gateway]
    API_Gateway --> Monolith[Modular Monolith (API)]

    subgraph "Backend System"
        Monolith --> |Events| EventBus[Event Bus (Redis/Kafka)]
        RealtimeSvc --> |Subscribe| EventBus

        subgraph "Modules (Contexts)"
            Identity[Identity Module]
            Geo[Geo/Location Module]
            Matching[Matching/Trip Module]
        end
    end

    Monolith -.-> DB[(MongoDB)]
    EventBus -.-> Redis[(Redis)]
```

### Camadas (Clean Architecture)
Para cada módulo (Identity, Matching, Geo), teremos:

1.  **Domain (Core)**:
    -   `Entities`: Objetos de negócio (User, Trip).
    -   `Value Objects`: Email, Location, Coordinate.
    -   `Interfaces (Ports)`: Contratos para Repositories e Services.
    -   *Regra*: Zero dependências externas (sem frameworks).

2.  **Application (Use Cases)**:
    -   `UseCases`: Orquestram a lógica (ex: `RequestTrip`, `AcceptTrip`).
    -   `DTOs`: Dados de entrada e saída.
    -   *Regra*: Depende apenas do Domain.

3.  **Infrastructure (Adapters)**:
    -   `Repositories`: Implementação do acesso ao banco (MongoDB, Postgres).
    -   `Gateways`: Implementação de serviços externos (Google Maps, Payment).
    -   `EventBus`: Implementação de Kafka/Redis.

4.  **Interfaces (Presenters)**:
    -   `Controllers`: Endpoints HTTP (FastAPI).
    -   `Consumers`: Consumidores de eventos (Kafka/Redis).

## 3. Estrutura de Pastas Recomendada

### Backend (Python)
```
src/
├── core/                   # Kernel compartilhado
│   ├── domain/             # Entidades base, Value Objects genéricos
│   ├── infrastructure/     # Configs, Logger, DB connection base
│   └── interfaces/         # Base controllers, middlewares
├── modules/                # Módulos (Bounded Contexts)
│   ├── identity/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── interface/
│   ├── matching/
│   └── location/
├── main.py                 # Entrypoint
└── containers.py           # Dependency Injection
```

### Mobile (React Native)
```
src/
├── core/                   # Componentes base, utilitários, temas
├── domain/                 # Entidades e Interfaces de repositórios
├── data/                   # Implementação de APIs, DTOs, Mappers
├── presentation/           # UI
│   ├── components/         # Componentes burros (UI pura)
│   ├── hooks/              # Lógica de estado (View Models)
│   ├── screens/            # Telas (conectam hooks à UI)
│   └── navigation/
└── services/               # Serviços transversais (Log, Analytics)
```

## 4. Plano de Migração

1.  **Refactor**: Criar a estrutura de pastas e mover o código do `server.py` para os módulos respectivos, aplicando Clean Architecture.
2.  **Decouple**: Substituir chamadas diretas entre módulos por Eventos (ex: `TripCreated` -> `NotifyDriver`).
3.  **Microservices (Futuro)**: Como os módulos estarão desacoplados, basta extrair a pasta `modules/identity` para um novo repositório/container e rodar separadamente.
