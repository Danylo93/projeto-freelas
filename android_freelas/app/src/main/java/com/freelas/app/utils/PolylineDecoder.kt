package com.freelas.app.utils

import com.google.android.gms.maps.model.LatLng

object PolylineDecoder {
    
    /**
     * Decode a polyline string into a list of LatLng points
     * This is a simplified version of the Google Polyline algorithm
     */
    fun decode(encoded: String): List<LatLng> {
        val poly = mutableListOf<LatLng>()
        var index = 0
        val len = encoded.length
        var lat = 0
        var lng = 0
        
        while (index < len) {
            var b: Int
            var shift = 0
            var result = 0
            
            do {
                b = encoded[index++].code - 63
                result = result or (b and 0x1f shl shift)
                shift += 5
            } while (b >= 0x20)
            
            val dlat = if (result and 1 != 0) (result shr 1).inv() else result shr 1
            lat += dlat
            
            shift = 0
            result = 0
            
            do {
                b = encoded[index++].code - 63
                result = result or (b and 0x1f shl shift)
                shift += 5
            } while (b >= 0x20)
            
            val dlng = if (result and 1 != 0) (result shr 1).inv() else result shr 1
            lng += dlng
            
            poly.add(LatLng(lat / 1E5, lng / 1E5))
        }
        
        return poly
    }
    
    /**
     * Create intermediate points between two locations for smooth animation
     */
    fun createIntermediatePoints(
        start: LatLng,
        end: LatLng,
        numberOfPoints: Int = 20
    ): List<LatLng> {
        val points = mutableListOf<LatLng>()
        
        for (i in 0..numberOfPoints) {
            val ratio = i.toDouble() / numberOfPoints
            val lat = start.latitude + (end.latitude - start.latitude) * ratio
            val lng = start.longitude + (end.longitude - start.longitude) * ratio
            points.add(LatLng(lat, lng))
        }
        
        return points
    }
    
    /**
     * Calculate the bearing between two points
     */
    fun calculateBearing(from: LatLng, to: LatLng): Float {
        val lat1 = Math.toRadians(from.latitude)
        val lat2 = Math.toRadians(to.latitude)
        val deltaLng = Math.toRadians(to.longitude - from.longitude)
        
        val x = kotlin.math.sin(deltaLng) * kotlin.math.cos(lat2)
        val y = kotlin.math.cos(lat1) * kotlin.math.sin(lat2) - 
                kotlin.math.sin(lat1) * kotlin.math.cos(lat2) * kotlin.math.cos(deltaLng)
        
        val bearing = Math.toDegrees(kotlin.math.atan2(x, y))
        return ((bearing + 360) % 360).toFloat()
    }
    
    /**
     * Calculate distance between two points in meters
     */
    fun calculateDistance(from: LatLng, to: LatLng): Double {
        val earthRadius = 6371000.0 // Earth's radius in meters
        val lat1Rad = Math.toRadians(from.latitude)
        val lat2Rad = Math.toRadians(to.latitude)
        val deltaLatRad = Math.toRadians(to.latitude - from.latitude)
        val deltaLngRad = Math.toRadians(to.longitude - from.longitude)
        
        val a = kotlin.math.sin(deltaLatRad / 2) * kotlin.math.sin(deltaLatRad / 2) +
                kotlin.math.cos(lat1Rad) * kotlin.math.cos(lat2Rad) *
                kotlin.math.sin(deltaLngRad / 2) * kotlin.math.sin(deltaLngRad / 2)
        
        val c = 2 * kotlin.math.atan2(kotlin.math.sqrt(a), kotlin.math.sqrt(1 - a))
        
        return earthRadius * c
    }
    
    /**
     * Create a smooth curved path between multiple waypoints
     */
    fun createSmoothPath(waypoints: List<LatLng>): List<LatLng> {
        if (waypoints.size < 2) return waypoints
        
        val smoothPath = mutableListOf<LatLng>()
        
        for (i in 0 until waypoints.size - 1) {
            val start = waypoints[i]
            val end = waypoints[i + 1]
            val intermediatePoints = createIntermediatePoints(start, end, 10)
            smoothPath.addAll(intermediatePoints)
        }
        
        return smoothPath
    }
    
    /**
     * Calculate the progress along a polyline given a current position
     */
    fun calculateProgressAlongRoute(
        route: List<LatLng>,
        currentPosition: LatLng
    ): Float {
        if (route.isEmpty()) return 0f
        
        var minDistance = Double.MAX_VALUE
        var closestIndex = 0
        
        // Find the closest point on the route
        for (i in route.indices) {
            val distance = calculateDistance(currentPosition, route[i])
            if (distance < minDistance) {
                minDistance = distance
                closestIndex = i
            }
        }
        
        return closestIndex.toFloat() / (route.size - 1)
    }
}



