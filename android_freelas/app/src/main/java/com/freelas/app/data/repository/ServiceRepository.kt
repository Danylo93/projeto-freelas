package com.freelas.app.data.repository

import com.freelas.app.data.model.*
import com.freelas.app.data.network.ApiService
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ServiceRepository @Inject constructor(
    private val apiService: ApiService
) {
    
    fun getServices(
        status: String? = null,
        category: String? = null
    ): Flow<Result<List<Service>>> = flow {
        try {
            val token = "Bearer ${getAuthToken()}" // Get from auth repository
            val response = apiService.getServices(token, status, category)
            
            if (response.isSuccessful && response.body() != null) {
                emit(Result.success(response.body()!!))
            } else {
                emit(Result.failure(Exception("Failed to fetch services: ${response.message()}")))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }
    
    suspend fun createService(service: Service): Result<Service> {
        return try {
            val token = "Bearer ${getAuthToken()}"
            val response = apiService.createService(token, service)
            
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to create service: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getService(serviceId: String): Result<Service> {
        return try {
            val token = "Bearer ${getAuthToken()}"
            val response = apiService.getService(token, serviceId)
            
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch service: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun updateService(serviceId: String, service: Service): Result<Service> {
        return try {
            val token = "Bearer ${getAuthToken()}"
            val response = apiService.updateService(token, serviceId, service)
            
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to update service: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun deleteService(serviceId: String): Result<Unit> {
        return try {
            val token = "Bearer ${getAuthToken()}"
            val response = apiService.deleteService(token, serviceId)
            
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to delete service: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun createOffer(offer: ServiceOffer): Result<ServiceOffer> {
        return try {
            val token = "Bearer ${getAuthToken()}"
            val response = apiService.createOffer(token, offer)
            
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to create offer: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun updateOffer(offerId: String, offer: ServiceOffer): Result<ServiceOffer> {
        return try {
            val token = "Bearer ${getAuthToken()}"
            val response = apiService.updateOffer(token, offerId, offer)
            
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to update offer: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getOffer(offerId: String): Result<ServiceOffer> {
        return try {
            val token = "Bearer ${getAuthToken()}"
            val response = apiService.getOffer(token, offerId)
            
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch offer: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getNearbyProviders(
        latitude: Double,
        longitude: Double,
        radius: Double = 10.0,
        category: String? = null
    ): Result<List<ServiceProviderProfile>> {
        return try {
            val token = "Bearer ${getAuthToken()}"
            val response = apiService.getProviders(token, latitude, longitude, radius, category)
            
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch providers: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun createProviderProfile(profile: ServiceProviderProfile): Result<ServiceProviderProfile> {
        return try {
            val token = "Bearer ${getAuthToken()}"
            val response = apiService.createProviderProfile(token, profile)
            
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to create provider profile: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun updateProviderProfile(profile: ServiceProviderProfile): Result<ServiceProviderProfile> {
        return try {
            val token = "Bearer ${getAuthToken()}"
            val response = apiService.updateProviderProfile(token, profile)
            
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to update provider profile: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getProviderProfile(): Result<ServiceProviderProfile> {
        return try {
            val token = "Bearer ${getAuthToken()}"
            val response = apiService.getProviderProfile(token)
            
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch provider profile: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    // Helper methods for specific use cases
    suspend fun getActiveServices(): Result<List<Service>> {
        return try {
            val token = "Bearer ${getAuthToken()}"
            val response = apiService.getServices(token, "in_progress")
            
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch active services: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getServiceRequests(): Result<List<Service>> {
        return try {
            val token = "Bearer ${getAuthToken()}"
            val response = apiService.getServices(token, "pending")
            
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch service requests: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getProviderEarnings(): Result<ProviderEarnings> {
        // This would typically come from a dedicated earnings endpoint
        // For now, we'll return mock data
        return try {
            Result.success(
                ProviderEarnings(
                    today = 150.0,
                    thisWeek = 850.0,
                    thisMonth = 3200.0,
                    total = 8500.0,
                    completedServices = 45,
                    averageRating = 4.8
                )
            )
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    private fun getAuthToken(): String {
        // This should be injected from AuthRepository or PreferencesManager
        return "mock_token"
    }
}

data class ProviderEarnings(
    val today: Double = 0.0,
    val thisWeek: Double = 0.0,
    val thisMonth: Double = 0.0,
    val total: Double = 0.0,
    val completedServices: Int = 0,
    val averageRating: Double = 0.0
)

