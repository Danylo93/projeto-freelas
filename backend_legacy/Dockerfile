FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# deps de SO (curl p/ healthcheck, build-essential p/ bcrypt/cryptography)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl \
 && rm -rf /var/lib/apt/lists/*

# !! Como o compose está dentro de backend, o contexto é ./backend
#    Logo, o requirements.txt já está na raiz do contexto.
COPY requirements.txt ./requirements.txt

RUN python -m pip install --upgrade pip setuptools wheel \
 && pip install -r requirements.txt

# copia TODO o código da API (server.py, seed_data.py, etc.)
COPY . .

EXPOSE 8001

# usuário não-root
RUN useradd -m appuser
USER appuser

# inicia a API (sua app ASGI está exportada como "app" no server.py)
CMD ["python", "server.py"]
# alternativa:
# CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
