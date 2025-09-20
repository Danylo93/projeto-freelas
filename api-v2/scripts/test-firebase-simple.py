#!/usr/bin/env python3
"""
Teste simples de conexão Firebase
"""

import os
import sys
import json

# Configurar variáveis de ambiente
os.environ['FIREBASE_DATABASE_URL'] = 'https://uber-like-freelas-default-rtdb.firebaseio.com'
os.environ['FIREBASE_CREDENTIALS_PATH'] = './config/firebase-credentials.json'

# Adicionar paths
sys.path.append('services/common')
sys.path.append('services/common/firebase-service')

def test_firebase_simple():
    """Teste simples de conexão Firebase"""
    try:
        print('🔥 Testando conexão Firebase simples...')
        
        # Importar Firebase Admin
        import firebase_admin
        from firebase_admin import credentials, db
        
        # Verificar se já existe app
        if not firebase_admin._apps:
            # Carregar credenciais
            cred_path = './config/firebase-credentials.json'
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                app = firebase_admin.initialize_app(cred, {
                    'databaseURL': 'https://uber-like-freelas-default-rtdb.firebaseio.com'
                })
                print('✅ Firebase inicializado com sucesso')
            else:
                print('❌ Arquivo de credenciais não encontrado')
                return False
        else:
            print('✅ Firebase já inicializado')
            app = firebase_admin.get_app()
        
        # Testar escrita simples
        ref = db.reference('test')
        ref.set({
            'message': 'Hello Firebase!',
            'timestamp': '2024-01-01T00:00:00Z'
        })
        print('✅ Escrita no Firebase: OK')
        
        # Testar leitura
        data = ref.get()
        if data:
            print('✅ Leitura do Firebase: OK')
            print(f'📊 Dados: {data}')
        else:
            print('⚠️ Leitura do Firebase: VAZIO')
        
        # Limpar dados de teste
        ref.delete()
        print('✅ Limpeza: OK')
        
        return True
        
    except Exception as e:
        print(f'❌ Erro: {e}')
        return False

if __name__ == "__main__":
    print('🚀 Iniciando teste Firebase simples...')
    success = test_firebase_simple()
    
    if success:
        print('🎉 Teste Firebase: SUCESSO!')
    else:
        print('❌ Teste Firebase: FALHOU!')
