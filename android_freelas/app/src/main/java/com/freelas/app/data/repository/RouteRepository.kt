package com.freelas.app.data.repository

import com.freelas.app.data.model.*
import com.freelas.app.data.network.ApiService
import com.google.android.gms.maps.model.LatLng
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RouteRepository @Inject constructor(
    private val apiService: ApiService
) {
    
    private val _currentRoute = MutableStateFlow<Route?>(null)
    val currentRoute: StateFlow<Route?> = _currentRoute.asStateFlow()
    
    private val _vehicleLocation = MutableStateFlow<VehicleLocation?>(null)
    val vehicleLocation: StateFlow<VehicleLocation?> = _vehicleLocation.asStateFlow()
    
    private val _routeUpdates = MutableStateFlow<RouteUpdate?>(null)
    val routeUpdates: StateFlow<RouteUpdate?> = _routeUpdates.asStateFlow()
    
    suspend fun getDirections(
        origin: Location,
        destination: Location,
        waypoints: List<Location> = emptyList()
    ): Result<Route> {
        return try {
            // This would call Google Directions API
            val mockRoute = createMockRoute(origin, destination, waypoints)
            _currentRoute.value = mockRoute
            Result.success(mockRoute)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun startRouteTracking(route: Route, vehicleId: String) {
        // Start real-time tracking
        simulateVehicleMovement(route, vehicleId)
    }
    
    suspend fun stopRouteTracking() {
        _vehicleLocation.value = null
        _routeUpdates.value = null
    }
    
    private suspend fun simulateVehicleMovement(route: Route, vehicleId: String) {
        // Simulate vehicle movement along the route
        val startLocation = route.startLocation
        val endLocation = route.endLocation
        
        // Create intermediate points for smooth animation
        val totalPoints = 20
        val latStep = (endLocation.latitude - startLocation.latitude) / totalPoints
        val lngStep = (endLocation.longitude - startLocation.longitude) / totalPoints
        
        repeat(totalPoints) { index ->
            val progress = (index + 1) / totalPoints.toFloat()
            val currentLat = startLocation.latitude + (latStep * (index + 1))
            val currentLng = startLocation.longitude + (lngStep * (index + 1))
            
            val currentLocation = Location(
                latitude = currentLat,
                longitude = currentLng,
                address = "Moving to destination"
            )
            
            // Calculate bearing (heading) towards next point
            val bearing = calculateBearing(
                startLocation.latitude, startLocation.longitude,
                currentLat, currentLng
            )
            
            val vehicleLocation = VehicleLocation(
                vehicleId = vehicleId,
                location = currentLocation,
                heading = bearing,
                speed = 30f + (index * 2), // Simulate speed increase
                timestamp = System.currentTimeMillis(),
                status = when {
                    progress < 0.1f -> VehicleStatus.APPROACHING
                    progress < 0.9f -> VehicleStatus.IN_PROGRESS
                    else -> VehicleStatus.ARRIVED
                }
            )
            
            _vehicleLocation.value = vehicleLocation
            
            // Create route update
            val remainingDistance = route.distance * (1 - progress)
            val estimatedArrival = System.currentTimeMillis() + ((route.duration * (1 - progress)) * 1000).toLong()
            
            val routeUpdate = RouteUpdate(
                vehicleLocation = vehicleLocation,
                remainingDistance = remainingDistance,
                estimatedArrival = estimatedArrival,
                nextInstruction = route.instructions.getOrNull(index % route.instructions.size)
            )
            
            _routeUpdates.value = routeUpdate
            
            // Simulate real-time updates
            kotlinx.coroutines.delay(2000) // Update every 2 seconds
        }
    }
    
    private fun createMockRoute(origin: Location, destination: Location, waypoints: List<Location>): Route {
        val distance = calculateDistance(origin, destination)
        val duration = (distance / 1000.0 * 2).toInt() // Assume 50 km/h average speed
        
        val instructions = listOf(
            RouteInstruction(
                instruction = "Siga reto por 500m",
                distance = 500.0,
                duration = 30,
                maneuver = "straight",
                location = origin
            ),
            RouteInstruction(
                instruction = "Vire à direita na próxima rua",
                distance = 200.0,
                duration = 15,
                maneuver = "turn-right",
                location = Location(
                    latitude = (origin.latitude + destination.latitude) / 2,
                    longitude = (origin.longitude + destination.longitude) / 2,
                    address = "Intersection"
                )
            ),
            RouteInstruction(
                instruction = "Você chegou ao destino",
                distance = 0.0,
                duration = 0,
                maneuver = "arrive",
                location = destination
            )
        )
        
        return Route(
            id = "route_${System.currentTimeMillis()}",
            startLocation = origin,
            endLocation = destination,
            waypoints = waypoints,
            polyline = "mock_polyline_encoded_string",
            distance = distance,
            duration = duration,
            instructions = instructions,
            bounds = RouteBounds(
                northeast = Location(
                    latitude = maxOf(origin.latitude, destination.latitude) + 0.01,
                    longitude = maxOf(origin.longitude, destination.longitude) + 0.01,
                    address = "Northeast bound"
                ),
                southwest = Location(
                    latitude = minOf(origin.latitude, destination.latitude) - 0.01,
                    longitude = minOf(origin.longitude, destination.longitude) - 0.01,
                    address = "Southwest bound"
                )
            )
        )
    }
    
    private fun calculateDistance(from: Location, to: Location): Double {
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
    
    private fun calculateBearing(fromLat: Double, fromLng: Double, toLat: Double, toLng: Double): Float {
        val lat1 = Math.toRadians(fromLat)
        val lat2 = Math.toRadians(toLat)
        val deltaLng = Math.toRadians(toLng - fromLng)
        
        val x = kotlin.math.sin(deltaLng) * kotlin.math.cos(lat2)
        val y = kotlin.math.cos(lat1) * kotlin.math.sin(lat2) - 
                kotlin.math.sin(lat1) * kotlin.math.cos(lat2) * kotlin.math.cos(deltaLng)
        
        val bearing = Math.toDegrees(kotlin.math.atan2(x, y))
        return ((bearing + 360) % 360).toFloat()
    }
    
    fun getCurrentVehicleLocation(): VehicleLocation? = _vehicleLocation.value
    
    fun getCurrentRoute(): Route? = _currentRoute.value
    
    fun clearRoute() {
        _currentRoute.value = null
        _vehicleLocation.value = null
        _routeUpdates.value = null
    }
}



