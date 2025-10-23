package com.freelas.app.data.model

import android.os.Parcelable
import kotlinx.parcelize.Parcelize
import java.util.Date

@Parcelize
data class User(
    val id: String,
    val name: String,
    val email: String,
    val phone: String,
    val userType: UserType,
    val isActive: Boolean,
    val createdAt: Date,
    val profileImage: String? = null,
    val rating: Double? = null,
    val totalServices: Int = 0
) : Parcelable

enum class UserType(val value: Int) {
    PROVIDER(1),
    CLIENT(2);
    
    companion object {
        fun fromValue(value: Int): UserType {
            return values().find { it.value == value } ?: CLIENT
        }
    }
}

@Parcelize
data class AuthRequest(
    val email: String,
    val password: String,
    val name: String? = null,
    val phone: String? = null,
    val userType: UserType? = null
) : Parcelable

@Parcelize
data class AuthResponse(
    val accessToken: String,
    val tokenType: String,
    val userType: UserType,
    val userData: User
) : Parcelable

