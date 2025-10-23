package com.freelas.app.ui.client

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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.freelas.app.data.model.ServiceCategory
import com.freelas.app.data.model.ServiceOffer
import com.freelas.app.ui.payment.PaymentScreen
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.GoogleMap
import com.google.maps.android.compose.MapProperties
import com.google.maps.android.compose.Marker
import com.google.maps.android.compose.MarkerState
import com.google.maps.android.compose.rememberCameraPositionState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ClientHomeScreen(
    onNavigateToTracking: (com.freelas.app.data.model.Service) -> Unit = {},
    viewModel: ClientHomeViewModel = hiltViewModel(),
    permissionManager: com.freelas.app.utils.PermissionManager? = null
) {
    val uiState by viewModel.uiState.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState(initial = false)
    val errorMessage by viewModel.errorMessage.collectAsState(initial = null)
    
    val locationPermissionGranted by permissionManager?.locationPermissionGranted?.collectAsState(initial = false) ?: remember { mutableStateOf(false) }
    var showPermissionDialog by remember { mutableStateOf(false) }
    
    LaunchedEffect(errorMessage) {
        if (errorMessage != null) {
            // Show error snackbar
        }
    }
    
    // Show permission dialog if location permission is not granted
    LaunchedEffect(locationPermissionGranted) {
        if (!locationPermissionGranted && permissionManager != null) {
            showPermissionDialog = true
        }
    }
    
    // Show payment screen if needed
    uiState.currentService?.let { currentService ->
        if (uiState.showPaymentScreen) {
            PaymentScreen(
                service = currentService,
                onPaymentSuccess = { transaction ->
                    viewModel.onPaymentSuccess(transaction)
                    onNavigateToTracking(currentService)
                },
                onPaymentCancelled = {
                    viewModel.cancelPayment()
                }
            )
            return
        }
    }
    
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
    ) {
        
        // Header with location input
        item {
            ClientHeaderWithSuggestions(
                origin = uiState.origin,
                destination = uiState.destination,
                onOriginChange = viewModel::updateOrigin,
                onDestinationChange = viewModel::updateDestination,
                modifier = Modifier.padding(16.dp)
            )
        }
        
        // Map view
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(300.dp)
                    .padding(horizontal = 16.dp)
            ) {
                        ClientMapView(
                            currentLocation = uiState.currentLocation?.let {
                                LatLng(it.latitude, it.longitude)
                            },
                            destination = uiState.destinationLocation?.let {
                                LatLng(it.latitude, it.longitude)
                            },
                            modifier = Modifier.fillMaxSize(),
                            permissionManager = permissionManager
                        )
                
                // Route deviation prevention banner
                RouteDeviationBanner(
                    modifier = Modifier
                        .align(Alignment.TopCenter)
                        .padding(top = 16.dp)
                )
            }
        }
        
        // Service categories
        item {
            ServiceCategories(
                categories = uiState.categories,
                selectedCategory = uiState.selectedCategory,
                onCategorySelected = viewModel::selectCategory,
                modifier = Modifier.padding(16.dp)
            )
        }
        
        // Distance and time info
        item {
            DistanceTimeInfo(
                distance = uiState.distance,
                estimatedTime = uiState.estimatedTime,
                modifier = Modifier.padding(horizontal = 16.dp)
            )
        }
        
        // Service offers with dynamic pricing
        item {
            ServiceOffersWithDynamicPricing(
                offers = uiState.serviceOffers,
                distance = uiState.distance,
                routeInfo = uiState.routeInfo,
                onOfferSelected = { offer ->
                    viewModel.selectServiceOffer(offer)
                    // Create service and start payment
                    val service = createMockService(offer)
                    viewModel.setCurrentService(service)
                    viewModel.startPayment()
                },
                modifier = Modifier.padding(16.dp)
            )
        }
        
        // Negotiation section
        item {
            NegotiationSection(
                onPriceChange = viewModel::updateNegotiatedPrice,
                onAutoAcceptToggle = viewModel::toggleAutoAccept,
                modifier = Modifier.padding(16.dp)
            )
        }
        
        // Nearby providers
        item {
            NearbyProvidersList(
                providers = uiState.nearbyProviders,
                onProviderSelected = viewModel::selectProvider,
                modifier = Modifier.padding(16.dp)
            )
        }
        
        // Active requests
        if (uiState.activeRequests.isNotEmpty()) {
            item {
                ActiveRequestsSection(
                    requests = uiState.activeRequests,
                    onRequestAction = viewModel::handleRequestAction,
                    modifier = Modifier.padding(16.dp)
                )
            }
        }
        
        // Bottom padding for better scrolling
        item {
            Spacer(modifier = Modifier.height(32.dp))
        }
    }
        
        // Permission request dialog
        com.freelas.app.ui.components.PermissionRequestDialog(
            isVisible = showPermissionDialog,
            onRequestPermission = {
                permissionManager?.requestLocationPermission()
                showPermissionDialog = false
            },
            onDismiss = {
                showPermissionDialog = false
            }
        )
    }

