package com.freelas.app.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material3.Icon
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Rect
import com.freelas.app.data.model.Location
import com.freelas.app.data.model.Service
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.model.*
import com.google.maps.android.compose.*
import kotlinx.coroutines.delay
import kotlin.math.*

@Composable
fun TrackingMapView(
    service: Service,
    currentVehicleLocation: Location?,
    modifier: Modifier = Modifier,
    permissionManager: com.freelas.app.utils.PermissionManager? = null
) {
    val context = LocalContext.current
    
    // Estado do mapa
    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(
            LatLng(
                currentVehicleLocation?.latitude ?: service.location.latitude,
                currentVehicleLocation?.longitude ?: service.location.longitude
            ),
            15f
        )
    }
    
    // Estado das permissões
    val locationPermissionGranted by permissionManager?.locationPermissionGranted?.collectAsState(initial = false) ?: remember { mutableStateOf(false) }
    
    // Estado da animação do carro
    val infiniteTransition = rememberInfiniteTransition(label = "car_animation")
    val carRotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "car_rotation"
    )
    
    // Estado da pulsação do carro
    val carPulse by infiniteTransition.animateFloat(
        initialValue = 0.8f,
        targetValue = 1.2f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "car_pulse"
    )
    
    // Coordenadas da rota (simuladas)
    val routeCoordinates = remember {
        generateRouteCoordinates(
            start = service.location,
            end = service.destination ?: service.location
        )
    }
    
    // Estado do veículo atual
    var vehiclePosition by remember { mutableStateOf(0) }
    
    // Animar o movimento do veículo
    LaunchedEffect(routeCoordinates) {
        while (vehiclePosition < routeCoordinates.size - 1) {
            delay(2000) // Move a cada 2 segundos
            vehiclePosition++
        }
    }
    
    // Atualizar câmera para seguir o veículo
    LaunchedEffect(vehiclePosition, routeCoordinates) {
        if (vehiclePosition < routeCoordinates.size) {
            val currentPos = routeCoordinates[vehiclePosition]
            cameraPositionState.animate(
                CameraUpdateFactory.newLatLngZoom(
                    LatLng(currentPos.latitude, currentPos.longitude),
                    16f
                )
            )
        }
    }
    
    // Atualizar câmera quando a localização do veículo mudar
    LaunchedEffect(currentVehicleLocation) {
        currentVehicleLocation?.let { location ->
            cameraPositionState.animate(
                CameraUpdateFactory.newLatLngZoom(
                    LatLng(location.latitude, location.longitude),
                    16f
                )
            )
        }
    }
    
    GoogleMap(
        modifier = modifier,
        cameraPositionState = cameraPositionState,
        properties = MapProperties(
            isMyLocationEnabled = locationPermissionGranted
        )
    ) {
        // Desenhar rota
        if (routeCoordinates.isNotEmpty()) {
            Polyline(
                points = routeCoordinates.map { LatLng(it.latitude, it.longitude) },
                color = Color(0xFF2196F3),
                width = 8f
            )
        }
        
        // Marcador de origem
        Marker(
            state = MarkerState(
                position = LatLng(service.location.latitude, service.location.longitude)
            ),
            title = "Origem",
            snippet = service.location.address,
            icon = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_GREEN)
        )
        
        // Marcador de destino
        service.destination?.let { destination ->
            Marker(
                state = MarkerState(
                    position = LatLng(destination.latitude, destination.longitude)
                ),
                title = "Destino",
                snippet = destination.address,
                icon = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_RED)
            )
        }
        
        // Ícone do veículo animado - apenas um marcador
        val vehicleLocation = if (currentVehicleLocation != null) {
            // Usar localização real se disponível
            currentVehicleLocation
        } else if (vehiclePosition < routeCoordinates.size) {
            // Usar simulação se não houver localização real
            routeCoordinates[vehiclePosition]
        } else {
            // Fallback para a primeira posição da rota
            routeCoordinates.firstOrNull()
        }
        
        vehicleLocation?.let { location ->
            // Animação de pulso para o veículo
            val infiniteTransition = rememberInfiniteTransition(label = "vehicle_pulse")
            val pulseScale by infiniteTransition.animateFloat(
                initialValue = 0.8f,
                targetValue = 1.2f,
                animationSpec = infiniteRepeatable(
                    animation = tween(1000, easing = FastOutSlowInEasing),
                    repeatMode = RepeatMode.Reverse
                ),
                label = "pulse"
            )
            
            Marker(
                state = MarkerState(
                    position = LatLng(location.latitude, location.longitude)
                ),
                title = "Seu motorista",
                snippet = "João Silva - Honda Civic ABC-1234",
                icon = createAnimatedCarIcon(pulseScale) // Usar ícone de carro animado
            )
        }
    }
}

/**
 * Cria um ícone de carro personalizado para o marcador do veículo
 */
private fun createCarIcon(): BitmapDescriptor {
    return createAnimatedCarIcon(1f)
}

/**
 * Cria um ícone de carro animado para o marcador do veículo
 */
