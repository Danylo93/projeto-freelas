package com.freelas.app.ui.provider

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.freelas.app.data.model.Location
import com.freelas.app.data.model.Service
import com.freelas.app.data.model.ServiceCategory
import com.freelas.app.data.model.ServiceOffer
import com.freelas.app.data.model.ServiceStatus
import com.freelas.app.data.repository.ServiceRepository
import com.freelas.app.data.repository.LocationRepository
import com.freelas.app.data.repository.RealProviderRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProviderHomeViewModel @Inject constructor(
    private val serviceRepository: ServiceRepository,
    private val locationRepository: LocationRepository,
    private val realProviderRepository: RealProviderRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(ProviderHomeUiState())
    val uiState: StateFlow<ProviderHomeUiState> = _uiState.asStateFlow()
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()
    
    init {
        getCurrentLocation()
        loadActiveServices()
        loadEarnings()
    }
    
    fun toggleAvailability() {
        val currentStatus = _uiState.value.isAvailable
        _uiState.value = _uiState.value.copy(isAvailable = !currentStatus)
        
        // Update provider status in backend
        viewModelScope.launch {
            // This would call the backend to update provider availability
            updateProviderAvailability(!currentStatus)
        }
    }
    
    fun acceptService(service: Service) {
        _isLoading.value = true
        
        viewModelScope.launch {
            val updatedService = service.copy(
                status = ServiceStatus.ACCEPTED,
                providerId = _uiState.value.currentProvider?.id ?: "",
                acceptedAt = java.util.Date()
            )
            
            serviceRepository.updateService(service.id, updatedService).fold(
                onSuccess = { updatedService ->
                    _isLoading.value = false
                    _uiState.value = _uiState.value.copy(
                        activeServices = _uiState.value.activeServices.map { 
                            if (it.id == service.id) updatedService else it 
                        }
                    )
                },
                onFailure = { exception ->
                    _isLoading.value = false
                    _errorMessage.value = exception.message ?: "Erro ao aceitar serviço"
                }
            )
        }
    }
    
    fun rejectService(service: Service) {
        _uiState.value = _uiState.value.copy(
            pendingRequests = _uiState.value.pendingRequests.filter { it.id != service.id }
        )
    }
    
    fun startService(service: Service) {
        _isLoading.value = true
        
        viewModelScope.launch {
            val updatedService = service.copy(
                status = ServiceStatus.IN_PROGRESS,
                startedAt = java.util.Date()
            )
            
            serviceRepository.updateService(service.id, updatedService)
                .fold(
                    onSuccess = { updatedService ->
                    _isLoading.value = false
                    _uiState.value = _uiState.value.copy(
                        activeServices = _uiState.value.activeServices.map { 
                            if (it.id == service.id) updatedService else it 
                        }
                    )
                }
                ,
                    onFailure = { exception ->
                    _isLoading.value = false
                    _errorMessage.value = exception.message ?: "Erro ao iniciar serviço"
                }
            )
        }
    }
    
    fun completeService(service: Service, rating: Int? = null, review: String? = null) {
        _isLoading.value = true
        
        viewModelScope.launch {
            val updatedService = service.copy(
                status = ServiceStatus.COMPLETED,
                completedAt = java.util.Date(),
                rating = rating,
                review = review
            )
            
            serviceRepository.updateService(service.id, updatedService)
                .fold(
                    onSuccess = { updatedService ->
                    _isLoading.value = false
                    _uiState.value = _uiState.value.copy(
                        activeServices = _uiState.value.activeServices.filter { it.id != service.id },
                        completedServices = _uiState.value.completedServices + updatedService
                    )
                    loadEarnings() // Refresh earnings
                }
                ,
                    onFailure = { exception ->
                    _isLoading.value = false
                    _errorMessage.value = exception.message ?: "Erro ao concluir serviço"
                }
            )
        }
    }
    
    fun makeCounterOffer(offer: ServiceOffer, counterPrice: Double) {
        _isLoading.value = true
        
        viewModelScope.launch {
            val updatedOffer = offer.copy(
                providerPrice = counterPrice,
                status = com.freelas.app.data.model.OfferStatus.COUNTER_OFFER
            )
            
            serviceRepository.updateOffer(offer.id, updatedOffer)
                .fold(
                    onSuccess = { updatedOffer ->
                    _isLoading.value = false
                    _uiState.value = _uiState.value.copy(
                        pendingOffers = _uiState.value.pendingOffers.map { 
                            if (it.id == offer.id) updatedOffer else it 
                        }
                    )
                }
                ,
                    onFailure = { exception ->
                    _isLoading.value = false
                    _errorMessage.value = exception.message ?: "Erro ao fazer contra-oferta"
                }
            )
        }
    }
    
    fun acceptOffer(offer: ServiceOffer) {
        _isLoading.value = true
        
        viewModelScope.launch {
            val updatedOffer = offer.copy(
                status = com.freelas.app.data.model.OfferStatus.ACCEPTED
            )
            
            serviceRepository.updateOffer(offer.id, updatedOffer)
                .fold(
                    onSuccess = { updatedOffer ->
                    _isLoading.value = false
                    _uiState.value = _uiState.value.copy(
                        pendingOffers = _uiState.value.pendingOffers.filter { it.id != offer.id }
                    )
                    // The service should now be accepted
                    loadActiveServices()
                }
                ,
                    onFailure = { exception ->
                    _isLoading.value = false
                    _errorMessage.value = exception.message ?: "Erro ao aceitar oferta"
                }
            )
        }
    }
    
    fun rejectOffer(offer: ServiceOffer) {
        _uiState.value = _uiState.value.copy(
            pendingOffers = _uiState.value.pendingOffers.filter { it.id != offer.id }
        )
    }
    
    fun updateLocation() {
        viewModelScope.launch {
            locationRepository.getCurrentLocation()
                .fold(
                    onSuccess = { location ->
                    _uiState.value = _uiState.value.copy(currentLocation = location)
                    // Update provider location in backend
                    updateProviderLocation(location)
                }
                ,
                    onFailure = { exception ->
                    _errorMessage.value = "Erro ao atualizar localização: ${exception.message}"
                }
            )
        }
    }
    
    fun loadServiceRequests() {
        _isLoading.value = true
        
        viewModelScope.launch {
            serviceRepository.getServiceRequests()
                .fold(
                    onSuccess = { requests ->
                    _isLoading.value = false
                    _uiState.value = _uiState.value.copy(pendingRequests = requests)
                }
                ,
                    onFailure = { exception ->
                    _isLoading.value = false
                    _errorMessage.value = "Erro ao carregar solicitações: ${exception.message}"
                }
            )
        }
    }
    
    private fun loadActiveServices() {
        viewModelScope.launch {
            serviceRepository.getActiveServices()
                .fold(
                    onSuccess = { services ->
                    _uiState.value = _uiState.value.copy(activeServices = services)
                }
                ,
                    onFailure = { exception ->
                    _errorMessage.value = "Erro ao carregar serviços ativos: ${exception.message}"
                }
            )
        }
    }
    
    private fun loadEarnings() {
        viewModelScope.launch {
            // Simula ID do prestador logado
            val providerId = "provider_001"
            
            realProviderRepository.getProviderEarnings(providerId)
                .collect { result ->
                    result.fold(
                        onSuccess = { repositoryEarnings ->
                            val uiEarnings = ProviderEarnings(
                                today = repositoryEarnings.today,
                                thisWeek = repositoryEarnings.thisWeek,
                                thisMonth = repositoryEarnings.thisMonth,
                                total = repositoryEarnings.total,
                                completedServices = repositoryEarnings.completedServices,
                                averageRating = repositoryEarnings.averageRating
                            )
                            _uiState.value = _uiState.value.copy(earnings = uiEarnings)
                        },
                        onFailure = { exception ->
                            _errorMessage.value = "Erro ao carregar ganhos: ${exception.message}"
                        }
                    )
                }
        }
    }
    
    private fun getCurrentLocation() {
        viewModelScope.launch {
            locationRepository.getCurrentLocation()
                .fold(
                    onSuccess = { location ->
                    _uiState.value = _uiState.value.copy(currentLocation = location)
                }
                ,
                    onFailure = { exception ->
                    _errorMessage.value = "Erro ao obter localização: ${exception.message}"
                }
            )
        }
    }
    
    private suspend fun updateProviderAvailability(isAvailable: Boolean) {
        // This would call the backend to update provider availability
        // For now, we'll just update the local state
    }
    
    private suspend fun updateProviderLocation(location: Location) {
        // This would call the backend to update provider location
        // For now, we'll just update the local state
    }
    
    fun clearError() {
        _errorMessage.value = null
    }
}

