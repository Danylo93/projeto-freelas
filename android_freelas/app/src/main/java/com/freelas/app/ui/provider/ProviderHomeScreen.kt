package com.freelas.app.ui.provider

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.freelas.app.R
import com.freelas.app.data.model.Service
import com.freelas.app.data.model.ServiceOffer
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.GoogleMap
import com.google.maps.android.compose.MapProperties
import com.google.maps.android.compose.Marker
import com.google.maps.android.compose.MarkerState
import com.google.maps.android.compose.rememberCameraPositionState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProviderHomeScreen(
    onNavigateToTracking: (com.freelas.app.data.model.Service) -> Unit = {},
    viewModel: ProviderHomeViewModel = hiltViewModel(),
    permissionManager: com.freelas.app.utils.PermissionManager? = null
) {
    val uiState by viewModel.uiState.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState(initial = false)
    val errorMessage by viewModel.errorMessage.collectAsState(initial = null)
    
    LaunchedEffect(errorMessage) {
        if (errorMessage != null) {
            // Show error snackbar
        }
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF5F5F5))
    ) {
        
        // Header with status toggle
        ProviderHeader(
            isAvailable = uiState.isAvailable,
            onToggleAvailability = viewModel::toggleAvailability,
            modifier = Modifier.padding(16.dp)
        )
        
        // Map view
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(250.dp)
                .padding(horizontal = 16.dp)
        ) {
            ProviderMapView(
                currentLocation = uiState.currentLocation,
                activeServices = uiState.activeServices,
                modifier = Modifier.fillMaxSize(),
                permissionManager = permissionManager
            )
            
            // Promotion banner
            PromotionBanner(
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .padding(top = 16.dp)
            )
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Content based on availability
        if (uiState.isAvailable) {
            AvailableProviderContent(
                uiState = uiState,
                onAcceptService = viewModel::acceptService,
                onRejectService = viewModel::rejectService,
                onAcceptOffer = viewModel::acceptOffer,
                onRejectOffer = viewModel::rejectOffer,
                onMakeCounterOffer = viewModel::makeCounterOffer,
                onNavigateToTracking = onNavigateToTracking,
                modifier = Modifier.padding(horizontal = 16.dp)
            )
        } else {
            OfflineProviderContent(
                earnings = uiState.earnings,
                completedServices = uiState.completedServices,
                modifier = Modifier.padding(horizontal = 16.dp)
            )
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Bottom navigation
        BottomNavigationPlaceholder()
    }
}

@Composable
fun ProviderHeader(
    isAvailable: Boolean,
    onToggleAvailability: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Olá, Prestador!",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = if (isAvailable) "Você está online" else "Você está offline",
                    fontSize = 14.sp,
                    color = if (isAvailable) Color.Green else Color.Gray
                )
            }
            
            StatusToggle(
                isAvailable = isAvailable,
                onToggle = onToggleAvailability
            )
        }
    }
}

@Composable
fun StatusToggle(
    isAvailable: Boolean,
    onToggle: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .clickable { onToggle() },
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isAvailable) Color.Green else Color.Gray
        )
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = if (isAvailable) Icons.Default.CheckCircle else Icons.Default.Cancel,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = if (isAvailable) stringResource(R.string.available) else stringResource(R.string.offline),
                color = Color.White,
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

@Composable
fun ProviderMapView(
    currentLocation: com.freelas.app.data.model.Location?,
    activeServices: List<Service>,
    modifier: Modifier = Modifier,
    permissionManager: com.freelas.app.utils.PermissionManager? = null
) {
    val currentLocationLatLng = currentLocation?.let { 
        LatLng(it.latitude, it.longitude) 
    } ?: LatLng(-23.5505, -46.6333) // São Paulo default
    
    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(currentLocationLatLng, 15f)
    }
    
    val locationPermissionGranted by permissionManager?.locationPermissionGranted?.collectAsState(initial = false) ?: remember { mutableStateOf(false) }
    
    GoogleMap(
        modifier = modifier,
        cameraPositionState = cameraPositionState,
        properties = com.google.maps.android.compose.MapProperties(
            isMyLocationEnabled = locationPermissionGranted
        )
    ) {
        // Provider location marker
        currentLocation?.let { location ->
            Marker(
                state = MarkerState(position = LatLng(location.latitude, location.longitude)),
                title = "Sua localização"
            )
        }
        
        // Active services markers
        activeServices.forEach { service ->
            service.destination?.let { destination ->
                Marker(
                    state = MarkerState(position = LatLng(destination.latitude, destination.longitude)),
                    title = "Serviço ativo"
                )
            }
        }
    }
}

