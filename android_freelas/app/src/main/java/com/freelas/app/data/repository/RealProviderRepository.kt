package com.freelas.app.data.repository

import com.freelas.app.data.model.Location
import com.freelas.app.data.model.ServiceProviderProfile
import com.freelas.app.data.model.ServiceCategory
import com.freelas.app.data.model.WorkingHours
import com.freelas.app.data.model.DaySchedule
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.delay
import java.util.Date
import kotlin.random.Random

class RealProviderRepository {
    
    // Simula prestadores reais em São Paulo
    private val realProviders = listOf(
        ServiceProviderProfile(
            id = "provider_001",
            userId = "user_001",
            category = ServiceCategory.TRANSPORT,
            price = 2.50, // R$ por km
            description = "Motorista experiente, carro confortável",
            location = Location(
                latitude = -23.5505,
                longitude = -46.6333,
                address = "Centro, São Paulo - SP"
            ),
            isAvailable = true,
            rating = 4.8,
            totalServices = 1247,
            images = listOf("car_001.jpg"),
            workingHours = WorkingHours(
                monday = DaySchedule(true, "06:00", "22:00"),
                tuesday = DaySchedule(true, "06:00", "22:00"),
                wednesday = DaySchedule(true, "06:00", "22:00"),
                thursday = DaySchedule(true, "06:00", "22:00"),
                friday = DaySchedule(true, "06:00", "22:00"),
                saturday = DaySchedule(true, "06:00", "22:00"),
                sunday = DaySchedule(true, "06:00", "22:00")
            )
        ),
        ServiceProviderProfile(
            id = "provider_002",
            userId = "user_002",
            category = ServiceCategory.TRANSPORT,
            price = 2.80,
            description = "Veículo premium, ar condicionado",
            location = Location(
                latitude = -23.5489,
                longitude = -46.6388,
                address = "Vila Madalena, São Paulo - SP"
            ),
            isAvailable = true,
            rating = 4.9,
            totalServices = 892,
            images = listOf("car_002.jpg"),
            workingHours = WorkingHours(
                monday = DaySchedule(true, "07:00", "23:00"),
                tuesday = DaySchedule(true, "07:00", "23:00"),
                wednesday = DaySchedule(true, "07:00", "23:00"),
                thursday = DaySchedule(true, "07:00", "23:00"),
                friday = DaySchedule(true, "07:00", "23:00"),
                saturday = DaySchedule(true, "07:00", "23:00"),
                sunday = DaySchedule(false, "00:00", "00:00")
            )
        ),
        ServiceProviderProfile(
            id = "provider_003",
            userId = "user_003",
            category = ServiceCategory.TRANSPORT,
            price = 2.20,
            description = "Economia, motorista pontual",
            location = Location(
                latitude = -23.5521,
                longitude = -46.6315,
                address = "Pinheiros, São Paulo - SP"
            ),
            isAvailable = true,
            rating = 4.6,
            totalServices = 2156,
            images = listOf("car_003.jpg"),
            workingHours = WorkingHours(
                monday = DaySchedule(true, "05:30", "21:30"),
                tuesday = DaySchedule(true, "05:30", "21:30"),
                wednesday = DaySchedule(true, "05:30", "21:30"),
                thursday = DaySchedule(true, "05:30", "21:30"),
                friday = DaySchedule(true, "05:30", "21:30"),
                saturday = DaySchedule(true, "05:30", "21:30"),
                sunday = DaySchedule(true, "05:30", "21:30")
            )
        ),
        ServiceProviderProfile(
            id = "provider_004",
            userId = "user_004",
            category = ServiceCategory.DELIVERY,
            price = 1.80,
            description = "Entregas rápidas, moto ágil",
            location = Location(
                latitude = -23.5478,
                longitude = -46.6355,
                address = "Itaim Bibi, São Paulo - SP"
            ),
            isAvailable = true,
            rating = 4.7,
            totalServices = 3421,
            images = listOf("moto_001.jpg"),
            workingHours = WorkingHours(
                monday = DaySchedule(true, "08:00", "20:00"),
                tuesday = DaySchedule(true, "08:00", "20:00"),
                wednesday = DaySchedule(true, "08:00", "20:00"),
                thursday = DaySchedule(true, "08:00", "20:00"),
                friday = DaySchedule(true, "08:00", "20:00"),
                saturday = DaySchedule(true, "08:00", "20:00"),
                sunday = DaySchedule(false, "00:00", "00:00")
            )
        ),
        ServiceProviderProfile(
            id = "provider_005",
            userId = "user_005",
            category = ServiceCategory.CLEANING,
            price = 45.0, // R$ por hora
            description = "Limpeza profissional, produtos eco-friendly",
            location = Location(
                latitude = -23.5512,
                longitude = -46.6372,
                address = "Jardins, São Paulo - SP"
            ),
            isAvailable = true,
            rating = 4.9,
            totalServices = 567,
            images = listOf("cleaning_001.jpg"),
            workingHours = WorkingHours(
                monday = DaySchedule(true, "08:00", "18:00"),
                tuesday = DaySchedule(true, "08:00", "18:00"),
                wednesday = DaySchedule(true, "08:00", "18:00"),
                thursday = DaySchedule(true, "08:00", "18:00"),
                friday = DaySchedule(true, "08:00", "18:00"),
                saturday = DaySchedule(false, "00:00", "00:00"),
                sunday = DaySchedule(false, "00:00", "00:00")
            )
        )
    )
    
