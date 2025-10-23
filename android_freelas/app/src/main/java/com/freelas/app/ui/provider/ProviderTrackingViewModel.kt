package com.freelas.app.ui.provider

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
class ProviderTrackingViewModel @Inject constructor(
    private val routeRepository: RouteRepository,
    private val serviceRepository: ServiceRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(ProviderTrackingUiState())
    val uiState: StateFlow<ProviderTrackingUiState> = _uiState.asStateFlow()
    
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
    
    fun startServiceExecution(service: Service) {
        _isLoading.value = true
        
        viewModelScope.launch {
            try {
                // Update service status to in progress
                val updatedService = service.copy(
                    status = ServiceStatus.IN_PROGRESS,
                    startedAt = java.util.Date()
                )
                
                serviceRepository.updateService(service.id, updatedService).fold(
                    onSuccess = { updatedService ->
                        _uiState.value = _uiState.value.copy(
                            currentService = updatedService
                        )
                        
                        // Get directions to client location
                        val routeResult = routeRepository.getDirections(
                            origin = updatedService.location, // Provider's current location
                            destination = updatedService.location // Client's pickup location
                        )
                        
                        routeResult.fold(
                            onSuccess = { route ->
                                _uiState.value = _uiState.value.copy(
                                    currentRoute = route
                                )
                                
                                // Start vehicle tracking simulation
                                routeRepository.startRouteTracking(route, "provider_${service.id}")
                                _isLoading.value = false
                            },
                            onFailure = { exception ->
                                _errorMessage.value = "Erro ao calcular rota: ${exception.message}"
                                _isLoading.value = false
                            }
                        )
                    },
                    onFailure = { exception ->
                        _errorMessage.value = "Erro ao iniciar serviço: ${exception.message}"
                        _isLoading.value = false
                    }
                )
            } catch (e: Exception) {
                _errorMessage.value = "Erro inesperado: ${e.message}"
                _isLoading.value = false
            }
        }
    }
    
    fun navigateToClient() {
        // Start navigation to client location
        val currentService = _uiState.value.currentService ?: return
        
        viewModelScope.launch {
            val routeResult = routeRepository.getDirections(
                origin = _uiState.value.currentLocation ?: currentService.location,
                destination = currentService.location // Client's location
            )
            
            routeResult.fold(
                onSuccess = { route ->
                    _uiState.value = _uiState.value.copy(
                        currentRoute = route,
                        navigationMode = NavigationMode.TO_CLIENT
                    )
                    routeRepository.startRouteTracking(route, "provider_${currentService.id}")
                },
                onFailure = { exception ->
                    _errorMessage.value = "Erro ao calcular rota para cliente: ${exception.message}"
                }
            )
        }
    }
    
    fun navigateToDestination() {
        // Start navigation to destination
        val currentService = _uiState.value.currentService ?: return
        val destination = currentService.destination ?: return
        
        viewModelScope.launch {
            val routeResult = routeRepository.getDirections(
                origin = currentService.location, // Client's location
                destination = destination
            )
            
            routeResult.fold(
                onSuccess = { route ->
                    _uiState.value = _uiState.value.copy(
                        currentRoute = route,
                        navigationMode = NavigationMode.TO_DESTINATION
                    )
                    routeRepository.startRouteTracking(route, "provider_${currentService.id}")
                },
                onFailure = { exception ->
                    _errorMessage.value = "Erro ao calcular rota para destino: ${exception.message}"
                }
            )
        }
    }
    
    fun markArrived() {
        val currentService = _uiState.value.currentService ?: return
        
        _uiState.value = _uiState.value.copy(
            hasArrived = true
        )
    }
    
    fun startTrip() {
        val currentService = _uiState.value.currentService ?: return
        
        _uiState.value = _uiState.value.copy(
            hasArrived = false,
            tripStarted = true
        )
        
        // Start navigation to destination
        navigateToDestination()
    }
    
    fun completeService() {
        val currentService = _uiState.value.currentService ?: return
        
        _isLoading.value = true
        
        viewModelScope.launch {
            val updatedService = currentService.copy(
                status = ServiceStatus.COMPLETED,
                completedAt = java.util.Date()
            )
            
            serviceRepository.updateService(currentService.id, updatedService).fold(
                onSuccess = {
                    _isLoading.value = false
                    _uiState.value = _uiState.value.copy(
                        currentService = updatedService,
                        showCompletionDialog = true
                    )
                    routeRepository.clearRoute()
                },
                onFailure = { exception ->
                    _isLoading.value = false
                    _errorMessage.value = "Erro ao concluir serviço: ${exception.message}"
                }
            )
        }
    }
    
    fun dismissCompletionDialog() {
        _uiState.value = _uiState.value.copy(
            showCompletionDialog = false,
            currentService = null,
            currentRoute = null,
            vehicleLocation = null,
            routeUpdate = null,
            hasArrived = false,
            tripStarted = false
        )
    }
    
    fun updateCurrentLocation(location: Location) {
        _uiState.value = _uiState.value.copy(
            currentLocation = location
        )
    }
    
    fun clearError() {
        _errorMessage.value = null
    }
}

data class ProviderTrackingUiState(
    val currentService: Service? = null,
    val currentRoute: Route? = null,
    val vehicleLocation: VehicleLocation? = null,
    val routeUpdate: RouteUpdate? = null,
    val currentLocation: Location? = null,
    val navigationMode: NavigationMode = NavigationMode.NONE,
    val hasArrived: Boolean = false,
    val tripStarted: Boolean = false,
    val showCompletionDialog: Boolean = false,
    val clientInfo: ClientInfo? = null
)

data class ClientInfo(
    val id: String,
    val name: String,
    val phone: String,
    val photo: String? = null
)

enum class NavigationMode {
    NONE,
    TO_CLIENT,
    TO_DESTINATION
}
