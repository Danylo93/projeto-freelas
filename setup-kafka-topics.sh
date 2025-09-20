#!/bin/bash

# Script para configurar tópicos do Kafka para o projeto Freelas
# Execute após subir o docker-compose.kafka.yml

echo "🚀 Configurando tópicos do Kafka para o projeto Freelas..."

# Aguardar o Kafka estar pronto
echo "⏳ Aguardando Kafka estar pronto..."
sleep 30

# Função para criar tópico
create_topic() {
    local topic_name=$1
    local partitions=$2
    local replication_factor=$3
    
    echo "📝 Criando tópico: $topic_name"
    docker exec -it $(docker ps -qf "ancestor=confluentinc/cp-kafka:7.5.1") \
        kafka-topics --create \
        --topic "$topic_name" \
        --bootstrap-server localhost:9092 \
        --partitions "$partitions" \
        --replication-factor "$replication_factor" \
        --if-not-exists
}

# Criar tópicos principais
echo "🔧 Criando tópicos principais..."

# Tópicos de localização de prestadores
create_topic "providers.location.v1" 12 1
create_topic "providers.status.v1" 6 1

# Tópicos de lifecycle de solicitações
create_topic "requests.lifecycle.v1" 12 1
create_topic "requests.matching.v1" 12 1

# Tópicos de ofertas e matching
create_topic "offers.created.v1" 12 1
create_topic "offers.accepted.v1" 12 1
create_topic "offers.rejected.v1" 12 1

# Tópicos de pagamentos
create_topic "payments.initiated.v1" 6 1
create_topic "payments.completed.v1" 6 1
create_topic "payments.failed.v1" 6 1

# Tópicos de notificações
create_topic "notifications.push.v1" 6 1
create_topic "notifications.inapp.v1" 6 1

# Tópicos de avaliações
create_topic "ratings.created.v1" 6 1
create_topic "ratings.updated.v1" 6 1

# Tópicos de analytics
create_topic "analytics.events.v1" 12 1
create_topic "analytics.metrics.v1" 6 1

# Tópicos de auditoria
create_topic "audit.events.v1" 12 1

echo "✅ Tópicos criados com sucesso!"

# Listar tópicos criados
echo "📋 Listando tópicos criados:"
docker exec -it $(docker ps -qf "ancestor=confluentinc/cp-kafka:7.5.1") \
    kafka-topics --list --bootstrap-server localhost:9092

echo ""
echo "🎉 Configuração do Kafka concluída!"
echo ""
echo "📊 Acesse o Kafka UI em: http://localhost:8080"
echo "🔧 Schema Registry em: http://localhost:8081"
echo "⚙️  Kafka Connect em: http://localhost:8083"
echo ""
echo "📝 Próximos passos:"
echo "1. Configure os producers nos serviços backend"
echo "2. Configure os consumers para processar eventos"
echo "3. Implemente schemas no Schema Registry"
echo "4. Configure conectores no Kafka Connect se necessário"
