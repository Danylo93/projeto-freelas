#!/usr/bin/env python3
"""
Script para testar conexão com Firebase no backend
"""

import os
import sys
import asyncio
from datetime import datetime

# Adicionar o diretório de serviços ao path
sys.path.append('services/common')
sys.path.append('services/common/firebase-service')

try:
    from firebase_client import firebase_client
except ImportError as e:
    print(f"❌ Erro: {e}")
    print("💡 Tentando import direto...")
    try:
        import firebase_client
        firebase_client = firebase_client.firebase_client
        print("✅ Import direto funcionou")
    except ImportError as e2:
        print(f"❌ Erro no import direto: {e2}")
        sys.exit(1)

async def test_firebase_connection():
    """Testa a conexão com Firebase"""
    try:
        print('🔥 Testando conexão com Firebase (Backend)...')
        
        # Testar criação de request
        test_request = {
            'id': f'test_request_{int(datetime.now().timestamp())}',
            'clientId': 'test_client_123',
            'category': 'test',
            'description': 'Teste de conexão Firebase',
            'address': 'Endereço de teste',
            'clientLatitude': -23.5505,
            'clientLongitude': -46.6333,
            'price': 50.0,
            'status': 'pending'
        }
        
        print('📝 Testando criação de request...')
        success = await firebase_client.create_request(test_request)
        if success:
            print('✅ Criação de request: OK')
        else:
            print('❌ Criação de request: FALHOU')
            return
        
        # Testar atualização de status
        print('🔄 Testando atualização de status...')
        success = await firebase_client.update_request_status(
            test_request['id'], 
            'accepted', 
            {'assignedProvider': 'test_provider_123'}
        )
        if success:
            print('✅ Atualização de status: OK')
        else:
            print('❌ Atualização de status: FALHOU')
        
        # Testar atualização de localização
        print('📍 Testando atualização de localização...')
        location_data = {
            'lat': -23.5505,
            'lng': -46.6333,
            'heading': 45.0
        }
        success = await firebase_client.update_provider_location('test_provider_123', location_data)
        if success:
            print('✅ Atualização de localização: OK')
        else:
            print('❌ Atualização de localização: FALHOU')
        
        # Testar criação de oferta
        print('💼 Testando criação de oferta...')
        offer_data = {
            'price': 75.0,
            'message': 'Oferta de teste',
            'estimatedTime': 30
        }
        success = await firebase_client.create_offer('test_provider_123', test_request['id'], offer_data)
        if success:
            print('✅ Criação de oferta: OK')
        else:
            print('❌ Criação de oferta: FALHOU')
        
        # Testar leitura de dados
        print('📖 Testando leitura de request...')
        request_data = await firebase_client.get_request(test_request['id'])
        if request_data:
            print('✅ Leitura de request: OK')
            print(f'📊 Dados: {request_data}')
        else:
            print('❌ Leitura de request: FALHOU')
        
        # Testar leitura de localização
        print('📍 Testando leitura de localização...')
        location_data = await firebase_client.get_provider_location('test_provider_123')
        if location_data:
            print('✅ Leitura de localização: OK')
            print(f'📊 Dados: {location_data}')
        else:
            print('❌ Leitura de localização: FALHOU')
        
        print('🎉 Teste de conexão Firebase (Backend) concluído com sucesso!')
        
    except Exception as e:
        print(f'❌ Erro ao testar Firebase: {e}')
        import traceback
        traceback.print_exc()

async def test_database_structure():
    """Testa a estrutura do banco de dados"""
    try:
        print('\n🏗️ Testando estrutura do banco de dados...')
        
        # Verificar se as coleções existem
        ref = firebase_client.get_database()
        
        # Testar requests
        requests_ref = ref.child('requests')
        requests_data = requests_ref.get()
        print(f'📋 Requests: {len(requests_data) if requests_data else 0} documentos')
        
        # Testar providerLocations
        providers_ref = ref.child('providerLocations')
        providers_data = providers_ref.get()
        print(f'👥 Provider Locations: {len(providers_data) if providers_data else 0} documentos')
        
        # Testar offers
        offers_ref = ref.child('offers')
        offers_data = offers_ref.get()
        print(f'💼 Offers: {len(offers_data) if offers_data else 0} documentos')
        
        # Testar users
        users_ref = ref.child('users')
        users_data = users_ref.get()
        print(f'👤 Users: {len(users_data) if users_data else 0} documentos')
        
        print('✅ Estrutura do banco de dados verificada!')
        
    except Exception as e:
        print(f'❌ Erro ao verificar estrutura: {e}')

async def main():
    """Função principal"""
    print('🚀 Iniciando testes do Firebase Backend...')
    print(f'🔗 Database URL: {firebase_client.database_url}')
    
    await test_firebase_connection()
    await test_database_structure()
    
    print('\n✅ Todos os testes concluídos!')

if __name__ == "__main__":
    asyncio.run(main())
