package com.freelas.app.data.model

import android.os.Parcelable
import kotlinx.parcelize.Parcelize

@Parcelize
data class PaymentMethod(
    val id: String,
    val name: String,
    val description: String,
    val type: PaymentMethodType,
    val isDefault: Boolean = false,
    val isEnabled: Boolean = true,
    val icon: String? = null
) : Parcelable

enum class PaymentMethodType {
    CREDIT_CARD,
    DEBIT_CARD,
    PIX,
    CASH,
    DIGITAL_WALLET
}

@Parcelize
data class Payment(
    val id: String,
    val serviceId: String,
    val amount: Double,
    val paymentMethod: PaymentMethod,
    val status: PaymentStatus,
    val transactionId: String?,
    val createdAt: Long,
    val processedAt: Long?
) : Parcelable

enum class PaymentStatus {
    PENDING,
    PROCESSING,
    COMPLETED,
    FAILED,
    CANCELLED,
    REFUNDED
}