data class ProviderHomeUiState(
    val isAvailable: Boolean = false,
    val currentLocation: Location? = null,
    val currentProvider: com.freelas.app.data.model.ServiceProviderProfile? = null,
    val pendingRequests: List<Service> = emptyList(),
    val pendingOffers: List<ServiceOffer> = emptyList(),
    val activeServices: List<Service> = emptyList(),
    val completedServices: List<Service> = emptyList(),
    val earnings: ProviderEarnings = ProviderEarnings(),
    val selectedCategory: ServiceCategory? = null,
    val workingHours: WorkingHoursUi = WorkingHoursUi()
)

data class ProviderEarnings(
    val today: Double = 0.0,
    val thisWeek: Double = 0.0,
    val thisMonth: Double = 0.0,
    val total: Double = 0.0,
    val completedServices: Int = 0,
    val averageRating: Double = 0.0
)

data class WorkingHoursUi(
    val monday: DayScheduleUi = DayScheduleUi(),
    val tuesday: DayScheduleUi = DayScheduleUi(),
    val wednesday: DayScheduleUi = DayScheduleUi(),
    val thursday: DayScheduleUi = DayScheduleUi(),
    val friday: DayScheduleUi = DayScheduleUi(),
    val saturday: DayScheduleUi = DayScheduleUi(),
    val sunday: DayScheduleUi = DayScheduleUi()
)

data class DayScheduleUi(
    val isWorking: Boolean = false,
    val startTime: String = "08:00",
    val endTime: String = "18:00"
)
