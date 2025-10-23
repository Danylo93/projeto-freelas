package com.freelas.app.data.model

import android.os.Parcelable
import kotlinx.parcelize.Parcelize
import java.util.Date

@Parcelize
data class Service(
    val id: String,
    val clientId: String,
    val providerId: String?,
    val category: ServiceCategory,
    val title: String,
    val description: String,
    val price: Double,
    val status: ServiceStatus,
    val location: Location,
    val destination: Location?,
    val estimatedTime: Int, // in minutes
    val distance: Double, // in kilometers
    val createdAt: Date,
    val acceptedAt: Date?,
    val startedAt: Date?,
    val completedAt: Date?,
    val rating: Int? = null,
    val review: String? = null,
    val images: List<String> = emptyList()
) : Parcelable

@Parcelize
data class Location(
    val latitude: Double,
    val longitude: Double,
    val address: String,
    val city: String? = null,
    val state: String? = null,
    val zipCode: String? = null
) : Parcelable

enum class ServiceCategory(val displayName: String, val icon: String) {
    DELIVERY("Entrega", "🚚"),
    TRANSPORT("Transporte", "🚗"),
    CLEANING("Limpeza", "🧹"),
    MAINTENANCE("Manutenção", "🔧"),
    CONSULTATION("Consultoria", "💼"),
    OTHER("Outro", "📋")
}

enum class ServiceStatus(val displayName: String) {
    PENDING("Pendente"),
    ACCEPTED("Aceito"),
    IN_PROGRESS("Em andamento"),
    COMPLETED("Concluído"),
    CANCELLED("Cancelado")
}

@Parcelize
data class ServiceOffer(
    val id: String,
    val serviceId: String,
    val clientId: String,
    val providerId: String?,
    val clientPrice: Double,
    val providerPrice: Double?,
    val status: OfferStatus,
    val createdAt: Date,
    val expiresAt: Date,
    val autoAccept: Boolean = false
) : Parcelable

enum class OfferStatus {
    PENDING,
    ACCEPTED,
    REJECTED,
    EXPIRED,
    COUNTER_OFFER
}

@Parcelize
data class ServiceProviderProfile(
    val id: String,
    val userId: String,
    val category: ServiceCategory,
    val price: Double,
    val description: String,
    val location: Location,
    val isAvailable: Boolean,
    val rating: Double,
    val totalServices: Int,
    val images: List<String> = emptyList(),
    val workingHours: WorkingHours? = null
) : Parcelable

@Parcelize
data class WorkingHours(
    val monday: DaySchedule? = null,
    val tuesday: DaySchedule? = null,
    val wednesday: DaySchedule? = null,
    val thursday: DaySchedule? = null,
    val friday: DaySchedule? = null,
    val saturday: DaySchedule? = null,
    val sunday: DaySchedule? = null
) : Parcelable

@Parcelize
data class DaySchedule(
    val isWorking: Boolean,
    val startTime: String, // Format: "HH:mm"
    val endTime: String    // Format: "HH:mm"
) : Parcelable

