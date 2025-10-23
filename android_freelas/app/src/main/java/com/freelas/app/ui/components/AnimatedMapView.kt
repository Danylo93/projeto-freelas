package com.freelas.app.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.freelas.app.data.model.*
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.model.*
import com.google.maps.android.compose.*
import androidx.compose.material3.MaterialTheme
import kotlinx.coroutines.delay

@Composable
fun AnimatedMapView(
    currentLocation: Location?,
    destination: Location?,
    route: Route?,
    vehicleLocation: VehicleLocation?,
    onMapLoaded: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    var mapLoaded by remember { mutableStateOf(false) }
    val cameraPositionState = rememberCameraPositionState()
    
    // Animation for vehicle marker
    val infiniteTransition = rememberInfiniteTransition(label = "vehicle")
    val vehicleScale by infiniteTransition.animateFloat(
        initialValue = 0.8f,
        targetValue = 1.2f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = EaseInOutCubic),
            repeatMode = RepeatMode.Reverse
        ),
        label = "vehicleScale"
    )
    
    // Animation for route polyline
    val routeAnimation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(3000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "routeAnimation"
    )
    
    // Camera animation
    LaunchedEffect(vehicleLocation) {
        vehicleLocation?.let { vehicle ->
            val cameraUpdate = CameraUpdateFactory.newLatLngZoom(
                LatLng(vehicle.location.latitude, vehicle.location.longitude),
                17f
            )
            cameraPositionState.animate(cameraUpdate)
        }
    }
    
    // Center camera on route bounds when route is loaded
    LaunchedEffect(route) {
        route?.let { r ->
            val bounds = r.bounds?.let { bounds ->
                LatLngBounds(
                    LatLng(bounds.southwest.latitude, bounds.southwest.longitude),
                    LatLng(bounds.northeast.latitude, bounds.northeast.longitude)
                )
            }
            
            if (bounds != null) {
                val cameraUpdate = CameraUpdateFactory.newLatLngBounds(bounds, 100)
                cameraPositionState.animate(cameraUpdate)
            }
        }
    }
    
    Box(modifier = modifier) {
        GoogleMap(
            cameraPositionState = cameraPositionState,
            onMapLoaded = {
                mapLoaded = true
                onMapLoaded()
            },
            properties = MapProperties(
                isMyLocationEnabled = true,
                mapType = MapType.NORMAL
            )
        ) {
            // Current location marker
            currentLocation?.let { location ->
                Marker(
                    state = MarkerState(
                        position = LatLng(location.latitude, location.longitude)
                    ),
                    title = "Sua localização",
                    icon = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_GREEN)
                )
            }
            
            // Destination marker
            destination?.let { dest ->
                Marker(
                    state = MarkerState(
                        position = LatLng(dest.latitude, dest.longitude)
                    ),
                    title = "Destino",
                    icon = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_RED)
                )
            }
            
            // Route polyline with animation
            route?.let { r ->
                val polylinePoints = decodePolyline(r.polyline)
                if (polylinePoints.isNotEmpty()) {
                    // Full route (gray)
                    Polyline(
                        points = polylinePoints,
                        color = Color.Gray,
                        width = 8f
                    )
                    
                    // Animated progress polyline (blue)
                    val animatedPoints = polylinePoints.take(
                        (polylinePoints.size * routeAnimation).toInt()
                    )
                    if (animatedPoints.isNotEmpty()) {
                        Polyline(
                            points = animatedPoints,
                            color = Color.Blue,
                            width = 12f
                        )
                    }
                }
            }
            
            // Animated vehicle marker
            vehicleLocation?.let { vehicle ->
                val vehiclePosition = LatLng(vehicle.location.latitude, vehicle.location.longitude)
                
                Marker(
                    state = MarkerState(position = vehiclePosition),
                    title = "Veículo em movimento",
                    icon = BitmapDescriptorFactory.fromBitmap(
                        createRotatedVehicleBitmap(vehicle.heading)
                    ),
                    anchor = Offset(0.5f, 0.5f)
                )
                
                // Vehicle status info window
                MarkerInfoWindow(
                    state = MarkerState(position = vehiclePosition),
                    title = getVehicleStatusText(vehicle.status),
                    snippet = "Velocidade: ${vehicle.speed.toInt()} km/h"
                )
            }
        }
        
        // Route information overlay
        if (route != null && vehicleLocation != null) {
            RouteInfoOverlay(
                route = route,
                vehicleLocation = vehicleLocation,
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .padding(16.dp)
            )
        }
        
        // Loading indicator
        if (!mapLoaded) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.White.copy(alpha = 0.8f)),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

@Composable
fun RouteInfoOverlay(
    route: Route,
    vehicleLocation: VehicleLocation,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.9f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Tempo estimado",
                        fontSize = 12.sp,
                        color = Color.Gray
                    )
                    Text(
                        text = formatDuration(route.duration),
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
                
                Column(
                    horizontalAlignment = Alignment.End
                ) {
                    Text(
                        text = "Distância",
                        fontSize = 12.sp,
                        color = Color.Gray
                    )
                    Text(
                        text = formatDistance(route.distance),
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Vehicle status
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                VehicleStatusIndicator(status = vehicleLocation.status)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = getVehicleStatusText(vehicleLocation.status),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}

@Composable
fun VehicleStatusIndicator(
    status: VehicleStatus,
    modifier: Modifier = Modifier
) {
    val color = when (status) {
        VehicleStatus.APPROACHING -> Color(0xFFFF9800)
        VehicleStatus.ARRIVED -> Color.Green
        VehicleStatus.IN_PROGRESS -> Color.Blue
        VehicleStatus.COMPLETED -> Color.Gray
    }
    
    val infiniteTransition = rememberInfiniteTransition(label = "status")
    val pulse by infiniteTransition.animateFloat(
        initialValue = 0.8f,
        targetValue = 1.2f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = EaseInOutCubic),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )
    
    Box(
        modifier = modifier
            .size(12.dp * pulse)
            .background(
                color = color,
                shape = androidx.compose.foundation.shape.CircleShape
            )
    )
}

private fun getVehicleStatusText(status: VehicleStatus): String {
    return when (status) {
        VehicleStatus.APPROACHING -> "A caminho"
        VehicleStatus.ARRIVED -> "Chegou"
        VehicleStatus.IN_PROGRESS -> "Em movimento"
        VehicleStatus.COMPLETED -> "Concluído"
    }
}

private fun formatDuration(seconds: Int): String {
    val minutes = seconds / 60
    return if (minutes < 60) {
        "${minutes} min"
    } else {
        val hours = minutes / 60
        val remainingMinutes = minutes % 60
        "${hours}h ${remainingMinutes}min"
    }
}

private fun formatDistance(meters: Double): String {
    return if (meters < 1000) {
        "${meters.toInt()} m"
    } else {
        "${String.format("%.1f", meters / 1000)} km"
    }
}

private fun decodePolyline(encoded: String): List<LatLng> {
    // Simplified polyline decoding
    // In a real implementation, you would use the full polyline decoding algorithm
    return emptyList()
}

private fun createRotatedVehicleBitmap(heading: Float): android.graphics.Bitmap {
    // Create a rotated vehicle bitmap
    // This would create a bitmap with a vehicle icon rotated to match the heading
    return android.graphics.Bitmap.createBitmap(48, 48, android.graphics.Bitmap.Config.ARGB_8888)
}
