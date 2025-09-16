FROM python:3.11-slim

WORKDIR /app

# opcional: curl só para healthcheck
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# copie somente o requirements primeiro (melhora cache)
# usando contexto ./services/common, referencie o arquivo dentro da subpasta
COPY admin-service/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# agora o resto do código
COPY . .

# alinhe a porta com o serviço (ex.: admin = 8014, auth = 8015, matching = 8016, payment = 8017)
EXPOSE 8017
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8017", "--reload"]
