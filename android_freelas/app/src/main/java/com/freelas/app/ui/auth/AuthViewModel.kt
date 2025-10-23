package com.freelas.app.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.freelas.app.data.model.AuthResponse
import com.freelas.app.data.model.UserType
import com.freelas.app.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()
    
    fun updateEmail(email: String) {
        _uiState.value = _uiState.value.copy(email = email)
    }
    
    fun updatePassword(password: String) {
        _uiState.value = _uiState.value.copy(password = password)
    }
    
    fun updateName(name: String) {
        _uiState.value = _uiState.value.copy(name = name)
    }
    
    fun updatePhone(phone: String) {
        _uiState.value = _uiState.value.copy(phone = phone)
    }
    
    fun updateConfirmPassword(confirmPassword: String) {
        _uiState.value = _uiState.value.copy(confirmPassword = confirmPassword)
    }
    
    fun toggleUserType() {
        val currentType = _uiState.value.userType
        val newType = if (currentType == UserType.CLIENT) UserType.PROVIDER else UserType.CLIENT
        _uiState.value = _uiState.value.copy(userType = newType)
    }
    
    fun toggleAuthMode() {
        _uiState.value = _uiState.value.copy(isLogin = !_uiState.value.isLogin)
    }
    
    fun login() {
        val state = _uiState.value
        if (validateLoginForm(state)) {
            _isLoading.value = true
            _errorMessage.value = null
            
            viewModelScope.launch {
                authRepository.login(state.email, state.password)
                    .onSuccess { authResponse ->
                        _isLoading.value = false
                        // Navigation will be handled by the UI
                    }
                    .onFailure { exception ->
                        _isLoading.value = false
                        _errorMessage.value = exception.message ?: "Erro ao fazer login"
                    }
            }
        }
    }
    
    fun register() {
        val state = _uiState.value
        if (validateRegisterForm(state)) {
            _isLoading.value = true
            _errorMessage.value = null
            
            viewModelScope.launch {
                authRepository.register(
                    name = state.name,
                    email = state.email,
                    phone = state.phone,
                    password = state.password,
                    userType = state.userType
                ).onSuccess { authResponse ->
                    _isLoading.value = false
                    // Navigation will be handled by the UI
                }.onFailure { exception ->
                    _isLoading.value = false
                    _errorMessage.value = exception.message ?: "Erro ao fazer cadastro"
                }
            }
        }
    }
    
    fun clearError() {
        _errorMessage.value = null
    }
    
    private fun validateLoginForm(state: AuthUiState): Boolean {
        return when {
            state.email.isBlank() -> {
                _errorMessage.value = "Email é obrigatório"
                false
            }
            !android.util.Patterns.EMAIL_ADDRESS.matcher(state.email).matches() -> {
                _errorMessage.value = "Email inválido"
                false
            }
            state.password.isBlank() -> {
                _errorMessage.value = "Senha é obrigatória"
                false
            }
            state.password.length < 6 -> {
                _errorMessage.value = "Senha deve ter pelo menos 6 caracteres"
                false
            }
            else -> true
        }
    }
    
    private fun validateRegisterForm(state: AuthUiState): Boolean {
        return when {
            state.name.isBlank() -> {
                _errorMessage.value = "Nome é obrigatório"
                false
            }
            state.email.isBlank() -> {
                _errorMessage.value = "Email é obrigatório"
                false
            }
            !android.util.Patterns.EMAIL_ADDRESS.matcher(state.email).matches() -> {
                _errorMessage.value = "Email inválido"
                false
            }
            state.phone.isBlank() -> {
                _errorMessage.value = "Telefone é obrigatório"
                false
            }
            state.password.isBlank() -> {
                _errorMessage.value = "Senha é obrigatória"
                false
            }
            state.password.length < 6 -> {
                _errorMessage.value = "Senha deve ter pelo menos 6 caracteres"
                false
            }
            state.confirmPassword != state.password -> {
                _errorMessage.value = "Senhas não coincidem"
                false
            }
            else -> true
        }
    }
}

data class AuthUiState(
    val email: String = "",
    val password: String = "",
    val name: String = "",
    val phone: String = "",
    val confirmPassword: String = "",
    val userType: UserType = UserType.CLIENT,
    val isLogin: Boolean = true
)