    suspend fun getNearbyProviders(
        latitude: Double,
        longitude: Double,
        radius: Double
    ): Flow<Result<List<ServiceProviderProfile>>> = flow {
        try {
            // Simula delay de rede
            delay(500)
            
            val userLocation = Location(latitude, longitude, "")
            val nearbyProviders = realProviders.filter { provider ->
                val distance = calculateDistance(
                    userLocation.latitude, userLocation.longitude,
                    provider.location.latitude, provider.location.longitude
                )
                distance <= radius && provider.isAvailable
            }.sortedBy { provider ->
                calculateDistance(
                    userLocation.latitude, userLocation.longitude,
                    provider.location.latitude, provider.location.longitude
                )
            }
            
            emit(Result.success(nearbyProviders))
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }
    
    suspend fun getProviderById(providerId: String): Flow<Result<ServiceProviderProfile?>> = flow {
        try {
            delay(200)
            val provider = realProviders.find { it.id == providerId }
            emit(Result.success(provider))
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }
    
    suspend fun updateProviderLocation(providerId: String, location: Location): Flow<Result<Boolean>> = flow {
        try {
            delay(100)
            // Simula atualização de localização
            emit(Result.success(true))
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }
    
    suspend fun updateProviderAvailability(providerId: String, isAvailable: Boolean): Flow<Result<Boolean>> = flow {
        try {
            delay(100)
            // Simula atualização de disponibilidade
            emit(Result.success(true))
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }
    
    suspend fun getProviderEarnings(providerId: String): Flow<Result<ProviderEarnings>> = flow {
        try {
            delay(300)
            
            // Simula ganhos reais baseados em dados históricos
            val provider = realProviders.find { it.id == providerId }
            val baseEarnings = provider?.totalServices ?: 0
            
            val earnings = ProviderEarnings(
                today = baseEarnings * 0.05 * Random.nextDouble(0.8, 1.2),
                thisWeek = baseEarnings * 0.3 * Random.nextDouble(0.9, 1.1),
                thisMonth = baseEarnings * 1.2 * Random.nextDouble(0.95, 1.05),
                total = baseEarnings.toDouble(),
                completedServices = baseEarnings,
                averageRating = provider?.rating ?: 4.5
            )
            
            emit(Result.success(earnings))
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }
    
    private fun calculateDistance(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val earthRadius = 6371.0 // km
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2)
        val c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return earthRadius * c
    }
}


