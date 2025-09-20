#!/usr/bin/env python3
"""
Script de migração para atualizar os serviços para usar Firebase Realtime Database
"""

import os
import shutil
from pathlib import Path

def migrate_service(service_name: str):
    """Migra um serviço específico para usar Firebase"""
    service_path = Path(f"services/common/{service_name}")
    
    if not service_path.exists():
        print(f"❌ Serviço {service_name} não encontrado")
        return False
    
    # Backup do arquivo original
    original_file = service_path / "main.py"
    backup_file = service_path / "main_backup.py"
    
    if original_file.exists():
        shutil.copy2(original_file, backup_file)
        print(f"✅ Backup criado: {backup_file}")
    
    # Renomear arquivo Firebase
    firebase_file = service_path / "main_firebase.py"
    if firebase_file.exists():
        shutil.copy2(firebase_file, original_file)
        print(f"✅ {service_name} migrado para Firebase")
        return True
    else:
        print(f"❌ Arquivo main_firebase.py não encontrado para {service_name}")
        return False

def update_docker_compose():
    """Atualiza o docker-compose.yml para incluir Firebase"""
    compose_file = Path("docker-compose.yml")
    
    if not compose_file.exists():
        print("❌ docker-compose.yml não encontrado")
        return False
    
    # Ler o arquivo
    with open(compose_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Verificar se Firebase já está configurado
    if "firebase-service:" in content:
        print("✅ Firebase service já está configurado no docker-compose.yml")
        return True
    
    # Adicionar configuração do Firebase (simplificada)
    firebase_config = """
  firebase-service:
    build:
      context: ./services/common
      dockerfile: firebase-service/Dockerfile
    container_name: firebase-service
    networks: [core]
    environment:
      - FIREBASE_DATABASE_URL=${FIREBASE_DATABASE_URL}
      - FIREBASE_CREDENTIALS_PATH=${FIREBASE_CREDENTIALS_PATH}
      - PYTHONPATH=/app
    working_dir: /app/firebase-service
    volumes:
      - ./services/common:/app
    healthcheck:
      test: ["CMD-SHELL", "python -c 'import firebase_admin; print(\"Firebase OK\")' || exit 1"]
      interval: 10s
      timeout: 3s
      retries: 5
"""
    
    # Inserir antes do api-gateway
    if "api-gateway:" in content:
        content = content.replace("  api-gateway:", firebase_config + "\n  api-gateway:")
        
        # Salvar o arquivo
        with open(compose_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✅ docker-compose.yml atualizado com Firebase service")
        return True
    else:
        print("❌ Não foi possível encontrar api-gateway no docker-compose.yml")
        return False

def create_env_example():
    """Cria arquivo .env.example com configurações do Firebase"""
    env_example = """# Firebase Configuration
FIREBASE_DATABASE_URL=https://freelas-app-default-rtdb.firebaseio.com
FIREBASE_CREDENTIALS_PATH=/app/credentials/firebase-service-account.json

# Alternative: Use environment variables for credentials
# FIREBASE_PROJECT_ID=freelas-app
# FIREBASE_PRIVATE_KEY_ID=your_private_key_id
# FIREBASE_PRIVATE_KEY=your_private_key
# FIREBASE_CLIENT_EMAIL=your_client_email
# FIREBASE_CLIENT_ID=your_client_id
# FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
# FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# MongoDB Configuration
MONGO_URL=mongodb://mongo:27017
DB_NAME=freelas

# Kafka Configuration
KAFKA_BOOTSTRAP=kafka:29092
"""
    
    env_file = Path(".env.example")
    with open(env_file, 'w', encoding='utf-8') as f:
        f.write(env_example)
    
    print("✅ Arquivo .env.example criado")

def main():
    """Função principal de migração"""
    print("🚀 Iniciando migração para Firebase Realtime Database...")
    
    # Lista de serviços para migrar
    services_to_migrate = [
        "request-service",
        "provider-service"
    ]
    
    success_count = 0
    
    # Migrar cada serviço
    for service in services_to_migrate:
        print(f"\n📦 Migrando {service}...")
        if migrate_service(service):
            success_count += 1
    
    # Atualizar docker-compose
    print(f"\n🐳 Atualizando docker-compose.yml...")
    update_docker_compose()
    
    # Criar arquivo de exemplo
    print(f"\n📝 Criando arquivo .env.example...")
    create_env_example()
    
    print(f"\n✅ Migração concluída!")
    print(f"📊 Serviços migrados: {success_count}/{len(services_to_migrate)}")
    
    print(f"\n📋 Próximos passos:")
    print(f"1. Configure as credenciais do Firebase no .env")
    print(f"2. Execute: docker-compose up --build")
    print(f"3. Teste os endpoints atualizados")
    print(f"4. Monitore os logs para verificar a conexão com Firebase")

if __name__ == "__main__":
    main()
