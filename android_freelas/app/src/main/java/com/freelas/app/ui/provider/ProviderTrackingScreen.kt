package com.freelas.app.ui.provider

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.freelas.app.ui.components.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProviderTrackingScreen(
    service: com.freelas.app.data.model.Service,
    onBack: () -> Unit,
    viewModel: ProviderTrackingViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState(initial = false)
    val errorMessage by viewModel.errorMessage.collectAsState(initial = null)
    
    // Start service execution when screen loads
    LaunchedEffect(service) {
        viewModel.startServiceExecution(service)
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
        // Map view
        AnimatedMapView(
            currentLocation = uiState.currentLocation,
            destination = when (uiState.navigationMode) {
                NavigationMode.TO_CLIENT -> service.location
                NavigationMode.TO_DESTINATION -> service.destination
                NavigationMode.NONE -> null
            },
            route = uiState.currentRoute,
            vehicleLocation = uiState.vehicleLocation,
            modifier = Modifier.fillMaxSize()
        )
        
        // Top bar
        TopAppBar(
            title = { 
                Text(
                    text = when (uiState.navigationMode) {
                        NavigationMode.TO_CLIENT -> "Indo buscar cliente"
                        NavigationMode.TO_DESTINATION -> "Em serviço"
                        NavigationMode.NONE -> "Serviço"
                    },
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
        
        // Service info card
        ServiceInfoCard(
            service = service,
            navigationMode = uiState.navigationMode,
            hasArrived = uiState.hasArrived,
            tripStarted = uiState.tripStarted,
            onNavigateToClient = viewModel::navigateToClient,
            onNavigateToDestination = viewModel::navigateToDestination,
            onMarkArrived = viewModel::markArrived,
            onStartTrip = viewModel::startTrip,
            onCompleteService = viewModel::completeService,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(16.dp)
        )
        
        // Route info overlay
        uiState.routeUpdate?.let { routeUpdate ->
            RouteInfoOverlay(
                route = uiState.currentRoute!!,
                vehicleLocation = uiState.vehicleLocation!!,
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
    
    // Completion dialog
    if (uiState.showCompletionDialog) {
        CompletionDialog(
            service = service,
            onDismiss = viewModel::dismissCompletionDialog
        )
    }
}

@Composable
fun ServiceInfoCard(
    service: com.freelas.app.data.model.Service,
    navigationMode: NavigationMode,
    hasArrived: Boolean,
    tripStarted: Boolean,
    onNavigateToClient: () -> Unit,
    onNavigateToDestination: () -> Unit,
    onMarkArrived: () -> Unit,
    onStartTrip: () -> Unit,
    onCompleteService: () -> Unit,
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
            // Service header
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
                        text = when (navigationMode) {
                            NavigationMode.TO_CLIENT -> "Indo buscar cliente"
                            NavigationMode.TO_DESTINATION -> "Em serviço"
                            NavigationMode.NONE -> "Serviço aceito"
                        },
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
            
            // Client info
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .background(
                            Color.Gray,
                            RoundedCornerShape(20.dp)
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Default.Person,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                }
                
                Spacer(modifier = Modifier.width(12.dp))
                
                Column {
                    Text(
                        text = "Cliente", // This would come from client data
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium
                    )
                    Text(
                        text = service.location.address,
                        fontSize = 12.sp,
                        color = Color.Gray
                    )
                }
                
                Spacer(modifier = Modifier.weight(1f))
                
                // Call button
                FloatingActionButton(
                    onClick = { /* Call client */ },
                    modifier = Modifier.size(40.dp),
                    containerColor = MaterialTheme.colorScheme.primary
                ) {
                    Icon(
                        Icons.Default.Phone,
                        contentDescription = "Ligar para cliente",
                        tint = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Action buttons based on current state
            when {
                !hasArrived && navigationMode == NavigationMode.NONE -> {
                    Button(
                        onClick = onNavigateToClient,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color.Green
                        )
                    ) {
                        Icon(
                            Icons.Default.Navigation,
                            contentDescription = null,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Ir buscar cliente")
                    }
                }
                
                hasArrived && !tripStarted -> {
                    Button(
                        onClick = onMarkArrived,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFFFF9800)
                        )
                    ) {
                        Icon(
                            Icons.Default.Check,
                            contentDescription = null,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Marcar como chegou")
                    }
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    Button(
                        onClick = onStartTrip,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary
                        )
                    ) {
                        Icon(
                            Icons.Default.PlayArrow,
                            contentDescription = null,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Iniciar viagem")
                    }
                }
                
                tripStarted -> {
                    Button(
                        onClick = onCompleteService,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color.Green
                        )
                    ) {
                        Icon(
                            Icons.Default.CheckCircle,
                            contentDescription = null,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Concluir serviço")
                    }
                }
            }
        }
    }
}

@Composable
fun CompletionDialog(
    service: com.freelas.app.data.model.Service,
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
                    text = "Parabéns!",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = "Você ganhou R$ ${String.format("%.2f", service.price)}",
                    fontSize = 16.sp,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "O serviço foi concluído com sucesso.",
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