@Composable
fun ClientHeaderWithSuggestions(
    origin: String,
    destination: String,
    onOriginChange: (String) -> Unit,
    onDestinationChange: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var showOriginSuggestions by remember { mutableStateOf(false) }
    var showDestinationSuggestions by remember { mutableStateOf(false) }
    
    Column(modifier = modifier) {
        // Origin input with suggestions
        OutlinedTextField(
            value = origin,
            onValueChange = { 
                onOriginChange(it)
                showOriginSuggestions = it.isNotEmpty()
            },
            label = { Text("Origem") },
            leadingIcon = { Icon(Icons.Default.MyLocation, contentDescription = null) },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )
        
        // Origin suggestions
        if (showOriginSuggestions && origin.isNotEmpty()) {
            AddressSuggestions(
                query = origin,
                onSuggestionSelected = { suggestion ->
                    onOriginChange(suggestion)
                    showOriginSuggestions = false
                }
            )
        }
        
        Spacer(modifier = Modifier.height(8.dp))
        
        // Destination input with suggestions
        OutlinedTextField(
            value = destination,
            onValueChange = { 
                onDestinationChange(it)
                showDestinationSuggestions = it.isNotEmpty()
            },
            label = { Text("Para onde vamos?") },
            leadingIcon = { Icon(Icons.Default.LocationOn, contentDescription = null) },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )
        
        // Destination suggestions
        if (showDestinationSuggestions && destination.isNotEmpty()) {
            AddressSuggestions(
                query = destination,
                onSuggestionSelected = { suggestion ->
                    onDestinationChange(suggestion)
                    showDestinationSuggestions = false
                }
            )
        }
    }
}

@Composable
fun AddressSuggestions(
    query: String,
    onSuggestionSelected: (String) -> Unit
) {
    val suggestions = remember(query) {
        generateAddressSuggestions(query)
    }
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column {
            suggestions.forEach { suggestion ->
                Text(
                    text = suggestion,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onSuggestionSelected(suggestion) }
                        .padding(16.dp),
                    style = MaterialTheme.typography.bodyMedium
                )
                if (suggestion != suggestions.last()) {
                    Divider()
                }
            }
        }
    }
}

@Composable
fun DistanceTimeInfo(
    distance: Double,
    estimatedTime: Int,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFF5F5F5))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "${String.format("%.1f", distance)} km",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Distância",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.Gray
                )
            }
            
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "${estimatedTime} min",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Tempo estimado",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.Gray
                )
            }
        }
    }
}

@Composable
fun ServiceOffersWithDynamicPricing(
    offers: List<ServiceOffer>,
    distance: Double,
    routeInfo: com.freelas.app.data.repository.RouteInfo?,
    onOfferSelected: (ServiceOffer) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        val savings = routeInfo?.let { 
            String.format("%.2f", it.basePrice * 0.15) // 15% de economia
        } ?: String.format("%.2f", distance * 2.5)
        
        Text(
            text = "Economize até R$$savings nesta corrida",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 16.dp)
        )
        
        offers.forEach { offer ->
            ServiceOfferCardWithDynamicPricing(
                offer = offer,
                distance = distance,
                routeInfo = routeInfo,
                onClick = { onOfferSelected(offer) }
            )
            Spacer(modifier = Modifier.height(8.dp))
        }
    }
}