@Composable
fun PromotionBanner(
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
    ) {
        // Yellow promotion banner
        Card(
            modifier = Modifier.weight(1f),
            shape = RoundedCornerShape(8.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFFFFD700))
        ) {
            Row(
                modifier = Modifier.padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(
                    modifier = Modifier.weight(1f)
                ) {
                    Text(
                        text = stringResource(R.string.various_advantages),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.Black
                    )
                    Text(
                        text = stringResource(R.string.be_partner_provider),
                        fontSize = 12.sp,
                        color = Color.Black
                    )
                }
                // Profile image placeholder
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .background(Color.Gray, RoundedCornerShape(20.dp))
                )
            }
        }
        
        Spacer(modifier = Modifier.width(8.dp))
        
        // Green promotion banner
        Card(
            shape = RoundedCornerShape(8.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF4CAF50))
        ) {
            Column(
                modifier = Modifier.padding(12.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "40%",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Text(
                    text = stringResource(R.string.learn_more),
                    fontSize = 10.sp,
                    color = Color.White
                )
            }
        }
    }
}

@Composable
fun AvailableProviderContent(
    uiState: ProviderHomeUiState,
    onAcceptService: (Service) -> Unit,
    onRejectService: (Service) -> Unit,
    onAcceptOffer: (ServiceOffer) -> Unit,
    onRejectOffer: (ServiceOffer) -> Unit,
    onMakeCounterOffer: (ServiceOffer, Double) -> Unit,
    onNavigateToTracking: (Service) -> Unit,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Earnings card
        item {
            EarningsCard(
                earnings = uiState.earnings,
                modifier = Modifier.fillMaxWidth()
            )
        }
        
        // Active services
        if (uiState.activeServices.isNotEmpty()) {
            item {
                Text(
                    text = stringResource(R.string.active_services),
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            
            items(uiState.activeServices) { service ->
                ActiveServiceCard(
                    service = service,
                    onStartService = { onNavigateToTracking(service) },
                    onCompleteService = { /* Handle complete service */ },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
        
        // Pending requests
        if (uiState.pendingRequests.isNotEmpty()) {
            item {
                Text(
                    text = "Novas solicitações",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            
            items(uiState.pendingRequests) { service ->
                ServiceRequestCard(
                    service = service,
                    onAccept = { onAcceptService(service) },
                    onReject = { onRejectService(service) },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
        
        // Pending offers
        if (uiState.pendingOffers.isNotEmpty()) {
            item {
                Text(
                    text = "Ofertas pendentes",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            
            items(uiState.pendingOffers) { offer ->
                OfferCard(
                    offer = offer,
                    onAccept = { onAcceptOffer(offer) },
                    onReject = { onRejectOffer(offer) },
                    onMakeCounterOffer = { price -> onMakeCounterOffer(offer, price) },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
        
        // Empty state
        if (uiState.pendingRequests.isEmpty() && uiState.pendingOffers.isEmpty() && uiState.activeServices.isEmpty()) {
            item {
                EmptyStateCard(
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
}

@Composable
fun OfflineProviderContent(
    earnings: ProviderEarnings,
    completedServices: List<Service>,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            EarningsCard(
                earnings = earnings,
                modifier = Modifier.fillMaxWidth()
            )
        }
        
        item {
            Text(
                text = "Serviços concluídos",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold
            )
        }
        
        if (completedServices.isNotEmpty()) {
            items(completedServices.take(5)) { service ->
                CompletedServiceCard(
                    service = service,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        } else {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            Icons.Default.Work,
                            contentDescription = null,
                            modifier = Modifier.size(48.dp),
                            tint = Color.Gray
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Nenhum serviço concluído ainda",
                            fontSize = 16.sp,
                            color = Color.Gray,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun EarningsCard(
    earnings: ProviderEarnings,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = stringResource(R.string.earnings),
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                EarningsItem(
                    label = "Hoje",
                    value = "R$ ${String.format("%.2f", earnings.today)}",
                    modifier = Modifier.weight(1f)
                )
                
                EarningsItem(
                    label = "Esta semana",
                    value = "R$ ${String.format("%.2f", earnings.thisWeek)}",
                    modifier = Modifier.weight(1f)
                )
                
                EarningsItem(
                    label = "Este mês",
                    value = "R$ ${String.format("%.2f", earnings.thisMonth)}",
                    modifier = Modifier.weight(1f)
                )
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Total: R$ ${String.format("%.2f", earnings.total)}",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                
                Text(
                    text = "${earnings.completedServices} serviços",
                    fontSize = 12.sp,
                    color = Color.Gray
                )
            }
        }
    }
}

@Composable
fun EarningsItem(
    label: String,
    value: String,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = value,
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )
        Text(
            text = label,
            fontSize = 12.sp,
            color = Color.Gray
        )
    }
}

@Composable
fun ActiveServiceCard(
    service: Service,
    onStartService: () -> Unit,
    onCompleteService: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = service.title,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Medium
                )
                
                Text(
                    text = "R$ ${String.format("%.2f", service.price)}",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = service.location.address,
                fontSize = 12.sp,
                color = Color.Gray
            )
            
            service.destination?.let { destination ->
                Text(
                    text = "Para: ${destination.address}",
                    fontSize = 12.sp,
                    color = Color.Gray
                )
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = onStartService,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color.Green
                    )
                ) {
                    Text("Iniciar")
                }
                
                Button(
                    onClick = onCompleteService,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary
                    )
                ) {
                    Text("Concluir")
                }
            }
        }
    }
}

@Composable
fun ServiceRequestCard(
    service: Service,
    onAccept: () -> Unit,
    onReject: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = service.title,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Medium
                )
                
                Text(
                    text = "R$ ${String.format("%.2f", service.price)}",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "Distância: ${String.format("%.1f", service.distance)} km",
                fontSize = 12.sp,
                color = Color.Gray
            )
            
            Text(
                text = "Tempo estimado: ${service.estimatedTime} min",
                fontSize = 12.sp,
                color = Color.Gray
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = onReject,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = Color.Red
                    )
                ) {
                    Text("Recusar")
                }
                
                Button(
                    onClick = onAccept,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary
                    )
                ) {
                    Text("Aceitar")
                }
            }
        }
    }
}

@Composable
fun OfferCard(
    offer: ServiceOffer,
    onAccept: () -> Unit,
    onReject: () -> Unit,
    onMakeCounterOffer: (Double) -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Oferta do cliente",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Medium
                )
                
                Text(
                    text = "R$ ${String.format("%.2f", offer.clientPrice)}",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "Oferta sugerida: R$ ${String.format("%.2f", offer.clientPrice * 1.2)}",
                fontSize = 12.sp,
                color = Color.Gray
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = onReject,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = Color.Red
                    )
                ) {
                    Text("Recusar")
                }
                
                Button(
                    onClick = { onMakeCounterOffer(offer.clientPrice * 1.2) },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFFFF9800)
                    )
                ) {
                    Text("Contra-oferta")
                }
                
                Button(
                    onClick = onAccept,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary
                    )
                ) {
                    Text("Aceitar")
                }
            }
        }
    }
}