private fun createAnimatedCarIcon(scale: Float): BitmapDescriptor {
    val size = 80
    val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    
    // Fundo transparente
    canvas.drawColor(android.graphics.Color.TRANSPARENT)
    
    // Paint para o carro
    val carPaint = Paint().apply {
        color = android.graphics.Color.parseColor("#2196F3") // Azul
        style = Paint.Style.FILL
        isAntiAlias = true
    }
    
    // Paint para detalhes
    val detailPaint = Paint().apply {
        color = android.graphics.Color.parseColor("#1976D2") // Azul mais escuro
        style = Paint.Style.FILL
        isAntiAlias = true
    }
    
    // Paint para janelas
    val windowPaint = Paint().apply {
        color = android.graphics.Color.parseColor("#E3F2FD") // Azul claro
        style = Paint.Style.FILL
        isAntiAlias = true
    }
    
    val centerX = size / 2f
    val centerY = size / 2f
    
    // Aplicar escala
    val scaledSize = (size * scale).toInt()
    val offsetX = (size - scaledSize) / 2f
    val offsetY = (size - scaledSize) / 2f
    
    // Sombra do carro
    val shadowPaint = Paint().apply {
        color = android.graphics.Color.parseColor("#40000000")
        style = Paint.Style.FILL
        isAntiAlias = true
    }
    
    val shadowRect = Rect(
        (centerX - 25 + offsetX + 2).toInt(),
        (centerY - 15 + offsetY + 2).toInt(),
        (centerX + 25 + offsetX + 2).toInt(),
        (centerY + 15 + offsetY + 2).toInt()
    )
    canvas.drawRoundRect(
        shadowRect.left.toFloat(),
        shadowRect.top.toFloat(),
        shadowRect.right.toFloat(),
        shadowRect.bottom.toFloat(),
        8f, 8f,
        shadowPaint
    )
    
    // Corpo do carro (retângulo arredondado)
    val carRect = Rect(
        (centerX - 25 + offsetX).toInt(),
        (centerY - 15 + offsetY).toInt(),
        (centerX + 25 + offsetX).toInt(),
        (centerY + 15 + offsetY).toInt()
    )
    canvas.drawRoundRect(
        carRect.left.toFloat(),
        carRect.top.toFloat(),
        carRect.right.toFloat(),
        carRect.bottom.toFloat(),
        8f, 8f,
        carPaint
    )
    
    // Janelas do carro
    val frontWindow = Rect(
        (centerX - 20 + offsetX).toInt(),
        (centerY - 12 + offsetY).toInt(),
        (centerX - 5 + offsetX).toInt(),
        (centerY - 2 + offsetY).toInt()
    )
    canvas.drawRoundRect(
        frontWindow.left.toFloat(),
        frontWindow.top.toFloat(),
        frontWindow.right.toFloat(),
        frontWindow.bottom.toFloat(),
        4f, 4f,
        windowPaint
    )
    
    val backWindow = Rect(
        (centerX + 5 + offsetX).toInt(),
        (centerY - 12 + offsetY).toInt(),
        (centerX + 20 + offsetX).toInt(),
        (centerY - 2 + offsetY).toInt()
    )
    canvas.drawRoundRect(
        backWindow.left.toFloat(),
        backWindow.top.toFloat(),
        backWindow.right.toFloat(),
        backWindow.bottom.toFloat(),
        4f, 4f,
        windowPaint
    )
    
    // Rodas
    val wheelPaint = Paint().apply {
        color = android.graphics.Color.parseColor("#424242") // Cinza escuro
        style = Paint.Style.FILL
        isAntiAlias = true
    }
    
    // Roda dianteira
    canvas.drawCircle(centerX - 18f + offsetX, centerY + 12f + offsetY, 4f, wheelPaint)
    // Roda traseira
    canvas.drawCircle(centerX + 18f + offsetX, centerY + 12f + offsetY, 4f, wheelPaint)
    
    // Faróis
    val headlightPaint = Paint().apply {
        color = android.graphics.Color.parseColor("#FFEB3B") // Amarelo
        style = Paint.Style.FILL
        isAntiAlias = true
    }
    canvas.drawCircle(centerX - 22f + offsetX, centerY - 8f + offsetY, 3f, headlightPaint)
    canvas.drawCircle(centerX + 22f + offsetX, centerY - 8f + offsetY, 3f, headlightPaint)
    
    return BitmapDescriptorFactory.fromBitmap(bitmap)
}

// Função para gerar coordenadas da rota
private fun generateRouteCoordinates(
    start: Location,
    end: Location
): List<Location> {
    val coordinates = mutableListOf<Location>()
    
    // Adicionar ponto de partida
    coordinates.add(start)
    
    // Gerar pontos intermediários para simular uma rota real
    val steps = 20
    val latStep = (end.latitude - start.latitude) / steps
    val lngStep = (end.longitude - start.longitude) / steps
    
    for (i in 1 until steps) {
        val lat = start.latitude + (latStep * i)
        val lng = start.longitude + (lngStep * i)
        
        // Adicionar pequenas variações para simular uma rota real
        val variation = 0.001
        val variedLat = lat + (Math.random() - 0.5) * variation
        val variedLng = lng + (Math.random() - 0.5) * variation
        
        coordinates.add(
            Location(
                latitude = variedLat,
                longitude = variedLng,
                address = "Ponto ${i + 1}"
            )
        )
    }
    
    // Adicionar ponto de destino
    coordinates.add(end)
    
    return coordinates
}
