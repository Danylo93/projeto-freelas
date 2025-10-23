package com.freelas.app.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.freelas.app.data.model.*
import kotlinx.coroutines.delay

@Composable
fun VehicleTrackingCard(
    routeUpdate: RouteUpdate?,
    driverInfo: com.freelas.app.ui.client.DriverInfo? = null,
    vehicleLocation: VehicleLocation? = null,
    onCallDriver: () -> Unit = {},
    onCancelRide: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    routeUpdate?.let { update ->
        Card(
            modifier = modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                // Header with driver info
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Driver avatar
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .background(
                                    Color.Gray,
                                    RoundedCornerShape(24.dp)
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                Icons.Default.Person,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                        
                        Spacer(modifier = Modifier.width(12.dp))
                        
                        Column {
                            Text(
                                text = driverInfo?.name ?: "Motorista",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "${driverInfo?.vehicleModel ?: "Veículo"} • ${driverInfo?.vehiclePlate ?: "ABC-1234"}",
                                fontSize = 12.sp,
                                color = Color.Gray
                            )
                        }
                    }
                    
                    // Call button
                    FloatingActionButton(
                        onClick = onCallDriver,
                        modifier = Modifier.size(48.dp),
                        containerColor = MaterialTheme.colorScheme.primary
                    ) {
                        Icon(
                            Icons.Default.Phone,
                            contentDescription = "Ligar para motorista",
                            tint = Color.White
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Vehicle status and ETA
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(
                            text = "Tempo estimado",
                            fontSize = 12.sp,
                            color = Color.Gray
                        )
                        Text(
                            text = "${update.estimatedArrival} min",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    
                    Column(
                        horizontalAlignment = Alignment.End
                    ) {
                        Text(
                            text = "Distância restante",
                            fontSize = 12.sp,
                            color = Color.Gray
                        )
                        Text(
                            text = if (update.remainingDistance < 1) "${(update.remainingDistance * 1000).toInt()} m" else "${String.format("%.1f", update.remainingDistance)} km",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Next instruction
                update.nextInstruction?.let { instruction ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFF5F5F5))
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                getInstructionIcon(instruction.maneuver),
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                text = instruction.instruction,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Cancel button
                OutlinedButton(
                    onClick = onCancelRide,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = Color.Red
                    ),
                    border = ButtonDefaults.outlinedButtonBorder.copy(
                        brush = androidx.compose.foundation.BorderStroke(1.dp, Color.Red).brush
                    )
                ) {
                    Text("Cancelar corrida")
                }
            }
        }
    }
}

@Composable
fun ServiceInProgressCard(
    service: Service,
    routeUpdate: RouteUpdate?,
    onCompleteService: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Service info
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = service.title,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Serviço em andamento",
                        fontSize = 12.sp,
                        color = Color.Gray
                    )
                }
                
                Text(
                    text = "R$ ${String.format("%.2f", service.price)}",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Progress indicator
            if (routeUpdate != null) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(
                            text = "Progresso",
                            fontSize = 12.sp,
                            color = Color.Gray
                        )
                        val progress = 1.0 - (routeUpdate.remainingDistance / service.distance)
                        Text(
                            text = "${(progress * 100).toInt()}%",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    
                    Column(
                        horizontalAlignment = Alignment.End
                    ) {
                        Text(
                            text = "Tempo restante",
                            fontSize = 12.sp,
                            color = Color.Gray
                        )
                        Text(
                            text = formatTimeRemaining(routeUpdate.estimatedArrival),
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(12.dp))
                
                // Progress bar
                LinearProgressIndicator(
                    progress = (1.0 - (routeUpdate.remainingDistance / service.distance)).toFloat(),
                    modifier = Modifier.fillMaxWidth(),
                    color = MaterialTheme.colorScheme.primary,
                    trackColor = Color.Gray.copy(alpha = 0.3f)
                )
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Complete button
            Button(
                onClick = onCompleteService,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color.Green
                )
            ) {
                Icon(
                    Icons.Default.Check,
                    contentDescription = null,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text("Concluir serviço")
            }
        }
    }
}

@Composable
fun LiveTrackingOverlay(
    vehicleLocation: VehicleLocation,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.9f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Pulsing location indicator
            PulsingLocationIndicator()
            
            Spacer(modifier = Modifier.width(12.dp))
            
            Column {
                Text(
                    text = "Acompanhando em tempo real",
                    fontSize = 12.sp,
                    color = Color.Gray
                )
                Text(
                    text = "Velocidade: ${vehicleLocation.speed.toInt()} km/h",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}

@Composable
fun PulsingLocationIndicator(
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val scale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.5f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = EaseInOut),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )
    
    val alpha by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 0.3f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = EaseInOut),
            repeatMode = RepeatMode.Reverse
        ),
        label = "alpha"
    )
    
    Box(
        modifier = modifier
            .size(12.dp * scale)
            .background(
                color = Color.Green.copy(alpha = alpha),
                shape = androidx.compose.foundation.shape.CircleShape
            )
    )
}

private fun getInstructionIcon(maneuver: String?): androidx.compose.ui.graphics.vector.ImageVector {
    return when (maneuver) {
        "turn-right" -> Icons.Default.TurnRight
        "turn-left" -> Icons.Default.TurnLeft
        "straight" -> Icons.Default.Straight
        "arrive" -> Icons.Default.Place
        else -> Icons.Default.Navigation
    }
}

private fun formatTimeRemaining(estimatedArrival: Long): String {
    val now = System.currentTimeMillis()
    val remainingMillis = estimatedArrival - now
    
    return if (remainingMillis <= 0) {
        "Chegou"
    } else {
        val minutes = remainingMillis / (1000 * 60)
        "${minutes.toInt()} min"
    }
}

private fun formatDistance(meters: Double): String {
    return if (meters < 1000) {
        "${meters.toInt()} m"
    } else {
        "${String.format("%.1f", meters / 1000)} km"
    }
}