@Composable
fun ServiceOfferCardWithDynamicPricing(
    offer: ServiceOffer,
    distance: Double,
    routeInfo: com.freelas.app.data.repository.RouteInfo?,
    onClick: () -> Unit
) {
    // Calculate dynamic pricing based on real data
    val serviceType = when (offer.id) {
        "offer_1" -> "FreelasPop"
        "offer_2" -> "FreelasPop+"
        "offer_3" -> "FreelasTaxi"
        else -> "FreelasPop"
    }
    
    val basePrice = when (serviceType) {
        "FreelasPop" -> 5.0
        "FreelasPop+" -> 8.0
        "FreelasTaxi" -> 12.0
        else -> 6.0
    }
    
    val dynamicPrice = routeInfo?.let { info ->
        basePrice + (info.distance * 2.5) * info.trafficMultiplier * info.demandMultiplier
    } ?: (basePrice + (distance * 2.5))
    
    val estimatedTime = routeInfo?.estimatedTime ?: ((distance * 2.5).toInt() + 5)
    
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = when (serviceType) {
                        "FreelasTaxi" -> Icons.Default.LocalTaxi
                        else -> Icons.Default.DirectionsCar
                    },
                    contentDescription = null,
                    tint = when (serviceType) {
                        "FreelasTaxi" -> Color(0xFFFFD700)
                        "FreelasPop+" -> Color(0xFF4CAF50)
                        else -> Color(0xFF2196F3)
                    },
                    modifier = Modifier.size(24.dp)
                )
                
                Spacer(modifier = Modifier.width(12.dp))
                
                Column {
                    Text(
                        text = serviceType,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "${estimatedTime} min",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray
                    )
                }
            }
            
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = "R$ ${String.format("%.2f", dynamicPrice)}",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF4CAF50)
                )
                if (serviceType == "FreelasPop+") {
                    Text(
                        text = "DESCONTO",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFF4CAF50),
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
fun NegotiationSection(
    onPriceChange: (Double) -> Unit,
    onAutoAcceptToggle: (Boolean) -> Unit,
    modifier: Modifier = Modifier
) {
    var negotiatedPrice by remember { mutableStateOf(80.0) }
    var autoAccept by remember { mutableStateOf(false) }
    
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFF5F5F5))
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "Freelas Negocia",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Text(
                text = "Sugira seu preço",
                style = MaterialTheme.typography.bodyMedium
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            OutlinedTextField(
                value = negotiatedPrice.toString(),
                onValueChange = { 
                    negotiatedPrice = it.toDoubleOrNull() ?: 0.0
                    onPriceChange(negotiatedPrice)
                },
                label = { Text("Preço sugerido") },
                prefix = { Text("R$") },
                modifier = Modifier.fillMaxWidth()
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Aceitar ofertas automaticamente",
                    style = MaterialTheme.typography.bodyMedium
                )
                
                Switch(
                    checked = autoAccept,
                    onCheckedChange = { 
                        autoAccept = it
                        onAutoAcceptToggle(it)
                    }
                )
            }
        }
    }
}

// Helper functions
fun generateAddressSuggestions(query: String): List<String> {
    val allSuggestions = listOf(
        "Rua Augusta, 1000 - Consolação, São Paulo - SP",
        "Avenida Paulista, 1000 - Bela Vista, São Paulo - SP",
        "Rua Oscar Freire, 500 - Jardins, São Paulo - SP",
        "Avenida Faria Lima, 2000 - Itaim Bibi, São Paulo - SP",
        "Rua da Consolação, 3000 - Centro, São Paulo - SP",
        "Avenida Rebouças, 1000 - Pinheiros, São Paulo - SP",
        "Rua Haddock Lobo, 500 - Cerqueira César, São Paulo - SP",
        "Avenida Ibirapuera, 2000 - Moema, São Paulo - SP",
        "Rua Teodoro Sampaio, 1000 - Pinheiros, São Paulo - SP",
        "Avenida Brigadeiro Luiz Antônio, 2000 - Bela Vista, São Paulo - SP",
        "Rua dos Pinheiros, 500 - Pinheiros, São Paulo - SP",
        "Avenida 9 de Julho, 3000 - Bela Vista, São Paulo - SP",
        "Rua Bela Cintra, 1000 - Jardins, São Paulo - SP",
        "Avenida Europa, 2000 - Jardins, São Paulo - SP",
        "Rua Estados Unidos, 500 - Jardins, São Paulo - SP"
    )
    
    return allSuggestions.filter { 
        it.contains(query, ignoreCase = true) 
    }.take(5)
}

