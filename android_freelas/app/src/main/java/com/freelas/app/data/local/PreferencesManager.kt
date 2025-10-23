package com.freelas.app.data.local

import android.content.Context
import android.content.SharedPreferences
import com.freelas.app.data.model.UserType
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PreferencesManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    
    private val prefs: SharedPreferences = context.getSharedPreferences(
        "freelas_prefs", Context.MODE_PRIVATE
    )
    
    companion object {
        private const val KEY_AUTH_TOKEN = "auth_token"
        private const val KEY_USER_TYPE = "user_type"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_USER_NAME = "user_name"
        private const val KEY_USER_EMAIL = "user_email"
        private const val KEY_USER_PHONE = "user_phone"
        private const val KEY_LAST_LOCATION_LAT = "last_location_lat"
        private const val KEY_LAST_LOCATION_LNG = "last_location_lng"
        private const val KEY_NOTIFICATIONS_ENABLED = "notifications_enabled"
        private const val KEY_AUTO_ACCEPT_OFFERS = "auto_accept_offers"
    }
    
    fun saveAuthToken(token: String) {
        prefs.edit().putString(KEY_AUTH_TOKEN, token).apply()
    }
    
    fun getAuthToken(): String? {
        return prefs.getString(KEY_AUTH_TOKEN, null)
    }
    
    fun saveUserType(userType: Int) {
        prefs.edit().putInt(KEY_USER_TYPE, userType).apply()
    }
    
    fun getUserType(): UserType? {
        val userTypeValue = prefs.getInt(KEY_USER_TYPE, -1)
        return if (userTypeValue != -1) UserType.fromValue(userTypeValue) else null
    }
    
    fun saveUserInfo(userId: String, name: String, email: String, phone: String) {
        prefs.edit()
            .putString(KEY_USER_ID, userId)
            .putString(KEY_USER_NAME, name)
            .putString(KEY_USER_EMAIL, email)
            .putString(KEY_USER_PHONE, phone)
            .apply()
    }
    
    fun getUserId(): String? {
        return prefs.getString(KEY_USER_ID, null)
    }
    
    fun getUserName(): String? {
        return prefs.getString(KEY_USER_NAME, null)
    }
    
    fun getUserEmail(): String? {
        return prefs.getString(KEY_USER_EMAIL, null)
    }
    
    fun getUserPhone(): String? {
        return prefs.getString(KEY_USER_PHONE, null)
    }
    
    fun saveLastLocation(latitude: Double, longitude: Double) {
        prefs.edit()
            .putFloat(KEY_LAST_LOCATION_LAT, latitude.toFloat())
            .putFloat(KEY_LAST_LOCATION_LNG, longitude.toFloat())
            .apply()
    }
    
    fun getLastLocation(): Pair<Double, Double>? {
        val lat = prefs.getFloat(KEY_LAST_LOCATION_LAT, 0f)
        val lng = prefs.getFloat(KEY_LAST_LOCATION_LNG, 0f)
        return if (lat != 0f && lng != 0f) {
            Pair(lat.toDouble(), lng.toDouble())
        } else null
    }
    
    fun setNotificationsEnabled(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_NOTIFICATIONS_ENABLED, enabled).apply()
    }
    
    fun areNotificationsEnabled(): Boolean {
        return prefs.getBoolean(KEY_NOTIFICATIONS_ENABLED, true)
    }
    
    fun setAutoAcceptOffers(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_AUTO_ACCEPT_OFFERS, enabled).apply()
    }
    
    fun isAutoAcceptOffersEnabled(): Boolean {
        return prefs.getBoolean(KEY_AUTO_ACCEPT_OFFERS, false)
    }
    
    fun clearAuthData() {
        prefs.edit()
            .remove(KEY_AUTH_TOKEN)
            .remove(KEY_USER_TYPE)
            .remove(KEY_USER_ID)
            .remove(KEY_USER_NAME)
            .remove(KEY_USER_EMAIL)
            .remove(KEY_USER_PHONE)
            .apply()
    }
    
    fun clearAll() {
        prefs.edit().clear().apply()
    }
}