@Composable
fun CompletedServiceCard(
    service: Service,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = service.title,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = service.location.address,
                    fontSize = 12.sp,
                    color = Color.Gray
                )
            }
            
            Column(
                horizontalAlignment = Alignment.End
            ) {
                Text(
                    text = "R$ ${String.format("%.2f", service.price)}",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                service.rating?.let { rating ->
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.Star,
                            contentDescription = null,
                            modifier = Modifier.size(12.dp),
                            tint = Color.Yellow
                        )
                        Text(
                            text = String.format("%.1f", rating.toDouble()),
                            fontSize = 12.sp,
                            color = Color.Gray
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun EmptyStateCard(
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                Icons.Default.Notifications,
                contentDescription = null,
                modifier = Modifier.size(48.dp),
                tint = Color.Gray
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "Aguardando solicitações...",
                fontSize = 16.sp,
                color = Color.Gray,
                textAlign = TextAlign.Center
            )
            Text(
                text = "Novas solicitações aparecerão aqui quando você estiver disponível",
                fontSize = 12.sp,
                color = Color.Gray,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
fun BottomNavigationPlaceholder() {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(80.dp),
        shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 32.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    Icons.Default.Home,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = stringResource(R.string.home),
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            
            Column(
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    Icons.Default.Work,
                    contentDescription = null,
                    tint = Color.Gray
                )
                Text(
                    text = "Serviços",
                    fontSize = 12.sp,
                    color = Color.Gray
                )
            }
        }
    }
}
