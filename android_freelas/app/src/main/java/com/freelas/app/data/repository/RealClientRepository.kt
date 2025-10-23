package com.freelas.app.data.repository

import com.freelas.app.data.model.Location
import com.freelas.app.data.model.Service
import com.freelas.app.data.model.ServiceCategory
import com.freelas.app.data.model.ServiceStatus
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.delay
import java.util.Date
import kotlin.random.Random

class RealClientRepository {
    
    // Simula serviços reais em São Paulo
    private val realServices = mutableListOf<Service>()
    
    // Endereços reais de São Paulo para sugestões
    private val realAddresses = listOf(
        "Rua Augusta, 1000 - Consolação, São Paulo - SP",
        "Avenida Paulista, 1000 - Bela Vista, São Paulo - SP",
        "Rua Oscar Freire, 500 - Jardins, São Paulo - SP",
        "Avenida Faria Lima, 2000 - Itaim Bibi, São Paulo - SP",
        "Rua da Consolação, 3000 - Centro, São Paulo - SP",
        "Avenida Rebouças, 1000 - Pinheiros, São Paulo - SP",
        "Rua Haddock Lobo, 500 - Cerqueira César, São Paulo - SP",
        "Avenida Ibirapuera, 2000 - Moema, São Paulo - SP",
        "Rua Teodoro Sampaio, 1000 - Pinheiros, São Paulo - SP",
        "Avenida Brigadeiro Luiz Antônio, 2000 - Bela Vista, São Paulo - SP",
        "Rua dos Pinheiros, 500 - Pinheiros, São Paulo - SP",
        "Avenida 9 de Julho, 3000 - Bela Vista, São Paulo - SP",
        "Rua Bela Cintra, 1000 - Jardins, São Paulo - SP",
        "Avenida Europa, 2000 - Jardins, São Paulo - SP",
        "Rua Estados Unidos, 500 - Jardins, São Paulo - SP"
    )
    
    suspend fun getAddressSuggestions(query: String): Flow<Result<List<String>>> = flow {
        try {
            delay(200) // Simula delay de API
            
            val suggestions = realAddresses.filter { address ->
                address.contains(query, ignoreCase = true)
            }.take(5)
            
            emit(Result.success(suggestions))
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }
    
    suspend fun calculateRouteAndPricing(
        origin: String,
        destination: String
    ): Flow<Result<RouteInfo>> = flow {
        try {
            delay(800) // Simula cálculo de rota
            
            // Simula cálculo real de distância e tempo
            val distance = Random.nextDouble(2.0, 25.0) // km
            val estimatedTime = (distance * Random.nextDouble(2.0, 4.0)).toInt() + 5 // minutos
            
            // Preços dinâmicos baseados em distância, tráfego e demanda
            val basePrice = 5.0
            val distancePrice = distance * 2.5
            val trafficMultiplier = Random.nextDouble(1.0, 1.8) // Simula tráfego
            val demandMultiplier = Random.nextDouble(0.9, 1.5) // Simula demanda
            
            val totalPrice = (basePrice + distancePrice) * trafficMultiplier * demandMultiplier
            
            val routeInfo = RouteInfo(
                distance = distance,
                estimatedTime = estimatedTime,
                basePrice = totalPrice,
                trafficMultiplier = trafficMultiplier,
                demandMultiplier = demandMultiplier,
                origin = origin,
                destination = destination
            )
            
            emit(Result.success(routeInfo))
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }
    
    suspend fun createServiceRequest(
        clientId: String,
        category: ServiceCategory,
        origin: String,
        destination: String,
        price: Double
    ): Flow<Result<Service>> = flow {
        try {
            delay(1000) // Simula criação de serviço
            
            val service = Service(
                id = "service_${System.currentTimeMillis()}",
                clientId = clientId,
                providerId = null,
                category = category,
                title = getServiceTitle(category),
                description = "Serviço solicitado de $origin para $destination",
                price = price,
                status = ServiceStatus.PENDING,
                location = Location(
                    latitude = -23.5505 + Random.nextDouble(-0.1, 0.1),
                    longitude = -46.6333 + Random.nextDouble(-0.1, 0.1),
                    address = origin
                ),
                destination = Location(
                    latitude = -23.5489 + Random.nextDouble(-0.1, 0.1),
                    longitude = -46.6388 + Random.nextDouble(-0.1, 0.1),
                    address = destination
                ),
                estimatedTime = (price / 2.5).toInt() + 5,
                distance = price / 2.5,
                createdAt = Date(),
                acceptedAt = null,
                startedAt = null,
                completedAt = null
            )
            
            realServices.add(service)
            emit(Result.success(service))
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }
    
    suspend fun getActiveServices(clientId: String): Flow<Result<List<Service>>> = flow {
        try {
            delay(300)
            
            val activeServices = realServices.filter { service ->
                service.clientId == clientId && 
                service.status in listOf(ServiceStatus.PENDING, ServiceStatus.ACCEPTED, ServiceStatus.IN_PROGRESS)
            }
            
            emit(Result.success(activeServices))
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }
    
    suspend fun getServiceHistory(clientId: String): Flow<Result<List<Service>>> = flow {
        try {
            delay(400)
            
            val history = realServices.filter { service ->
                service.clientId == clientId && 
                service.status == ServiceStatus.COMPLETED
            }.sortedByDescending { it.completedAt }
            
            emit(Result.success(history))
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }
    
    suspend fun cancelService(serviceId: String): Flow<Result<Boolean>> = flow {
        try {
            delay(500)
            
            val service = realServices.find { it.id == serviceId }
            if (service != null && service.status == ServiceStatus.PENDING) {
                val updatedService = service.copy(status = ServiceStatus.CANCELLED)
                val index = realServices.indexOf(service)
                realServices[index] = updatedService
                emit(Result.success(true))
            } else {
                emit(Result.failure(Exception("Serviço não pode ser cancelado")))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }
    
    suspend fun rateService(serviceId: String, rating: Int, review: String?): Flow<Result<Boolean>> = flow {
        try {
            delay(300)
            
            val service = realServices.find { it.id == serviceId }
            if (service != null) {
                val updatedService = service.copy(
                    rating = rating,
                    review = review
                )
                val index = realServices.indexOf(service)
                realServices[index] = updatedService
                emit(Result.success(true))
            } else {
                emit(Result.failure(Exception("Serviço não encontrado")))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }
    
    private fun getServiceTitle(category: ServiceCategory): String {
        return when (category) {
            ServiceCategory.TRANSPORT -> "Transporte"
            ServiceCategory.DELIVERY -> "Entrega"
            ServiceCategory.CLEANING -> "Limpeza"
            ServiceCategory.MAINTENANCE -> "Manutenção"
            ServiceCategory.CONSULTATION -> "Consultoria"
            ServiceCategory.OTHER -> "Serviço"
        }
    }
}

data class RouteInfo(
    val distance: Double, // km
    val estimatedTime: Int, // minutos
    val basePrice: Double, // R$
    val trafficMultiplier: Double,
    val demandMultiplier: Double,
    val origin: String,
    val destination: String
)

