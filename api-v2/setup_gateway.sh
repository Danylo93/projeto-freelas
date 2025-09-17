#!/bin/bash

echo "🚀 Configurando API Gateway"
echo "=========================="

# Verifica se o Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker primeiro."
    exit 1
fi

# Para containers existentes
echo "🛑 Parando containers existentes..."
docker-compose down

# Constrói e inicia os serviços
echo "🔨 Construindo e iniciando serviços..."
docker-compose up --build -d

# Aguarda os serviços ficarem prontos
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 30

# Testa o gateway
echo "🧪 Testando gateway..."
python3 test_gateway.py

echo ""
echo "✅ Setup concluído!"
echo ""
echo "📝 Próximos passos:"
echo "1. Execute: ngrok http 8000"
echo "2. Copie a URL do ngrok"
echo "3. Crie um arquivo .env na pasta frontend/ com:"
echo "   EXPO_PUBLIC_API_URL=https://sua-url-ngrok.ngrok.io"
echo ""
echo "🔗 URLs disponíveis:"
echo "   Gateway: http://localhost:8000"
echo "   Health: http://localhost:8000/healthz"
echo "   API Health: http://localhost:8000/api/health"
