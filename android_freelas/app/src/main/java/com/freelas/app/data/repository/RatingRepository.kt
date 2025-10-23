package com.freelas.app.data.repository

import com.freelas.app.data.model.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import java.util.*
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repositório para gerenciar avaliações
 */
@Singleton
class RatingRepository @Inject constructor() {
    
    /**
     * Histórico de avaliações
     */
    private val ratingHistory = mutableListOf<ServiceRating>()
    
    /**
     * Obtém as categorias de avaliação disponíveis
     */
    fun getRatingCategories(): List<RatingCategory> {
        return RatingCategories.getAllCategories()
    }
    
    /**
     * Obtém as categorias positivas
     */
    fun getPositiveCategories(): List<RatingCategory> {
        return RatingCategories.POSITIVE_CATEGORIES
    }
    
    /**
     * Obtém as categorias negativas
     */
    fun getNegativeCategories(): List<RatingCategory> {
        return RatingCategories.NEGATIVE_CATEGORIES
    }
    
    /**
     * Submete uma avaliação
     */
    suspend fun submitRating(request: RatingRequest): RatingResponse {
        // Simular delay de processamento
        delay(1000)
        
        val selectedCategories = RatingCategories.getAllCategories()
            .filter { it.id in request.categoryIds }
        
        val rating = ServiceRating(
            id = "rating_${System.currentTimeMillis()}",
            serviceId = request.serviceId,
            clientId = "client_001", // Mock client ID
            providerId = "provider_001", // Mock provider ID
            rating = request.rating,
            comment = request.comment,
            categories = selectedCategories,
            createdAt = Date(),
            isCompleted = true
        )
        
        // Adicionar ao histórico
        ratingHistory.add(rating)
        
        return RatingResponse(
            ratingId = rating.id,
            success = true,
            message = "Avaliação enviada com sucesso!"
        )
    }
    
    /**
     * Obtém o histórico de avaliações
     */
    fun getRatingHistory(): List<ServiceRating> {
        return ratingHistory.toList()
    }
    
    /**
     * Obtém uma avaliação específica
     */
    fun getRating(ratingId: String): ServiceRating? {
        return ratingHistory.find { it.id == ratingId }
    }
    
    /**
     * Obtém avaliações por serviço
     */
    fun getRatingsByService(serviceId: String): List<ServiceRating> {
        return ratingHistory.filter { it.serviceId == serviceId }
    }
    
    /**
     * Obtém avaliações por prestador
     */
    fun getRatingsByProvider(providerId: String): List<ServiceRating> {
        return ratingHistory.filter { it.providerId == providerId }
    }
    
    /**
     * Calcula a média de avaliações de um prestador
     */
    fun getProviderAverageRating(providerId: String): Double {
        val ratings = getRatingsByProvider(providerId)
        return if (ratings.isNotEmpty()) {
            ratings.map { it.rating }.average()
        } else {
            0.0
        }
    }
    
    /**
     * Obtém estatísticas de avaliação
     */
    fun getRatingStats(providerId: String): Map<Int, Int> {
        val ratings = getRatingsByProvider(providerId)
        return ratings.groupingBy { it.rating }.eachCount()
    }
}
