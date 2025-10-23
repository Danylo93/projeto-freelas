package com.freelas.app.ui.client

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.freelas.app.data.model.*
import com.freelas.app.data.repository.RouteRepository
import com.freelas.app.data.repository.ServiceRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ClientTrackingViewModel @Inject constructor(
    private val routeRepository: RouteRepository,
    private val serviceRepository: ServiceRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(ClientTrackingUiState())
    val uiState: StateFlow<ClientTrackingUiState> = _uiState.asStateFlow()
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()
    
    init {
        // Observe route updates
        viewModelScope.launch {
            combine(
                routeRepository.currentRoute,
                routeRepository.vehicleLocation,
                routeRepository.routeUpdates
            ) { route, vehicleLocation, routeUpdate ->
                Triple(route, vehicleLocation, routeUpdate)
            }.collect { (route, vehicleLocation, routeUpdate) ->
                _uiState.value = _uiState.value.copy(
                    currentRoute = route,
                    vehicleLocation = vehicleLocation,
                    routeUpdate = routeUpdate
                )
            }
        }
    }
    
    fun startServiceTracking(service: Service) {
        _isLoading.value = true
        
        viewModelScope.launch {
            try {
                // Initialize tracking state with real data
                _uiState.value = _uiState.value.copy(
                    currentService = service,
                    vehicleLocation = VehicleLocation(
                        vehicleId = "vehicle_${service.id}",
                        location = service.location,
                        speed = 0f,
                        heading = 0f,
                        timestamp = System.currentTimeMillis(),
                        status = VehicleStatus.APPROACHING
                    ),
                    driverInfo = DriverInfo(
                        id = "driver_001",
                        name = "João Silva",
                        phone = "11999887766",
                        vehicleModel = "Honda Civic",
                        vehiclePlate = "ABC-1234",
                        rating = 4.8,
                        photo = null
                    )
                )
                
                // Get directions for the service
                val routeResult = routeRepository.getDirections(
                    origin = service.location,
                    destination = service.destination ?: service.location
                )
                
                routeResult.fold(
                    onSuccess = { route ->
                        _uiState.value = _uiState.value.copy(
                            currentRoute = route
                        )
                        
                        // Start real-time vehicle tracking simulation
                        startVehicleMovementSimulation(service, route)
                        _isLoading.value = false
                    },
                    onFailure = { exception ->
                        _errorMessage.value = "Erro ao calcular rota: ${exception.message}"
                        _isLoading.value = false
                    }
                )
            } catch (e: Exception) {
                _errorMessage.value = "Erro inesperado: ${e.message}"
                _isLoading.value = false
            }
        }
    }
    
    private fun startVehicleMovementSimulation(service: Service, route: Route) {
        viewModelScope.launch {
            val destination = service.destination ?: service.location
            val totalDistance = calculateDistance(
                service.location.latitude, service.location.longitude,
                destination.latitude, destination.longitude
            )
            
            // Simulação mais realista com mais pontos e velocidade variável
            val totalSteps = (totalDistance * 10).toInt().coerceIn(50, 200) // Mais pontos baseados na distância
            var currentStep = 0
            
            // Velocidade mais realista (20-45 km/h em trânsito urbano)
            val baseSpeed = 25f + (Math.random() * 20f) // 25-45 km/h
            
            while (currentStep < totalSteps) {
                // Delay mais realista baseado na velocidade
                val delayMs = (1000 * (totalDistance / totalSteps) / (baseSpeed / 3.6)).toLong().coerceIn(800, 2000)
                kotlinx.coroutines.delay(delayMs)
                
                currentStep++
                val progress = currentStep.toDouble() / totalSteps
                
                // Movimento mais suave seguindo a rota
                val newPosition = calculatePositionOnRoute(
                    service.location, destination, progress
                )
                
                // Calcular velocidade realista baseada no progresso
                val speed = when {
                    progress < 0.1 -> baseSpeed * 0.7 // Mais devagar no início
                    progress > 0.9 -> baseSpeed * 0.5 // Mais devagar no final
                    else -> baseSpeed + (Math.random() * 10 - 5) // Variação natural
                }.coerceIn(15.0, 50.0).toFloat()
                
                // Calcular direção baseada no movimento
                val heading = calculateHeading(service.location, newPosition)
                
                val newLocation = Location(
                    latitude = newPosition.latitude,
                    longitude = newPosition.longitude,
                    address = when {
                        progress < 0.3 -> "Saindo do local"
                        progress < 0.7 -> "Em trânsito"
                        else -> "Próximo ao destino"
                    }
                )
                
                // Calcular tempo e distância restantes mais precisos
                val remainingDistance = totalDistance * (1 - progress)
                val remainingTime = (remainingDistance / (speed / 3.6) / 60).toInt().coerceAtLeast(1)
                
                val vehicleLocation = VehicleLocation(
                    vehicleId = "vehicle_${service.id}",
                    location = newLocation,
                    speed = speed,
                    heading = heading,
                    timestamp = System.currentTimeMillis(),
                    status = when {
                        progress > 0.95 -> VehicleStatus.ARRIVED
                        progress > 0.8 -> VehicleStatus.APPROACHING
                        else -> VehicleStatus.APPROACHING
                    }
                )
                
                _uiState.value = _uiState.value.copy(
                    vehicleLocation = vehicleLocation,
                    routeUpdate = RouteUpdate(
                        vehicleLocation = vehicleLocation,
                        remainingDistance = remainingDistance,
                        estimatedArrival = remainingTime.toLong(),
                        nextInstruction = RouteInstruction(
                            instruction = generateRealisticInstruction(progress, remainingDistance),
                            distance = remainingDistance,
                            duration = remainingTime,
                            location = newLocation
                        )
                    )
                )
            }
            
            // Vehicle arrived
            val finalLocation = service.destination ?: service.location
            val finalVehicleLocation = VehicleLocation(
                vehicleId = "vehicle_${service.id}",
                location = finalLocation,
                speed = 0f,
                heading = 0f,
                timestamp = System.currentTimeMillis(),
                status = VehicleStatus.ARRIVED
            )
            
            _uiState.value = _uiState.value.copy(
                vehicleLocation = finalVehicleLocation,
                routeUpdate = RouteUpdate(
                    vehicleLocation = finalVehicleLocation,
                    remainingDistance = 0.0,
                    estimatedArrival = 0L,
                    nextInstruction = RouteInstruction(
                        instruction = "Você chegou ao destino",
                        distance = 0.0,
                        duration = 0,
                        location = finalLocation
                    )
                ),
                hasArrived = true,
                showRatingScreen = true
            )
        }
    }
    
    fun callDriver() {
        // This would trigger a call to the driver
        // For now, we'll just show a message
        _errorMessage.value = "Funcionalidade de chamada será implementada"
    }
    
    fun cancelRide() {
        val currentService = _uiState.value.currentService ?: return
        
        _isLoading.value = true
        
        viewModelScope.launch {
            serviceRepository.deleteService(currentService.id)
                .onSuccess {
                    _isLoading.value = false
                    _uiState.value = _uiState.value.copy(
                        currentService = null,
                        currentRoute = null,
                        vehicleLocation = null,
                        routeUpdate = null
                    )
                    routeRepository.clearRoute()
                }
                .onFailure { exception ->
                    _isLoading.value = false
                    _errorMessage.value = "Erro ao cancelar corrida: ${exception.message}"
                }
        }
    }
    
    fun completeService() {
        val currentService = _uiState.value.currentService ?: return
        
        _isLoading.value = true
        
        viewModelScope.launch {
            val updatedService = currentService.copy(
                status = ServiceStatus.COMPLETED,
                completedAt = java.util.Date()
            )
            
            serviceRepository.updateService(currentService.id, updatedService)
                .onSuccess {
                    _isLoading.value = false
                    _uiState.value = _uiState.value.copy(
                        currentService = updatedService,
                        showRatingDialog = true
                    )
                    routeRepository.clearRoute()
                }
                .onFailure { exception ->
                    _isLoading.value = false
                    _errorMessage.value = "Erro ao concluir serviço: ${exception.message}"
                }
        }
    }
    
    fun submitRating(rating: Int, review: String) {
        val currentService = _uiState.value.currentService ?: return
        
        _isLoading.value = true
        
        viewModelScope.launch {
            val updatedService = currentService.copy(
                rating = rating,
                review = review
            )
            
            serviceRepository.updateService(currentService.id, updatedService)
                .onSuccess {
                    _isLoading.value = false
                    _uiState.value = _uiState.value.copy(
                        currentService = updatedService,
                        showRatingDialog = false,
                        showCompletionDialog = true
                    )
                }
                .onFailure { exception ->
                    _isLoading.value = false
                    _errorMessage.value = "Erro ao enviar avaliação: ${exception.message}"
                }
        }
    }
    
    fun dismissRatingDialog() {
        _uiState.value = _uiState.value.copy(showRatingDialog = false)
    }
    
    fun dismissCompletionDialog() {
        _uiState.value = _uiState.value.copy(
            showCompletionDialog = false,
            currentService = null,
            currentRoute = null,
            vehicleLocation = null,
            routeUpdate = null
        )
    }
    
    fun refreshLocation() {
        // This would refresh the vehicle location
        // For now, we'll just trigger a re-fetch of route updates
        viewModelScope.launch {
            val currentRoute = _uiState.value.currentRoute
            val currentService = _uiState.value.currentService
            
            if (currentRoute != null && currentService != null) {
                routeRepository.startRouteTracking(currentRoute, "vehicle_${currentService.id}")
            }
        }
    }
    
    fun clearError() {
        _errorMessage.value = null
    }
    
    /**
     * Calcula a distância entre dois pontos usando a fórmula de Haversine
     */
    private fun calculateDistance(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val earthRadius = 6371.0 // Raio da Terra em km
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2)
        val c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return earthRadius * c
    }
    
    /**
     * Calcula a posição na rota baseada no progresso
     */
    private fun calculatePositionOnRoute(start: Location, end: Location, progress: Double): Location {
        // Interpolação linear mais suave com curva
        val easedProgress = easeInOutCubic(progress)
        
        val lat = start.latitude + (end.latitude - start.latitude) * easedProgress
        val lng = start.longitude + (end.longitude - start.longitude) * easedProgress
        
        // Adicionar pequenas variações para simular movimento real em ruas
        val variation = 0.0001 // ~11 metros
        val latVariation = (Math.random() - 0.5) * variation
        val lngVariation = (Math.random() - 0.5) * variation
        
        return Location(
            latitude = lat + latVariation,
            longitude = lng + lngVariation,
            address = "Em movimento"
        )
    }
    
    /**
     * Função de easing para movimento mais suave
     */
    private fun easeInOutCubic(t: Double): Double {
        return if (t < 0.5) {
            4 * t * t * t
        } else {
            1 - Math.pow(-2 * t + 2, 3.0) / 2
        }
    }
    
    /**
     * Calcula a direção (heading) baseada no movimento
     */
    private fun calculateHeading(from: Location, to: Location): Float {
        val lat1 = Math.toRadians(from.latitude)
        val lat2 = Math.toRadians(to.latitude)
        val deltaLng = Math.toRadians(to.longitude - from.longitude)
        
        val y = Math.sin(deltaLng) * Math.cos(lat2)
        val x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng)
        
        var bearing = Math.toDegrees(Math.atan2(y, x))
        bearing = (bearing + 360) % 360
        
        return bearing.toFloat()
    }
    
    /**
     * Gera instruções mais realistas baseadas no progresso e distância
     */
    private fun generateRealisticInstruction(progress: Double, remainingDistance: Double): String {
        return when {
            remainingDistance < 0.1 -> "Você chegou ao destino"
            remainingDistance < 0.3 -> "Próximo ao destino"
            progress < 0.1 -> "Saindo do local de partida"
            progress < 0.2 -> "Siga em frente"
            progress < 0.3 -> "Continue reto pela avenida"
            progress < 0.4 -> "Mantenha-se na faixa da direita"
            progress < 0.5 -> "Vire à direita na próxima rua"
            progress < 0.6 -> "Siga em frente"
            progress < 0.7 -> "Continue reto"
            progress < 0.8 -> "Mantenha-se na rota"
            progress < 0.9 -> "Próximo ao destino, reduza a velocidade"
            else -> "Chegando ao destino"
        }
    }
    
    fun hideRatingScreen() {
        _uiState.value = _uiState.value.copy(showRatingScreen = false)
    }
    
    fun onRatingCompleted() {
        _uiState.value = _uiState.value.copy(
            showRatingScreen = false,
            showCompletionDialog = false,
            currentService = null,
            currentRoute = null,
            vehicleLocation = null,
            routeUpdate = null,
            hasArrived = false
        )
        routeRepository.clearRoute()
    }
}

data class ClientTrackingUiState(
    val currentService: Service? = null,
    val currentRoute: Route? = null,
    val vehicleLocation: VehicleLocation? = null,
    val routeUpdate: RouteUpdate? = null,
    val showRatingDialog: Boolean = false,
    val showCompletionDialog: Boolean = false,
    val driverInfo: DriverInfo? = null,
    val hasArrived: Boolean = false,
    val showRatingScreen: Boolean = false
)

data class DriverInfo(
    val id: String,
    val name: String,
    val phone: String,
    val vehicleModel: String,
    val vehiclePlate: String,
    val rating: Double,
    val photo: String? = null
)

