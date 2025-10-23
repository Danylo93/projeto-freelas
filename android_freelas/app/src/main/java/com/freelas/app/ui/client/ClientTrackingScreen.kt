package com.freelas.app.ui.client

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.freelas.app.ui.components.*
import com.freelas.app.ui.rating.RatingScreen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ClientTrackingScreen(
    service: com.freelas.app.data.model.Service,
    onBack: () -> Unit,
    viewModel: ClientTrackingViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()
    
    // Start tracking when screen loads
    LaunchedEffect(service) {
        viewModel.startServiceTracking(service)
    }
    
    LaunchedEffect(errorMessage) {
        if (errorMessage != null) {
            // Show error snackbar
        }
    }
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
    ) {
        // Map view with real-time tracking
        TrackingMapView(
            service = service,
            currentVehicleLocation = uiState.vehicleLocation?.location,
            modifier = Modifier.fillMaxSize()
        )
        
        // Top bar
        TopAppBar(
            title = { 
                Text(
                    text = "Acompanhando",
                    color = Color.White,
                    fontWeight = FontWeight.Medium
                ) 
            },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(
                        Icons.Default.ArrowBack,
                        contentDescription = "Voltar",
                        tint = Color.White
                    )
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor = Color.Transparent
            ),
            modifier = Modifier.padding(16.dp)
        )
        
        // Vehicle tracking card with real data
        uiState.routeUpdate?.let { routeUpdate ->
            VehicleTrackingCard(
                routeUpdate = routeUpdate,
                driverInfo = uiState.driverInfo,
                vehicleLocation = uiState.vehicleLocation,
                onCallDriver = viewModel::callDriver,
                onCancelRide = viewModel::cancelRide,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(16.dp)
            )
        }
        
        // Live tracking overlay
        uiState.vehicleLocation?.let { vehicleLocation ->
            LiveTrackingOverlay(
                vehicleLocation = vehicleLocation,
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .padding(top = 80.dp, start = 16.dp, end = 16.dp)
            )
        }
        
        // Loading overlay
        if (isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.5f)),
                contentAlignment = Alignment.Center
            ) {
                Card(
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp),
                            color = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.width(16.dp))
                        Text(
                            text = "Carregando...",
                            fontSize = 16.sp
                        )
                    }
                }
            }
        }
    }
    
    // Rating screen
    if (uiState.showRatingScreen && uiState.currentService != null) {
        RatingScreen(
            service = uiState.currentService!!,
            onRatingCompleted = {
                viewModel.onRatingCompleted()
                onBack() // Navegar de volta à tela inicial
            },
            onSkipRating = {
                viewModel.hideRatingScreen()
                onBack() // Navegar de volta à tela inicial
            }
        )
    }
    
    // Completion dialog - removido pois vamos direto para a tela inicial
}

@Composable
fun RatingDialog(
    onRatingSubmitted: (Int, String) -> Unit,
    onDismiss: () -> Unit
) {
    var rating by remember { mutableStateOf(0) }
    var review by remember { mutableStateOf("") }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "Avalie o serviço",
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column {
                Text(
                    text = "Como foi sua experiência?",
                    modifier = Modifier.padding(bottom = 16.dp)
                )
                
                // Star rating
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center
                ) {
                    repeat(5) { index ->
                        IconButton(
                            onClick = { rating = index + 1 }
                        ) {
                            Icon(
                                imageVector = if (index < rating) Icons.Default.Star else Icons.Default.StarBorder,
                                contentDescription = null,
                                tint = if (index < rating) Color.Yellow else Color.Gray,
                                modifier = Modifier.size(32.dp)
                            )
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Review text field
                OutlinedTextField(
                    value = review,
                    onValueChange = { review = it },
                    label = { Text("Comentário (opcional)") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 3
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onRatingSubmitted(rating, review) },
                enabled = rating > 0
            ) {
                Text("Enviar")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar")
            }
        }
    )
}

@Composable
fun CompletionDialog(
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "Serviço concluído!",
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    Icons.Default.CheckCircle,
                    contentDescription = null,
                    modifier = Modifier.size(48.dp),
                    tint = Color.Green
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Obrigado por usar o FreelasApp!",
                    fontSize = 16.sp
                )
                Text(
                    text = "Seu serviço foi concluído com sucesso.",
                    fontSize = 14.sp,
                    color = Color.Gray
                )
            }
        },
        confirmButton = {
            Button(
                onClick = onDismiss,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Continuar")
            }
        }
    )
}

