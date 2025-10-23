package com.freelas.app.data.repository

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location as AndroidLocation
import androidx.core.app.ActivityCompat
import com.freelas.app.data.model.Location
import com.freelas.app.data.network.ApiService
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.coroutines.resume

@Singleton
class LocationRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val apiService: ApiService
) {
    
    private val fusedLocationClient: FusedLocationProviderClient = 
        LocationServices.getFusedLocationProviderClient(context)
    
    suspend fun getCurrentLocation(): Result<Location> {
        return try {
            if (!hasLocationPermission()) {
                return Result.failure(Exception("Location permission not granted"))
            }
            
            val androidLocation = getLastKnownLocation()
            if (androidLocation != null) {
                val location = Location(
                    latitude = androidLocation.latitude,
                    longitude = androidLocation.longitude,
                    address = "Current Location" // Will be updated with reverse geocoding
                )
                
                // Get address from coordinates
                val addressResult = reverseGeocode(location.latitude, location.longitude)
                addressResult.fold(
                    onSuccess = { address ->
                        Result.success(location.copy(address = address))
                    },
                    onFailure = {
                        Result.success(location) // Return location even if address fails
                    }
                )
            } else {
                Result.failure(Exception("Unable to get current location"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun geocodeAddress(address: String): Result<Location> {
        return try {
            val response = apiService.geocodeAddress(address)
            
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to geocode address: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun reverseGeocode(latitude: Double, longitude: Double): Result<String> {
        return try {
            val response = apiService.reverseGeocode(latitude, longitude)
            
            if (response.isSuccessful && response.body() != null) {
                val location = response.body()!!
                Result.success(location.address)
            } else {
                Result.failure(Exception("Failed to reverse geocode: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun calculateDistance(
        from: Location,
        to: Location
    ): Double {
        val results = FloatArray(1)
        AndroidLocation.distanceBetween(
            from.latitude,
            from.longitude,
            to.latitude,
            to.longitude,
            results
        )
        return results[0].toDouble() / 1000.0 // Convert to kilometers
    }
    
    suspend fun calculateEstimatedTime(
        from: Location,
        to: Location,
        averageSpeed: Double = 30.0 // km/h
    ): Int {
        val distance = calculateDistance(from, to)
        return ((distance / averageSpeed) * 60).toInt() // Convert to minutes
    }
    
    private suspend fun getLastKnownLocation(): AndroidLocation? {
        return suspendCancellableCoroutine { continuation ->
            val cancellationTokenSource = CancellationTokenSource()
            
            fusedLocationClient.getCurrentLocation(
                Priority.PRIORITY_HIGH_ACCURACY,
                cancellationTokenSource.token
            ).addOnCompleteListener { task ->
                if (task.isSuccessful && task.result != null) {
                    continuation.resume(task.result)
                } else {
                    continuation.resume(null)
                }
            }
            
            continuation.invokeOnCancellation {
                cancellationTokenSource.cancel()
            }
        }
    }
    
    private fun hasLocationPermission(): Boolean {
        return ActivityCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED || 
        ActivityCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }
    
    fun getLocationPermissionStatus(): Array<String> {
        val permissions = mutableListOf<String>()
        
        if (ActivityCompat.checkSelfPermission(
                context,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            permissions.add(Manifest.permission.ACCESS_FINE_LOCATION)
        }
        
        if (ActivityCompat.checkSelfPermission(
                context,
                Manifest.permission.ACCESS_COARSE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            permissions.add(Manifest.permission.ACCESS_COARSE_LOCATION)
        }
        
        return permissions.toTypedArray()
    }
}

