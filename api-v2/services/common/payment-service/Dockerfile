FROM python:3.11-slim

WORKDIR /app

# opcional: curl só para healthcheck
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# copie somente o requirements primeiro (melhora cache)
# quando o build usa context ./services/common, precisamos referenciar o requirements
# dentro da subpasta do serviço
COPY payment-service/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# agora o resto do código
COPY . .

# alinhe a porta com o serviço (ex.: admin = 8014, auth = 8015, matching = 8016, payment = 8017)
EXPOSE 8016
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8016", "--reload"]
