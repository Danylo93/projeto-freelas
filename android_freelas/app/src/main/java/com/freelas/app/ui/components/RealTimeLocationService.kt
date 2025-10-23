package com.freelas.app.ui.components

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.os.Binder
import android.os.Build
import android.os.IBinder
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import com.freelas.app.MainActivity
import com.freelas.app.R
import com.freelas.app.data.model.Location as AppLocation
import com.google.android.gms.location.*
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class RealTimeLocationService : Service() {
    
    @Inject
    lateinit var fusedLocationClient: FusedLocationProviderClient
    
    private val binder = LocationBinder()
    private val serviceScope = CoroutineScope(Dispatchers.IO)
    
    private val _currentLocation = MutableStateFlow<AppLocation?>(null)
    val currentLocation: StateFlow<AppLocation?> = _currentLocation.asStateFlow()
    
    private val _isTracking = MutableStateFlow(false)
    val isTracking: StateFlow<Boolean> = _isTracking.asStateFlow()
    
    private lateinit var locationCallback: LocationCallback
    private lateinit var locationRequest: LocationRequest
    
    companion object {
        private const val NOTIFICATION_ID = 1
        private const val CHANNEL_ID = "location_service_channel"
        private const val CHANNEL_NAME = "Location Service"
        
        fun startService(context: Context) {
            val intent = Intent(context, RealTimeLocationService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }
        
        fun stopService(context: Context) {
            val intent = Intent(context, RealTimeLocationService::class.java)
            context.stopService(intent)
        }
    }
    
    inner class LocationBinder : Binder() {
        fun getService(): RealTimeLocationService = this@RealTimeLocationService
    }
    
    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        setupLocationRequest()
        setupLocationCallback()
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIFICATION_ID, createNotification())
        startLocationUpdates()
        return START_STICKY
    }
    
    override fun onBind(intent: Intent?): IBinder = binder
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Tracks your location for ride sharing"
                setShowBadge(false)
            }
            
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    private fun createNotification(): Notification {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("FreelasApp")
            .setContentText("Acompanhando sua localização")
            .setSmallIcon(R.drawable.ic_notification)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()
    }
    
    private fun setupLocationRequest() {
        locationRequest = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY,
            5000L // 5 seconds
        ).apply {
            setMinUpdateIntervalMillis(2000L) // 2 seconds
            setMaxUpdateDelayMillis(10000L) // 10 seconds
            setWaitForAccurateLocation(false)
        }.build()
    }
    
    private fun setupLocationCallback() {
        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                super.onLocationResult(locationResult)
                locationResult.lastLocation?.let { location ->
                    val appLocation = AppLocation(
                        latitude = location.latitude,
                        longitude = location.longitude,
                        address = "Current Location" // Will be updated with reverse geocoding
                    )
                    _currentLocation.value = appLocation
                }
            }
        }
    }
    
    private fun startLocationUpdates() {
        if (ActivityCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            return
        }
        
        _isTracking.value = true
        fusedLocationClient.requestLocationUpdates(
            locationRequest,
            locationCallback,
            null
        )
    }
    
    private fun stopLocationUpdates() {
        _isTracking.value = false
        fusedLocationClient.removeLocationUpdates(locationCallback)
    }
    
    override fun onDestroy() {
        super.onDestroy()
        stopLocationUpdates()
    }
}



