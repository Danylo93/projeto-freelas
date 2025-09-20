#!/usr/bin/env python3
"""
Script de setup completo do backend
Configura ambiente, instala dependências e testa conexões
"""

import os
import sys
import subprocess
import json
from pathlib import Path

def run_command(command, description):
    """Executa comando e retorna resultado"""
    print(f"🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ {description} - Sucesso")
            return True
        else:
            print(f"❌ {description} - Erro: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ {description} - Exceção: {e}")
        return False

def check_python_version():
    """Verifica versão do Python"""
    print("🐍 Verificando versão do Python...")
    version = sys.version_info
    if version.major >= 3 and version.minor >= 8:
        print(f"✅ Python {version.major}.{version.minor}.{version.micro} - OK")
        return True
    else:
        print(f"❌ Python {version.major}.{version.minor}.{version.micro} - Requer Python 3.8+")
        return False

def install_dependencies():
    """Instala dependências Python"""
    dependencies = [
        "firebase-admin",
        "python-dotenv",
        "fastapi",
        "uvicorn",
        "pymongo",
        "kafka-python",
        "redis",
        "pydantic"
    ]
    
    print("📦 Instalando dependências...")
    for dep in dependencies:
        if not run_command(f"pip install {dep}", f"Instalando {dep}"):
            return False
    return True

def create_directories():
    """Cria diretórios necessários"""
    directories = [
        "logs",
        "config",
        "tests",
        "docs"
    ]
    
    print("📁 Criando diretórios...")
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        print(f"✅ Diretório {directory} criado")
    return True

def create_env_file():
    """Cria arquivo .env de exemplo"""
    env_content = """# Firebase Configuration
FIREBASE_DATABASE_URL=https://uber-like-freelas-default-rtdb.firebaseio.com
FIREBASE_CREDENTIALS_PATH=./config/firebase-credentials.json

# MongoDB Configuration
MONGODB_URL=mongodb://localhost:27017/freelas

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# Redis Configuration
REDIS_URL=redis://localhost:6379

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
"""
    
    env_file = Path(".env")
    if not env_file.exists():
        with open(env_file, "w") as f:
            f.write(env_content)
        print("✅ Arquivo .env criado")
    else:
        print("⚠️  Arquivo .env já existe")
    return True

def create_firebase_credentials_template():
    """Cria template de credenciais Firebase"""
    template = {
        "type": "service_account",
        "project_id": "uber-like-freelas",
        "private_key_id": "YOUR_PRIVATE_KEY_ID",
        "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n",
        "client_email": "firebase-adminsdk-xxxxx@uber-like-freelas.iam.gserviceaccount.com",
        "client_id": "YOUR_CLIENT_ID",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token"
    }
    
    creds_file = Path("config/firebase-credentials.json")
    if not creds_file.exists():
        with open(creds_file, "w") as f:
            json.dump(template, f, indent=2)
        print("✅ Template de credenciais Firebase criado")
        print("⚠️  IMPORTANTE: Configure suas credenciais reais em config/firebase-credentials.json")
    else:
        print("⚠️  Arquivo de credenciais Firebase já existe")
    return True

def test_imports():
    """Testa imports dos módulos"""
    print("🧪 Testando imports...")
    
    try:
        import firebase_admin
        print("✅ firebase_admin importado")
    except ImportError:
        print("❌ firebase_admin não encontrado")
        return False
    
    try:
        import fastapi
        print("✅ fastapi importado")
    except ImportError:
        print("❌ fastapi não encontrado")
        return False
    
    try:
        import pymongo
        print("✅ pymongo importado")
    except ImportError:
        print("❌ pymongo não encontrado")
        return False
    
    return True

def main():
    """Função principal"""
    print("🚀 Iniciando setup do backend...")
    print("=" * 50)
    
    steps = [
        ("Verificar Python", check_python_version),
        ("Criar diretórios", create_directories),
        ("Instalar dependências", install_dependencies),
        ("Criar arquivo .env", create_env_file),
        ("Criar template Firebase", create_firebase_credentials_template),
        ("Testar imports", test_imports)
    ]
    
    success_count = 0
    for step_name, step_func in steps:
        print(f"\n📋 {step_name}...")
        if step_func():
            success_count += 1
        else:
            print(f"❌ Falha em: {step_name}")
    
    print("\n" + "=" * 50)
    print(f"📊 Setup concluído: {success_count}/{len(steps)} passos executados com sucesso")
    
    if success_count == len(steps):
        print("🎉 Backend configurado com sucesso!")
        print("\n📝 Próximos passos:")
        print("1. Configure suas credenciais Firebase em config/firebase-credentials.json")
        print("2. Execute: python scripts/test-firebase-backend.py")
        print("3. Execute: docker-compose up --build")
    else:
        print("⚠️  Alguns passos falharam. Verifique os erros acima.")
    
    return success_count == len(steps)

if __name__ == "__main__":
    main()
