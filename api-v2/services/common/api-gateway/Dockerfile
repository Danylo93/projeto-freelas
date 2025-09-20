FROM python:3.11-slim

WORKDIR /app

# Instala dependências do sistema
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copia requirements e instala dependências Python
COPY api-gateway/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código
COPY api-gateway/ .

# Expõe a porta
EXPOSE 8000

# Comando para executar
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
