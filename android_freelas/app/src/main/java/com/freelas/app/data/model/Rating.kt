package com.freelas.app.data.model

import android.os.Parcelable
import kotlinx.parcelize.Parcelize
import java.util.Date

/**
 * Modelo de dados para avaliação do serviço
 */
@Parcelize
data class ServiceRating(
    val id: String,
    val serviceId: String,
    val clientId: String,
    val providerId: String,
    val rating: Int, // 1-5 estrelas
    val comment: String? = null,
    val categories: List<RatingCategory> = emptyList(),
    val createdAt: Date,
    val isCompleted: Boolean = false
) : Parcelable

/**
 * Categorias de avaliação
 */
@Parcelize
data class RatingCategory(
    val id: String,
    val name: String,
    val description: String,
    val isPositive: Boolean = true
) : Parcelable

/**
 * Modelo para solicitação de avaliação
 */
@Parcelize
data class RatingRequest(
    val serviceId: String,
    val rating: Int,
    val comment: String? = null,
    val categoryIds: List<String> = emptyList()
) : Parcelable

/**
 * Modelo para resposta da avaliação
 */
@Parcelize
data class RatingResponse(
    val ratingId: String,
    val success: Boolean,
    val message: String
) : Parcelable

/**
 * Categorias pré-definidas de avaliação
 */
object RatingCategories {
    val POSITIVE_CATEGORIES = listOf(
        RatingCategory(
            id = "punctual",
            name = "Pontual",
            description = "Chegou no horário",
            isPositive = true
        ),
        RatingCategory(
            id = "friendly",
            name = "Educado",
            description = "Muito educado e simpático",
            isPositive = true
        ),
        RatingCategory(
            id = "clean_vehicle",
            name = "Veículo limpo",
            description = "Carro limpo e organizado",
            isPositive = true
        ),
        RatingCategory(
            id = "safe_driving",
            name = "Dirigiu com segurança",
            description = "Condução segura e responsável",
            isPositive = true
        ),
        RatingCategory(
            id = "good_route",
            name = "Rota otimizada",
            description = "Escolheu a melhor rota",
            isPositive = true
        )
    )
    
    val NEGATIVE_CATEGORIES = listOf(
        RatingCategory(
            id = "late",
            name = "Atrasado",
            description = "Chegou atrasado",
            isPositive = false
        ),
        RatingCategory(
            id = "rude",
            name = "Mal educado",
            description = "Foi grosseiro ou mal educado",
            isPositive = false
        ),
        RatingCategory(
            id = "dirty_vehicle",
            name = "Veículo sujo",
            description = "Carro sujo ou desorganizado",
            isPositive = false
        ),
        RatingCategory(
            id = "unsafe_driving",
            name = "Dirigiu perigosamente",
            description = "Condução perigosa ou imprudente",
            isPositive = false
        ),
        RatingCategory(
            id = "bad_route",
            name = "Rota ruim",
            description = "Escolheu uma rota ruim",
            isPositive = false
        )
    )
    
    fun getAllCategories(): List<RatingCategory> {
        return POSITIVE_CATEGORIES + NEGATIVE_CATEGORIES
    }
}
