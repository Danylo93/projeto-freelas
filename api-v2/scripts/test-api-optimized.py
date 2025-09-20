#!/usr/bin/env python3
"""
Teste completo da API otimizada
"""

import asyncio
import httpx
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

async def test_api_optimized():
    """Teste completo da API otimizada"""
    print("🚀 Iniciando teste da API otimizada...")
    
    async with httpx.AsyncClient() as client:
        # Teste 1: Health Check
        print("\n1️⃣ Testando Health Check...")
        try:
            response = await client.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                print("✅ Health Check: OK")
            else:
                print(f"❌ Health Check: {response.status_code}")
        except Exception as e:
            print(f"❌ Health Check: {e}")
        
        # Teste 2: Criar Prestador
        print("\n2️⃣ Testando criação de prestador...")
        provider_data = {
            "name": "João Silva",
            "email": "joao@teste.com",
            "phone": "+5511999999999",
            "document": "12345678901",
            "vehicle_type": "car",
            "vehicle_plate": "ABC1234",
            "vehicle_model": "Honda Civic",
            "vehicle_color": "Branco",
            "categories": ["delivery", "transport"],
            "max_distance": 15.0,
            "hourly_rate": 60.0
        }
        
        try:
            response = await client.post(f"{BASE_URL}/providers", json=provider_data)
            if response.status_code == 200:
                provider = response.json()
                provider_id = provider["id"]
                print(f"✅ Prestador criado: {provider_id}")
            else:
                print(f"❌ Erro ao criar prestador: {response.status_code}")
                return
        except Exception as e:
            print(f"❌ Erro ao criar prestador: {e}")
            return
        
        # Teste 3: Atualizar localização do prestador
        print("\n3️⃣ Testando atualização de localização...")
        location_data = {
            "latitude": -23.5505,
            "longitude": -46.6333,
            "heading": 90.0,
            "speed": 30.0
        }
        
        try:
            response = await client.post(
                f"{BASE_URL}/providers/{provider_id}/location",
                json=location_data
            )
            if response.status_code == 200:
                print("✅ Localização atualizada: OK")
            else:
                print(f"❌ Erro ao atualizar localização: {response.status_code}")
        except Exception as e:
            print(f"❌ Erro ao atualizar localização: {e}")
        
        # Teste 4: Definir prestador como online
        print("\n4️⃣ Testando status online...")
        try:
            response = await client.post(f"{BASE_URL}/providers/{provider_id}/online")
            if response.status_code == 200:
                print("✅ Prestador online: OK")
            else:
                print(f"❌ Erro ao definir online: {response.status_code}")
        except Exception as e:
            print(f"❌ Erro ao definir online: {e}")
        
        # Teste 5: Criar solicitação
        print("\n5️⃣ Testando criação de solicitação...")
        request_data = {
            "client_id": "client_123",
            "category": "delivery",
            "description": "Entrega de comida",
            "address": "Rua das Flores, 123",
            "client_latitude": -23.5505,
            "client_longitude": -46.6333,
            "price": 25.0,
            "estimated_duration": 30
        }
        
        try:
            response = await client.post(f"{BASE_URL}/requests", json=request_data)
            if response.status_code == 200:
                request = response.json()
                request_id = request["id"]
                print(f"✅ Solicitação criada: {request_id}")
            else:
                print(f"❌ Erro ao criar solicitação: {response.status_code}")
                return
        except Exception as e:
            print(f"❌ Erro ao criar solicitação: {e}")
            return
        
        # Teste 6: Criar oferta
        print("\n6️⃣ Testando criação de oferta...")
        offer_data = {
            "provider_id": provider_id,
            "price": 30.0,
            "estimated_duration": 25,
            "message": "Posso fazer a entrega em 25 minutos"
        }
        
        try:
            response = await client.post(
                f"{BASE_URL}/requests/{request_id}/offers",
                json=offer_data
            )
            if response.status_code == 200:
                print("✅ Oferta criada: OK")
            else:
                print(f"❌ Erro ao criar oferta: {response.status_code}")
        except Exception as e:
            print(f"❌ Erro ao criar oferta: {e}")
        
        # Teste 7: Aceitar solicitação
        print("\n7️⃣ Testando aceitação de solicitação...")
        try:
            response = await client.post(
                f"{BASE_URL}/requests/{request_id}/accept",
                json={"provider_id": provider_id}
            )
            if response.status_code == 200:
                print("✅ Solicitação aceita: OK")
            else:
                print(f"❌ Erro ao aceitar solicitação: {response.status_code}")
        except Exception as e:
            print(f"❌ Erro ao aceitar solicitação: {e}")
        
        # Teste 8: Atualizar status da solicitação
        print("\n8️⃣ Testando atualização de status...")
        status_update = {
            "status": "en_route",
            "provider_latitude": -23.5500,
            "provider_longitude": -46.6330
        }
        
        try:
            response = await client.put(
                f"{BASE_URL}/requests/{request_id}",
                json=status_update
            )
            if response.status_code == 200:
                print("✅ Status atualizado: OK")
            else:
                print(f"❌ Erro ao atualizar status: {response.status_code}")
        except Exception as e:
            print(f"❌ Erro ao atualizar status: {e}")
        
        # Teste 9: Avaliar serviço
        print("\n9️⃣ Testando avaliação...")
        try:
            response = await client.post(
                f"{BASE_URL}/requests/{request_id}/rate",
                json={"rating": 4.5}
            )
            if response.status_code == 200:
                print("✅ Avaliação enviada: OK")
            else:
                print(f"❌ Erro ao avaliar: {response.status_code}")
        except Exception as e:
            print(f"❌ Erro ao avaliar: {e}")
        
        # Teste 10: Processar pagamento
        print("\n🔟 Testando pagamento...")
        payment_data = {
            "payment_method": "credit_card",
            "amount": 30.0,
            "currency": "BRL",
            "description": "Pagamento do serviço"
        }
        
        try:
            response = await client.post(
                f"{BASE_URL}/requests/{request_id}/payment",
                json=payment_data
            )
            if response.status_code == 200:
                print("✅ Pagamento processado: OK")
            else:
                print(f"❌ Erro ao processar pagamento: {response.status_code}")
        except Exception as e:
            print(f"❌ Erro ao processar pagamento: {e}")
        
        # Teste 11: Buscar prestadores próximos
        print("\n1️⃣1️⃣ Testando busca de prestadores próximos...")
        try:
            response = await client.get(
                f"{BASE_URL}/providers/nearby",
                params={
                    "latitude": -23.5505,
                    "longitude": -46.6333,
                    "radius": 5.0,
                    "category": "delivery"
                }
            )
            if response.status_code == 200:
                providers = response.json()
                print(f"✅ Prestadores próximos encontrados: {len(providers)}")
            else:
                print(f"❌ Erro ao buscar prestadores: {response.status_code}")
        except Exception as e:
            print(f"❌ Erro ao buscar prestadores: {e}")
        
        # Teste 12: Estatísticas do prestador
        print("\n1️⃣2️⃣ Testando estatísticas do prestador...")
        try:
            response = await client.get(f"{BASE_URL}/providers/{provider_id}/stats")
            if response.status_code == 200:
                stats = response.json()
                print(f"✅ Estatísticas: {stats}")
            else:
                print(f"❌ Erro ao buscar estatísticas: {response.status_code}")
        except Exception as e:
            print(f"❌ Erro ao buscar estatísticas: {e}")

if __name__ == "__main__":
    print("🧪 Teste da API Otimizada - Freelas Uber-like")
    print("=" * 50)
    asyncio.run(test_api_optimized())
    print("\n🎉 Teste concluído!")
