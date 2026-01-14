# Projeto FreelancerApp - Nova Arquitetura

Este repositório contém a reestruturação do projeto FreelancerApp, focado em Clean Architecture, Microservices-readiness e Realtime.

## Estrutura

- `backend_new/`: Novo backend em Python/FastAPI (Modular Monolith).
- `frontend/`: App Mobile em React Native (Expo).
- `docker-compose.yml`: Orquestração local.

## Como Rodar (Backend)

1. **Pré-requisitos**: Docker e Docker Compose.
2. **Executar**:
   ```bash
   docker-compose up --build
   ```
3. **Acessar**:
   - API: http://localhost:8000
   - Docs: http://localhost:8000/docs

## Como Rodar (Mobile)

1. **Instalar Dependências**:
   ```bash
   cd frontend
   npm install
   ```
2. **Executar**:
   ```bash
   npm start
   ```

## Arquitetura

Veja [ARCHITECTURE.md](./ARCHITECTURE.md) para detalhes da arquitetura.

## Testes

Backend:
```bash
cd backend_new
pip install -r requirements.txt
pytest
```