fun createMockService(offer: ServiceOffer): com.freelas.app.data.model.Service {
    val serviceType = when (offer.id) {
        "offer_1" -> "FreelasPop"
        "offer_2" -> "FreelasPop+"
        "offer_3" -> "FreelasTaxi"
        else -> "FreelasPop"
    }
    
    return com.freelas.app.data.model.Service(
        id = "mock_service_${System.currentTimeMillis()}",
        clientId = "mock_client_1",
        providerId = null,
        category = com.freelas.app.data.model.ServiceCategory.TRANSPORT,
        title = serviceType,
        description = "Serviço solicitado",
        status = com.freelas.app.data.model.ServiceStatus.PENDING,
        price = offer.clientPrice,
        location = com.freelas.app.data.model.Location(
            latitude = -23.5505,
            longitude = -46.6333,
            address = "Origem"
        ),
        destination = com.freelas.app.data.model.Location(
            latitude = -23.5489,
            longitude = -46.6388,
            address = "Destino"
        ),
        estimatedTime = 15,
        distance = 5.2,
        createdAt = java.util.Date(),
        acceptedAt = null,
        startedAt = null,
        completedAt = null
    )
}

// Keep existing composables that are still needed
@Composable
fun RouteDeviationBanner(modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = Color(0xFF2196F3))
    ) {
        Text(
            text = "Prevenção de desvio de rota está disponível",
            color = Color.White,
            style = MaterialTheme.typography.bodySmall,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
        )
    }
}

@Composable
fun ServiceCategories(
    categories: List<ServiceCategory>,
    selectedCategory: ServiceCategory?,
    onCategorySelected: (ServiceCategory) -> Unit,
    modifier: Modifier = Modifier
) {
    LazyRow(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(categories) { category ->
            CategoryChip(
                category = category,
                isSelected = selectedCategory?.displayName == category.displayName,
                onClick = { onCategorySelected(category) }
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CategoryChip(
    category: ServiceCategory,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    FilterChip(
        onClick = onClick,
        label = { Text(category.displayName) },
        selected = isSelected,
        modifier = Modifier.padding(vertical = 4.dp)
    )
}

@Composable
fun ClientMapView(
    currentLocation: LatLng?,
    destination: LatLng?,
    modifier: Modifier = Modifier,
    permissionManager: com.freelas.app.utils.PermissionManager? = null
) {
    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(
            currentLocation ?: LatLng(-23.5505, -46.6333),
            15f
        )
    }
    
    val locationPermissionGranted by permissionManager?.locationPermissionGranted?.collectAsState(initial = false) ?: remember { mutableStateOf(false) }

    GoogleMap(
        modifier = modifier,
        cameraPositionState = cameraPositionState,
        properties = MapProperties(
            isMyLocationEnabled = locationPermissionGranted
        )
    ) {
        currentLocation?.let { location ->
            Marker(
                state = MarkerState(position = location),
                title = "Sua localização"
            )
        }

        destination?.let { location ->
            Marker(
                state = MarkerState(position = location),
                title = "Destino"
            )
        }
    }
}

@Composable
fun NearbyProvidersList(
    providers: List<com.freelas.app.data.model.User>,
    onProviderSelected: (com.freelas.app.data.model.User) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        Text(
            text = "Prestadores próximos",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 12.dp)
        )
        
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(providers) { provider ->
                ProviderCard(
                    provider = provider,
                    onClick = { onProviderSelected(provider) }
                )
            }
        }
    }
}

@Composable
fun ProviderCard(
    provider: com.freelas.app.data.model.User,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .width(120.dp)
            .clickable { onClick() },
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = Icons.Default.Person,
                contentDescription = null,
                modifier = Modifier.size(32.dp)
            )
            
            Spacer(modifier = Modifier.height(4.dp))
            
            Text(
                text = provider.name,
                style = MaterialTheme.typography.bodySmall,
                textAlign = TextAlign.Center
            )
            
            Text(
                text = "⭐ ${provider.rating ?: 4.5}",
                style = MaterialTheme.typography.bodySmall,
                color = Color.Gray
            )
        }
    }
}

@Composable
fun ActiveRequestsSection(
    requests: List<com.freelas.app.data.model.Service>,
    onRequestAction: (String, String) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        Text(
            text = "Solicitações ativas",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 12.dp)
        )
        
        requests.forEach { request ->
            ActiveRequestCard(
                request = request,
                onAction = onRequestAction
            )
            Spacer(modifier = Modifier.height(8.dp))
        }
    }
}

@Composable
fun ActiveRequestCard(
    request: com.freelas.app.data.model.Service,
    onAction: (String, String) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "Solicitação #${request.id.takeLast(6)}",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            
            Text(
                text = request.description,
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(vertical = 4.dp)
            )
            
            Text(
                text = "R$ ${String.format("%.2f", request.price)}",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF4CAF50)
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = { onAction(request.id, "cancel") },
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Cancelar")
                }
                
                Button(
                    onClick = { onAction(request.id, "track") },
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Acompanhar")
                }
            }
        }
    }
}
