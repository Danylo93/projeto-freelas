FROM python:3.11-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar dependências Python
COPY notification-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY notification-service/main.py .

# Copiar módulos comuns
COPY common ./common

# Expor porta
EXPOSE 8016

# Comando para executar a aplicação
CMD ["uvicorn", "main:socket_app", "--host", "0.0.0.0", "--port", "8016"]
