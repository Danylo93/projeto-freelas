package com.freelas.app.data.model

import android.os.Parcelable
import kotlinx.parcelize.Parcelize
import com.google.android.gms.maps.model.LatLng

@Parcelize
data class Route(
    val id: String,
    val startLocation: Location,
    val endLocation: Location,
    val waypoints: List<Location> = emptyList(),
    val polyline: String, // Encoded polyline from Google Directions API
    val distance: Double, // in meters
    val duration: Int, // in seconds
    val instructions: List<RouteInstruction> = emptyList(),
    val bounds: RouteBounds? = null
) : Parcelable

@Parcelize
data class RouteInstruction(
    val instruction: String,
    val distance: Double,
    val duration: Int,
    val maneuver: String? = null,
    val location: Location
) : Parcelable

@Parcelize
data class RouteBounds(
    val northeast: Location,
    val southwest: Location
) : Parcelable

@Parcelize
data class VehicleLocation(
    val vehicleId: String,
    val location: Location,
    val heading: Float, // Bearing in degrees
    val speed: Float, // Speed in km/h
    val timestamp: Long,
    val status: VehicleStatus
) : Parcelable

enum class VehicleStatus {
    APPROACHING,
    ARRIVED,
    IN_PROGRESS,
    COMPLETED
}

@Parcelize
data class RouteUpdate(
    val vehicleLocation: VehicleLocation,
    val remainingDistance: Double,
    val estimatedArrival: Long,
    val nextInstruction: RouteInstruction?
) : Parcelable

// Helper functions for route calculations
fun List<LatLng>.decodePolyline(): List<LatLng> {
    val poly = mutableListOf<LatLng>()
    var index = 0
    val len = this.size
    
    while (index < len) {
        var lat = 0
        var lng = 0
        var shift = 0
        var result = 0
        
        do {
            val b = this[index].latitude.toInt() - 63
            result = result or (b and 0x1f shl shift)
            shift += 5
        } while (b >= 0x20 && ++index < len)
        
        val dlat = if (result and 1 != 0) (result shr 1).inv() else result shr 1
        lat += dlat
        
        shift = 0
        result = 0
        do {
            val b = this[index].longitude.toInt() - 63
            result = result or (b and 0x1f shl shift)
            shift += 5
        } while (b >= 0x20 && ++index < len)
        
        val dlng = if (result and 1 != 0) (result shr 1).inv() else result shr 1
        lng += dlng
        
        poly.add(LatLng(lat / 1E5, lng / 1E5))
    }
    
    return poly
}



