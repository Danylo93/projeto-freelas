#!/usr/bin/env python3
"""
Script de limpeza e organização do backend
Remove arquivos desnecessários e organiza a estrutura
"""

import os
import shutil
from pathlib import Path

def cleanup_backend():
    """Executa limpeza completa do backend"""
    print("🧹 Iniciando limpeza do backend...")
    
    # Arquivos para remover
    files_to_remove = [
        "test_websocket_direct.py",
        "test_websocket_connection.py", 
        "test_websocket.py",
        "test_socket_direct.py",
        "test_socket_notification.py",
        "test_socket_notifications.py",
        "test_notification_direct.json",
        "test_notification_flow.json",
        "test_notification_manual.json",
        "test_manual_notification.json",
        "test_kafka_event.json",
        "test_new_request.json",
        "test_client.json",
        "test_provider_config.json",
        "test_user.json",
        "test_request.json",
        "client_request.json",
        "provider_services.json",
        "WEBSOCKET_MIGRATION.md",
        "README_GATEWAY.md",
        "setup_gateway.sh",
        "cleanup_old_requests.py",
        "test_gateway.py",
        "test_notifications.py",
        "test_jwt_token.py",
        "insomnia-api-v2.json",
        "readme.md"
    ]
    
    # Remover arquivos
    removed_count = 0
    for file in files_to_remove:
        if os.path.exists(file):
            os.remove(file)
            print(f"✅ Removido: {file}")
            removed_count += 1
        else:
            print(f"⚠️  Não encontrado: {file}")
    
    # Criar estrutura de diretórios organizada
    directories = [
        "docs",
        "tests",
        "scripts",
        "config",
        "logs"
    ]
    
    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory)
            print(f"📁 Criado diretório: {directory}")
    
    # Mover arquivos de documentação
    doc_files = [
        "README_FIREBASE_BACKEND.md",
        "firebase-config-updated.md",
        "FIREBASE_SETUP_INSTRUCTIONS.md"
    ]
    
    for file in doc_files:
        if os.path.exists(file):
            shutil.move(file, f"docs/{file}")
            print(f"📄 Movido para docs: {file}")
    
    # Mover scripts
    script_files = [
        "migrate_to_firebase.py",
        "test-firebase-backend.py"
    ]
    
    for file in script_files:
        if os.path.exists(file):
            shutil.move(file, f"scripts/{file}")
            print(f"🔧 Movido para scripts: {file}")
    
    # Mover arquivos de configuração
    config_files = [
        "firebase-credentials-example.json"
    ]
    
    for file in config_files:
        if os.path.exists(file):
            shutil.move(file, f"config/{file}")
            print(f"⚙️  Movido para config: {file}")
    
    print(f"\n🎉 Limpeza concluída!")
    print(f"📊 Arquivos removidos: {removed_count}")
    print(f"📁 Estrutura organizada em: docs/, tests/, scripts/, config/, logs/")

if __name__ == "__main__":
    cleanup_backend()
