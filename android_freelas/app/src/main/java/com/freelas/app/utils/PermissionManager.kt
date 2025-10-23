package com.freelas.app.utils

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class PermissionManager(private val activity: ComponentActivity) {
    
    private val _locationPermissionGranted = MutableStateFlow(false)
    val locationPermissionGranted: StateFlow<Boolean> = _locationPermissionGranted.asStateFlow()
    
    private val locationPermissionRequest = activity.registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val fineLocationGranted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] ?: false
        val coarseLocationGranted = permissions[Manifest.permission.ACCESS_COARSE_LOCATION] ?: false
        
        _locationPermissionGranted.value = fineLocationGranted || coarseLocationGranted
    }
    
    fun checkLocationPermission(): Boolean {
        val fineLocationGranted = ContextCompat.checkSelfPermission(
            activity,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        
        val coarseLocationGranted = ContextCompat.checkSelfPermission(
            activity,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        
        val granted = fineLocationGranted || coarseLocationGranted
        _locationPermissionGranted.value = granted
        return granted
    }
    
    fun requestLocationPermission() {
        if (!checkLocationPermission()) {
            locationPermissionRequest.launch(
                arrayOf(
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                )
            )
        }
    }
    
    fun shouldShowLocationRationale(): Boolean {
        return activity.shouldShowRequestPermissionRationale(Manifest.permission.ACCESS_FINE_LOCATION) ||
               activity.shouldShowRequestPermissionRationale(Manifest.permission.ACCESS_COARSE_LOCATION)
    }
}
