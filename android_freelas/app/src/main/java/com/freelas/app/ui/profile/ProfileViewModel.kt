package com.freelas.app.ui.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.freelas.app.data.model.User
import com.freelas.app.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()
    
    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()
    
    init {
        loadUserProfile()
    }
    
    private fun loadUserProfile() {
        viewModelScope.launch {
            authRepository.getCurrentUser().fold(
                onSuccess = { user ->
                    _uiState.value = _uiState.value.copy(user = user)
                    _isLoading.value = false
                },
                onFailure = { exception ->
                    _errorMessage.value = "Erro ao carregar perfil: ${exception.message}"
                    _isLoading.value = false
                }
            )
        }
    }
    
    fun updateProfile(name: String, phone: String) {
        _isLoading.value = true
        
        viewModelScope.launch {
            // This would call an update profile endpoint
            // For now, just update the local state
            val currentUser = _uiState.value.user
            if (currentUser != null) {
                val updatedUser = currentUser.copy(
                    name = name,
                    phone = phone
                )
                _uiState.value = _uiState.value.copy(user = updatedUser)
            }
            _isLoading.value = false
        }
    }
    
    fun clearError() {
        _errorMessage.value = null
    }
}

data class ProfileUiState(
    val user: User? = null
)
